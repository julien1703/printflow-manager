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
  width: number;
  left: number;
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
  width,
  left,
  onClick,
  onRemove,
  machineAccent,
}: JobCardProps) {
  const [shaking, setShaking] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
    disabled: isPinned,
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
      : job.status === "Knapp"
      ? "oklch(0.55 0.16 55)"
      : "oklch(0.50 0.04 0)";

  return (
    <div
      ref={setNodeRef}
      {...(isPinned ? {} : { ...listeners, ...attributes })}
      onClick={isPinned ? handlePinnedAttempt : onClick}
      title={isPinned ? "Festgepinnt — nicht verschiebbar" : undefined}
      className={`absolute select-none rounded-lg overflow-hidden border border-border/60 shadow-sm group transition-opacity ${
        isDragging ? "opacity-30" : "opacity-100"
      } ${shaking ? "gepinnt-blocked" : ""} ${isAi ? "ki-pulse" : ""}`}
      style={{
        top: 4,
        height: 80,
        left,
        width,
        background: isAi ? "oklch(0.95 0.04 280)" : background,
        borderLeft: isAi ? "4px dashed oklch(0.55 0.22 258 / 0.7)" : pinnedBorder,
        cursor: isPinned ? "not-allowed" : isDragging ? "grabbing" : "grab",
        zIndex: isDragging ? 999 : undefined,
      }}
    >
      {/* Top accent bar */}
      {!isAi && (
        <div style={{ height: 2, background: machineAccent, flexShrink: 0 }} />
      )}

      <div className="px-2 pt-1 pb-1 flex flex-col h-full overflow-hidden">
        {/* Badge row */}
        <div className="flex items-center gap-1 mb-0.5">
          {job.isNew && (
            <span className="text-[7px] font-bold rounded px-1 py-0.5 leading-none" style={{ background: "oklch(0.88 0.10 145 / 0.4)", color: "oklch(0.38 0.16 145)" }}>
              NEU
            </span>
          )}
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
          {isPinned && (
            <Lock className="h-2.5 w-2.5 ml-auto shrink-0" style={{ color: "oklch(0.55 0.22 255)" }} />
          )}
        </div>

        {/* Customer name */}
        <div className="text-[11px] font-bold truncate leading-tight">
          {isAi && "✦ "}{gridJob.customer}
        </div>

        {/* Product details */}
        {job.product && (
          <div className="text-[9px] text-muted-foreground truncate leading-tight">
            {job.product}{job.grammatur ? ` · ${job.grammatur}g` : ""}
          </div>
        )}

        {/* Footer: delivery + hours */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[9px] font-mono" style={{ color: deliveryColor }}>
            {gridJob.delivery}
          </span>
          {job.druckzeitStunden && (
            <span className="text-[9px] font-mono text-muted-foreground">
              {job.druckzeitStunden}h
            </span>
          )}
        </div>
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
