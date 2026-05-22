import { useState } from "react";
import { JOBS, MACHINE_META, PHASES, type Job } from "@/lib/mock-data";
import { PhaseTracker, PhaseHeader } from "../phase-tracker";
import { Search, ChevronDown, Clock } from "lucide-react";

const KUNDE_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  "Vorzeitig": { label: "Im Plan",   cls: "bg-[oklch(0.72_0.18_145/0.15)] text-[oklch(0.40_0.18_145)]" },
  "Nach Plan": { label: "Im Plan",   cls: "bg-[oklch(0.70_0.14_240/0.15)] text-[oklch(0.45_0.18_245)]" },
  "Hinterher": { label: "Verzögert", cls: "bg-[oklch(0.65_0.22_25/0.15)] text-[oklch(0.50_0.22_25)]" },
};

function ProjectCard({ job, expanded, onToggle }: { job: Job; expanded: boolean; onToggle: () => void }) {
  const k = KUNDE_STATUS_MAP[job.status];
  const color = MACHINE_META[job.machine].color;
  const phaseIdx = PHASES.indexOf(job.phase);

  return (
    <div className="card-lift rounded-2xl border bg-card overflow-hidden" onClick={onToggle} style={{ cursor: "pointer" }}>
      {/* Top color bar */}
      <div style={{ height: 4, backgroundColor: color }} />
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[10px] font-mono text-muted-foreground">{job.id}</span>
          <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold shrink-0 ${k.cls}`}>{k.label}</span>
          {job.isNew && (
            <span
              className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0"
              style={{
                backgroundColor: "oklch(0.52 0.20 145 / 0.15)",
                color: "oklch(0.35 0.18 145)",
                border: "1px solid oklch(0.60 0.18 145 / 0.40)",
              }}
            >
              NEU
            </span>
          )}
        </div>
        {/* Customer + product */}
        <div className="text-base font-semibold leading-tight mb-0.5">{job.customer}</div>
        {job.product && <div className="text-xs text-muted-foreground mb-3 truncate">{job.product}</div>}

        {/* 4-segment phase bar */}
        <div className="flex gap-0.5 mb-1">
          {PHASES.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full"
              style={{
                backgroundColor:
                  i < phaseIdx ? "oklch(0.72 0.18 145)" :
                  i === phaseIdx ? color :
                  "var(--border)",
              }}
            />
          ))}
        </div>
        {/* Phase labels */}
        <div className="flex text-[8px] text-muted-foreground mb-3">
          {PHASES.map((p, i) => (
            <div key={i} className="flex-1 text-center truncate" style={{ color: i === phaseIdx ? color : undefined }}>{p}</div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {job.delivery}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>
      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Phasen-Verlauf</div>
          <PhaseHeader />
          <PhaseTracker job={job} />
        </div>
      )}
    </div>
  );
}

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

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((j) => (
          <ProjectCard
            key={j.id}
            job={j}
            expanded={expanded === j.id}
            onToggle={() => setExpanded(expanded === j.id ? null : j.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 p-8 text-center text-sm text-muted-foreground">Keine Treffer.</div>
        )}
      </div>
    </div>
  );
}
