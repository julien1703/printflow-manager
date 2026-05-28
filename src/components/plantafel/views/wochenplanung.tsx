import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  JOBS, SLOTS_BY_MACHINE,
  type Job, type Machine, type Weekday, type Slot,
} from "@/lib/mock-data";
import { buildKIPlan, type PlacedJob } from "@/lib/planning-ai";
import { AuftragDrawer } from "@/components/plantafel/auftrag-drawer";
import { MachineTabs, type TabView } from "@/components/plantafel/machine-tabs";
import { WochenplanGrid } from "@/components/plantafel/wochenplan-grid";
import { Sparkles, Lock, AlertTriangle, Clock } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SlotKey = string;

interface ManualJob {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  phase: "Im Druck";
  aiSuggested: false;
  reason?: string;
}

type GridJob = PlacedJob | ManualJob;

// ─── Constants ───────────────────────────────────────────────────────────────

const PLANNABLE_JOBS = JOBS.filter(
  (j) => j.druckzeitStunden !== undefined || j.machine === "Digi"
);

// ─── DigiStatus ──────────────────────────────────────────────────────────────

function DigiStatus() {
  const digiJobs = JOBS.filter(
    (j) => j.machine === "Digi" && j.orderStatus === "In Produktion"
  );
  const hasBacklog = digiJobs.some((j) => j.problem);
  const hasCapacityIssue = digiJobs.length > 3;

  const statusColor = hasCapacityIssue
    ? "oklch(0.55 0.22 25)"
    : hasBacklog
    ? "oklch(0.55 0.17 85)"
    : "oklch(0.45 0.18 145)";

  const statusLabel = hasCapacityIssue
    ? "Kapazität erreicht"
    : hasBacklog
    ? "Rückstau"
    : "Läuft normal";

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div
        className="rounded-xl border border-border p-5 mb-6 max-w-xl"
        style={{ background: "oklch(0.95 0.04 145 / 0.3)" }}
      >
        <div className="text-sm font-semibold text-foreground mb-1">
          Digitaldruck läuft eigenständig
        </div>
        <div className="text-xs text-muted-foreground">
          Eingriff nur bei Rückstau nötig
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: statusColor }}
        />
        <span className="text-sm font-semibold" style={{ color: statusColor }}>
          {statusLabel}
        </span>
      </div>

      {digiJobs.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-3">
            Laufende Aufträge
          </div>
          <div className="space-y-2 max-w-sm">
            {digiJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-border px-4 py-2.5 bg-card"
              >
                <div className="text-xs font-bold">{job.customer}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {job.product}
                  {job.quantity ? ` · ${job.quantity}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PoolKarte — einheitliche Karte für alle ungeplanten Aufträge ─────────────

function PoolKarte({
  job,
  isNew,
  isPinned,
  onClick,
}: {
  job: Job;
  isNew: boolean;
  isPinned: boolean;
  onClick: () => void;
}) {
  const prefix = isNew ? "eingang" : "tasche";
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${prefix}:${job.id}`,
    data: { jobId: job.id, source: prefix },
  });

  const machineColor =
    job.machine === "CD"   ? "var(--machine-cd)"   :
    job.machine === "SM5"  ? "var(--machine-sm5)"  :
    job.machine === "RZK"  ? "var(--machine-rzk)"  :
                             "var(--machine-digi)";

  const isLate = job.status === "Hinterher";
  const hasProblem = job.druckfreigabe === "Fehlt" || job.druckdatenEingang === null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`shrink-0 rounded-2xl overflow-hidden transition-all select-none ${
        isNew ? "neu-ring" : ""
      } ${
        isDragging
          ? "opacity-25 scale-95 cursor-grabbing"
          : "cursor-grab hover:shadow-lg hover:-translate-y-1"
      }`}
      style={{
        width: 188,
        background: "oklch(1.0 0 0)",
        border: `1.5px solid ${isLate ? "oklch(0.82 0.08 25)" : hasProblem ? "oklch(0.84 0.07 85)" : "oklch(0.90 0.003 255)"}`,
        boxShadow: "0 1px 3px oklch(0 0 0 / 0.06), 0 4px 12px oklch(0 0 0 / 0.04)",
      }}
    >
      {/* Maschinenfarb-Balken oben */}
      <div style={{ height: 3, background: machineColor }} />

      <div className="p-3 space-y-2">
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {isNew && (
            <span
              className="text-[9px] font-bold rounded-full px-2 py-0.5 leading-none pulse-chip"
              style={{ background: "oklch(0.92 0.08 145 / 0.35)", color: "oklch(0.35 0.18 145)" }}
            >
              NEU
            </span>
          )}
          {isPinned && (
            <Lock className="h-3 w-3 shrink-0" style={{ color: "oklch(0.55 0.18 255)" }} />
          )}
          {(job.prioritaet === "eilig" || job.prioritaet === "express") && (
            <span
              className="text-[9px] font-bold rounded-full px-2 py-0.5 leading-none"
              style={{ background: "oklch(0.94 0.10 50 / 0.35)", color: "oklch(0.48 0.18 50)" }}
            >
              {job.prioritaet}
            </span>
          )}
          {hasProblem && (
            <AlertTriangle className="h-3 w-3 shrink-0 ml-auto" style={{ color: "oklch(0.55 0.17 85)" }} />
          )}
          {isLate && !hasProblem && (
            <Clock className="h-3 w-3 shrink-0 ml-auto" style={{ color: "oklch(0.55 0.20 25)" }} />
          )}
        </div>

        {/* Kundenname */}
        <div className="font-bold text-[13px] leading-tight truncate text-foreground">
          {job.customer}
        </div>

        {/* Produkt */}
        {job.product && (
          <div className="text-[10px] text-muted-foreground truncate leading-snug">
            {job.product}
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-border/60" />

        {/* Kenndaten */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {job.druckzeitStunden !== undefined && (
              <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                {job.druckzeitStunden}h
              </span>
            )}
            {job.auflage !== undefined && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {job.auflage >= 1000
                  ? `${Math.round(job.auflage / 1000)}k`
                  : job.auflage} Stk.
              </span>
            )}
          </div>
          <span
            className="text-[10px] font-mono font-semibold shrink-0"
            style={{ color: isLate ? "oklch(0.52 0.20 25)" : "oklch(0.45 0.04 255)" }}
          >
            {job.delivery}
          </span>
        </div>

        {/* Warn-Chips */}
        {(job.dispersionslack || job.sonderfarbe) && (
          <div className="flex gap-1 flex-wrap">
            {job.dispersionslack && (
              <span
                className="text-[8px] font-semibold rounded-md px-1.5 py-0.5 leading-none"
                style={{ background: "oklch(0.93 0.05 255 / 0.5)", color: "oklch(0.40 0.16 255)" }}
              >
                Lack
              </span>
            )}
            {job.sonderfarbe && (
              <span
                className="text-[8px] font-semibold rounded-md px-1.5 py-0.5 leading-none"
                style={{ background: "oklch(0.94 0.10 50 / 0.3)", color: "oklch(0.48 0.18 50)" }}
              >
                {job.sonderfarbe}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AuftragsPool — kombinierter horizontaler Streifen ────────────────────────

function AuftragsPool({
  eingang,
  tasche,
  pinnedIds,
  onCardClick,
  onKiVorschlag,
}: {
  eingang: Job[];
  tasche: Job[];
  pinnedIds: Set<string>;
  onCardClick: (id: string) => void;
  onKiVorschlag: () => void;
}) {
  const total = eingang.length + tasche.length;

  if (total === 0) return null;

  return (
    <div
      className="shrink-0 border-b border-border"
      style={{ background: "oklch(0.975 0.003 255)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 pt-3 pb-0">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
          Auftragspool
        </span>
        <span
          className="rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold"
          style={{ background: "oklch(0.20 0.008 255)", color: "white" }}
        >
          {total}
        </span>
        {eingang.length > 0 && (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold pulse-chip"
            style={{ background: "oklch(0.92 0.08 145 / 0.3)", color: "oklch(0.35 0.18 145)" }}
          >
            {eingang.length} NEU
          </span>
        )}
        <button
          type="button"
          onClick={onKiVorschlag}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition hover:opacity-90 active:scale-95"
          style={{
            background: "linear-gradient(135deg, oklch(0.50 0.22 280), oklch(0.44 0.19 300))",
          }}
        >
          <Sparkles className="h-3 w-3" />
          KI-Vorschlag
        </button>
      </div>

      {/* Karten */}
      <div className="flex gap-3 overflow-x-auto px-6 py-3">
        {eingang.map((job) => (
          <PoolKarte
            key={job.id}
            job={job}
            isNew
            isPinned={pinnedIds.has(job.id)}
            onClick={() => onCardClick(job.id)}
          />
        ))}
        {eingang.length > 0 && tasche.length > 0 && (
          <div className="shrink-0 w-px self-stretch my-2 rounded-full" style={{ background: "oklch(0.87 0.003 255)" }} />
        )}
        {tasche.map((job) => (
          <PoolKarte
            key={job.id}
            job={job}
            isNew={false}
            isPinned={pinnedIds.has(job.id)}
            onClick={() => onCardClick(job.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function WochenplanungView({ readOnly = false }: { readOnly?: boolean }) {
  const [activeMachine, setActiveMachine] = useState<TabView>("Gesamt");
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [grid, setGrid] = useState<Record<SlotKey, GridJob[]>>({});
  const [eingang, setEingang] = useState<Job[]>(() =>
    PLANNABLE_JOBS.filter((j) => j.isNew)
  );
  const [tasche, setTasche] = useState<Job[]>(() =>
    PLANNABLE_JOBS.filter((j) => !j.isNew && j.machine !== "Digi")
  );
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    () => new Set(JOBS.filter((j) => j.festgepinnt).map((j) => j.id))
  );
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [prioritaetOverrides, setPrioritaetOverrides] = useState<
    Record<string, Job["prioritaet"]>
  >({});
  const [notizOverrides, setNotizOverrides] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const selectedJob = selectedJobId
    ? JOBS.find((j) => j.id === selectedJobId) ?? null
    : null;

  function togglePinned(jobId: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  function handleKiPlan() {
    const allUnplaced = [...eingang];
    const plan = buildKIPlan(
      allUnplaced.map((j) => ({ ...j, festgepinnt: pinnedIds.has(j.id) }))
    );
    const weekPrefix = currentWeekOffset;
    setGrid((prev) => {
      const merged: Record<SlotKey, GridJob[]> = { ...prev };
      for (const [planKey, slot] of Object.entries(plan)) {
        const key = `${weekPrefix}|${planKey}`;
        if (!merged[key] || merged[key].length === 0) {
          merged[key] = [slot];
        }
      }
      return merged;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const slotKeyTarget = over.id as string;

    // Determine job ID — draggables use prefix "eingang:" or "tasche:"
    const jobId = activeId.startsWith("eingang:")
      ? activeId.slice(8)
      : activeId.startsWith("tasche:")
      ? activeId.slice(7)
      : activeId;

    // Parse slot key: "weekOffset|machine|day|slot"
    const parts = slotKeyTarget.split("|");
    if (parts.length !== 4) return;
    const [weekOffsetStr, machine, day, slot] = parts as [string, Machine, Weekday, Slot];
    const targetWeekOffset = parseInt(weekOffsetStr, 10);

    if (!SLOTS_BY_MACHINE[machine].includes(slot)) return;

    const job =
      eingang.find((j) => j.id === jobId) ??
      tasche.find((j) => j.id === jobId);
    if (!job) return;

    // Machine must match
    if (job.machine !== machine) return;

    // Capacity check: sum of existing hours in slot ≤ 8h
    const existingJobs = grid[slotKeyTarget] ?? [];
    const usedHours = existingJobs.reduce((sum, gj) => {
      const j = JOBS.find((x) => x.id === gj.jobId);
      return sum + (j?.druckzeitStunden ?? 1);
    }, 0);
    if (usedHours + (job.druckzeitStunden ?? 1) > 8) return;

    const newGridJob: ManualJob = {
      jobId: job.id,
      customer: job.customer,
      machine: job.machine,
      delivery: job.delivery,
      phase: "Im Druck",
      aiSuggested: false,
    };

    setGrid((prev) => ({
      ...prev,
      [slotKeyTarget]: [...(prev[slotKeyTarget] ?? []), newGridJob],
    }));

    setEingang((prev) => prev.filter((j) => j.id !== jobId));
    setTasche((prev) => prev.filter((j) => j.id !== jobId));
  }

  function removeFromGrid(key: SlotKey, jobId: string) {
    setGrid((prev) => {
      const cell = prev[key] ?? [];
      const kept = cell.filter((gj) => gj.jobId !== jobId);
      const next = { ...prev };
      if (kept.length === 0) delete next[key];
      else next[key] = kept;
      return next;
    });
    const originalJob = JOBS.find((j) => j.id === jobId);
    if (!originalJob) return;
    if (originalJob.isNew) {
      setEingang((prev) =>
        prev.find((j) => j.id === jobId) ? prev : [...prev, originalJob]
      );
    } else {
      setTasche((prev) =>
        prev.find((j) => j.id === jobId) ? prev : [...prev, originalJob]
      );
    }
  }

  const gridContent = (
    <div className="flex flex-col fade-swap" style={{ minHeight: "calc(100vh - 88px)" }}>
      {/* Page header */}
      <div className="px-8 pt-8 pb-5 shrink-0 border-b border-border">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          {readOnly ? "Wochenübersicht · Nur lesend" : "Produktionsleitung · Wochenplanung"}
        </div>
        <h1 className="editorial-header text-4xl">Wochenplanung</h1>
      </div>

      {/* Auftragspool — nur bei editierbarer Ansicht */}
      {!readOnly && (() => {
        const poolEingang = activeMachine === "Gesamt"
          ? eingang
          : activeMachine === "Digi"
          ? []
          : eingang.filter((j) => j.machine === activeMachine);

        const poolTasche = activeMachine === "Gesamt"
          ? tasche
          : activeMachine === "Digi"
          ? []
          : tasche.filter((j) => j.machine === activeMachine);

        return (
          <AuftragsPool
            eingang={poolEingang}
            tasche={poolTasche}
            pinnedIds={pinnedIds}
            onCardClick={(id) => setSelectedJobId(id)}
            onKiVorschlag={handleKiPlan}
          />
        );
      })()}

      {/* Machine Tabs */}
      <MachineTabs
        activeTab={activeMachine}
        onChange={setActiveMachine}
        eingang={readOnly ? [] : eingang}
      />

      {/* Tab content */}
      <div className="flex flex-1 overflow-hidden">
        {activeMachine === "Gesamt" ? (
          <div className="flex flex-col flex-1 divide-y divide-border">
            {(["CD", "SM5", "RZK"] as const).map((machine) => (
              <div key={machine} className="shrink-0">
                <div className="px-6 py-2 bg-muted/30 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground border-b border-border">
                  {machine === "SM5" ? "SM528" : machine}
                </div>
                <WochenplanGrid
                  machine={machine}
                  weekOffset={currentWeekOffset}
                  onWeekOffsetChange={setCurrentWeekOffset}
                  grid={grid}
                  pinnedIds={pinnedIds}
                  onCardClick={(jobId) => setSelectedJobId(jobId)}
                  onRemove={removeFromGrid}
                  hideKwNav
                  readOnly={readOnly}
                />
              </div>
            ))}
            <div className="shrink-0">
              <div className="px-6 py-2 bg-muted/30 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground border-b border-border">
                Digi
              </div>
              <DigiStatus />
            </div>
          </div>
        ) : activeMachine === "Digi" ? (
          <DigiStatus />
        ) : (
          <WochenplanGrid
            machine={activeMachine}
            weekOffset={currentWeekOffset}
            onWeekOffsetChange={setCurrentWeekOffset}
            grid={grid}
            pinnedIds={pinnedIds}
            onCardClick={(jobId) => setSelectedJobId(jobId)}
            onRemove={removeFromGrid}
            readOnly={readOnly}
          />
        )}
      </div>

      {/* Auftrag Drawer */}
      {selectedJob && (
        <AuftragDrawer
          job={{
            ...selectedJob,
            prioritaet: prioritaetOverrides[selectedJob.id] ?? selectedJob.prioritaet,
            notiz: notizOverrides[selectedJob.id] ?? selectedJob.notiz ?? null,
          }}
          onToggleFestgepinnt={() => togglePinned(selectedJob.id)}
          onClose={() => setSelectedJobId(null)}
          onPrioritaetChange={(p) =>
            setPrioritaetOverrides((prev) => ({ ...prev, [selectedJob.id]: p }))
          }
          onNotizChange={(n) =>
            setNotizOverrides((prev) => ({ ...prev, [selectedJob.id]: n }))
          }
        />
      )}
    </div>
  );

  if (readOnly) return gridContent;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {gridContent}
    </DndContext>
  );
}
