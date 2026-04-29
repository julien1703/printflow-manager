import { JOBS, UPCOMING, MESSAGES, AI_SUGGESTIONS, MACHINE_META } from "@/lib/mock-data";
import { PhaseTracker, PhaseHeader } from "../phase-tracker";
import { ZeitPill } from "../zeit-pill";
import { MachineBadge, MachineDot } from "../dots";
import { BackgroundBlobs } from "../blobs";
import { AlertTriangle, MessageSquare, Sparkles, Check, X, Clock } from "lucide-react";
import { useState } from "react";

const AI_TONE = [
  { border: "oklch(0.72 0.17 55)",  bg: "oklch(0.72 0.17 55 / 0.06)",  confidence: 3 }, // CD orange
  { border: "oklch(0.65 0.22 25)",  bg: "oklch(0.65 0.22 25 / 0.06)",  confidence: 2 }, // warning
  { border: "oklch(0.62 0.18 245)", bg: "oklch(0.62 0.18 245 / 0.06)", confidence: 3 }, // info
];

export function ProduktionsleitungView() {
  const [aiOpen, setAiOpen] = useState(true);

  return (
    <div className="relative">
      <BackgroundBlobs />
      <div className="relative flex gap-7 p-8 fade-swap">
        <div className="flex-1 min-w-0 space-y-7">
          {/* Editorial header */}
          <header>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
              Produktionsleitung
            </div>
            <h1 className="editorial-header text-4xl">Übersicht · Mittwoch</h1>
            <div className="mt-3 flex items-baseline gap-6">
              <KPI value={JOBS.length} label="Aktive Aufträge" />
              <KPI value={JOBS.filter(j => j.problem).length} label="Probleme" tone="warn" />
              <KPI value={JOBS.filter(j => j.status === "Hinterher").length} label="Verzögert" tone="warn" />
              <KPI value={UPCOMING.length} label="Anstehend" />
            </div>
          </header>

          {/* Top status bar */}
          <div className="grid grid-cols-3 gap-5">
            <Panel title="Anstehend" subtitle={`${UPCOMING.length} Aufträge`}>
              <div className="flex gap-2">
                {UPCOMING.map((u) => (
                  <div key={u.id} className="flex-1 rounded-xl border border-dashed border-border px-2.5 py-2 text-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MachineDot machine={u.machine} size={6} glow={false} />
                      <span className="text-muted-foreground text-[10px]">{u.id}</span>
                    </div>
                    <div className="font-medium truncate">{u.customer}</div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Probleme" subtitle="2 aktiv" tone="warn">
              <div className="space-y-1.5">
                {JOBS.filter((j) => j.problem).map((j) => (
                  <div key={j.id} className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-[oklch(0.65_0.22_25)]" />
                    <span className="font-medium">{j.customer.split(" ")[0]}</span>
                    <span className="text-muted-foreground truncate">— {j.problem}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Nachrichten" subtitle={`${MESSAGES.filter((m) => m.unread).length} ungelesen`}>
              <div className="space-y-1.5">
                {MESSAGES.slice(0, 3).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{m.from}:</span>
                    <span className="text-muted-foreground truncate">{m.text}</span>
                    {m.unread && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[oklch(0.70_0.14_240)] glow-blue" />}
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Three columns */}
          <div className="grid grid-cols-[320px_1fr_180px] gap-5">
            <SectionCard title="Auftragsliste">
              <div className="space-y-2.5 max-h-[560px] overflow-auto pr-1">
                {JOBS.map((j) => {
                  const urgent = j.status === "Hinterher" && !!j.problem;
                  return (
                    <div
                      key={j.id}
                      className={`relative rounded-2xl border bg-card px-3.5 py-3 transition hover:shadow-md ${
                        urgent ? "pulse-border-red border-transparent" : "border-border shadow-sm"
                      }`}
                      style={{ borderLeftWidth: 4, borderLeftColor: MACHINE_META[j.machine].color }}
                    >
                      {j.openSubsteps > 0 && (
                        <span className="absolute right-2 top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                          {j.openSubsteps}
                        </span>
                      )}
                      <div className="font-semibold text-sm">{j.customer}</div>
                      <div className="text-[11px] text-muted-foreground">{j.id}</div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <MachineBadge machine={j.machine} />
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{j.delivery}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Phasen-Tracker">
              <PhaseHeader />
              <div className="divide-y divide-border">
                {JOBS.map((j) => (
                  <div key={j.id} className="grid grid-cols-[140px_1fr] items-center gap-2 py-1.5">
                    <div className="text-xs">
                      <div className="font-semibold truncate">{j.customer}</div>
                      <div className="text-[10px] text-muted-foreground">{j.id}</div>
                    </div>
                    <PhaseTracker job={j} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Zeitrahmen">
              <div className="space-y-3.5">
                {JOBS.map((j) => (
                  <div key={j.id} className="flex flex-col items-start gap-1">
                    <div className="text-[10px] text-muted-foreground">{j.delivery}</div>
                    <ZeitPill status={j.status} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* AI panel */}
        <aside className={`shrink-0 transition-all ${aiOpen ? "w-80" : "w-12"}`}>
          <div className="sticky top-6">
            <button
              onClick={() => setAiOpen(!aiOpen)}
              className="mb-3 flex items-center gap-2 rounded-2xl bg-card border border-border px-3.5 py-2.5 text-xs font-medium shadow-sm hover:shadow-md transition w-full"
            >
              <Sparkles className="h-3.5 w-3.5 text-[oklch(0.60_0.18_245)]" />
              {aiOpen && <span>KI-Vorschläge</span>}
              {aiOpen && <span className="ml-auto rounded-full bg-[oklch(0.70_0.14_240/0.15)] px-1.5 py-0.5 text-[10px] text-[oklch(0.45_0.18_245)]">3</span>}
            </button>
            {aiOpen && (
              <div className="space-y-3 fade-swap">
                {AI_SUGGESTIONS.map((s, i) => {
                  const tone = AI_TONE[i % AI_TONE.length];
                  return (
                    <div
                      key={s.id}
                      className={`rounded-2xl p-4 ${s.isNew ? "ai-card-glow" : "border border-border shadow-sm"}`}
                      style={{
                        backgroundColor: tone.bg,
                        borderLeft: `3px solid ${tone.border}`,
                      }}
                    >
                      <div className="flex gap-2 text-sm leading-snug">
                        <span className="text-base leading-none">{s.icon}</span>
                        <span>{s.text}</span>
                      </div>
                      {/* Confidence */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Konfidenz
                        </span>
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map((d) => (
                            <span
                              key={d}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor: d < tone.confidence ? tone.border : "oklch(0.90 0.01 250)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-primary text-primary-foreground text-xs font-medium px-2 py-1.5 hover:opacity-90 transition">
                          <Check className="h-3 w-3" />Übernehmen
                        </button>
                        <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-muted text-foreground text-xs font-medium px-2 py-1.5 hover:bg-muted/80 transition">
                          <X className="h-3 w-3" />Ablehnen
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="soft-card p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}

function Panel({ title, subtitle, children, tone }: { title: string; subtitle?: string; children: React.ReactNode; tone?: "warn" }) {
  return (
    <div
      className={`rounded-2xl bg-card border p-5 shadow-sm ${
        tone === "warn" ? "border-[oklch(0.65_0.22_25/0.3)]" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function KPI({ value, label, tone }: { value: number; label: string; tone?: "warn" }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={`kpi-numeral text-3xl ${
          tone === "warn" ? "text-[oklch(0.55_0.22_25)]" : "text-foreground"
        }`}
      >
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
