import { useState } from "react";
import {
  JOBS, MACHINE_META, PHASES, CASCADE_CONFLICTS, LIVE_PRINT,
  type Job, type Machine,
} from "@/lib/mock-data";
import { ZeitPill } from "../zeit-pill";
import { KISuggestionsPanel } from "@/components/plantafel/ki-suggestions";
import { AuftragDrawer } from "@/components/plantafel/auftrag-drawer";
import {
  AlertTriangle, Zap, Clock, TrendingDown, Activity, Printer,
  AlertOctagon, FileWarning, ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react";

const ALL_MACHINES: Machine[] = ["CD", "RZK", "SM5", "Digi"];

function sortByDelivery(a: Job, b: Job) {
  const d = (s: string) => { const [day, month] = s.split(".").map(Number); return month * 100 + day; };
  return d(a.delivery) - d(b.delivery);
}

function getCurrentJob(machine: Machine): Job | undefined {
  return (
    JOBS.find(
      (j) => j.machine === machine &&
        (j.orderStatus === "In Produktion" || j.orderStatus === "Blockiert")
    ) ??
    JOBS.filter(
      (j) => j.machine === machine &&
        j.orderStatus !== "Abgeschlossen" &&
        j.orderStatus !== "Storniert"
    ).sort(sortByDelivery)[0]
  );
}

function getNextJob(machine: Machine, currentId?: string): Job | undefined {
  return JOBS.filter(
    (j) =>
      j.machine === machine &&
      j.id !== currentId &&
      j.orderStatus !== "Abgeschlossen" &&
      j.orderStatus !== "Storniert" &&
      j.orderStatus !== "In Produktion" &&
      j.orderStatus !== "Blockiert"
  ).sort(sortByDelivery)[0];
}

const MACHINE_DISPLAY: Record<Machine, string> = {
  CD: "CD", RZK: "RZK", SM5: "SM528", Digi: "Digi",
};

export function ProduktionsleitungView() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    () => new Set(JOBS.filter((j) => j.festgepinnt).map((j) => j.id))
  );
  const [prioritaetOverrides, setPrioritaetOverrides] = useState<Record<string, Job["prioritaet"]>>({});
  const [notizOverrides, setNotizOverrides] = useState<Record<string, string>>({});

  function togglePinned(jobId: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  const activeJobs = JOBS.filter(
    (j) => j.orderStatus !== "Abgeschlossen" && j.orderStatus !== "Storniert"
  ).sort(sortByDelivery);

  const inProduction = JOBS.filter((j) => j.orderStatus === "In Produktion").length;
  const blockedCount = JOBS.filter((j) => j.orderStatus === "Blockiert" || j.cascadeConflict).length;
  const missingFreigabe = JOBS.filter(
    (j) => j.druckfreigabe === "Fehlt" && j.orderStatus !== "Abgeschlossen" && j.orderStatus !== "Storniert"
  );

  function toggleAlert(id: string) {
    setExpandedAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const kpis = [
    { count: activeJobs.length, label: "Aktiv",        Icon: Activity,     warn: false },
    { count: inProduction,       label: "Im Druck",     Icon: Printer,      warn: false },
    { count: blockedCount,       label: "Blockiert",    Icon: AlertOctagon, warn: blockedCount > 0 },
    { count: missingFreigabe.length, label: "Freigabe fehlt", Icon: FileWarning, warn: missingFreigabe.length > 0 },
  ];

  return (
    <div className="relative fade-swap" style={{ minHeight: "calc(100vh - 88px)" }}>

      {/* ── Page Header ── */}
      <div className="px-8 pt-7 pb-5 border-b border-border flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1">
            Produktionsleitung · G. Maisch
          </div>
          <h1 className="text-3xl font-bold leading-none tracking-tight">Dashboard</h1>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground pb-0.5">
          Mi. 20. Mai 2026 · KW 21
        </span>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="px-6 py-4 flex items-center gap-4">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: kpi.warn
                  ? "oklch(0.93 0.10 25 / 0.15)"
                  : "oklch(0.95 0.003 80)",
              }}
            >
              <kpi.Icon
                className="h-4 w-4"
                style={{ color: kpi.warn ? "oklch(0.50 0.22 25)" : "oklch(0.55 0.006 255)" }}
              />
            </div>
            <div>
              <div
                className="text-2xl font-black number-display leading-none"
                style={{ color: kpi.warn ? "oklch(0.50 0.22 25)" : "oklch(0.16 0.008 255)" }}
              >
                {kpi.count}
              </div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold mt-0.5">
                {kpi.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* ── Alerts ── */}
        {(CASCADE_CONFLICTS.length > 0 || missingFreigabe.length > 0) && (
          <div className="space-y-2">
            {CASCADE_CONFLICTS.map((cc) => {
              const isExpanded = expandedAlerts.has(cc.triggerId);
              return (
                <div
                  key={cc.triggerId}
                  className="rounded-xl border cursor-pointer overflow-hidden"
                  style={{
                    background: "oklch(0.98 0.015 25)",
                    borderColor: "oklch(0.88 0.08 25)",
                  }}
                  onClick={() => toggleAlert(cc.triggerId)}
                >
                  <div className="flex items-center gap-3 px-4 py-3 text-sm">
                    <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
                    <span className="font-semibold" style={{ color: "oklch(0.38 0.20 25)" }}>
                      Kaskaden-Konflikt:
                    </span>
                    <span className="font-medium text-foreground">{cc.triggerCustomer}</span>
                    <span className="text-muted-foreground text-xs flex-1 truncate">· {cc.reason}</span>
                    <div className="flex gap-1 shrink-0">
                      {cc.affected.map((a) => (
                        <span
                          key={a.role}
                          className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-medium"
                          style={{
                            background: a.severity === "high" ? "oklch(0.88 0.10 25 / 0.3)" : "oklch(0.90 0.08 85 / 0.3)",
                            color: a.severity === "high" ? "oklch(0.40 0.20 25)" : "oklch(0.42 0.16 85)",
                          }}
                        >
                          {a.actionRequired && <TrendingDown className="h-2.5 w-2.5" />}
                          {a.role.replace("buchbinderei","BB").replace("logistik","Log.").replace("projektmanager","PM")}
                        </span>
                      ))}
                    </div>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-1.5 mt-3 mb-3">
                        {cc.affected.map((a) => (
                          <div key={a.role} className="flex items-start gap-2 text-xs">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ background: a.severity === "high" ? "oklch(0.50 0.22 25)" : "oklch(0.55 0.17 85)" }} />
                            <span className="font-semibold" style={{ color: a.severity === "high" ? "oklch(0.40 0.20 25)" : "oklch(0.42 0.16 85)" }}>
                              {a.role.replace("buchbinderei","Buchbinderei").replace("logistik","Logistik").replace("projektmanager","Projektmanager")}
                            </span>
                            <span className="text-muted-foreground">· {a.impact}</span>
                          </div>
                        ))}
                      </div>
                      <KISuggestionsPanel role="produktionsleitung" context={cc.reason} />
                    </div>
                  )}
                </div>
              );
            })}

            {missingFreigabe.length > 0 && (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm border"
                style={{ background: "oklch(0.98 0.04 85 / 0.5)", borderColor: "oklch(0.88 0.10 85)" }}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.52 0.17 85)" }} />
                <span className="font-semibold" style={{ color: "oklch(0.40 0.16 85)" }}>
                  {missingFreigabe.length}× Druckfreigabe fehlt
                </span>
                <span className="text-muted-foreground text-xs">
                  {missingFreigabe.map((j) => j.customer).join(" · ")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Maschinen ── */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-3">
            Maschinen
          </div>
          <div className="grid grid-cols-4 gap-3">
            {ALL_MACHINES.map((machine) => {
              const currentJob = getCurrentJob(machine);
              const nextJob = getNextJob(machine, currentJob?.id);
              const color = MACHINE_META[machine].color;
              const isBlocked = currentJob?.cascadeConflict || currentJob?.orderStatus === "Blockiert";
              const isRunning = currentJob?.orderStatus === "In Produktion";
              const livePrint = LIVE_PRINT.find((lp) => lp.machine === machine);

              return (
                <div
                  key={machine}
                  className="rounded-2xl border overflow-hidden flex flex-col"
                  style={{
                    background: isBlocked ? "oklch(0.98 0.015 25)" : "var(--card)",
                    borderColor: isBlocked ? "oklch(0.88 0.08 25)" : "var(--border)",
                  }}
                >
                  {/* Header */}
                  <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border/50">
                    <div>
                      <div className="text-base font-black" style={{ color }}>{MACHINE_DISPLAY[machine]}</div>
                      <div
                        className="text-[9px] uppercase tracking-[0.12em] font-semibold mt-0.5"
                        style={{
                          color: isBlocked ? "oklch(0.50 0.22 25)" : isRunning ? "oklch(0.45 0.18 145)" : "var(--muted-foreground)",
                        }}
                      >
                        {isBlocked ? "Blockiert" : isRunning ? "Läuft" : "Bereit"}
                      </div>
                    </div>
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${isRunning ? "pulse-chip" : ""}`}
                      style={{
                        background: isBlocked ? "oklch(0.55 0.22 25)" : isRunning ? "oklch(0.52 0.20 145)" : "oklch(0.82 0.003 255)",
                      }}
                    />
                  </div>

                  {/* Aktueller Auftrag */}
                  <div className="p-3 flex-1">
                    {currentJob ? (
                      <button
                        type="button"
                        onClick={() => setSelectedJob(currentJob)}
                        className="w-full text-left rounded-xl p-3 transition hover:brightness-[0.97]"
                        style={{
                          background: `color-mix(in oklab, ${color} 6%, var(--background))`,
                          border: `1px solid color-mix(in oklab, ${color} 16%, var(--border))`,
                        }}
                      >
                        <div className="text-[9px] uppercase tracking-[0.12em] font-semibold mb-1" style={{ color }}>
                          Jetzt
                        </div>
                        <div className="text-sm font-bold leading-snug truncate mb-1">
                          {currentJob.customer}
                        </div>
                        {isRunning && livePrint && (
                          <div className="mt-2 mb-1">
                            <div className="h-1 rounded-full bg-border overflow-hidden">
                              <div
                                className="h-full rounded-full shimmer-bar"
                                style={{ width: `${livePrint.progress}%`, background: color }}
                              />
                            </div>
                            <div className="text-[9px] text-muted-foreground font-mono mt-1">
                              ~{livePrint.finishInMin} min
                            </div>
                          </div>
                        )}
                        <div className="text-[9px] font-mono text-muted-foreground mt-1">
                          {currentJob.delivery}
                        </div>
                      </button>
                    ) : (
                      <div className="rounded-xl p-3 border border-dashed border-border text-xs text-muted-foreground">
                        Kein Auftrag
                      </div>
                    )}
                  </div>

                  {/* Nächster Auftrag */}
                  {nextJob && (
                    <button
                      type="button"
                      onClick={() => setSelectedJob(nextJob)}
                      className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition text-left"
                    >
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] font-semibold truncate flex-1">{nextJob.customer}</span>
                      <span className="text-[9px] font-mono text-muted-foreground shrink-0">{nextJob.delivery}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Alle aktiven Aufträge ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
              Alle aktiven Aufträge
            </span>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
              {activeJobs.length}
            </span>
          </div>

          {/* Table header */}
          <div className="grid text-[9px] uppercase tracking-[0.12em] font-semibold text-muted-foreground px-4 mb-1.5"
            style={{ gridTemplateColumns: "2rem 1fr 7rem 7rem 5rem 5rem" }}>
            <span />
            <span>Kunde</span>
            <span>Phase</span>
            <span>Status</span>
            <span>Termin</span>
            <span />
          </div>

          <div className="space-y-1">
            {activeJobs.map((j) => {
              const color = MACHINE_META[j.machine].color;
              const phaseIdx = PHASES.indexOf(j.phase);
              return (
                <button
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className="w-full text-left rounded-xl border bg-card px-4 py-3 grid items-center gap-4 hover:bg-muted/30 transition-colors"
                  style={{
                    gridTemplateColumns: "2rem 1fr 7rem 7rem 5rem 5rem",
                    borderLeftWidth: 3,
                    borderLeftColor: color,
                    borderColor: j.cascadeConflict ? "oklch(0.88 0.08 25)" : "var(--border)",
                    background: j.cascadeConflict ? "oklch(0.98 0.015 25)" : undefined,
                  }}
                >
                  {/* Machine */}
                  <span className="text-[10px] font-black" style={{ color }}>
                    {MACHINE_DISPLAY[j.machine]}
                  </span>

                  {/* Kunde + Badges */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate">{j.customer}</span>
                      {j.cascadeConflict && (
                        <Zap className="h-3 w-3 shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
                      )}
                      {j.isNew && (
                        <span className="text-[8px] font-bold rounded-full px-1.5 py-0.5 shrink-0"
                          style={{ background: "oklch(0.92 0.08 145 / 0.3)", color: "oklch(0.35 0.18 145)" }}>
                          NEU
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground">{j.product}</span>
                  </div>

                  {/* Phase dots */}
                  <div className="flex items-center gap-1">
                    {PHASES.map((_, i) => (
                      <div key={i} className="h-1.5 flex-1 rounded-full"
                        style={{
                          background: i < phaseIdx ? "oklch(0.72 0.18 145)"
                            : i === phaseIdx ? (j.cascadeConflict ? "oklch(0.50 0.22 25)" : color)
                            : "var(--border)",
                        }}
                      />
                    ))}
                  </div>

                  {/* ZeitStatus */}
                  <div><ZeitPill status={j.status} /></div>

                  {/* Termin */}
                  <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {j.delivery}
                  </div>

                  {/* Freigabe */}
                  <div>
                    {j.druckfreigabe === "Fehlt" && (
                      <span className="text-[8px] font-semibold rounded-md px-1.5 py-0.5"
                        style={{ background: "oklch(0.94 0.10 85 / 0.35)", color: "oklch(0.45 0.16 85)" }}>
                        Freigabe fehlt
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Drawer ── */}
      {selectedJob && (
        <AuftragDrawer
          job={{
            ...selectedJob,
            festgepinnt: pinnedIds.has(selectedJob.id),
            prioritaet: prioritaetOverrides[selectedJob.id] ?? selectedJob.prioritaet,
            notiz: notizOverrides[selectedJob.id] ?? selectedJob.notiz,
          }}
          onClose={() => setSelectedJob(null)}
          onToggleFestgepinnt={() => togglePinned(selectedJob.id)}
          onPrioritaetChange={(p) =>
            setPrioritaetOverrides((prev) => ({ ...prev, [selectedJob.id]: p }))
          }
          onNotizChange={(text) =>
            setNotizOverrides((prev) => ({ ...prev, [selectedJob.id]: text }))
          }
        />
      )}
    </div>
  );
}
