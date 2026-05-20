import { useState } from "react";
import {
  JOBS, MACHINE_META, PHASES, WEEKDAYS, SLOTS,
  TODAY_INDEX,
  type Job, type Machine, type Phase, type Weekday, type Slot,
} from "@/lib/mock-data";
import { Check, Sparkles, X } from "lucide-react";

const ALL_MACHINES: Machine[] = ["CD", "RZK", "SM5", "Digi"];

type SlotKey = string;

interface PlacedJob {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  phase: Phase;
  aiSuggested: boolean;
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
    const d = (s: string) => parseInt(s.split(".")[0]);
    return d(a.delivery) - d(b.delivery);
  });

  for (const job of sorted) {
    let placed = false;
    for (const day of WEEKDAYS) {
      if (placed) break;
      for (const slot of SLOTS) {
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
  const [dragging, setDragging] = useState<Job | null>(null);

  const hasKiSlots = Object.values(grid).some((s) => s.aiSuggested);

  function handleKiPlan() {
    const plan = buildKiPlan(tasche);
    setGrid(plan);
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

  function handleDragStart(job: Job) {
    setDragging(job);
  }

  function handleDrop(machine: Machine, day: Weekday, slot: Slot) {
    if (!dragging) return;
    const key = slotKey(machine, day, slot);
    setGrid((prev) => ({
      ...prev,
      [key]: {
        jobId: dragging.id,
        customer: dragging.customer,
        machine: dragging.machine,
        delivery: dragging.delivery,
        phase: "Im Druck",
        aiSuggested: false,
      },
    }));
    setTasche((prev) => prev.filter((j) => j.id !== dragging.id));
    setDragging(null);
  }

  function removeFromGrid(key: SlotKey) {
    const removed = grid[key];
    if (!removed) return;
    const originalJob = JOBS.find((j) => j.id === removed.jobId);
    setGrid((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (originalJob && !tasche.find((j) => j.id === removed.jobId)) {
      setTasche((prev) => [...prev, originalJob]);
    }
  }

  return (
    <div className="flex flex-col fade-swap" style={{ minHeight: "calc(100vh - 88px)" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-4 flex items-start justify-between shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
            Produktionsleitung · Wochenplanung
          </div>
          <h1 className="editorial-header text-4xl">Wochenplanung</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            KW 20 · 20.–24. Mai 2026 — Aufträge per Drag & Drop planen
          </p>
        </div>
        {hasKiSlots && (
          <button
            type="button"
            onClick={confirmKiPlan}
            className="flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold shadow-md hover:opacity-85 transition"
          >
            <Check className="h-4 w-4" />
            Plan bestätigen
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto px-8 pb-4">
        <div className="soft-card overflow-hidden">
          {/* Header row */}
          <div
            className="grid border-b border-border bg-muted/40"
            style={{ gridTemplateColumns: `100px repeat(${WEEKDAYS.length}, 1fr)` }}
          >
            <div className="px-3 py-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              Maschine
            </div>
            {WEEKDAYS.map((d, i) => {
              const isToday = i === TODAY_INDEX;
              return (
                <div
                  key={d}
                  className={`px-3 py-3 text-center border-l border-border ${isToday ? "bg-[oklch(0.95_0.09_95)]" : ""}`}
                >
                  <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                    {d}
                  </div>
                  {isToday && (
                    <div className="mt-0.5 text-[10px] font-semibold text-[oklch(0.50_0.16_85)]">
                      Heute
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Machine rows */}
          {ALL_MACHINES.map((machine) => {
            const color = MACHINE_META[machine].color;
            return (
              <div
                key={machine}
                className="grid border-b border-border last:border-0"
                style={{ gridTemplateColumns: `100px repeat(${WEEKDAYS.length}, 1fr)` }}
              >
                <div className="flex items-center px-3 py-2 border-r border-border">
                  <span className="text-sm font-bold" style={{ color }}>
                    {machine}
                  </span>
                </div>
                {WEEKDAYS.map((day, di) => {
                  const isToday = di === TODAY_INDEX;
                  return (
                    <div
                      key={day}
                      className={`border-l border-border p-1.5 space-y-1 ${isToday ? "bg-[oklch(0.97_0.06_95)]" : ""}`}
                    >
                      {SLOTS.map((slot) => {
                        const key = slotKey(machine, day, slot);
                        const placed = grid[key];
                        return (
                          <GridSlotCell
                            key={slot}
                            slotName={slot}
                            placed={placed}
                            color={color}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(machine, day, slot)}
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

      {/* Auftragstasche */}
      <div className="shrink-0 border-t border-border bg-card px-8 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
              Auftragstasche
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {tasche.length} bereit
            </span>
          </div>
          <button
            type="button"
            onClick={handleKiPlan}
            className="flex items-center gap-2 rounded-xl border border-dashed border-[oklch(0.55_0.22_258/0.6)] bg-[oklch(0.55_0.22_258/0.06)] px-4 py-2 text-xs font-semibold text-[oklch(0.40_0.22_258)] hover:bg-[oklch(0.55_0.22_258/0.12)] transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            ✦ KI verplant
          </button>
        </div>
        <div className="flex gap-3 flex-wrap">
          {tasche.length === 0 && (
            <div className="text-sm text-muted-foreground italic">Alle Aufträge verplant.</div>
          )}
          {tasche.map((job) => {
            const color = MACHINE_META[job.machine].color;
            return (
              <TascheCard
                key={job.id}
                job={job}
                color={color}
                onDragStart={() => handleDragStart(job)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GridSlotCell({
  slotName,
  placed,
  color,
  onDragOver,
  onDrop,
  onRemove,
}: {
  slotName: Slot;
  placed: PlacedJob | undefined;
  color: string;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onRemove: () => void;
}) {
  if (placed) {
    const isAi = placed.aiSuggested;
    return (
      <div
        className="relative rounded-lg px-2 py-1.5 group"
        style={{
          backgroundColor: isAi ? "oklch(0.55 0.22 258 / 0.08)" : `color-mix(in oklab, ${color} 10%, white)`,
          border: isAi ? "1.5px dashed oklch(0.55 0.22 258 / 0.7)" : `2px solid color-mix(in oklab, ${color} 20%, white)`,
          borderRadius: 8,
        }}
      >
        <div
          className="text-[9px] uppercase tracking-wider font-semibold mb-0.5"
          style={{ color: isAi ? "oklch(0.40 0.22 258)" : color }}
        >
          {slotName} {isAi && "· KI"}
        </div>
        <div className="text-[11px] font-semibold leading-tight truncate">{placed.customer}</div>
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/60 transition"
          aria-label="Auftrag entfernen"
        >
          <X className="h-2.5 w-2.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="rounded-lg border border-dashed border-[oklch(0.82_0.05_240)] bg-[oklch(0.97_0.03_240)] px-2 py-1.5 text-[9px] text-[oklch(0.60_0.08_240)] font-medium hover:border-[oklch(0.65_0.12_240)] hover:bg-[oklch(0.94_0.05_240)] transition"
      style={{ minHeight: 40 }}
    >
      <span className="opacity-60">{slotName}</span>
    </div>
  );
}

function TascheCard({
  job,
  color,
  onDragStart,
}: {
  job: Job;
  color: string;
  onDragStart: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="rounded-xl border px-3 py-2.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:translate-y-[-1px] transition select-none"
      style={{
        borderStyle: "solid",
        borderWidth: "1px 1px 1px 3px",
        borderColor: `var(--border) var(--border) var(--border) ${color}`,
        backgroundColor: `color-mix(in oklab, ${color} 8%, white)`,
        minWidth: 130,
      }}
    >
      <div className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color }}>
        {job.machine}
      </div>
      <div className="text-sm font-semibold leading-tight">{job.customer}</div>
      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
        {job.id} · {job.delivery}
      </div>
    </div>
  );
}
