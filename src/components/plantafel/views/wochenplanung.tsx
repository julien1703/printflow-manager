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
import { MachineTabs } from "@/components/plantafel/machine-tabs";
import { WochenplanGrid } from "@/components/plantafel/wochenplan-grid";
import { Sparkles } from "lucide-react";

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

// ─── EingangKarte (dnd-kit) ───────────────────────────────────────────────────

function EingangKarte({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `eingang:${job.id}`,
    data: { jobId: job.id, source: "eingang" },
  });

  const machineColor =
    job.machine === "CD"   ? "var(--machine-cd)"   :
    job.machine === "SM5"  ? "var(--machine-sm5)"  :
    job.machine === "RZK"  ? "var(--machine-rzk)"  :
                             "var(--machine-digi)";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`shrink-0 rounded-xl select-none transition-all overflow-hidden neu-ring ${
        isDragging ? "opacity-30 scale-95 cursor-grabbing" : "cursor-grab hover:shadow-md hover:-translate-y-0.5"
      }`}
      style={{
        background: "oklch(0.97 0.02 255)",
        border: "1.5px solid oklch(0.65 0.10 255)",
        minWidth: 152,
      }}
    >
      <div style={{ height: 3, backgroundColor: machineColor }} />
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              backgroundColor: `color-mix(in oklab, ${machineColor} 15%, white)`,
              color: machineColor,
            }}
          >
            {job.machine === "SM5" ? "SM528" : job.machine}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[8px] font-bold pulse-chip"
            style={{ background: "oklch(0.35 0.18 145 / 0.12)", color: "oklch(0.30 0.16 145)" }}
          >
            NEU
          </span>
          {job.prioritaet && job.prioritaet !== "normal" && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              style={{ background: "oklch(0.93 0.12 50 / 0.25)", color: "oklch(0.50 0.18 50)" }}
            >
              {job.prioritaet}
            </span>
          )}
        </div>

        <div className="text-xs font-bold truncate" style={{ maxWidth: 140 }}>
          {job.customer}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[9px] font-mono text-muted-foreground">
            {job.druckzeitStunden}h
          </span>
          <span className="text-[9px] text-muted-foreground/40">·</span>
          <span className="text-[9px] font-mono" style={{ color: "oklch(0.50 0.08 25)" }}>
            {job.delivery}
          </span>
        </div>

        {(job.dispersionslack || job.sonderfarbe) && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {job.dispersionslack && (
              <span className="text-[7px] bg-white/70 rounded px-1 py-0.5 text-muted-foreground font-medium">
                Lack
              </span>
            )}
            {job.sonderfarbe && (
              <span
                className="text-[7px] rounded px-1 py-0.5 font-medium"
                style={{ background: "oklch(0.93 0.12 50 / 0.18)", color: "oklch(0.50 0.16 50)" }}
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

// ─── EingangStreifen ─────────────────────────────────────────────────────────

function EingangStreifen({
  jobs,
  onKiVorschlag,
}: {
  jobs: Job[];
  onKiVorschlag: () => void;
}) {
  return (
    <div
      className="shrink-0 border-b border-border px-6 py-3"
      style={{
        background: "oklch(0.97 0.02 255 / 0.6)",
        borderLeft: "3px solid oklch(0.60 0.14 255)",
      }}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
            Neue Aufträge
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold pulse-chip"
            style={{
              background: "oklch(0.55 0.18 255 / 0.15)",
              color: "oklch(0.38 0.16 255)",
            }}
          >
            {jobs.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onKiVorschlag}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.48 0.19 295))",
          }}
        >
          <Sparkles className="h-3 w-3" />
          KI-Vorschlag
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {jobs.map((job) => (
          <EingangKarte key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export function WochenplanungView() {
  const [activeMachine, setActiveMachine] = useState<Machine>("CD");
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [grid, setGrid] = useState<Record<SlotKey, GridJob[]>>({});
  const [eingang, setEingang] = useState<Job[]>(() =>
    PLANNABLE_JOBS.filter((j) => j.isNew)
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

    // Determine job ID (eingang draggables use prefix "eingang:")
    const jobId = activeId.startsWith("eingang:") ? activeId.slice(8) : activeId;

    // Parse slot key: "weekOffset|machine|day|slot"
    const parts = slotKeyTarget.split("|");
    if (parts.length !== 4) return;
    const [weekOffsetStr, machine, day, slot] = parts as [string, Machine, Weekday, Slot];
    const targetWeekOffset = parseInt(weekOffsetStr, 10);

    if (!SLOTS_BY_MACHINE[machine].includes(slot)) return;

    const job = eingang.find((j) => j.id === jobId);
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
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col fade-swap" style={{ minHeight: "calc(100vh - 88px)" }}>
        {/* Page header */}
        <div className="px-8 pt-8 pb-5 shrink-0 border-b border-border">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
            Produktionsleitung · Wochenplanung
          </div>
          <h1 className="editorial-header text-4xl">Wochenplanung</h1>
        </div>

        {/* EingangStreifen */}
        {eingang.length > 0 && (
          <EingangStreifen jobs={eingang} onKiVorschlag={handleKiPlan} />
        )}

        {/* Machine Tabs */}
        <MachineTabs
          activeMachine={activeMachine}
          onChange={setActiveMachine}
          eingang={eingang}
        />

        {/* Tab content */}
        <div className="flex flex-1 overflow-hidden">
          {activeMachine === "Digi" ? (
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
