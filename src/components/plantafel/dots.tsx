import { Machine, MACHINE_META } from "@/lib/mock-data";

export function MachineDot({ machine, size = 10, glow = true }: { machine: Machine; size?: number; glow?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full ${glow ? "glow-dot" : ""}`}
      style={{
        width: size,
        height: size,
        backgroundColor: MACHINE_META[machine].color,
        color: MACHINE_META[machine].color,
      }}
    />
  );
}

export function MachineBadge({ machine }: { machine: Machine }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{
        backgroundColor: `color-mix(in oklab, ${MACHINE_META[machine].color} 15%, white)`,
        color: MACHINE_META[machine].color,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: MACHINE_META[machine].color }}
      />
      {MACHINE_META[machine].label}
    </span>
  );
}

export function StatusGlowDot({ kind }: { kind: "green" | "yellow" | "red" | "blue" }) {
  const cls =
    kind === "green" ? "bg-[oklch(0.72_0.18_145)] glow-green"
    : kind === "yellow" ? "bg-[oklch(0.85_0.17_85)] glow-yellow"
    : kind === "red" ? "bg-[oklch(0.65_0.22_25)] glow-red"
    : "bg-[oklch(0.70_0.14_240)] glow-blue";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
}
