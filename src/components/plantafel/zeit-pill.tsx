import { ZeitStatus } from "@/lib/mock-data";

export function ZeitPill({ status }: { status: ZeitStatus }) {
  const map: Record<ZeitStatus, { bg: string; dot: string; label: string }> = {
    "Vorzeitig":  { bg: "bg-[oklch(0.72_0.18_145/0.15)] text-[oklch(0.45_0.18_145)]", dot: "glow-green bg-[oklch(0.72_0.18_145)]", label: "Vorzeitig" },
    "Nach Plan":  { bg: "bg-[oklch(0.70_0.14_240/0.15)] text-[oklch(0.45_0.18_245)]", dot: "glow-blue bg-[oklch(0.70_0.14_240)]", label: "Nach Plan" },
    "Hinterher":  { bg: "bg-[oklch(0.65_0.22_25/0.15)] text-[oklch(0.50_0.22_25)]",   dot: "glow-red bg-[oklch(0.65_0.22_25)]",   label: "Hinterher" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${s.bg}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
