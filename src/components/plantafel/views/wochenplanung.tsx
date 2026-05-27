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
  const hasDruckfreigabeProblem =
    job.druckfreigabe === "Fehlt" || job.druckfreigabe === "Angefordert";
  const druckdatenFehlen = job.druckdatenEingang === null;

  const deliveryColor = isLate ? "oklch(0.52 0.20 25)" : "oklch(0.40 0.04 0)";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`shrink-0 rounded-xl border overflow-hidden transition-all select-none ${
        isNew ? "neu-ring" : ""
      } ${
        isDragging
          ? "opacity-30 scale-95 cursor-grabbing shadow-xl"
          : "cursor-grab hover:shadow-md hover:-translate-y-0.5"
      }`}
      style={{
        width: 176,
        background: isLate
          ? "oklch(0.98 0.02 25)"
          : hasDruckfreigabeProblem
          ? "oklch(0.98 0.03 85)"
          : "oklch(0.99 0.005 255)",
        borderColor: isLate
          ? "oklch(0.85 0.08 25)"
          : hasDruckfreigabeProblem
          ? "oklch(0.85 0.08 85)"
          : "oklch(0.88 0.003 80)",
      }}
    >
      {/* Maschinenfarb-Balken */}
      <div className="h-1" style={{ backgroundColor: machineColor }} />

      <div className="px-2.5 pt-2 pb-2 space-y-1.5">
        {/* Zeile 1: Maschine + Badges + Termin */}
        <div className="flex items-center gap-1 flex-wrap">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none shrink-0"
            style={{ backgroundColor: `color-mix(in oklab, ${machineColor} 15%, white)`, color: machineColor }}
          >
            {job.machine === "SM5" ? "SM528" : job.machine}
          </span>
          {isNew && (
            <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold leading-none pulse-chip"
              style={{ background: "oklch(0.35 0.18 145 / 0.12)", color: "oklch(0.30 0.16 145)" }}>
              NEU
            </span>
          )}
          {isPinned && (
            <span className="flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[8px] font-semibold leading-none"
              style={{ background: "oklch(0.92 0.08 255 / 0.4)", color: "oklch(0.40 0.20 255)" }}>
              <Lock className="h-2 w-2" />
            </span>
          )}
          {(job.prioritaet === "eilig" || job.prioritaet === "express") && (
            <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold leading-none"
              style={{ background: "oklch(0.93 0.12 50 / 0.3)", color: "oklch(0.48 0.18 50)" }}>
              {job.prioritaet}
            </span>
          )}
          {hasDruckfreigabeProblem && (
            <AlertTriangle className="h-2.5 w-2.5 shrink-0" style={{ color: "oklch(0.55 0.16 85)" }} />
          )}
          <span className="ml-auto text-[9px] font-mono font-semibold shrink-0" style={{ color: deliveryColor }}>
            {job.delivery}
          </span>
        </div>

        {/* Zeile 2: Kundenname */}
        <div className="text-[12px] font-bold leading-tight truncate">{job.customer}</div>

        {/* Zeile 3: Produkt */}
        {job.product && (
          <div className="text-[9px] text-muted-foreground truncate">{job.product}</div>
        )}

        {/* Zeile 4: Auflage · Druckzeit · Papier */}
        <div className="flex items-center gap-2 flex-wrap">
          {job.auflage !== undefined && (
            <span className="text-[9px] font-mono text-muted-foreground">
              {job.auflage.toLocaleString("de-DE")} Stk.
            </span>
          )}
          {job.seitenanzahl != null && (
            <span className="text-[9px] text-muted-foreground">{job.seitenanzahl} S.</span>
          )}
          {job.druckzeitStunden !== undefined && (
            <span className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground">
              <Clock className="h-2 w-2" />
              {job.druckzeitStunden}h
            </span>
          )}
        </div>
        {job.paper && (
          <div className="text-[9px] text-muted-foreground truncate">{job.paper}</div>
        )}

        {/* Zeile 5: Warn-Flags */}
        {(job.dispersionslack || job.sonderfarbe || druckdatenFehlen) && (
          <div className="flex flex-wrap gap-1">
            {job.dispersionslack && (
              <span className="text-[7px] font-semibold rounded px-1 py-0.5 leading-none"
                style={{ background: "oklch(0.92 0.06 255 / 0.5)", color: "oklch(0.40 0.18 255)" }}>
                Lack · Rüstzeit
              </span>
            )}
            {job.sonderfarbe && (
              <span className="text-[7px] font-semibold rounded px-1 py-0.5 leading-none"
                style={{ background: "oklch(0.93 0.12 50 / 0.25)", color: "oklch(0.48 0.18 50)" }}>
                {job.sonderfarbe}
              </span>
            )}
            {druckdatenFehlen && (
              <span className="text-[7px] font-semibold rounded px-1 py-0.5 leading-none"
                style={{ background: "oklch(0.93 0.10 25 / 0.25)", color: "oklch(0.48 0.20 25)" }}>
                Druckdaten fehlen
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
  const neuCount = eingang.length;

  return (
    <div className="shrink-0 border-b border-border" style={{ background: "oklch(0.975 0.004 255)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-3 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground">
          Auftragstasche
        </span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: "oklch(0.88 0.003 80)", color: "oklch(0.40 0.006 255)" }}>
          {total}
        </span>
        {neuCount > 0 && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold pulse-chip"
            style={{ background: "oklch(0.35 0.18 145 / 0.10)", color: "oklch(0.30 0.16 145)" }}>
            {neuCount} NEU
          </span>
        )}
        <button
          type="button"
          onClick={onKiVorschlag}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.48 0.19 295))" }}
        >
          <Sparkles className="h-3 w-3" />
          KI-Vorschlag
        </button>
      </div>

      {/* Karten-Streifen */}
      <div className="flex gap-2.5 overflow-x-auto px-6 pb-3">
        {/* Neue Aufträge zuerst */}
        {eingang.map((job) => (
          <PoolKarte
            key={job.id}
            job={job}
            isNew
            isPinned={pinnedIds.has(job.id)}
            onClick={() => onCardClick(job.id)}
          />
        ))}
        {/* Trennlinie wenn beide vorhanden */}
        {eingang.length > 0 && tasche.length > 0 && (
          <div className="shrink-0 w-px self-stretch my-1" style={{ background: "oklch(0.85 0.003 80)" }} />
        )}
        {/* Bestehende Aufträge */}
        {tasche.map((job) => (
          <PoolKarte
            key={job.id}
            job={job}
            isNew={false}
            isPinned={pinnedIds.has(job.id)}
            onClick={() => onCardClick(job.id)}
          />
        ))}
        {total === 0 && (
          <p className="text-[11px] text-muted-foreground py-4">Alle Aufträge eingeplant</p>
        )}
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function WochenplanungView() {
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

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col fade-swap" style={{ minHeight: "calc(100vh - 88px)" }}>
        {/* Page header */}
        <div className="px-8 pt-8 pb-5 shrink-0 border-b border-border">
          <h1 className="editorial-header text-4xl">Wochenplanung</h1>
        </div>

        {/* Auftragspool */}
        <AuftragsPool
          eingang={eingang}
          tasche={tasche}
          pinnedIds={pinnedIds}
          onCardClick={(id) => setSelectedJobId(id)}
          onKiVorschlag={handleKiPlan}
        />

        {/* Machine Tabs */}
        <MachineTabs
          activeTab={activeMachine}
          onChange={setActiveMachine}
          eingang={eingang}
        />

        {/* Tab content + Sidebar */}
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
    </DndContext>
  );
}
