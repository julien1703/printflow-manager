import { JOBS, UPCOMING, MESSAGES, AI_SUGGESTIONS, MACHINE_META } from "@/lib/mock-data";
import { PhaseTracker, PhaseHeader } from "./phase-tracker";
import { ZeitPill } from "./zeit-pill";
import { MachineBadge, MachineDot } from "./dots";
import { AlertTriangle, MessageSquare, Sparkles, Check, X, Clock } from "lucide-react";
import { useState } from "react";

export function ProduktionsleitungView() {
  const [aiOpen, setAiOpen] = useState(true);

  return (
    <div className="flex gap-6 p-6 fade-swap">
      <div className="flex-1 min-w-0 space-y-5">
        {/* Top status bar */}
        <div className="grid grid-cols-3 gap-4">
          <Panel title="Anstehend" subtitle={`${UPCOMING.length} Aufträge`}>
            <div className="flex gap-2">
              {UPCOMING.map((u) => (
                <div key={u.id} className="flex-1 rounded-md border border-dashed border-border px-2 py-2 text-xs">
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
        <div className="grid grid-cols-[320px_1fr_180px] gap-4">
          {/* Auftragsliste */}
          <Card title="Auftragsliste">
            <div className="space-y-2.5 max-h-[560px] overflow-auto pr-1">
              {JOBS.map((j) => (
                <div
                  key={j.id}
                  className="relative rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm hover:shadow-md transition"
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
              ))}
            </div>
          </Card>

          {/* Phase tracker */}
          <Card title="Phasen-Tracker">
            <PhaseHeader />
            <div className="divide-y divide-border">
              {JOBS.map((j) => (
                <div key={j.id} className="grid grid-cols-[140px_1fr] items-center gap-2 py-1">
                  <div className="text-xs">
                    <div className="font-semibold truncate">{j.customer}</div>
                    <div className="text-[10px] text-muted-foreground">{j.id}</div>
                  </div>
                  <PhaseTracker job={j} />
                </div>
              ))}
            </div>
          </Card>

          {/* Zeitrahmen */}
          <Card title="Zeitrahmen">
            <div className="space-y-3">
              {JOBS.map((j) => (
                <div key={j.id} className="flex flex-col items-start gap-1">
                  <div className="text-[10px] text-muted-foreground">{j.delivery}</div>
                  <ZeitPill status={j.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* AI panel */}
      <aside className={`shrink-0 transition-all ${aiOpen ? "w-80" : "w-12"}`}>
        <div className="sticky top-6">
          <button
            onClick={() => setAiOpen(!aiOpen)}
            className="mb-3 flex items-center gap-2 rounded-md bg-card border border-border px-3 py-2 text-xs font-medium shadow-sm hover:shadow-md transition w-full"
          >
            <Sparkles className="h-3.5 w-3.5 text-[oklch(0.60_0.18_245)]" />
            {aiOpen && <span>KI-Vorschläge</span>}
            {aiOpen && <span className="ml-auto rounded-full bg-[oklch(0.70_0.14_240/0.15)] px-1.5 py-0.5 text-[10px] text-[oklch(0.45_0.18_245)]">3</span>}
          </button>
          {aiOpen && (
            <div className="space-y-3 fade-swap">
              {AI_SUGGESTIONS.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-lg bg-card p-3.5 ${s.isNew ? "ai-card-glow" : "border border-border shadow-sm"}`}
                >
                  <div className="flex gap-2 text-sm leading-snug">
                    <span className="text-base leading-none">{s.icon}</span>
                    <span>{s.text}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-primary text-primary-foreground text-xs font-medium px-2 py-1.5 hover:opacity-90 transition">
                      <Check className="h-3 w-3" />Übernehmen
                    </button>
                    <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-muted text-foreground text-xs font-medium px-2 py-1.5 hover:bg-muted/80 transition">
                      <X className="h-3 w-3" />Ablehnen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-card border border-border shadow-sm p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}

function Panel({ title, subtitle, children, tone }: { title: string; subtitle?: string; children: React.ReactNode; tone?: "warn" }) {
  return (
    <div className={`rounded-xl bg-card border shadow-sm p-4 ${tone === "warn" ? "border-[oklch(0.65_0.22_25/0.3)]" : "border-border"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
