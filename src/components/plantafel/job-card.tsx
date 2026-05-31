import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { X, Lock } from "lucide-react";
import type { Job, Machine } from "@/lib/mock-data";

type GridJob = {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  aiSuggested?: boolean;
  reason?: string;
};

interface JobCardProps {
  job: Job;
  gridJob: GridJob;
  isPinned: boolean;
  isAi: boolean;
  height: number;
  sourceSlotKey: string;
  onClick: () => void;
  onRemove: () => void;
  machineAccent: string;
}

function cardBg(job: Job): { background: string; borderLeft: string } {
  if (job.cascadeConflict) {
    return { background: "oklch(0.97 0.03 25)", borderLeft: "4px solid oklch(0.55 0.22 25)" };
  }
  if (job.prioritaet === "express" || job.prioritaet === "eilig") {
    return { background: "oklch(0.97 0.04 55)", borderLeft: "4px solid oklch(0.62 0.16 55)" };
  }
  if (job.druckfreigabe === "Fehlt" || job.druckfreigabe === "Angefordert") {
    return { background: "oklch(0.98 0.04 85)", borderLeft: "4px solid oklch(0.60 0.18 85)" };
  }
  if (job.isNew) {
    return { background: "oklch(0.98 0.04 145)", borderLeft: "4px solid oklch(0.55 0.18 145)" };
  }
  return { background: "oklch(0.98 0.01 0)", borderLeft: "4px solid oklch(0.55 0.05 0)" };
}

export function JobCard({
  job,
  gridJob,
  isPinned,
  isAi,
  height,
  sourceSlotKey,
  onClick,
  onRemove,
  machineAccent,
}: JobCardProps) {
  const [shaking, setShaking] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `grid:${sourceSlotKey}:${job.id}`,
    disabled: isPinned,
    data: { jobId: job.id, source: "grid", sourceSlotKey },
  });

  function handlePinnedAttempt() {
    if (!isPinned) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 350);
  }

  const { background, borderLeft: borderLeftStyle } = cardBg(job);
  const pinnedBorder = isPinned ? `4px solid oklch(0.55 0.22 255)` : borderLeftStyle;

  const deliveryColor =
    job.status === "Hinterher"
      ? "oklch(0.52 0.20 25)"
      : "oklch(0.50 0.04 0)";

  return (
    <div
      ref={setNodeRef}
      {...(isPinned ? {} : { ...listeners, ...attributes })}
      onClick={isPinned ? handlePinnedAttempt : onClick}
      title={isPinned ? "Festgepinnt — nicht verschiebbar" : undefined}
      className={`relative flex-1 min-w-0 select-none rounded-lg overflow-hidden border border-border/60 shadow-sm group transition-opacity ${
        isDragging ? "opacity-30" : "opacity-100"
      } ${shaking ? "gepinnt-blocked" : ""} ${isAi ? "ki-pulse" : ""}`}
      style={{
        height,
        background: isAi ? "oklch(0.95 0.04 280)" : background,
        borderLeft: isAi ? "4px dashed oklch(0.55 0.22 258 / 0.7)" : pinnedBorder,
        cursor: isPinned ? "not-allowed" : isDragging ? "grabbing" : "grab",
      }}
    >
      {/* Top accent bar */}
      {!isAi && (
        <div style={{ height: 2, background: machineAccent, flexShrink: 0 }} />
      )}

      <div className="px-2 pt-1 pb-1 flex flex-col h-full overflow-hidden">
        {/* Customer + Product + (bei kleinen Karten: Datum/Dauer inline rechts) */}
        <div className="flex items-baseline gap-1 overflow-hidden">
          <div className="text-[11px] font-bold leading-tight truncate shrink-0 max-w-[55%]">
            {isAi && "✦ "}{gridJob.customer}
          </div>
          {job.product && height >= 44 && (
            <div className="text-[9px] text-muted-foreground leading-tight truncate min-w-0">
              {job.product}{job.grammatur ? ` · ${job.grammatur}g` : ""}
            </div>
          )}
          {height < 44 && (
            <div className="flex items-center gap-1 ml-auto shrink-0">
              <span className="text-[9px] font-mono" style={{ color: deliveryColor }}>
                {gridJob.delivery}
              </span>
              {job.druckzeitStunden && (
                <span className="text-[9px] font-mono text-muted-foreground">
                  {job.druckzeitStunden}h
                </span>
              )}
            </div>
          )}
          {isPinned && (
            <Lock className="h-2.5 w-2.5 shrink-0" style={{ color: "oklch(0.55 0.22 255)" }} />
          )}
        </div>

        {/* Footer: delivery + details + hours — nur wenn genug Platz */}
        {height >= 44 && (
          <div className="flex items-center justify-between mt-auto gap-1">
            <span className="text-[9px] font-mono" style={{ color: deliveryColor }}>
              {gridJob.delivery}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              {job.dispersionslack && (
                <span className="text-[7px] rounded px-1 py-0.5 leading-none bg-white/60 text-muted-foreground font-medium">
                  Lack
                </span>
              )}
              {job.sonderfarbe && (
                <span className="text-[7px] rounded px-1 py-0.5 leading-none font-medium" style={{ background: "oklch(0.93 0.12 50 / 0.2)", color: "oklch(0.50 0.18 50)" }}>
                  {job.sonderfarbe}
                </span>
              )}
              {job.druckzeitStunden && (
                <span className="text-[9px] font-mono text-muted-foreground">
                  {job.druckzeitStunden}h
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-0.5 right-0.5 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/70 transition"
        aria-label="Entfernen"
      >
        <X className="h-2.5 w-2.5 text-muted-foreground" />
      </button>
    </div>
  );
}
