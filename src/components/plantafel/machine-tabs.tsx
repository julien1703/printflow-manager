import type { Job, Machine } from "@/lib/mock-data";

export type TabView = "Gesamt" | Machine;

const TAB_META: Record<Machine, { display: string; accent: string }> = {
  CD:   { display: "CD",    accent: "oklch(0.55 0.18 255)" },
  SM5:  { display: "SM528", accent: "oklch(0.55 0.18 295)" },
  RZK:  { display: "RZK",  accent: "oklch(0.55 0.04 255)" },
  Digi: { display: "Digi", accent: "oklch(0.52 0.18 145)" },
};

interface MachineTabsProps {
  activeTab: TabView;
  onChange: (t: TabView) => void;
  eingang: Job[];
}

const MACHINES: Machine[] = ["CD", "SM5", "RZK", "Digi"];

export function MachineTabs({ activeTab, onChange, eingang }: MachineTabsProps) {
  const hasNew = eingang.length > 0;

  const inactiveStyle = {
    background: "oklch(0.92 0.004 255)",
    borderColor: "oklch(0.86 0.004 255)",
    color: "oklch(0.45 0.006 255)",
  };

  return (
    <div className="relative flex items-end gap-1 px-6 pt-3 pb-0 border-b border-border bg-background shrink-0">
      {hasNew && (
        <span
          className="absolute top-2 right-6 h-2 w-2 rounded-full"
          style={{ background: "oklch(0.55 0.22 25)" }}
        />
      )}

      {/* Gesamt-Tab */}
      {activeTab === "Gesamt" ? (
        <button
          type="button"
          onClick={() => onChange("Gesamt")}
          className="relative w-24 py-2.5 rounded-t-lg border border-b-0 transition-all text-sm font-bold leading-none text-center"
          style={{ background: "oklch(0.22 0.008 255)", borderColor: "oklch(0.22 0.008 255)", color: "white", marginBottom: -1, zIndex: 1 }}
        >
          Übersicht
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onChange("Gesamt")}
          className="relative w-24 py-2 rounded-lg border transition-all text-sm font-bold leading-none text-center"
          style={{ ...inactiveStyle, marginBottom: 3 }}
        >
          Übersicht
        </button>
      )}

      {/* Divider */}
      <div className="w-px mx-1 mb-1" style={{ height: 20, background: "oklch(0.88 0.003 80)" }} />

      {/* Machine tabs */}
      {MACHINES.map((machine) => {
        const meta = TAB_META[machine];
        const isActive = machine === activeTab;
        return isActive ? (
          <button
            key={machine}
            type="button"
            onClick={() => onChange(machine)}
            className="relative w-24 py-2.5 rounded-t-lg border border-b-0 transition-all text-sm font-bold leading-none text-center"
            style={{ background: meta.accent, borderColor: meta.accent, color: "white", marginBottom: -1, zIndex: 1 }}
          >
            {meta.display}
          </button>
        ) : (
          <button
            key={machine}
            type="button"
            onClick={() => onChange(machine)}
            className="relative w-24 py-2 rounded-lg border transition-all text-sm font-bold leading-none text-center"
            style={{ ...inactiveStyle, marginBottom: 3 }}
          >
            {meta.display}
          </button>
        );
      })}
    </div>
  );
}
