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

function cardWidth(druckzeitStunden: number | undefined): number {
  return Math.max(60, ((druckzeitStunden ?? 1) / 8) * 480);
}

const SLOT_META: Record<Slot, { label: string; short: string; hue: number }> = {
  Früh:  { label: "Frühschicht",  short: "F", hue: 85  },
  Spät:  { label: "Spätschicht",  short: "S", hue: 255 },
  Nacht: { label: "Nachtschicht", short: "N", hue: 280 },
};

const WEEK_DAYS_LABELS: Record<Weekday, (kw: number) => { day: string; date: string }> = {
  Mo: (kw) => ({ day: "Mo", date: kw === 21 ? "19.05" : kw === 22 ? "26.05" : kw === 23 ? "02.06" : "09.06" }),
  Di: (kw) => ({ day: "Di", date: kw === 21 ? "20.05" : kw === 22 ? "27.05" : kw === 23 ? "03.06" : "10.06" }),
  Mi: (kw) => ({ day: "Mi", date: kw === 21 ? "21.05" : kw === 22 ? "28.05" : kw === 23 ? "04.06" : "11.06" }),
  Do: (kw) => ({ day: "Do", date: kw === 21 ? "22.05" : kw === 22 ? "29.05" : kw === 23 ? "05.06" : "12.06" }),
  Fr: (kw) => ({ day: "Fr", date: kw === 21 ? "23.05" : kw === 22 ? "30.05" : kw === 23 ? "06.06" : "13.06" }),
};

const KW_META = [{ kw: 21 }, { kw: 22 }, { kw: 23 }, { kw: 24 }];

interface WochenplanGridProps {
  machine: Machine;
  weekOffset: number;
  onWeekOffsetChange: (offset: number) => void;
  grid: Record<SlotKey, GridJob[]>;
  pinnedIds: Set<string>;
  onCardClick: (jobId: string) => void;
  onRemove: (key: SlotKey, jobId: string) => void;
  hideKwNav?: boolean;
  readOnly?: boolean;
}

function DropZoneRow({
  id, slot, weekOffset, jobs, pinnedIds, onCardClick, onRemove, accent, isToday, isRzk, readOnly,
}: {
  id: SlotKey;
  slot: Slot;
  weekOffset: number;
  jobs: GridJob[];
  pinnedIds: Set<string>;
  onCardClick: (jobId: string) => void;
  onRemove: (key: SlotKey, jobId: string) => void;
  accent: string;
  isToday: boolean;
  isRzk: boolean;
  readOnly?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const rowHeight = isRzk ? 60 : 84;
  let stackLeft = 0;

  return (
    <div
      ref={readOnly ? undefined : setNodeRef}
      className="relative transition-colors"
      style={{
        height: rowHeight,
        background: isOver && !readOnly
          ? `oklch(0.70 0.14 ${SLOT_META[slot].hue} / 0.12)`
          : isToday
          ? "oklch(0.97 0.04 85 / 0.30)"
          : undefined,
        outline: isOver && !readOnly ? `1.5px dashed oklch(0.60 0.14 ${SLOT_META[slot].hue} / 0.5)` : undefined,
        outlineOffset: -2,
        opacity: isRzk ? 0.75 : 1,
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
              id: gj.jobId, customer: gj.customer, machine: gj.machine,
              delivery: gj.delivery, product: "", phase: "Im Druck",
              orderStatus: "In Produktion", status: "Nach Plan", openSubsteps: 0,
            } as Job)}
            gridJob={gj}
            isPinned={pinnedIds.has(gj.jobId)}
            isAi={!!gj.aiSuggested}
            width={w}
            left={l}
            onClick={() => onCardClick(gj.jobId)}
            onRemove={readOnly ? () => {} : () => onRemove(id, gj.jobId)}
            machineAccent={accent}
          />
        );
      })}
    </div>
  );
}

export function WochenplanGrid({
  machine, weekOffset, onWeekOffsetChange, grid, pinnedIds,
  onCardClick, onRemove, hideKwNav = false, readOnly = false,
}: WochenplanGridProps) {
  const accent =
    machine === "CD"   ? "oklch(0.55 0.18 255)" :
    machine === "SM5"  ? "oklch(0.55 0.18 295)" :
    machine === "RZK"  ? "oklch(0.55 0.04 255)" :
                         "oklch(0.52 0.18 145)";
  const slots = SLOTS_BY_MACHINE[machine];
  const isRzk = machine === "RZK";
  const kw = KW_META[weekOffset]?.kw ?? 21;
  const LABEL_W = 80;

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* KW Navigation */}
      {!hideKwNav && (
        <div
          className="flex items-center gap-1.5 px-5 py-2.5 border-b border-border shrink-0"
          style={{ background: "oklch(0.98 0.003 255)" }}
        >
          <button
            type="button"
            onClick={() => onWeekOffsetChange(weekOffset - 1)}
            disabled={weekOffset === 0}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-25 transition text-muted-foreground font-semibold"
            aria-label="Vorherige Woche"
          >‹</button>
          {KW_META.map((w, i) => (
            <button
              key={w.kw}
              type="button"
              onClick={() => onWeekOffsetChange(i)}
              className="h-7 px-3 rounded-lg text-xs font-semibold transition"
              style={
                i === weekOffset
                  ? { background: accent, color: "white" }
                  : { color: "oklch(0.55 0.006 255)", background: "transparent" }
              }
            >
              KW {w.kw}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onWeekOffsetChange(weekOffset + 1)}
            disabled={weekOffset === KW_META.length - 1}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-25 transition text-muted-foreground font-semibold"
            aria-label="Nächste Woche"
          >›</button>
        </div>
      )}

      {/* Day header */}
      <div
        className="grid shrink-0 border-b border-border"
        style={{ gridTemplateColumns: `${LABEL_W}px repeat(${WEEKDAYS.length}, 1fr)`, background: "oklch(0.985 0.002 255)" }}
      >
        <div className="border-r border-border/60" />
        {WEEKDAYS.map((day, di) => {
          const isToday = weekOffset === 0 && di === TODAY_INDEX;
          const { day: dayLabel, date } = WEEK_DAYS_LABELS[day](kw);
          return (
            <div
              key={day}
              className="flex flex-col items-center justify-center px-2 py-2 border-r border-border/60 last:border-r-0"
              style={
                isToday
                  ? { background: "oklch(0.16 0.008 255)" }
                  : undefined
              }
            >
              <span
                className="text-[11px] font-black leading-none"
                style={{ color: isToday ? "white" : "oklch(0.22 0.008 255)" }}
              >
                {dayLabel}
              </span>
              <span
                className="text-[9px] font-mono mt-0.5 leading-none"
                style={{ color: isToday ? "oklch(0.70 0.005 255)" : "oklch(0.60 0.006 255)" }}
              >
                {date}
              </span>
            </div>
          );
        })}
      </div>

      {/* Slot rows */}
      {slots.map((slot, slotIdx) => {
        const meta = SLOT_META[slot];
        const isLastSlot = slotIdx === slots.length - 1;
        return (
          <div
            key={slot}
            className="grid shrink-0"
            style={{
              gridTemplateColumns: `${LABEL_W}px repeat(${WEEKDAYS.length}, 1fr)`,
              borderBottom: isLastSlot ? "none" : "1px solid oklch(0.91 0.003 255)",
            }}
          >
            {/* Slot label */}
            <div
              className="flex flex-col items-center justify-center gap-1 border-r border-border/60 shrink-0 py-2"
              style={{ height: isRzk ? 60 : 84 }}
            >
              <div
                className="h-5 w-5 rounded-lg flex items-center justify-center text-[9px] font-black"
                style={{
                  background: `oklch(0.92 0.06 ${meta.hue} / 0.5)`,
                  color: `oklch(0.38 0.14 ${meta.hue})`,
                }}
              >
                {meta.short}
              </div>
              <span
                className="text-[8px] font-semibold leading-none"
                style={{ color: "oklch(0.58 0.006 255)" }}
              >
                {slot}
              </span>
            </div>

            {/* Day cells */}
            {WEEKDAYS.map((day, di) => {
              const isToday = weekOffset === 0 && di === TODAY_INDEX;
              const key = slotKey(weekOffset, machine, day, slot);
              const jobs = grid[key] ?? [];
              return (
                <div
                  key={day}
                  className="border-r border-border/40 last:border-r-0 overflow-hidden relative"
                  style={isToday ? { background: "oklch(0.98 0.03 85 / 0.20)" } : undefined}
                >
                  {/* Today column indicator line */}
                  {isToday && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0.5"
                      style={{ background: "oklch(0.65 0.14 85 / 0.5)" }}
                    />
                  )}
                  <DropZoneRow
                    id={key}
                    slot={slot}
                    weekOffset={weekOffset}
                    jobs={jobs}
                    pinnedIds={pinnedIds}
                    onCardClick={onCardClick}
                    onRemove={onRemove}
                    accent={accent}
                    isToday={isToday}
                    isRzk={isRzk}
                    readOnly={readOnly}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
