import { Job, PHASES, MACHINE_META } from "@/lib/mock-data";

export function PhaseTracker({ job }: { job: Job }) {
  const currentIdx = PHASES.indexOf(job.phase);
  const color = MACHINE_META[job.machine].color;

  return (
    <div className="relative flex items-center justify-between px-2 py-3">
      {/* connecting line */}
      <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-border" />
      {PHASES.map((p, i) => {
        const isCurrent = i === currentIdx;
        const isDone = i < currentIdx;
        const hasProblem = isCurrent && !!job.problem;
        return (
          <div key={p} className="relative z-10 flex flex-1 flex-col items-center">
            <span
              className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 transition-all`}
              style={{
                backgroundColor: isCurrent ? color : isDone ? `color-mix(in oklab, ${color} 50%, white)` : "white",
                borderColor: isCurrent || isDone ? color : "var(--border)",
                boxShadow: isCurrent
                  ? `0 0 10px ${color}, 0 0 20px color-mix(in oklab, ${color} 40%, transparent)`
                  : "none",
                color,
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
    <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {PHASES.map((p) => (
        <span key={p} className="flex-1 text-center">{p}</span>
      ))}
    </div>
  );
}
