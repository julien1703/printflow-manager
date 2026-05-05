import { Job, PHASES } from "@/lib/mock-data";

const GREEN = "oklch(0.52 0.15 153)";
const RED   = "oklch(0.50 0.19 25)";
const GRAY  = "var(--border)";

export function PhaseTracker({ job }: { job: Job }) {
  const currentIdx = PHASES.indexOf(job.phase);
  const isBehind = job.status === "Hinterher";
  const activeColor = isBehind ? RED : GREEN;
  const pct = PHASES.length > 1 ? (currentIdx / (PHASES.length - 1)) * 100 : 0;

  return (
    <div className="relative flex items-center justify-between px-2 py-4">
      {/* base line */}
      <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-border" />
      {/* progress line */}
      <div
        className="absolute left-4 top-1/2 h-px -translate-y-1/2"
        style={{ width: `calc((100% - 2rem) * ${pct / 100})`, backgroundColor: GREEN }}
      />
      {PHASES.map((p, i) => {
        const isCurrent = i === currentIdx;
        const isDone    = i < currentIdx;
        return (
          <div key={p} className="relative z-10 flex flex-1 flex-col items-center">
            <span
              className="flex items-center justify-center rounded-full transition-all"
              style={
                isCurrent
                  ? {
                      width: 14,
                      height: 14,
                      backgroundColor: "var(--card)",
                      border: `2.5px solid ${activeColor}`,
                      boxShadow: `0 0 0 3px color-mix(in oklab, ${activeColor} 18%, transparent)`,
                    }
                  : isDone
                  ? { width: 9, height: 9, backgroundColor: GREEN, border: `1.5px solid ${GREEN}` }
                  : { width: 9, height: 9, backgroundColor: "var(--card)", border: `1.5px solid ${GRAY}` }
              }
            />
            {isCurrent && !!job.problem && (
              <span className="absolute top-5 text-[9px] font-medium whitespace-nowrap" style={{ color: RED }}>
                Problem
              </span>
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