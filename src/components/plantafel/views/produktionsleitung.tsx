import { JOBS, UPCOMING, MESSAGES, AI_SUGGESTIONS, MACHINE_META, PHASES, type Job } from "@/lib/mock-data";
import { PhaseTracker } from "../phase-tracker";
import { ZeitPill } from "../zeit-pill";
import { MachineBadge, MachineDot } from "../dots";
import {
  AlertTriangle, MessageSquare, Sparkles, Check, X, Clock,
  Package, Truck, Layers, FileText, ChevronRight,
} from "lucide-react";
import { useState } from "react";

const AI_TONE = [
  { border: "var(--machine-cd)",   bg: "oklch(0.70 0.21 48 / 0.07)",  confidence: 3 },
  { border: "var(--destructive)",  bg: "oklch(0.52 0.22 25 / 0.06)",  confidence: 2 },
  { border: "var(--machine-rzk)", bg: "oklch(0.50 0.22 258 / 0.06)", confidence: 3 },
];

// Pro Maschine nur 1 Auftrag — Priorität: Hauptdruck > späteste Phase
const PHASE_PRIORITY = ["Hauptdruck", "Nachbereitung", "Versandfertig", "Vordruck", "Schneiden"];
const ACTIVE_JOBS: Job[] = Object.values(
  JOBS.reduce((acc, job) => {
    const existing = acc[job.machine];
    if (!existing) { acc[job.machine] = job; return acc; }
    if (PHASE_PRIORITY.indexOf(job.phase) < PHASE_PRIORITY.indexOf(existing.phase)) {
      acc[job.machine] = job;
    }
    return acc;
  }, {} as Record<string, Job>)
);

export function ProduktionsleitungView() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="relative">
      <div className="p-8 fade-swap">
        <div className="space-y-6">

          {/* Header */}
          <header className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.20em] text-muted-foreground font-medium mb-2">
                Produktionsleitung · Druckerei Pfitzer GmbH
              </div>
              <h1 className="editorial-header text-[2rem] leading-none text-foreground">Übersicht — Mittwoch</h1>
              <div className="mt-3 flex items-center gap-5">
                <KPI value={JOBS.length} label="Aufträge" />
                <KPI value={JOBS.filter(j => j.problem).length} label="Probleme" tone="warn" />
                <KPI value={JOBS.filter(j => j.status === "Hinterher").length} label="Verzögert" tone="warn" />
                <KPI value={UPCOMING.length} label="Anstehend" />
              </div>
            </div>
            {/* KI-Vorschläge Button — oben rechts im Content, verdeckt nichts */}
            <div className="relative shrink-0">
              <button
                onClick={() => setAiOpen(!aiOpen)}
                className="flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-md hover:opacity-85 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                KI-Vorschläge
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">3</span>
              </button>
              {aiOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 space-y-2.5 fade-swap z-20">
                  {AI_SUGGESTIONS.map((s, i) => {
                    const tone = AI_TONE[i % AI_TONE.length];
                    return (
                      <div
                        key={s.id}
                        className="rounded-xl p-3.5 border border-border shadow-lg"
                        style={{ borderLeftWidth: 3, borderLeftColor: tone.border, backgroundColor: "var(--card)" }}
                      >
                        <div className="flex gap-2 text-sm leading-snug">
                          <span className="text-base leading-none shrink-0">{s.icon}</span>
                          <span>{s.text}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Konfidenz</span>
                          <div className="flex gap-0.5">
                            {[0, 1, 2].map((d) => (
                              <span
                                key={d}
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: d < tone.confidence ? tone.border : "var(--border)" }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mt-2.5 flex gap-2">
                          <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-foreground text-background text-xs font-medium px-2 py-1.5 hover:opacity-80 transition">
                            <Check className="h-3 w-3" />Übernehmen
                          </button>
                          <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-muted text-foreground text-xs font-medium px-2 py-1.5 hover:bg-muted/60 transition">
                            <X className="h-3 w-3" />Ablehnen
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </header>

          {/* Status panels */}
          <div className="grid grid-cols-3 gap-4">
            <Panel title="Anstehend" subtitle={`${UPCOMING.length} Aufträge`}>
              <div className="flex gap-2">
                {UPCOMING.map((u) => (
                  <div key={u.id} className="flex-1 rounded-lg border border-dashed border-border px-2.5 py-2 text-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MachineDot machine={u.machine} size={6} glow={false} />
                      <span className="text-muted-foreground text-[10px] font-mono">{u.id}</span>
                    </div>
                    <div className="font-medium truncate">{u.customer}</div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Probleme" subtitle={`${JOBS.filter(j => j.problem).length} aktiv`} tone="warn">
              <div className="space-y-1.5">
                {JOBS.filter((j) => j.problem).map((j) => (
                  <div key={j.id} className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--destructive)" }} />
                    <span className="font-semibold">{j.customer.split(" ")[0]}</span>
                    <span className="text-muted-foreground truncate">{j.problem}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Nachrichten" subtitle={`${MESSAGES.filter((m) => m.unread).length} ungelesen`}>
              <div className="space-y-1.5">
                {MESSAGES.slice(0, 3).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-semibold">{m.from}:</span>
                    <span className="text-muted-foreground truncate">{m.text}</span>
                    {m.unread && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--machine-rzk)] glow-blue shrink-0" />}
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Unified job table — 1 Auftrag pro Maschine */}
          <div className="soft-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[80px_160px_1fr_160px] items-center gap-x-5 px-5 py-3 border-b border-border bg-muted/40">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Maschine</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Auftrag</div>
              <div className="flex items-center justify-between px-2">
                {PHASES.map((p) => (
                  <span key={p} className="flex-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {p}
                  </span>
                ))}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground text-right">Termin</div>
            </div>

            <div className="divide-y divide-border">
              {ACTIVE_JOBS.map((j) => {
                const isBehind = j.status === "Hinterher";
                return (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJob(j)}
                    className={`w-full text-left grid grid-cols-[80px_160px_1fr_160px] items-center gap-x-5 px-5 py-3.5 transition-colors hover:bg-muted/30 group ${isBehind ? "pulse-row-behind" : ""}`}
                  >
                    {/* Maschinen-Badge */}
                    <div className="flex flex-col items-start gap-1">
                      <MachineBadge machine={j.machine} />
                      {j.phase === "Hauptdruck" ? (
                        <span className="text-[9px] font-medium" style={{ color: "oklch(0.50 0.16 153)" }}>● läuft</span>
                      ) : (j.phase === "Schneiden" || j.phase === "Vordruck") ? (
                        <span className="text-[9px] text-muted-foreground">○ wartet</span>
                      ) : null}
                    </div>
                    {/* Auftragsinfo */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate flex items-center gap-2">
                          {j.customer}
                          {j.openSubsteps > 0 && (
                            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground shrink-0">
                              {j.openSubsteps}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{j.id}</div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    {/* Phase tracker */}
                    <PhaseTracker job={j} />
                    {/* deadline */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />{j.delivery}
                      </span>
                      <ZeitPill status={j.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Auftragstasche Drawer */}
      {selectedJob && (
        <AuftragDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}

function AuftragDrawer({ job, onClose }: { job: Job; onClose: () => void }) {
  const meta = MACHINE_META[job.machine];
  const currentIdx = PHASES.indexOf(job.phase);

  return (
    <>
      <div
        className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-[440px] bg-card drawer-panel z-50 overflow-y-auto flex flex-col">
        {/* Header */}
        <div
          className="px-7 pt-7 pb-5 border-b border-border"
          style={{ borderTopWidth: 3, borderTopColor: meta.color }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1 font-mono">{job.id}</div>
              <h2 className="text-xl font-semibold tracking-tight">{job.customer}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-muted transition text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold" style={{ color: meta.color }}>{job.machine}</span>
            <ZeitPill status={job.status} />
            {job.problem && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive">
                <AlertTriangle className="h-3 w-3" />{job.problem}
              </span>
            )}
          </div>
        </div>

        {/* Phase progress */}
        <div className="px-7 py-5 border-b border-border">
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-3">Produktionsfortschritt</div>
          <div className="flex items-center justify-between mb-2">
            {PHASES.map((p, i) => {
              const isCurrent = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <div key={p} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: isCurrent ? meta.color : isDone ? "var(--status-ahead)" : "var(--border)",
                      boxShadow: isCurrent ? `0 0 0 3px ${meta.color}30` : "none",
                    }}
                  />
                  <span className={`text-[9px] text-center font-medium leading-tight ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                    {p}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details */}
        <div className="px-7 py-5 space-y-5 flex-1">

          {/* Termin */}
          <Section icon={<Clock className="h-3.5 w-3.5" />} title="Termin & Versand">
            <Row label="Liefertermin" value={job.delivery} mono />
            {job.versandfertigAb && <Row label="Versandfertig ab" value={job.versandfertigAb} mono />}
            {job.city && <Row label="Empfänger" value={job.city} />}
            {job.shipStatus && (
              <Row label="Versandstatus" value={
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                  job.shipStatus === "Versendet" ? "text-[var(--status-ahead)]" :
                  job.shipStatus === "Gebucht" ? "text-[var(--machine-rzk)]" :
                  "text-muted-foreground"
                }`}>
                  <Truck className="h-3 w-3" />{job.shipStatus}
                </span>
              } />
            )}
          </Section>

          {/* Druckdetails */}
          <Section icon={<Layers className="h-3.5 w-3.5" />} title="Druckdetails">
            {job.paper && <Row label="Papier" value={job.paper} />}
            {job.quantity && <Row label="Auflage" value={job.quantity} mono />}
            {job.instructions && <Row label="Spezifikation" value={job.instructions} />}
          </Section>

          {/* Weiterverarbeitung */}
          {job.finishing && (
            <Section icon={<Package className="h-3.5 w-3.5" />} title="Weiterverarbeitung">
              <Row label="Verfahren" value={job.finishing} />
              {job.finishingHours && <Row label="Aufwand" value={`ca. ${job.finishingHours}h`} mono />}
              {job.wvStatus && (
                <Row label="WV-Status" value={
                  <span className={`text-xs font-medium ${
                    job.wvStatus === "Bereit für WV" ? "text-[var(--status-ahead)]" :
                    job.wvStatus === "Druck läuft" ? "text-[var(--machine-cd)]" :
                    "text-muted-foreground"
                  }`}>{job.wvStatus}</span>
                } />
              )}
            </Section>
          )}

          {/* Offene Schritte */}
          {job.openSubsteps > 0 && (
            <Section icon={<FileText className="h-3.5 w-3.5" />} title="Offene Schritte">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                  {job.openSubsteps}
                </span>
                <span className="text-sm text-muted-foreground">Substeps ausstehend</span>
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-2.5">
        {icon}{title}
      </div>
      <div className="space-y-1.5 pl-0.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

function Panel({ title, subtitle, children, tone }: { title: string; subtitle?: string; children: React.ReactNode; tone?: "warn" }) {
  return (
    <div className={`rounded-2xl bg-card border p-4 shadow-sm ${tone === "warn" ? "border-destructive/20" : "border-border"}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-xs font-semibold">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function KPI({ value, label, tone }: { value: number; label: string; tone?: "warn" }) {
  const colored = tone === "warn" && value > 0;
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-base font-semibold tabular-nums ${colored ? "text-destructive" : "text-foreground"}`}>
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}