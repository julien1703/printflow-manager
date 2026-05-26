import { useState } from "react";
import type React from "react";
import {
  JOBS, MACHINE_META, WEEKDAYS, SLOTS_BY_MACHINE, TODAY_INDEX,
  type Job, type Machine, type Weekday, type Slot,
} from "@/lib/mock-data";
import { buildKIPlan, type PlacedJob } from "@/lib/planning-ai";
import { AuftragDrawer } from "@/components/plantafel/auftrag-drawer";
import { Check, Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

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

const ALL_MACHINES: Machine[] = ["CD", "SM5", "RZK", "Digi"];

const WEEK_META = [
  { kw: 21, label: "20.–24. Mai 2026" },
  { kw: 22, label: "27.–31. Mai 2026" },
  { kw: 23, label: "03.–07. Jun. 2026" },
  { kw: 24, label: "10.–14. Jun. 2026" },
];

const MAX_WEEK_OFFSET = WEEK_META.length - 1;

const PLANNABLE_JOBS = JOBS.filter(
  (j) => j.druckzeitStunden !== undefined || j.machine === "Digi"
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slotKey(weekOffset: number, machine: Machine, day: Weekday, slot: Slot): SlotKey {
  return `${weekOffset}|${machine}|${day}|${slot}`;
}

function cardStyle(job: Job, isPinned: boolean): React.CSSProperties {
  let bg: string;
  let border: string;

  if (job.cascadeConflict) {
    bg = "oklch(0.93 0.10 25 / 0.9)";
    border = "1.5px solid oklch(0.55 0.22 25)";
  } else if (job.prioritaet === "express" || job.prioritaet === "eilig") {
    bg = "oklch(0.93 0.12 50 / 0.9)";
    border = "1.5px solid oklch(0.62 0.16 50)";
  } else if (
    job.druckfreigabe === "Fehlt" ||
    job.druckfreigabe === "Angefordert"
  ) {
    bg = "oklch(0.96 0.10 85 / 0.9)";
    border = "1.5px solid oklch(0.60 0.18 85)";
  } else {
    bg = "oklch(0.93 0.07 145 / 0.9)";
    border = "1.5px solid oklch(0.55 0.18 145)";
  }

  if (isPinned) {
    border = "2px solid oklch(0.55 0.22 280)";
  }

  return { background: bg, border };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WochenplanungView() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [grid, setGrid] = useState<Record<SlotKey, GridJob[]>>({});
  const [eingang, setEingang] = useState<Job[]>(() =>
    PLANNABLE_JOBS.filter((j) => j.isNew)
  );
  const [tasche, setTasche] = useState<Job[]>(() =>
    PLANNABLE_JOBS.filter(
      (j) => !j.isNew && j.machine !== "Digi" && j.druckzeitStunden !== undefined
    )
  );
  const [dragSourceMachine, setDragSourceMachine] = useState<Machine | null>(null);
  const [newlyPlaced, setNewlyPlaced] = useState<Set<SlotKey>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    () => new Set(JOBS.filter((j) => j.festgepinnt).map((j) => j.id))
  );
  const [expandedRzk, setExpandedRzk] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [prioritaetOverrides, setPrioritaetOverrides] = useState<
    Record<string, Job["prioritaet"]>
  >({});
  const [notizOverrides, setNotizOverrides] = useState<Record<string, string>>({});

  const hasKiSlots = Object.values(grid)
    .flat()
    .some((s) => s.aiSuggested);

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
    const allUnplaced = [...eingang, ...tasche];
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

  function confirmKiPlan() {
    let placedIds: Set<string> = new Set();
    setGrid((prev) => {
      const confirmed: Record<SlotKey, GridJob[]> = {};
      for (const [key, jobs] of Object.entries(prev)) {
        confirmed[key] = jobs.map((gj) => ({ ...gj, aiSuggested: false as const }));
      }
      placedIds = new Set(Object.values(prev).flat().map((gj) => gj.jobId));
      return confirmed;
    });
    setEingang((prev) => prev.filter((j) => !placedIds.has(j.id)));
    setTasche((prev) => prev.filter((j) => !placedIds.has(j.id)));
  }

  function resetKiPlan() {
    setGrid((prev) => {
      const next: Record<SlotKey, GridJob[]> = {};
      for (const [key, jobs] of Object.entries(prev)) {
        const kept = jobs.filter((gj) => !gj.aiSuggested);
        if (kept.length > 0) next[key] = kept;
      }
      return next;
    });
  }

  function handleDrop(
    e: React.DragEvent<HTMLDivElement>,
    machine: Machine,
    day: Weekday,
    slot: Slot
  ) {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("jobId");
    const job =
      eingang.find((j) => j.id === jobId) ??
      tasche.find((j) => j.id === jobId);
    if (!job) return;
    if (!SLOTS_BY_MACHINE[machine].includes(slot)) return;

    const key = slotKey(currentWeekOffset, machine, day, slot);

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
      [key]: [...(prev[key] ?? []), newGridJob],
    }));

    setEingang((prev) => prev.filter((j) => j.id !== jobId));
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
    setDragSourceMachine(null);
  }

  function removeFromGrid(key: SlotKey, jobId: string) {
    setGrid((prev) => {
      const cell = prev[key] ?? [];
      const kept = cell.filter((gj) => gj.jobId !== jobId);
      const next = { ...prev };
      if (kept.length === 0) {
        delete next[key];
      } else {
        next[key] = kept;
      }
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

  const weekInfo = WEEK_META[Math.min(currentWeekOffset, MAX_WEEK_OFFSET)];

  return (
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
        <EingangStreifen
          jobs={eingang}
          onDragStart={(machine) => setDragSourceMachine(machine)}
          onDragEnd={() => setDragSourceMachine(null)}
          onKiVorschlag={handleKiPlan}
        />
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="soft-card overflow-hidden">
            {/* Week navigation header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
              <button
                type="button"
                onClick={() => setCurrentWeekOffset((o) => Math.max(0, o - 1))}
                disabled={currentWeekOffset === 0}
                className="rounded-lg p-1.5 hover:bg-muted transition disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold">KW {weekInfo.kw}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {weekInfo.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCurrentWeekOffset((o) => Math.min(MAX_WEEK_OFFSET, o + 1))
                }
                disabled={currentWeekOffset === MAX_WEEK_OFFSET}
                className="rounded-lg p-1.5 hover:bg-muted transition disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {currentWeekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentWeekOffset(0)}
                  className="text-xs text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-lg hover:bg-muted"
                >
                  Heute
                </button>
              )}
            </div>

            {/* Day column headers */}
            <div
              className="grid border-b border-border bg-muted/20"
              style={{ gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)` }}
            >
              <div className="px-3 py-2 border-r border-border" />
              {WEEKDAYS.map((d, i) => {
                const isToday = currentWeekOffset === 0 && i === TODAY_INDEX;
                return (
                  <div
                    key={d}
                    className={`px-3 py-2 text-center border-l border-border ${
                      isToday ? "bg-[oklch(0.94_0.08_85)]" : ""
                    }`}
                  >
                    <div
                      className={`text-[10px] uppercase tracking-[0.14em] font-bold ${
                        isToday ? "text-[oklch(0.42_0.16_85)]" : "text-muted-foreground"
                      }`}
                    >
                      {d}
                    </div>
                    {isToday && (
                      <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[oklch(0.90_0.10_85)] px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.18_85)]" />
                        <span className="text-[9px] font-bold text-[oklch(0.42_0.16_85)]">
                          Heute
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Machine rows */}
            {ALL_MACHINES.map((machine) => {
              const color = MACHINE_META[machine].color;
              const slots = SLOTS_BY_MACHINE[machine];

              if (machine === "Digi") {
                const digiJob = JOBS.find(
                  (j) => j.machine === "Digi" && j.orderStatus === "In Produktion"
                );
                const status = digiJob?.problem
                  ? { label: "Rückstau", color: "oklch(0.55 0.17 85)" }
                  : digiJob
                  ? { label: "Läuft", color: "oklch(0.45 0.18 145)" }
                  : { label: "Ok", color: "oklch(0.60 0.04 255)" };
                return <DigiRow key={machine} color={color} status={status} />;
              }

              if (machine === "RZK") {
                const rzkHasJobs = WEEKDAYS.some((day) =>
                  slots.some(
                    (slot) =>
                      (grid[slotKey(currentWeekOffset, machine, day, slot)] ?? []).length > 0
                  )
                );
                const isExpanded = rzkHasJobs || expandedRzk;

                return (
                  <div
                    key={machine}
                    className="border-b border-border last:border-0"
                    style={{ opacity: isExpanded ? 1 : 0.5 }}
                  >
                    {!isExpanded ? (
                      <div
                        className="grid cursor-pointer hover:opacity-80 transition"
                        style={{
                          gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)`,
                          height: 32,
                        }}
                        onClick={() => setExpandedRzk(true)}
                      >
                        <div className="flex items-center px-3 gap-1 border-r border-border">
                          <span className="text-xs font-black" style={{ color }}>
                            RZK
                          </span>
                          <span className="text-[9px] text-muted-foreground">▸</span>
                        </div>
                        {WEEKDAYS.map((d) => (
                          <div
                            key={d}
                            className="border-l border-border flex items-center justify-center"
                          >
                            <span className="text-[9px] text-muted-foreground italic">leer</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)`,
                        }}
                      >
                        <div className="flex flex-col items-center justify-center px-2 py-2 border-r border-border gap-0.5">
                          <button
                            type="button"
                            onClick={() => setExpandedRzk(false)}
                            className="text-[9px] text-muted-foreground hover:text-foreground transition"
                          >
                            ▴
                          </button>
                          <span className="text-xs font-black" style={{ color }}>
                            RZK
                          </span>
                        </div>
                        {WEEKDAYS.map((day, di) => {
                          const isToday = currentWeekOffset === 0 && di === TODAY_INDEX;
                          return (
                            <div
                              key={day}
                              className={`border-l border-border p-1.5 ${
                                isToday ? "bg-[oklch(0.97_0.06_85)]" : ""
                              }`}
                              style={isToday ? { borderLeft: "3px solid oklch(0.72 0.14 85)" } : undefined}
                            >
                              {slots.map((slot) => {
                                const key = slotKey(currentWeekOffset, machine, day, slot);
                                const cellJobs = grid[key] ?? [];
                                return (
                                  <SchichtZelle
                                    key={slot}
                                    slotName={slot}
                                    cellJobs={cellJobs}
                                    color={color}
                                    machine={machine}
                                    dragSourceMachine={dragSourceMachine}
                                    newlyPlaced={newlyPlaced}
                                    slotKeyVal={key}
                                    pinnedIds={pinnedIds}
                                    onDrop={(e) => handleDrop(e, machine, day, slot)}
                                    onRemove={(jobId) => removeFromGrid(key, jobId)}
                                    onCardClick={(jobId) => setSelectedJobId(jobId)}
                                    height={100}
                                  />
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isCd = machine === "CD";
              return (
                <div
                  key={machine}
                  className="grid border-b border-border last:border-0"
                  style={{
                    gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)`,
                    background: isCd
                      ? `color-mix(in oklab, ${color} 4%, var(--background))`
                      : undefined,
                  }}
                >
                  <div className="flex flex-col items-center justify-center px-2 py-3 border-r border-border gap-1">
                    <span
                      className={`font-black ${isCd ? "text-base" : "text-sm"}`}
                      style={{ color }}
                    >
                      {machine}
                    </span>
                    <div
                      className="h-1 w-8 rounded-full"
                      style={{ backgroundColor: color, opacity: 0.4 }}
                    />
                  </div>

                  {WEEKDAYS.map((day, di) => {
                    const isToday = currentWeekOffset === 0 && di === TODAY_INDEX;
                    return (
                      <div
                        key={day}
                        className={`border-l border-border p-1.5 space-y-1 ${
                          isToday ? "bg-[oklch(0.97_0.06_85/0.5)]" : ""
                        }`}
                        style={isToday ? { borderLeft: "3px solid oklch(0.72 0.14 85)" } : undefined}
                      >
                        {slots.map((slot) => {
                          const key = slotKey(currentWeekOffset, machine, day, slot);
                          const cellJobs = grid[key] ?? [];
                          return (
                            <SchichtZelle
                              key={slot}
                              slotName={slot}
                              cellJobs={cellJobs}
                              color={color}
                              machine={machine}
                              dragSourceMachine={dragSourceMachine}
                              newlyPlaced={newlyPlaced}
                              slotKeyVal={key}
                              pinnedIds={pinnedIds}
                              onDrop={(e) => handleDrop(e, machine, day, slot)}
                              onRemove={(jobId) => removeFromGrid(key, jobId)}
                              onCardClick={(jobId) => setSelectedJobId(jobId)}
                              height={160}
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

        {/* Auftragstasche sidebar */}
        <div className="w-64 shrink-0 border-l border-border flex flex-col bg-muted/20">
          <div className="px-4 py-4 border-b border-border shrink-0">
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
              className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white transition hover:opacity-90 shadow-md"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.48 0.19 295))",
                boxShadow: "0 4px 16px oklch(0.55 0.22 280 / 0.30)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              KI-Plan
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                  onDragStart={(machine) => setDragSourceMachine(machine)}
                  onDragEnd={() => setDragSourceMachine(null)}
                  onToggleFestgepinnt={() => togglePinned(job.id)}
                />
              );
            })}
          </div>

          {hasKiSlots && (
            <div className="shrink-0 p-3 border-t border-border space-y-2">
              <button
                type="button"
                onClick={confirmKiPlan}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white transition shadow-sm hover:opacity-90"
                style={{ background: "oklch(0.52 0.14 153)" }}
              >
                <Check className="h-4 w-4" />
                Plan bestätigen
              </button>
              <button
                type="button"
                onClick={resetKiPlan}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition"
              >
                Zurücksetzen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedJob && (
        <AuftragDrawer
          job={{
            ...selectedJob,
            festgepinnt: pinnedIds.has(selectedJob.id),
            prioritaet:
              prioritaetOverrides[selectedJob.id] ?? selectedJob.prioritaet,
            notiz: notizOverrides[selectedJob.id] ?? selectedJob.notiz,
          }}
          onClose={() => setSelectedJobId(null)}
          onToggleFestgepinnt={() => togglePinned(selectedJob.id)}
          onPrioritaetChange={(p) =>
            setPrioritaetOverrides((prev) => ({ ...prev, [selectedJob.id]: p }))
          }
          onNotizChange={(text) =>
            setNotizOverrides((prev) => ({ ...prev, [selectedJob.id]: text }))
          }
        />
      )}
    </div>
  );
}

// ─── EingangStreifen ─────────────────────────────────────────────────────────

function EingangStreifen({
  jobs,
  onDragStart,
  onDragEnd,
  onKiVorschlag,
}: {
  jobs: Job[];
  onDragStart: (machine: Machine) => void;
  onDragEnd: () => void;
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
            background:
              "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.48 0.19 295))",
          }}
        >
          <Sparkles className="h-3 w-3" />
          KI-Vorschlag
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {jobs.map((job) => (
          <EingangKarte
            key={job.id}
            job={job}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

function EingangKarte({
  job,
  onDragStart,
  onDragEnd,
}: {
  job: Job;
  onDragStart: (machine: Machine) => void;
  onDragEnd: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const machineColor = MACHINE_META[job.machine].color;

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
      className={`shrink-0 rounded-xl select-none transition-all overflow-hidden ${
        isDragging
          ? "opacity-40 scale-95 cursor-grabbing"
          : "cursor-grab hover:shadow-md hover:-translate-y-0.5 neu-ring"
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
            {job.machine}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[8px] font-bold pulse-chip"
            style={{
              background: "oklch(0.35 0.18 145 / 0.12)",
              color: "oklch(0.30 0.16 145)",
            }}
          >
            NEU
          </span>
          {job.prioritaet && job.prioritaet !== "normal" && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                background: "oklch(0.93 0.12 50 / 0.25)",
                color: "oklch(0.50 0.18 50)",
              }}
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
          <span
            className="text-[9px] font-mono"
            style={{ color: "oklch(0.50 0.08 25)" }}
          >
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
                style={{
                  background: "oklch(0.93 0.12 50 / 0.18)",
                  color: "oklch(0.50 0.16 50)",
                }}
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

// ─── SchichtZelle ────────────────────────────────────────────────────────────

function SchichtZelle({
  slotName,
  cellJobs,
  color,
  machine,
  dragSourceMachine,
  newlyPlaced,
  slotKeyVal,
  pinnedIds,
  onDrop,
  onRemove,
  onCardClick,
  height,
}: {
  slotName: Slot;
  cellJobs: GridJob[];
  color: string;
  machine: Machine;
  dragSourceMachine: Machine | null;
  newlyPlaced: Set<SlotKey>;
  slotKeyVal: SlotKey;
  pinnedIds: Set<string>;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemove: (jobId: string) => void;
  onCardClick: (jobId: string) => void;
  height: number;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isMismatch = dragSourceMachine !== null && dragSourceMachine !== machine;

  const totalHours = cellJobs.reduce((acc, gj) => {
    const j = JOBS.find((j2) => j2.id === gj.jobId);
    return acc + (j?.druckzeitStunden ?? 0);
  }, 0);
  const isOverCapacity = totalHours > 8;

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition ${
        isOverCapacity ? "ring-2 ring-destructive" : ""
      }`}
      style={{
        height,
        background:
          isDragOver && !isMismatch
            ? "oklch(0.96 0.04 280)"
            : "oklch(0.97 0.00 0 / 0.4)",
        border: `1px dashed ${
          isDragOver && !isMismatch
            ? "oklch(0.55 0.22 280 / 0.6)"
            : isDragOver && isMismatch
            ? "oklch(0.55 0.22 25 / 0.6)"
            : "var(--border)"
        }`,
        outline: isDragOver && !isMismatch ? "2px solid oklch(0.55 0.22 280 / 0.4)" : undefined,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e);
      }}
    >
      {cellJobs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground/40 font-medium">
            {slotName}
          </span>
        </div>
      )}

      {(() => {
        let stackOffset = 0;
        return cellJobs.map((gridJob, i) => {
          const fullJob = JOBS.find((j) => j.id === gridJob.jobId);
          const jobHeight = fullJob?.druckzeitStunden
            ? Math.max(28, (fullJob.druckzeitStunden / 8) * height)
            : 36;
          const top = stackOffset;
          stackOffset += jobHeight;
          const isPinned = pinnedIds.has(gridJob.jobId);
          const isNew = newlyPlaced.has(slotKeyVal);
          return (
            <AuftragKarte
              key={`${gridJob.jobId}-${i}`}
              gridJob={gridJob}
              fullJob={fullJob}
              top={top}
              height={Math.min(jobHeight, height - top)}
              isPinned={isPinned}
              isAi={gridJob.aiSuggested}
              isNew={isNew}
              color={color}
              onRemove={() => onRemove(gridJob.jobId)}
              onClick={() => onCardClick(gridJob.jobId)}
            />
          );
        });
      })()}

      {cellJobs.length > 0 && !isOverCapacity && (() => {
        const usedPx = cellJobs.reduce((acc, gj) => {
          const j = JOBS.find((j2) => j2.id === gj.jobId);
          return acc + Math.max(28, ((j?.druckzeitStunden ?? 0) / 8) * height);
        }, 0);
        const freePx = height - usedPx;
        if (freePx < 16) return null;
        const freeHours = ((freePx / height) * 8).toFixed(1);
        return (
          <div
            className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
            style={{ top: usedPx, height: freePx }}
          >
            <span className="text-[8px] text-muted-foreground/50 italic">
              {freeHours}h frei
            </span>
          </div>
        );
      })()}

      {isDragOver && isMismatch && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 rounded-xl">
          <span className="text-[9px] text-destructive/70 font-medium">
            Falsche Maschine
          </span>
        </div>
      )}
    </div>
  );
}

// ─── FlagChip ────────────────────────────────────────────────────────────────

function FlagChip({
  label,
  accent,
}: {
  label: string;
  accent?: string;
}) {
  return (
    <span
      className="text-[7px] rounded px-1 py-0.5 font-medium leading-none"
      style={{
        background: accent
          ? `color-mix(in oklab, ${accent} 15%, white)`
          : "oklch(1 0 0 / 0.55)",
        color: accent ?? "oklch(0.40 0.04 0)",
      }}
    >
      {label}
    </span>
  );
}

// ─── AuftragKarte ────────────────────────────────────────────────────────────

function AuftragKarte({
  gridJob,
  fullJob,
  top,
  height,
  isPinned,
  isAi,
  isNew,
  color,
  onRemove,
  onClick,
}: {
  gridJob: GridJob;
  fullJob: Job | undefined;
  top: number;
  height: number;
  isPinned: boolean;
  isAi: boolean;
  isNew: boolean;
  color: string;
  onRemove: () => void;
  onClick: () => void;
}) {
  const style = fullJob
    ? cardStyle(fullJob, isPinned)
    : {
        background: "oklch(0.93 0.07 145 / 0.9)",
        border: "1.5px solid oklch(0.55 0.18 145)",
      };

  const aiStyle: React.CSSProperties = isAi
    ? {
        background: "oklch(0.95 0.04 280)",
        border: "1.5px dashed oklch(0.55 0.22 258 / 0.7)",
      }
    : {};

  const deliveryColor =
    fullJob?.status === "Hinterher"
      ? "oklch(0.52 0.20 25)"
      : "oklch(0.45 0.04 0)";

  return (
    <div
      className={`absolute group cursor-pointer rounded-lg overflow-hidden transition-all duration-150 hover:shadow-[0_3px_12px_oklch(0_0_0/0.18)] hover:brightness-[1.03] ${
        isNew ? "pop-in" : ""
      } ${isAi ? "ki-pulse" : ""}`}
      style={{
        top,
        height,
        left: 4,
        right: 4,
        ...style,
        ...aiStyle,
      }}
      onClick={onClick}
    >
      {!isAi && (
        <div style={{ height: 3, backgroundColor: color, flexShrink: 0 }} />
      )}

      <div className="px-1.5 pt-1 pb-0.5 overflow-hidden flex flex-col" style={{ height: height - (isAi ? 0 : 3) }}>
        {height >= 36 && (
          <div
            className="text-[11px] font-bold truncate leading-tight"
            style={{ color: isAi ? "oklch(0.40 0.22 258)" : undefined }}
          >
            {isAi && "✦ "}
            {gridJob.customer}
          </div>
        )}

        {height >= 52 && fullJob && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-mono text-muted-foreground">
              {fullJob.druckzeitStunden}h
            </span>
            <span className="text-[9px] text-muted-foreground/40">·</span>
            <span className="text-[9px] font-mono" style={{ color: deliveryColor }}>
              {gridJob.delivery}
            </span>
          </div>
        )}

        {height >= 68 && fullJob && (
          <div className="flex flex-wrap gap-0.5 mt-auto pb-0.5">
            {fullJob.dispersionslack && <FlagChip label="Lack" />}
            {fullJob.grammatur && (
              <FlagChip label={`${fullJob.grammatur}g`} />
            )}
            {fullJob.sonderfarbe && (
              <FlagChip label="Sonderf." accent="oklch(0.62 0.16 50)" />
            )}
            {isPinned && <FlagChip label="Gepinnt" accent="oklch(0.55 0.22 280)" />}
            {(fullJob.prioritaet === "eilig" ||
              fullJob.prioritaet === "express") && (
              <FlagChip label={fullJob.prioritaet} accent="oklch(0.62 0.16 50)" />
            )}
          </div>
        )}

        {isAi && gridJob.aiSuggested && gridJob.reason && height >= 80 && (
          <div className="text-[7px] italic text-muted-foreground mt-0.5 leading-tight opacity-80 overflow-hidden">
            {gridJob.reason}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-0.5 right-0.5 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/70 transition"
        aria-label="Entfernen"
      >
        <X className="h-2.5 w-2.5 text-muted-foreground" />
      </button>
    </div>
  );
}

// ─── DigiRow ──────────────────────────────────────────────────────────────────

function DigiRow({
  color,
  status,
}: {
  color: string;
  status: { label: string; color: string };
}) {
  return (
    <div
      className="grid border-b border-border last:border-0"
      style={{ gridTemplateColumns: `80px repeat(5, 1fr)`, height: 48 }}
    >
      <div className="flex items-center justify-center px-2 border-r border-border">
        <span className="text-xs font-black" style={{ color }}>
          Digi
        </span>
      </div>
      <div className="col-span-5 border-l border-border flex items-center px-4 gap-3">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: status.color }}
        />
        <span className="text-xs font-medium" style={{ color: status.color }}>
          {status.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          Digitaldruck · Weber AG · Meyer Consulting
        </span>
      </div>
    </div>
  );
}

// ─── TascheCard ──────────────────────────────────────────────────────────────

function TascheCard({
  job,
  color,
  onDragStart,
  onDragEnd,
  onToggleFestgepinnt: _onToggleFestgepinnt,
}: {
  job: Job;
  color: string;
  onDragStart: (machine: Machine) => void;
  onDragEnd: () => void;
  onToggleFestgepinnt?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const deliveryColor =
    job.status === "Hinterher"
      ? "oklch(0.52 0.20 25)"
      : "oklch(0.45 0.04 0)";

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
      className={`drag-card rounded-xl select-none overflow-hidden ${
        isDragging ? "dragging" : ""
      }`}
      style={{
        border: `1px solid color-mix(in oklab, ${color} 25%, var(--border))`,
        backgroundColor: `color-mix(in oklab, ${color} 8%, var(--card))`,
      }}
    >
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              backgroundColor: `color-mix(in oklab, ${color} 18%, white)`,
              color,
            }}
          >
            {job.machine}
          </span>
          <span
            className="text-[9px] font-mono font-semibold"
            style={{ color: deliveryColor }}
          >
            {job.delivery}
          </span>
          {job.prioritaet && job.prioritaet !== "normal" && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                background: "oklch(0.93 0.12 50 / 0.25)",
                color: "oklch(0.50 0.18 50)",
              }}
            >
              {job.prioritaet}
            </span>
          )}
          {job.festgepinnt && (
            <span className="text-[8px] text-muted-foreground font-medium">
              Gepinnt
            </span>
          )}
        </div>

        <div className="text-xs font-bold leading-tight truncate">{job.customer}</div>

        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {job.druckzeitStunden && (
            <span className="text-[9px] font-mono text-muted-foreground">
              {job.druckzeitStunden}h
            </span>
          )}
          {job.dispersionslack && (
            <span className="text-[8px] bg-white/60 rounded px-1 py-0.5 text-muted-foreground font-medium">
              Lack
            </span>
          )}
          {job.sonderfarbe && (
            <span
              className="text-[8px] rounded px-1 py-0.5 font-medium"
              style={{
                background: "oklch(0.93 0.12 50 / 0.18)",
                color: "oklch(0.50 0.16 50)",
              }}
            >
              Sonderf.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
