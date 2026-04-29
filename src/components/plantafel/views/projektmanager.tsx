import { useState } from "react";
import { JOBS, MACHINE_META } from "@/lib/mock-data";
import { PhaseTracker, PhaseHeader } from "../phase-tracker";
import { Search, ChevronDown } from "lucide-react";

const KUNDE_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  "Vorzeitig": { label: "Im Plan",   cls: "bg-[oklch(0.72_0.18_145/0.15)] text-[oklch(0.40_0.18_145)]" },
  "Nach Plan": { label: "Im Plan",   cls: "bg-[oklch(0.70_0.14_240/0.15)] text-[oklch(0.45_0.18_245)]" },
  "Hinterher": { label: "Verzögert", cls: "bg-[oklch(0.65_0.22_25/0.15)] text-[oklch(0.50_0.22_25)]" },
};

export function ProjektmanagerView() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"alle" | "Im Plan" | "Verzögert">("alle");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = JOBS.filter((j) => {
    const matchQ = !q || j.customer.toLowerCase().includes(q.toLowerCase()) || j.id.includes(q);
    const k = KUNDE_STATUS_MAP[j.status].label;
    const matchF = filter === "alle" || k === filter;
    return matchQ && matchF;
  });

  return (
    <div className="p-8 space-y-6 fade-swap">
      <header>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Projektmanager · Kundenbetreuung
        </div>
        <h1 className="editorial-header text-4xl">Meine Aufträge</h1>
      </header>
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kunde oder Auftragsnummer suchen..."
            className="w-full rounded-lg border border-input bg-card pl-10 pr-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-card border border-border p-1 shadow-sm">
          {(["alle","Im Plan","Verzögert"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="soft-card soft-card-lg overflow-hidden">
        {filtered.map((j) => {
          const k = KUNDE_STATUS_MAP[j.status];
          const isOpen = expanded === j.id;
          return (
            <div key={j.id} className="border-b border-border last:border-0">
              <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr_auto] items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition">
                <div>
                  <div className="font-semibold text-sm">{j.customer}</div>
                  <div className="text-[11px] text-muted-foreground">{j.id}</div>
                </div>
                <div className="text-xs text-muted-foreground">Kontakt</div>
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${MACHINE_META[j.machine].color} 12%, white)`,
                      color: MACHINE_META[j.machine].color,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: MACHINE_META[j.machine].color, boxShadow: `0 0 8px ${MACHINE_META[j.machine].color}` }}
                    />
                    {j.phase}
                  </span>
                </div>
                <div className="text-sm font-medium">{j.delivery}</div>
                <div>
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${k.cls}`}>{k.label}</span>
                </div>
                <button
                  onClick={() => setExpanded(isOpen ? null : j.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/70"
                >
                  Details <ChevronDown className={`h-3 w-3 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              {isOpen && (
                <div className="bg-muted/20 px-5 py-4 fade-swap">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Phasen-Verlauf</div>
                  <PhaseHeader />
                  <PhaseTracker job={j} />
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Keine Treffer.</div>
        )}
      </div>
    </div>
  );
}
