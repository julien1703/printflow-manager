import { useState } from "react";
import {
  JOBS, MACHINE_META, WEEKDAYS, SLOTS_BY_MACHINE,
  TODAY_INDEX,
  type Job, type Machine, type Phase, type Weekday, type Slot,
} from "@/lib/mock-data";
import { Check, Sparkles, X } from "lucide-react";
import { JobBadges } from "@/components/plantafel/job-badges";

const ALL_MACHINES: Machine[] = ["CD", "RZK", "SM5", "Digi"];

type SlotKey = string;

interface PlacedJob {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  phase: Phase;
  aiSuggested: boolean;
  reason?: string;
}

function slotKey(machine: Machine, day: Weekday, slot: Slot): SlotKey {
  return `${machine}|${day}|${slot}`;
}

const TASCHE_JOBS: Job[] = JOBS.filter(
  (j) =>
    j.druckfreigabe === "Erteilt" &&
    j.orderStatus !== "Abgeschlossen" &&
    j.orderStatus !== "Storniert" &&
    j.orderStatus !== "Versandbereit"
);

function buildKiPlan(jobs: Job[]): Record<SlotKey, PlacedJob> {
  const plan: Record<SlotKey, PlacedJob> = {};
  const sorted = [...jobs].sort((a, b) => {
    const d = (s: string) => {
      const [day, month] = s.split(".").map(Number);
      return month * 100 + day;
    };
    return d(a.delivery) - d(b.delivery);
  });

  for (const job of sorted) {
    let placed = false;
    for (const day of WEEKDAYS) {
      if (placed) break;
      for (const slot of SLOTS_BY_MACHINE[job.machine]) {
        const key = slotKey(job.machine, day, slot);
        if (!plan[key]) {
          plan[key] = {
            jobId: job.id,
            customer: job.customer,
            machine: job.machine,
            delivery: job.delivery,
            phase: "Im Druck",
            aiSuggested: true,
          };
          placed = true;
          break;
        }
      }
    }
  }
  return plan;
}

export function WochenplanungView() {
  const [grid, setGrid] = useState<Record<SlotKey, PlacedJob>>({});
  const [tasche, setTasche] = useState<Job[]>(TASCHE_JOBS);
  const [dragMachine, setDragMachine] = useState<Machine | null>(null);
  const [newlyPlaced, setNewlyPlaced] = useState<Set<SlotKey>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    () => new Set(JOBS.filter((j) => j.festgepinnt).map((j) => j.id))
  );

  function togglePinned(jobId: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }
  const hasKiSlots = Object.values(grid).some((s) => s.aiSuggested);

  function handleKiPlan() {
    const plan = buildKiPlan(tasche);
    setGrid((prev) => {
      const merged: Record<SlotKey, PlacedJob> = { ...prev };
      for (const [key, slot] of Object.entries(plan)) {
        if (!merged[key]) merged[key] = slot;
      }
      return merged;
    });
  }

  function confirmKiPlan() {
    const confirmed: Record<SlotKey, PlacedJob> = {};
    for (const [key, slot] of Object.entries(grid)) {
      confirmed[key] = { ...slot, aiSuggested: false };
    }
    setGrid(confirmed);
    const placedIds = new Set(Object.values(confirmed).map((s) => s.jobId));
    setTasche((prev) => prev.filter((j) => !placedIds.has(j.id)));
  }

  function resetKiPlan() {
    setGrid((prev) => {
      const next: Record<SlotKey, PlacedJob> = {};
      for (const [key, slot] of Object.entries(prev)) {
        if (!slot.aiSuggested) next[key] = slot;
      }
      return next;
    });
  }

  function handleDragEnd() {
    setDragMachine(null);
  }

  function handleDrop(e: React.DragEvent, machine: Machine, day: Weekday, slot: Slot) {
    const jobId = e.dataTransfer.getData("jobId");
    const job = tasche.find((j) => j.id === jobId);
    if (!job) return;
    if (!SLOTS_BY_MACHINE[machine].includes(slot)) return;
    const key = slotKey(machine, day, slot);
    if (grid[key]) return;
    setGrid((prev) => ({
      ...prev,
      [key]: {
        jobId: job.id,
        customer: job.customer,
        machine: job.machine,
        delivery: job.delivery,
        phase: "Im Druck",
        aiSuggested: false,
      },
    }));
    setTasche((prev) => prev.filter((j) => j.id !== jobId));
    setNewlyPlaced((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setTimeout(() => {
      setNewlyPlaced((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 300);
    setDragMachine(null);
  }

  function removeFromGrid(key: SlotKey) {
    setGrid((prevGrid) => {
      const removed = prevGrid[key];
      if (!removed) return prevGrid;
      const originalJob = JOBS.find((j) => j.id === removed.jobId);
      if (originalJob) {
        setTasche((prevTasche) =>
          prevTasche.find((j) => j.id === removed.jobId)
            ? prevTasche
            : [...prevTasche, originalJob]
        );
      }
      const next = { ...prevGrid };
      delete next[key];
      return next;
    });
  }

  return (
    <div className="flex flex-col fade-swap" style={{ minHeight: "calc(100vh - 88px)" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-5 shrink-0 border-b border-border">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Produktionsleitung · Wochenplanung
        </div>
        <h1 className="editorial-header text-4xl">Wochenplanung</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          KW 20 · 20.–24. Mai 2026 — Aufträge per Drag & Drop planen
        </p>
      </div>

      {/* Body: Grid + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="soft-card overflow-hidden">
            {/* Header row */}
            <div
              className="grid border-b border-border bg-muted/40"
              style={{ gridTemplateColumns: `90px repeat(${WEEKDAYS.length}, 1fr)` }}
            >
              <div className="px-3 py-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground" />
              {WEEKDAYS.map((d, i) => {
                const isToday = i === TODAY_INDEX;
                return (
                  <div
                    key={d}
                    className={`px-3 py-3 text-center border-l border-border ${isToday ? "bg-[oklch(0.94_0.08_85)]" : ""}`}
                  >
                    <div className={`text-[10px] uppercase tracking-[0.14em] font-bold ${isToday ? "text-[oklch(0.42_0.16_85)]" : "text-muted-foreground"}`}>
                      {d}
                    </div>
                    {isToday && (
                      <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[oklch(0.90_0.10_85)] px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.18_85)]" />
                        <span className="text-[9px] font-bold text-[oklch(0.42_0.16_85)]">Heute</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {ALL_MACHINES.map((machine) => {
              const color = MACHINE_META[machine].color;
              return (
                <div
                  key={machine}
                  className="grid border-b border-border last:border-0"
                  style={{ gridTemplateColumns: `90px repeat(${WEEKDAYS.length}, 1fr)` }}
                >
                  <div className="flex flex-col items-center justify-center px-2 py-3 border-r border-border gap-1">
                    <span className="text-sm font-black" style={{ color }}>{machine}</span>
                    <div className="h-1 w-8 rounded-full" style={{ backgroundColor: color, opacity: 0.4 }} />
                  </div>
                  {WEEKDAYS.map((day, di) => {
                    const isToday = di === TODAY_INDEX;
                    return (
                      <div
                        key={day}
                        className={`border-l border-border p-1.5 space-y-1 ${isToday ? "bg-[oklch(0.97_0.06_95)]" : ""}`}
                      >
                        {SLOTS_BY_MACHINE[machine].map((slot) => {
                          const key = slotKey(machine, day, slot);
                          const placed = grid[key];
                          return (
                            <GridSlotCell
                              key={slot}
                              slotName={slot}
                              placed={placed}
                              color={color}
                              dragMachine={dragMachine}
                              gridMachine={machine}
                              isNew={newlyPlaced.has(key)}
                              onDrop={(e) => handleDrop(e, machine, day, slot)}
                              onRemove={() => removeFromGrid(key)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar — Auftragstasche */}
        <div className="w-72 shrink-0 border-l border-border flex flex-col bg-muted/20">
          {/* Sidebar header */}
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                Auftragstasche
              </span>
              <span className="rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-bold">
                {tasche.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleKiPlan}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 shadow-md"
              style={{
                background: "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.48 0.19 295))",
                boxShadow: "0 4px 16px oklch(0.55 0.22 280 / 0.30)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              KI-Plan generieren
            </button>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {tasche.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground italic">
                Alle Aufträge verplant.
              </div>
            )}
            {tasche.map((job) => {
              const color = MACHINE_META[job.machine].color;
              return (
                <TascheCard
                  key={job.id}
                  job={{ ...job, festgepinnt: pinnedIds.has(job.id) }}
                  color={color}
                  onDragStart={(machine) => setDragMachine(machine)}
                  onDragEnd={handleDragEnd}
                  onToggleFestgepinnt={() => togglePinned(job.id)}
                />
              );
            })}
          </div>

          {/* Confirm + Reset buttons */}
          {hasKiSlots && (
            <div className="shrink-0 p-4 border-t border-border space-y-2">
              <button
                type="button"
                onClick={confirmKiPlan}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition shadow-sm hover:opacity-90"
                style={{
                  background: "oklch(0.52 0.14 153)",
                  boxShadow: "0 2px 12px oklch(0.52 0.14 153 / 0.30)",
                }}
              >
                <Check className="h-4 w-4" />
                Plan bestätigen
              </button>
              <button
                type="button"
                onClick={resetKiPlan}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition"
              >
                Alles zurücksetzen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GridSlotCell({
  slotName, placed, color, dragMachine, gridMachine, isNew, onDrop, onRemove,
}: {
  slotName: Slot;
  placed: PlacedJob | undefined;
  color: string;
  dragMachine: Machine | null;
  gridMachine: Machine;
  isNew: boolean;
  onDrop: (e: React.DragEvent) => void;
  onRemove: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  if (placed) {
    const isAi = placed.aiSuggested;
    return (
      <div
        className={`relative rounded-xl overflow-hidden group ${isNew ? "pop-in" : ""} ${isAi ? "ki-pulse" : ""}`}
        style={{
          background: isAi
            ? "oklch(0.95 0.04 280)"
            : `color-mix(in oklab, ${color} 12%, white)`,
          border: isAi
            ? "1.5px dashed oklch(0.55 0.22 258 / 0.7)"
            : `1px solid color-mix(in oklab, ${color} 25%, var(--border))`,
        }}
      >
        {!isAi && <div style={{ height: 3, backgroundColor: color }} />}
        <div className="px-2 py-2">
          <div className="text-[9px] uppercase tracking-wider font-bold mb-0.5" style={{ color: isAi ? "oklch(0.40 0.22 258)" : color }}>
            {slotName}{isAi && " · KI ✦"}
          </div>
          <div className="text-[11px] font-bold leading-tight truncate">{placed.customer}</div>
          <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{placed.delivery}</div>
          {placed.aiSuggested && placed.reason && (
            <div className="text-[8px] italic text-muted-foreground mt-1 leading-tight opacity-80">
              {placed.reason}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 rounded-md p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/70 transition"
          aria-label="Auftrag entfernen"
        >
          <X className="h-2.5 w-2.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  const isMismatch = dragMachine !== null && dragMachine !== gridMachine;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e); }}
      className={`drop-zone rounded-xl border-2 border-dashed transition ${
        isDragOver && isMismatch
          ? "border-destructive/50 bg-destructive/5 drag-over-blocked"
          : isDragOver
          ? "border-[oklch(0.55_0.22_280/0.6)] bg-[oklch(0.96_0.04_280)] drag-over"
          : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
      }`}
      style={{ minHeight: 52 }}
    >
      <div className="flex items-center justify-center h-full pt-3 pb-2">
        <span className="text-[9px] text-muted-foreground/50 font-medium">{slotName}</span>
      </div>
      {isDragOver && isMismatch && (
        <div className="text-center pb-1 text-[8px] text-destructive/70 font-medium">Falsche Maschine</div>
      )}
    </div>
  );
}

function TascheCard({
  job, color, onDragStart, onDragEnd, onToggleFestgepinnt,
}: {
  job: Job;
  color: string;
  onDragStart: (machine: Machine) => void;
  onDragEnd: () => void;
  onToggleFestgepinnt?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("jobId", job.id);
        setIsDragging(true);
        onDragStart(job.machine);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      className={`drag-card rounded-xl select-none overflow-hidden ${isDragging ? "dragging" : ""}`}
      style={{
        border: `1px solid color-mix(in oklab, ${color} 25%, var(--border))`,
        backgroundColor: `color-mix(in oklab, ${color} 8%, var(--card))`,
      }}
    >
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold"
            style={{ backgroundColor: `color-mix(in oklab, ${color} 18%, white)`, color }}
          >
            {job.machine}
          </span>
          <span className="text-[9px] text-muted-foreground font-mono">{job.delivery}</span>
          {job.isNew && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                backgroundColor: "oklch(0.52 0.20 145 / 0.15)",
                color: "oklch(0.35 0.18 145)",
              }}
            >
              NEU
            </span>
          )}
        </div>
        <div className="text-sm font-semibold leading-tight">{job.customer}</div>
        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{job.id}</div>
        <JobBadges job={job} onToggleFestgepinnt={onToggleFestgepinnt} compact />
      </div>
    </div>
  );
}
