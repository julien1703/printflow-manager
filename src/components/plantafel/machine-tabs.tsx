import type { Job, Machine } from "@/lib/mock-data";

export type TabView = "Gesamt" | Machine;

const TAB_META: Record<Machine, {
  display: string;
  badge: string;
  description: string;
  accent: string;
}> = {
  CD:   { display: "CD",    badge: "3-schichtig",       description: "Hauptmaschine · Früh / Spät / Nacht", accent: "oklch(0.55 0.18 255)" },
  SM5:  { display: "SM528", badge: "1-schichtig",        description: "5-Farb · Frühschicht · Sonderfarben",  accent: "oklch(0.55 0.18 295)" },
  RZK:  { display: "RZK",   badge: "Gering ausgelastet", description: "2-Farb · Nur Frühschicht · ~30% Auslastung", accent: "oklch(0.55 0.04 255)" },
  Digi: { display: "Digi",  badge: "Eigenständig",       description: "Digitaldruck · Läuft selbstständig",   accent: "oklch(0.52 0.18 145)" },
};

interface MachineTabsProps {
  activeTab: TabView;
  onChange: (t: TabView) => void;
  eingang: Job[];
}

const MACHINES: Machine[] = ["CD", "SM5", "RZK", "Digi"];

export function MachineTabs({ activeTab, onChange, eingang }: MachineTabsProps) {
  const hasNew = eingang.length > 0;

  return (
    <div className="relative flex gap-1 px-6 pt-3 pb-0 border-b border-border bg-background shrink-0">
      {hasNew && (
        <span
          className="absolute top-2 right-6 h-2 w-2 rounded-full"
          style={{ background: "oklch(0.55 0.22 25)" }}
        />
      )}

      {/* Gesamt-Tab */}
      <button
        type="button"
        onClick={() => onChange("Gesamt")}
        className="relative flex flex-col items-start px-4 py-2.5 rounded-t-lg border border-b-0 transition-all"
        style={
          activeTab === "Gesamt"
            ? { background: "oklch(0.22 0.008 255)", borderColor: "oklch(0.22 0.008 255)", color: "white", marginBottom: -1, zIndex: 1 }
            : { background: "oklch(0.95 0.003 80 / 0.5)", borderColor: "transparent", color: "oklch(0.50 0.006 255)" }
        }
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold leading-none">Übersicht</span>
          <span
            className="text-[9px] font-semibold rounded-full px-1.5 py-0.5 leading-none"
            style={
              activeTab === "Gesamt"
                ? { background: "oklch(1 0 0 / 0.22)", color: "white" }
                : { background: "oklch(0.88 0.003 80)", color: "oklch(0.50 0.006 255)" }
            }
          >
            Alle Maschinen
          </span>
        </div>
        <span className="text-[9px] leading-none" style={{ opacity: activeTab === "Gesamt" ? 0.8 : 0.7 }}>
          CD · SM528 · RZK · Digi
        </span>
      </button>

      {/* Divider */}
      <div className="w-px mx-1 self-stretch my-2" style={{ background: "oklch(0.88 0.003 80)" }} />

      {/* Machine tabs */}
      {MACHINES.map((machine) => {
        const meta = TAB_META[machine];
        const isActive = machine === activeTab;
        return (
          <button
            key={machine}
            type="button"
            onClick={() => onChange(machine)}
            className="relative flex flex-col items-start px-4 py-2.5 rounded-t-lg border border-b-0 transition-all"
            style={
              isActive
                ? { background: meta.accent, borderColor: meta.accent, color: "white", marginBottom: -1, zIndex: 1 }
                : { background: "oklch(0.95 0.003 80 / 0.5)", borderColor: "transparent", color: "oklch(0.50 0.006 255)" }
            }
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold leading-none">{meta.display}</span>
              <span
                className="text-[9px] font-semibold rounded-full px-1.5 py-0.5 leading-none"
                style={
                  isActive
                    ? { background: "oklch(1 0 0 / 0.22)", color: "white" }
                    : { background: "oklch(0.88 0.003 80)", color: "oklch(0.50 0.006 255)" }
                }
              >
                {meta.badge}
              </span>
            </div>
            <span className="text-[9px] leading-none" style={{ opacity: isActive ? 0.8 : 0.7 }}>
              {meta.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
