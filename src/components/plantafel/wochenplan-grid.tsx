import { useDroppable, useDndContext } from "@dnd-kit/core";
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
  startOffset?: number; // hours from slot start (0–8), undefined = auto-sequential
};

type SlotKey = string;

function slotKey(weekOffset: number, machine: Machine, day: Weekday, slot: Slot): SlotKey {
  return `${weekOffset}|${machine}|${day}|${slot}`;
}

// Höhe einer Karte proportional zur Schichtlänge (8h = volle Zeilenhöhe)
function cardHeight(druckzeitStunden: number | undefined, rowHeight: number): number {
  return Math.max(20, Math.min(rowHeight - 8, ((druckzeitStunden ?? 1) / 8) * rowHeight));
}

// Berechnet den vertikalen Startoffset (in Stunden) für jede Karte
function computeOffsets(jobs: GridJob[]): Record<string, number> {
  const result: Record<string, number> = {};
  let cursor = 0;
  for (const gj of jobs) {
    const off = gj.startOffset ?? cursor;
    result[gj.jobId] = off;
    const dur = JOBS.find((j) => j.id === gj.jobId)?.druckzeitStunden ?? 1;
    cursor = off + dur;
  }
  return result;
}

const SLOT_LABEL: Record<Slot, string> = { Früh: "F", Spät: "S", Nacht: "N" };

// Startzeit jeder Schicht (in Stunden, 0–23)
const SLOT_START: Record<Slot, number> = { Früh: 6, Spät: 14, Nacht: 22 };
const SLOT_RANGE: Record<Slot, string>  = { Früh: "06–14", Spät: "14–22", Nacht: "22–06" };

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
  isDraggingActive?: boolean;
  dragPointerY?: number;
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
  rowHeight,
  dragPointerY,
  isLastSlot,
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
  rowHeight: number;
  dragPointerY: number;
  isLastSlot: boolean;
}) {
  const { setNodeRef, isOver, rect } = useDroppable({ id });
  const { active } = useDndContext();
  const offsets = computeOffsets(jobs);

  // Ghost-Karte: Position + Höhe für den Drop-Indikator berechnen
  let ghostTop: number | null = null;
  let ghostHeight = 20;
  if (isOver && rect.current) {
    const relY = Math.max(0, dragPointerY - rect.current.top);
    const rawOff = (relY / rowHeight) * 8;
    const snapHour = Math.max(0, Math.min(7, Math.round(rawOff)));
    ghostTop = (snapHour / 8) * rowHeight;

    // Druckzeit des aktiven Auftrags herausfinden für korrekte Höhe
    if (active?.id) {
      const activeId = active.id as string;
      let jobId: string | undefined;
      if (activeId.startsWith("grid:")) {
        const wp = activeId.slice(5);
        jobId = wp.slice(wp.lastIndexOf(":") + 1);
      } else if (activeId.startsWith("eingang:")) jobId = activeId.slice(8);
      else if (activeId.startsWith("tasche:")) jobId = activeId.slice(7);
      const dur = JOBS.find((j) => j.id === jobId)?.druckzeitStunden ?? 1;
      ghostHeight = Math.max(20, Math.min(rowHeight - 8, (dur / 8) * rowHeight));
    }
  }

  return (
    <div
      ref={setNodeRef}
      className="relative overflow-hidden"
      style={{
        height: rowHeight,
        background: isOver
          ? "oklch(0.70 0.14 240 / 0.06)"
          : isToday
          ? "oklch(0.97 0.05 85 / 0.25)"
          : undefined,
        borderLeft: isToday ? `2px solid oklch(0.72 0.14 85)` : "2px solid transparent",
        borderBottom: isLastSlot ? undefined : "1px solid oklch(0.60 0.005 255 / 0.38)",
        opacity: isRzk ? 0.7 : 1,
      }}
    >
      {/* Stunden-Rasterlinien */}
      {Array.from({ length: 7 }, (_, i) => i + 1).map((h) => (
        <div
          key={h}
          style={{
            position: "absolute",
            top: `${(h / 8) * 100}%`,
            left: 0,
            right: 0,
            height: 1,
            background: "oklch(0.88 0.003 80 / 0.55)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Ghost-Karte: zeigt exakt wo der Auftrag einrasten wird */}
      {ghostTop !== null && (
        <div
          style={{
            position: "absolute",
            top: ghostTop,
            left: 4,
            right: 4,
            height: ghostHeight,
            background: "oklch(0.70 0.14 240 / 0.12)",
            border: "2px dashed oklch(0.55 0.18 255 / 0.7)",
            borderRadius: 8,
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      )}

      {/* Karten */}
      {jobs.map((gj) => {
        const fullJob = JOBS.find((j) => j.id === gj.jobId);
        const off = offsets[gj.jobId] ?? 0;
        const top = (off / 8) * rowHeight;
        const h = cardHeight(fullJob?.druckzeitStunden, rowHeight);
        return (
          <div
            key={gj.jobId}
            style={{ position: "absolute", top, left: 4, right: 4 }}
          >
            <JobCard
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
              height={h}
              sourceSlotKey={id}
              onClick={() => onCardClick(gj.jobId)}
              onRemove={() => onRemove(id, gj.jobId)}
              machineAccent={accent}
            />
          </div>
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
  isDraggingActive = false,
  dragPointerY = 0,
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
  const rowHeight = isDraggingActive ? 320 : 88;

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
      {slots.map((slot, slotIndex) => {
        const isLastSlot = slotIndex === slots.length - 1;
        return (
        <div
          key={slot}
          className="grid"
          style={{ gridTemplateColumns: `64px repeat(${WEEKDAYS.length}, 1fr)` }}
        >
          {/* Slot label — Uhrzeit-Lineal, immer aktiv */}
          <div
            className="relative border-r shrink-0 overflow-hidden"
            style={{ height: rowHeight, borderBottom: isLastSlot ? undefined : "1px solid oklch(0.60 0.005 255 / 0.38)" }}
          >
            {/* Anfangszeit, immer sehr subtil oben rechts */}
            {!isDraggingActive && (
              <span
                className="absolute top-0.5 right-1 font-mono leading-none select-none"
                style={{ fontSize: 7, color: "oklch(0.45 0.006 255)", opacity: 0.40 }}
              >
                {`${String(SLOT_START[slot]).padStart(2, "0")}:00`}
              </span>
            )}

            {isDraggingActive ? (
              // Erweiterter Modus: vollständiges Uhrzeit-Lineal
              Array.from({ length: 8 }, (_, i) => {
                const hour = (SLOT_START[slot] + i) % 24;
                const lineTop = (i / 8) * rowHeight;
                const top = i === 0 ? 1 : lineTop - 5;
                return (
                  <div
                    key={i}
                    className="absolute flex items-center"
                    style={{ top, left: 3, right: 4 }}
                  >
                    <span
                      className="font-mono leading-none whitespace-nowrap"
                      style={{
                        fontSize: 9,
                        color: i === 0 ? accent : "oklch(0.50 0.006 255)",
                        opacity: i === 0 ? 0.70 : 0.48,
                      }}
                    >
                      {`${String(hour).padStart(2, "0")}:00`}
                    </span>
                    {i > 0 && (
                      <div
                        className="flex-1 ml-1"
                        style={{ height: 1, background: "oklch(0.82 0.003 80 / 0.6)" }}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              // Standard-Modus: Schicht-Buchstabe zentriert als Hauptindikator
              <div className="flex items-center justify-center h-full">
                <span
                  className="font-bold leading-none rounded-full w-5 h-5 flex items-center justify-center"
                  style={{ fontSize: 10, background: `${accent}22`, color: accent }}
                >
                  {SLOT_LABEL[slot]}
                </span>
              </div>
            )}
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
                  rowHeight={rowHeight}
                  dragPointerY={dragPointerY}
                  isLastSlot={isLastSlot}
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
