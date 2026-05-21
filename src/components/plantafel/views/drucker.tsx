import { JOBS } from "@/lib/mock-data";
import { AlertTriangle, CheckCircle2, Clock, FileSearch, Send } from "lucide-react";

const URGENCY_ORDER = { critical: 0, warn: 1, ok: 2 };

interface VorstufeJob {
  id: string;
  customer: string;
  product: string;
  delivery: string;
  druckfreigabe: "Erteilt" | "Fehlt" | "Angefordert";
  productionScheduled?: boolean;
  daysUntilDeadline: number;
  urgency: "critical" | "warn" | "ok";
  problem?: string;
}

function parseDelivery(d: string): number {
  const [day, month] = d.replace(".", "").split(".").map(Number);
  const now = new Date(2026, 4, 18); // 18.05.2026
  const target = new Date(2026, month - 1, day);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const VORSTUFE_JOBS: VorstufeJob[] = JOBS
  .filter((j) => j.orderStatus !== "Abgeschlossen" && j.orderStatus !== "Storniert" && j.orderStatus !== "Versandbereit")
  .map((j) => {
    const days = parseDelivery(j.delivery);
    const freigabe = j.druckfreigabe ?? "Angefordert";
    let urgency: "critical" | "warn" | "ok" = "ok";
    if (freigabe === "Fehlt" && j.productionScheduled) urgency = "critical";
    else if (freigabe === "Fehlt" && days <= 3) urgency = "critical";
    else if (freigabe === "Fehlt") urgency = "warn";
    else if (freigabe === "Angefordert" && days <= 4) urgency = "warn";
    return {
      id: j.id,
      customer: j.customer,
      product: j.product,
      delivery: j.delivery,
      druckfreigabe: freigabe,
      productionScheduled: j.productionScheduled,
      daysUntilDeadline: days,
      urgency,
      problem: j.problem,
    };
  })
  .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] || a.daysUntilDeadline - b.daysUntilDeadline);

const criticalCount = VORSTUFE_JOBS.filter((j) => j.urgency === "critical").length;
const warnCount = VORSTUFE_JOBS.filter((j) => j.urgency === "warn").length;

const KANBAN_COLS = [
  { urgency: "critical" as const, label: "Kritisch",     color: "oklch(0.50 0.22 25)" },
  { urgency: "warn"     as const, label: "Ausstehend",   color: "oklch(0.55 0.17 85)" },
  { urgency: "ok"       as const, label: "Freigegeben",  color: "oklch(0.52 0.14 153)" },
];

export function DruckvorstufeView() {
  return (
    <div className="p-8 space-y-6 fade-swap">
      {/* Header */}
      <header>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Druckvorstufe · K. Weber
        </div>
        <h1 className="editorial-header text-4xl">Datenprüfung & Freigaben</h1>
        <div className="mt-3 flex items-center gap-5">
          <KPI value={criticalCount} label="Kritisch" tone="critical" />
          <KPI value={warnCount} label="Ausstehend" tone="warn" />
          <KPI value={VORSTUFE_JOBS.filter(j => j.urgency === "ok").length} label="Freigegeben" tone="ok" />
        </div>
      </header>

      {/* Critical alert */}
      {criticalCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-[oklch(0.65_0.22_25/0.08)] border border-[oklch(0.65_0.22_25/0.35)] px-5 py-4">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
          <div>
            <div className="text-sm font-semibold text-destructive mb-0.5">
              {criticalCount} Auftrag{criticalCount > 1 ? "e" : ""} ohne Freigabe — Produktion blockiert
            </div>
            {VORSTUFE_JOBS.filter(j => j.urgency === "critical" && j.productionScheduled).map((j) => (
              <div key={j.id} className="text-xs text-muted-foreground">
                {j.customer} ({j.id}) — Produktion morgen 08:00 Uhr geplant, Freigabe fehlt!
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-3 gap-5">
        {KANBAN_COLS.map(col => {
          const colJobs = VORSTUFE_JOBS.filter(j => j.urgency === col.urgency);
          return (
            <div key={col.urgency} className="soft-card overflow-hidden">
              {/* Column header */}
              <div
                className="px-4 py-3 border-b border-border flex items-center justify-between"
                style={{ borderTopWidth: 3, borderTopColor: col.color }}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: col.color }}>{col.label}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: `color-mix(in oklab, ${col.color} 12%, white)`, color: col.color }}
                >
                  {colJobs.length}
                </span>
              </div>
              {/* Cards */}
              <div className="p-3 space-y-2.5 min-h-[300px]">
                {colJobs.map(j => <KanbanCard key={j.id} job={j} accentColor={col.color} />)}
                {colJobs.length === 0 && (
                  <div className="text-xs text-muted-foreground italic py-8 text-center">Keine Aufträge</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FreigabeCard({ job }: { job: VorstufeJob }) {
  const isOk = job.urgency === "ok";
  const isCritical = job.urgency === "critical";
  const isWarn = job.urgency === "warn";

  const borderColor =
    isCritical ? "oklch(0.65 0.22 25)" :
    isWarn ? "oklch(0.78 0.18 85)" :
    "oklch(0.72 0.18 145)";

  const bgColor =
    isCritical ? "oklch(0.65 0.22 25 / 0.04)" :
    isWarn ? "oklch(0.85 0.17 85 / 0.05)" :
    "var(--card)";

  const deadlineLabel =
    job.daysUntilDeadline === 0 ? "Heute fällig" :
    job.daysUntilDeadline === 1 ? "Morgen fällig" :
    job.daysUntilDeadline < 0 ? `${Math.abs(job.daysUntilDeadline)} Tage überfällig` :
    `in ${job.daysUntilDeadline} Tagen`;

  const deadlineCls =
    job.daysUntilDeadline <= 1 ? "text-destructive font-semibold" :
    job.daysUntilDeadline <= 3 ? "text-[oklch(0.52_0.17_85)] font-semibold" :
    "text-muted-foreground";

  return (
    <div
      className="rounded-2xl bg-card border p-5"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor, backgroundColor: bgColor }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-muted-foreground">{job.id}</span>
            {job.productionScheduled && (
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                Produktion geplant
              </span>
            )}
          </div>
          <div className="text-base font-semibold">{job.customer}</div>
          <div className="text-sm text-muted-foreground">{job.product}</div>
          {job.problem && (
            <div className="mt-1.5 text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />{job.problem}
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isOk ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.72_0.18_145/0.15)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.40_0.18_145)]">
              <CheckCircle2 className="h-3.5 w-3.5" />Freigabe erteilt
            </span>
          ) : isCritical ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />Freigabe fehlt
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.85_0.17_85/0.20)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.42_0.16_85)]">
              <Clock className="h-3.5 w-3.5" />Angefordert
            </span>
          )}
          <span className={`text-[11px] flex items-center gap-1 ${deadlineCls}`}>
            <Clock className="h-3 w-3" />{job.delivery} · {deadlineLabel}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {!isOk && (
        <div className="mt-4 flex gap-2 pt-4 border-t border-border">
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-muted text-foreground text-xs font-medium px-4 py-2 hover:bg-muted/70 transition">
            <FileSearch className="h-3.5 w-3.5" />Daten prüfen
          </button>
          {job.druckfreigabe === "Fehlt" && (
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-foreground text-background text-xs font-semibold px-4 py-2 hover:opacity-85 transition">
              <Send className="h-3.5 w-3.5" />Freigabe anfordern
            </button>
          )}
          {job.druckfreigabe === "Angefordert" && (
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-[oklch(0.72_0.18_145)] text-white text-xs font-semibold px-4 py-2 hover:opacity-90 transition">
              <CheckCircle2 className="h-3.5 w-3.5" />Freigabe erteilen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function KanbanCard({ job, accentColor }: { job: VorstufeJob; accentColor: string }) {
  const isCritical = job.urgency === "critical";

  const deadlineLabel =
    job.daysUntilDeadline === 0 ? "Heute fällig" :
    job.daysUntilDeadline === 1 ? "Morgen fällig" :
    job.daysUntilDeadline < 0 ? `${Math.abs(job.daysUntilDeadline)}T überfällig` :
    `in ${job.daysUntilDeadline}T`;

  const deadlineCls =
    job.daysUntilDeadline <= 1 ? "text-destructive font-semibold" :
    job.daysUntilDeadline <= 3 ? "text-[oklch(0.52_0.17_85)] font-semibold" :
    "text-muted-foreground";

  return (
    <div
      className="card-lift rounded-xl border bg-card p-3.5"
      style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-mono text-muted-foreground">{job.id}</span>
        <div className="flex items-center gap-1 shrink-0">
          {isCritical && (
            <span className="pulse-chip inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive/15 text-destructive text-[9px] font-black">!</span>
          )}
          <span className={`text-[10px] ${deadlineCls}`}>{deadlineLabel}</span>
        </div>
      </div>
      <div className="text-sm font-semibold leading-tight">{job.customer}</div>
      {job.product && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{job.product}</div>}
      {job.productionScheduled && (
        <span className="mt-1.5 inline-block rounded-full bg-destructive/15 px-2 py-0.5 text-[9px] font-semibold text-destructive">
          Produktion geplant
        </span>
      )}
      {job.urgency !== "ok" && (
        <div className="mt-2.5 flex gap-1.5 pt-2.5 border-t border-border">
          <button className="inline-flex items-center gap-1 rounded-lg bg-muted text-foreground text-[10px] font-medium px-2.5 py-1.5 hover:bg-muted/70 transition">
            <FileSearch className="h-3 w-3" />Prüfen
          </button>
          {job.druckfreigabe === "Fehlt" && (
            <button className="inline-flex items-center gap-1 rounded-lg bg-foreground text-background text-[10px] font-semibold px-2.5 py-1.5 hover:opacity-85 transition">
              <Send className="h-3 w-3" />Anfordern
            </button>
          )}
          {job.druckfreigabe === "Angefordert" && (
            <button className="inline-flex items-center gap-1 rounded-lg bg-[oklch(0.72_0.18_145)] text-white text-[10px] font-semibold px-2.5 py-1.5 hover:opacity-90 transition">
              <CheckCircle2 className="h-3 w-3" />Erteilen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function KPI({ value, label, tone }: { value: number; label: string; tone: "critical" | "warn" | "ok" }) {
  const cls =
    tone === "critical" && value > 0 ? "text-destructive" :
    tone === "warn" && value > 0 ? "text-[oklch(0.52_0.17_85)]" :
    tone === "ok" && value > 0 ? "text-[oklch(0.45_0.18_145)]" :
    "text-muted-foreground";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-base font-semibold tabular-nums ${cls}`}>{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
