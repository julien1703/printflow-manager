// src/components/plantafel/job-badges.tsx
import { Lock, Unlock } from "lucide-react";
import type { Job } from "@/lib/mock-data";

interface JobBadgesProps {
  job: Job;
  /** If provided, clicking the Lock icon calls this to toggle festgepinnt */
  onToggleFestgepinnt?: () => void;
  /** compact = smaller text for TascheCard / GridSlotCell */
  compact?: boolean;
}

export function JobBadges({ job, onToggleFestgepinnt, compact = false }: JobBadgesProps) {
  const textCls = compact ? "text-[8px]" : "text-[10px]";
  const pxCls   = compact ? "px-1.5 py-0.5" : "px-2 py-0.5";

  return (
    <div className={`flex flex-wrap items-center gap-1 ${compact ? "mt-0.5" : "mt-1.5"}`}>
      {/* NEU badge */}
      {job.isNew && (
        <span
          className={`inline-flex items-center rounded-full font-bold ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "oklch(0.52 0.20 145 / 0.15)",
            color: "oklch(0.35 0.18 145)",
            border: "1px solid oklch(0.60 0.18 145 / 0.40)",
          }}
        >
          NEU
        </span>
      )}

      {/* Dispersionslack badge */}
      {job.dispersionslack === true && (
        <span
          className={`inline-flex items-center rounded-full font-semibold ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "oklch(0.52 0.14 153 / 0.12)",
            color: "oklch(0.38 0.14 153)",
            border: "1px solid oklch(0.52 0.14 153 / 0.30)",
          }}
        >
          Lack ✓
        </span>
      )}
      {job.dispersionslack === false && (
        <span
          className={`inline-flex items-center rounded-full font-medium ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          Lack –
        </span>
      )}

      {/* Sonderfarbe badge */}
      {job.sonderfarbe && (
        <span
          className={`inline-flex items-center rounded-full font-semibold ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "oklch(0.72 0.18 55 / 0.14)",
            color: "oklch(0.42 0.18 55)",
            border: "1px solid oklch(0.65 0.18 55 / 0.30)",
          }}
        >
          Sonderf. {job.sonderfarbe}
        </span>
      )}

      {/* Grammatur pill */}
      {job.grammatur !== undefined && (
        <span
          className={`inline-flex items-center rounded-full font-mono font-medium ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "oklch(0.70 0.14 240 / 0.10)",
            color: "oklch(0.42 0.14 245)",
            border: "1px solid oklch(0.65 0.14 240 / 0.22)",
          }}
        >
          {job.grammatur}g
        </span>
      )}

      {/* Druckzeit */}
      {job.druckzeitStunden !== undefined && (
        <span
          className={`inline-flex items-center rounded-full font-mono font-medium ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          ~{job.druckzeitStunden}h
        </span>
      )}

      {/* Festpinnen icon */}
      {job.festgepinnt !== undefined && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFestgepinnt?.();
          }}
          title={job.festgepinnt ? "Auftrag festgepinnt — KI bewegt ihn nicht" : "Auftrag freigeben"}
          className="inline-flex items-center rounded-full transition hover:opacity-70"
          style={{
            backgroundColor: job.festgepinnt
              ? "oklch(0.55 0.22 280 / 0.12)"
              : "var(--muted)",
            color: job.festgepinnt
              ? "oklch(0.42 0.20 280)"
              : "var(--muted-foreground)",
            padding: compact ? "2px 4px" : "2px 6px",
          }}
        >
          {job.festgepinnt
            ? <Lock className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
            : <Unlock className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
          }
        </button>
      )}
    </div>
  );
}
