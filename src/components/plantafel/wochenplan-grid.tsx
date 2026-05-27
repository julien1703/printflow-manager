import { useDroppable } from "@dnd-kit/core";
import { WEEKDAYS, SLOTS_BY_MACHINE, TODAY_INDEX, MACHINE_META, JOBS } from "@/lib/mock-data";
import type { Machine, Weekday, Slot, Job } from "@/lib/mock-data";
import { JobCard } from "./job-card";

type GridJob = {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  aiSuggested?: boolean;
  reason?: string;
};

type SlotKey = string;

function slotKey(weekOffset: number, machine: Machine, day: Weekday, slot: Slot): SlotKey {
  return `${weekOffset}|${machine}|${day}|${slot}`;
}

// 1h = 60px, 8h shift = 480px
function cardWidth(druckzeitStunden: number | undefined): number {
  return Math.max(60, ((druckzeitStunden ?? 1) / 8) * 480);
}

const SLOT_LABEL: Record<Slot, string> = { Früh: "F", Spät: "S", Nacht: "N" };

const WEEK_DAYS_LABELS: Record<Weekday, (kw: number) => string> = {
  Mo: (kw) => `Mo ${kw === 21 ? "19.05" : kw === 22 ? "26.05" : kw === 23 ? "02.06" : "09.06"}`,
  Di: (kw) => `Di ${kw === 21 ? "20.05" : kw === 22 ? "27.05" : kw === 23 ? "03.06" : "10.06"}`,
  Mi: (kw) => `Mi ${kw === 21 ? "21.05" : kw === 22 ? "28.05" : kw === 23 ? "04.06" : "11.06"}`,
  Do: (kw) => `Do ${kw === 21 ? "22.05" : kw === 22 ? "29.05" : kw === 23 ? "05.06" : "12.06"}`,
  Fr: (kw) => `Fr ${kw === 21 ? "23.05" : kw === 22 ? "30.05" : kw === 23 ? "06.06" : "13.06"}`,
};

const KW_META = [
  { kw: 21 },
  { kw: 22 },
  { kw: 23 },
  { kw: 24 },
];

interface WochenplanGridProps {
  machine: Machine;
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
  grid: Record<SlotKey, GridJob[]>;
  pinnedIds: Set<string>;
  onCardClick: (jobId: string) => void;
  onRemove: (key: SlotKey, jobId: string) => void;
  hideKwNav?: boolean;
}

function DropZoneRow({
  id,
  machine,
  day,
  slot,
  weekOffset,
  jobs,
  pinnedIds,
  onCardClick,
  onRemove,
  accent,
  isToday,
  isRzk,
}: {
  id: SlotKey;
  machine: Machine;
  day: Weekday;
  slot: Slot;
  weekOffset: number;
  jobs: GridJob[];
  pinnedIds: Set<string>;
  onCardClick: (jobId: string) => void;
  onRemove: (key: SlotKey, jobId: string) => void;
  accent: string;
  isToday: boolean;
  isRzk: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const rowHeight = isRzk ? 64 : 88;

  let stackLeft = 0;

  return (
    <div
      ref={setNodeRef}
      className="relative border-b border-border/40 transition-colors"
      style={{
        height: rowHeight,
        background: isOver
          ? "oklch(0.70 0.14 240 / 0.10)"
          : isToday
          ? "oklch(0.97 0.05 85 / 0.25)"
          : undefined,
        borderLeft: isToday ? `2px solid oklch(0.72 0.14 85)` : "2px solid transparent",
        opacity: isRzk ? 0.7 : 1,
      }}
    >
      {jobs.map((gj) => {
        const fullJob = JOBS.find((j) => j.id === gj.jobId);
        const w = cardWidth(fullJob?.druckzeitStunden);
        const l = stackLeft;
        stackLeft += w + 4;
        return (
          <JobCard
            key={gj.jobId}
            job={fullJob ?? ({
              id: gj.jobId,
              customer: gj.customer,
              machine: gj.machine,
              delivery: gj.delivery,
              product: "",
              phase: "Im Druck",
              orderStatus: "In Produktion",
              status: "Nach Plan",
              openSubsteps: 0,
            } as Job)}
            gridJob={gj}
            isPinned={pinnedIds.has(gj.jobId)}
            isAi={!!gj.aiSuggested}
            width={w}
            left={l}
            onClick={() => onCardClick(gj.jobId)}
            onRemove={() => onRemove(id, gj.jobId)}
            machineAccent={accent}
          />
        );
      })}
    </div>
  );
}

export function WochenplanGrid({
  machine,
  weekOffset,
  onWeekOffsetChange,
  grid,
  pinnedIds,
  onCardClick,
  onRemove,
  hideKwNav = false,
}: WochenplanGridProps) {
  const meta = MACHINE_META[machine];
  const accent =
    machine === "CD"   ? "oklch(0.55 0.18 255)" :
    machine === "SM5"  ? "oklch(0.55 0.18 295)" :
    machine === "RZK"  ? "oklch(0.55 0.04 255)" :
                         "oklch(0.52 0.18 145)";
  const slots = SLOTS_BY_MACHINE[machine];
  const isRzk = machine === "RZK";
  const kw = KW_META[weekOffset]?.kw ?? 21;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* KW Navigation */}
      {!hideKwNav && (
        <div className="flex items-center gap-1 px-6 py-2 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <button
            type="button"
            onClick={() => onWeekOffsetChange(weekOffset - 1)}
            disabled={weekOffset === 0}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition"
            aria-label="Vorherige Woche"
          >
            ‹
          </button>
          {KW_META.map((w, i) => (
            <button
              key={w.kw}
              type="button"
              onClick={() => onWeekOffsetChange(i)}
              className="px-3 py-1 rounded text-sm font-medium transition"
              style={
                i === weekOffset
                  ? { background: accent, color: "white" }
                  : { color: "oklch(0.50 0.006 255)" }
              }
            >
              KW {w.kw}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onWeekOffsetChange(weekOffset + 1)}
            disabled={weekOffset === KW_META.length - 1}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition"
            aria-label="Nächste Woche"
          >
            ›
          </button>
        </div>
      )}

      {/* Grid header: day labels */}
      <div
        className="grid shrink-0 border-b border-border bg-background/60"
        style={{ gridTemplateColumns: `64px repeat(${WEEKDAYS.length}, 1fr)` }}
      >
        <div className="border-r border-border" />
        {WEEKDAYS.map((day, di) => {
          const isToday = weekOffset === 0 && di === TODAY_INDEX;
          return (
            <div
              key={day}
              className="text-[10px] font-semibold text-muted-foreground px-2 py-1.5 border-r border-border last:border-r-0"
              style={
                isToday
                  ? { color: "oklch(0.52 0.14 85)", fontWeight: 700, borderLeft: `2px solid oklch(0.72 0.14 85)` }
                  : undefined
              }
            >
              {WEEK_DAYS_LABELS[day](kw)}
            </div>
          );
        })}
      </div>

      {/* Slot rows */}
      {slots.map((slot) => (
        <div
          key={slot}
          className="grid"
          style={{ gridTemplateColumns: `64px repeat(${WEEKDAYS.length}, 1fr)` }}
        >
          {/* Slot label */}
          <div
            className="flex items-center justify-center border-r border-border border-b border-border/40 shrink-0"
            style={{ height: isRzk ? 64 : 88 }}
          >
            <span
              className="text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
              style={{ background: `${accent}22`, color: accent }}
            >
              {SLOT_LABEL[slot]}
            </span>
          </div>

          {/* Day cells */}
          {WEEKDAYS.map((day, di) => {
            const isToday = weekOffset === 0 && di === TODAY_INDEX;
            const key = slotKey(weekOffset, machine, day, slot);
            const jobs = grid[key] ?? [];
            return (
              <div key={day} className="border-r border-border last:border-r-0 overflow-hidden">
                <DropZoneRow
                  id={key}
                  machine={machine}
                  day={day}
                  slot={slot}
                  weekOffset={weekOffset}
                  jobs={jobs}
                  pinnedIds={pinnedIds}
                  onCardClick={onCardClick}
                  onRemove={onRemove}
                  accent={accent}
                  isToday={isToday}
                  isRzk={isRzk}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
