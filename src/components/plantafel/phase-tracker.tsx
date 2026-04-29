import { Job, PHASES, MACHINE_META } from "@/lib/mock-data";

export function PhaseTracker({ job }: { job: Job }) {
  const currentIdx = PHASES.indexOf(job.phase);
  const color = MACHINE_META[job.machine].color;
  const doneColor = "oklch(0.72 0.18 145)"; // green

  // Gradient progress line based on position
  const pct = PHASES.length > 1 ? (currentIdx / (PHASES.length - 1)) * 100 : 0;

  return (
    <div className="relative flex items-center justify-between px-2 py-4">
      {/* base line */}
      <div className="absolute left-4 right-4 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-border" />
      {/* gradient progress line */}
      <div
        className="absolute left-4 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
        style={{
          width: `calc((100% - 2rem) * ${pct / 100})`,
          background: `linear-gradient(90deg, ${doneColor} 0%, ${color} 100%)`,
          boxShadow: `0 0 10px color-mix(in oklab, ${color} 40%, transparent)`,
        }}
      />
      {PHASES.map((p, i) => {
        const isCurrent = i === currentIdx;
        const isDone = i < currentIdx;
        const hasProblem = isCurrent && !!job.problem;
        const dotColor = isCurrent ? color : isDone ? doneColor : "white";
        return (
          <div key={p} className="relative z-10 flex flex-1 flex-col items-center">
            <span
              className={`flex items-center justify-center rounded-full transition-all ${isCurrent ? "pulse-glow" : ""}`}
              style={{
                width: isCurrent ? 16 : 12,
                height: isCurrent ? 16 : 12,
                backgroundColor: dotColor,
                border: `2px solid ${isCurrent || isDone ? dotColor : "var(--border)"}`,
                boxShadow: isCurrent
                  ? `0 0 0 3px white, 0 0 12px ${color}, 0 0 24px color-mix(in oklab, ${color} 50%, transparent)`
                  : isDone
                    ? `0 0 0 2px white, 0 0 6px ${doneColor}`
                    : "none",
              }}
            />
            {hasProblem && (
              <span className="absolute -bottom-3 text-[10px] leading-none text-[oklch(0.70_0.18_55)]">⚠</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PhaseHeader() {
  return (
    <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {PHASES.map((p) => (
        <span key={p} className="flex-1 text-center">{p}</span>
      ))}
    </div>
  );
}
