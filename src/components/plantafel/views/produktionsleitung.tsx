import { useState } from "react";
import {
  JOBS, MACHINE_META, PHASES, CASCADE_CONFLICTS, LIVE_PRINT,
  type Job, type Machine,
} from "@/lib/mock-data";
import { ZeitPill } from "../zeit-pill";
import { KISuggestionsPanel } from "@/components/plantafel/ki-suggestions";
import { AuftragDrawer } from "@/components/plantafel/auftrag-drawer";
import {
  Bell, Zap, Clock, ChevronDown, ChevronUp, ArrowRight,
  CheckCircle2, AlertTriangle, Circle, TrendingDown,
} from "lucide-react";

const ALL_MACHINES: Machine[] = ["CD", "SM5", "RZK", "Digi"];

const MACHINE_DISPLAY: Record<Machine, string> = {
  CD: "CD", RZK: "RZK", SM5: "SM528", Digi: "Digi",
};

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

function MachineUtilBar({ machine, color }: { machine: Machine; color: string }) {
  const jobs = JOBS.filter(
    (j) => j.machine === machine && j.orderStatus !== "Abgeschlossen" && j.orderStatus !== "Storniert"
  );
  const total = Math.min(jobs.length, 6);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all"
          style={{ background: i < total ? color : "oklch(0.88 0.003 80)" }}
        />
      ))}
    </div>
  );
}

export function ProduktionsleitungView() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [expandedConflict, setExpandedConflict] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    () => new Set(JOBS.filter((j) => j.festgepinnt).map((j) => j.id))
  );
  const [prioritaetOverrides, setPrioritaetOverrides] = useState<Record<string, Job["prioritaet"]>>({});
  const [notizOverrides, setNotizOverrides] = useState<Record<string, string>>({});

  function togglePinned(jobId: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
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


  const totalAlerts = CASCADE_CONFLICTS.length + (missingFreigabe.length > 0 ? 1 : 0);

  return (
    <div className="relative fade-swap flex flex-col" style={{ minHeight: "calc(100vh - 88px)" }}>

      {/* ── Header ── */}
      <div className="px-8 pt-6 pb-5 flex items-start justify-between shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1.5">
            Produktionsleitung · G. Maisch
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-none">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Mittwoch, 20. Mai 2026 · KW 21
          </p>
        </div>

        {/* Notification bell */}
        {totalAlerts > 0 && (
          <button
            type="button"
            onClick={() => setAlertsExpanded((v) => !v)}
            className="relative flex items-center gap-2.5 rounded-2xl border px-4 py-3 transition-all hover:bg-muted/40"
            style={{
              background: alertsExpanded ? "oklch(0.97 0.015 25)" : "var(--card)",
              borderColor: alertsExpanded ? "oklch(0.82 0.10 25)" : "var(--border)",
            }}
          >
            <div className="relative">
              <Bell className="h-4 w-4" style={{ color: "oklch(0.50 0.22 25)" }} />
              <span
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full text-[8px] font-black flex items-center justify-center"
                style={{ background: "oklch(0.50 0.22 25)", color: "white" }}
              >
                {totalAlerts}
              </span>
            </div>
            <span className="text-sm font-semibold" style={{ color: "oklch(0.38 0.20 25)" }}>
              {totalAlerts} {totalAlerts === 1 ? "Hinweis" : "Hinweise"}
            </span>
            {alertsExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* ── Alerts Panel (expandable) ── */}
      {alertsExpanded && (
        <div className="mx-8 mb-5 rounded-2xl border overflow-hidden" style={{ borderColor: "oklch(0.82 0.10 25)" }}>
          {CASCADE_CONFLICTS.map((cc) => (
            <div key={cc.triggerId} style={{ borderBottom: "1px solid oklch(0.90 0.04 25)" }}>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-left transition hover:brightness-[0.97]"
                style={{ background: "oklch(0.98 0.015 25)" }}
                onClick={() => setExpandedConflict(expandedConflict === cc.triggerId ? null : cc.triggerId)}
              >
                <Zap className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
                <span className="font-bold" style={{ color: "oklch(0.38 0.20 25)" }}>Kaskaden-Konflikt</span>
                <span className="text-foreground font-medium">{cc.triggerCustomer}</span>
                <span className="text-muted-foreground text-xs flex-1 truncate">· {cc.reason}</span>
                <div className="flex gap-1 shrink-0">
                  {cc.affected.map((a) => (
                    <span key={a.role} className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                      style={{
                        background: a.severity === "high" ? "oklch(0.88 0.10 25 / 0.4)" : "oklch(0.90 0.08 85 / 0.4)",
                        color: a.severity === "high" ? "oklch(0.40 0.20 25)" : "oklch(0.42 0.16 85)",
                      }}>
                      {a.actionRequired && <TrendingDown className="h-2.5 w-2.5" />}
                      {a.role.replace("buchbinderei","BB").replace("logistik","Log.").replace("projektmanager","PM")}
                    </span>
                  ))}
                </div>
                {expandedConflict === cc.triggerId ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              {expandedConflict === cc.triggerId && (
                <div className="px-5 pb-4 pt-2" style={{ background: "oklch(0.98 0.015 25)" }}>
                  <div className="space-y-1 mb-3">
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
          ))}
          {missingFreigabe.length > 0 && (
            <div className="flex items-center gap-3 px-5 py-3.5 text-sm" style={{ background: "oklch(0.98 0.04 85 / 0.5)" }}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "oklch(0.52 0.17 85)" }} />
              <span className="font-bold" style={{ color: "oklch(0.40 0.16 85)" }}>{missingFreigabe.length}× Druckfreigabe fehlt</span>
              <span className="text-muted-foreground text-xs">{missingFreigabe.map((j) => j.customer).join(" · ")}</span>
            </div>
          )}
        </div>
      )}

      {/* ── KPI Strip (compact, secondary) ── */}
      <div
        className="mx-8 mb-6 rounded-2xl border flex items-center divide-x divide-border shrink-0"
        style={{ background: "var(--card)" }}
      >
        {[
          { value: inProduction,          label: "Im Druck",        warn: false,                        icon: <Circle className="h-3 w-3 fill-current" style={{ color: "oklch(0.52 0.20 145)" }} /> },
          { value: activeJobs.length,     label: "Aktiv",           warn: false,                        icon: <CheckCircle2 className="h-3 w-3 text-muted-foreground" /> },
          { value: blockedCount,          label: "Blockiert",       warn: blockedCount > 0,             icon: <Zap className="h-3 w-3" style={{ color: blockedCount > 0 ? "oklch(0.50 0.22 25)" : "var(--muted-foreground)" }} /> },
          { value: missingFreigabe.length,label: "Freigabe fehlt",  warn: missingFreigabe.length > 0,  icon: <AlertTriangle className="h-3 w-3" style={{ color: missingFreigabe.length > 0 ? "oklch(0.52 0.17 85)" : "var(--muted-foreground)" }} /> },
        ].map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-2.5 px-5 py-3 flex-1">
            {kpi.icon}
            <span
              className="text-xl font-black number-display leading-none"
              style={{ color: kpi.warn ? (kpi.label === "Blockiert" ? "oklch(0.50 0.22 25)" : "oklch(0.45 0.16 85)") : "oklch(0.16 0.008 255)" }}
            >
              {kpi.value}
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground leading-tight">
              {kpi.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Body: single column ── */}
      <div className="px-8 pb-8 flex flex-col gap-6 flex-1 min-h-0">

        {/* ── Maschinen (4 columns) ── */}
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
              const jobCount = JOBS.filter(
                (j) => j.machine === machine && j.orderStatus !== "Abgeschlossen" && j.orderStatus !== "Storniert"
              ).length;

              return (
                <div
                  key={machine}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    background: isBlocked ? "oklch(0.98 0.015 25)" : "var(--card)",
                    borderColor: isBlocked ? "oklch(0.88 0.08 25)" : "var(--border)",
                  }}
                >
                  {/* Machine header */}
                  <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black"
                      style={{ background: `color-mix(in oklab, ${color} 12%, var(--background))`, color }}
                    >
                      {MACHINE_DISPLAY[machine].slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm" style={{ color }}>{MACHINE_DISPLAY[machine]}</span>
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${isRunning ? "pulse-chip" : ""}`}
                          style={{
                            background: isBlocked ? "oklch(0.55 0.22 25)" : isRunning ? "oklch(0.52 0.20 145)" : "oklch(0.82 0.003 255)",
                          }}
                        />
                        <span className="text-[9px] font-semibold uppercase tracking-widest"
                          style={{ color: isBlocked ? "oklch(0.50 0.22 25)" : isRunning ? "oklch(0.45 0.18 145)" : "var(--muted-foreground)" }}>
                          {isBlocked ? "Blockiert" : isRunning ? "Läuft" : "Bereit"}
                        </span>
                        <span className="ml-auto text-[9px] font-mono text-muted-foreground">{jobCount}</span>
                      </div>
                      <div className="mt-1.5">
                        <MachineUtilBar machine={machine} color={color} />
                      </div>
                    </div>
                  </div>

                  {/* Current job */}
                  {currentJob ? (
                    <button
                      type="button"
                      onClick={() => setSelectedJob(currentJob)}
                      className="w-full text-left mx-3 mb-2 rounded-xl p-3 transition hover:brightness-[0.97] border"
                      style={{
                        background: `color-mix(in oklab, ${color} 5%, var(--background))`,
                        borderColor: `color-mix(in oklab, ${color} 18%, var(--border))`,
                        width: "calc(100% - 1.5rem)",
                      }}
                    >
                      <div className="text-[8px] uppercase tracking-[0.12em] font-bold mb-1" style={{ color }}>Jetzt</div>
                      <div className="text-sm font-bold truncate">{currentJob.customer}</div>
                      {isRunning && livePrint && (
                        <div className="mt-2">
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                            <div className="h-full rounded-full shimmer-bar" style={{ width: `${livePrint.progress}%`, background: color }} />
                          </div>
                          <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
                            <span>{livePrint.progress}%</span>
                            <span>~{livePrint.finishInMin} min</span>
                          </div>
                        </div>
                      )}
                      {!isRunning && (
                        <div className="text-[9px] font-mono text-muted-foreground mt-1">{currentJob.delivery}</div>
                      )}
                    </button>
                  ) : (
                    <div className="mx-3 mb-2 rounded-xl p-3 border border-dashed border-border text-[10px] text-muted-foreground text-center">
                      Kein Auftrag geplant
                    </div>
                  )}

                  {/* Next job */}
                  {nextJob && (
                    <button
                      type="button"
                      onClick={() => setSelectedJob(nextJob)}
                      className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:bg-muted/30 transition text-left"
                      style={{ width: "calc(100% - 1.5rem)" }}
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

        {/* ── Alle Aufträge ── */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
              Aktive Aufträge
            </span>
            <span
              className="text-[10px] font-black rounded-full px-2 py-0.5 number-display"
              style={{ background: "oklch(0.22 0.008 255)", color: "white" }}
            >
              {activeJobs.length}
            </span>
          </div>

          {/* Header row */}
          <div
            className="grid px-4 pb-2 text-[9px] uppercase tracking-[0.12em] font-semibold text-muted-foreground"
            style={{ gridTemplateColumns: "2.5rem 1fr 6rem 6rem 4.5rem 5rem" }}
          >
            <span />
            <span>Kunde · Produkt</span>
            <span>Phase</span>
            <span>Status</span>
            <span>Termin</span>
            <span />
          </div>

          <div className="overflow-auto space-y-1.5 pr-1">
            {activeJobs.map((j, idx) => {
              const color = MACHINE_META[j.machine].color;
              const phaseIdx = PHASES.indexOf(j.phase);
              return (
                <button
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className="w-full text-left rounded-xl border px-4 py-3 grid items-center gap-3 hover:bg-muted/30 transition-colors group"
                  style={{
                    gridTemplateColumns: "2.5rem 1fr 6rem 6rem 4.5rem 5rem",
                    borderLeftWidth: 3,
                    borderLeftColor: color,
                    borderColor: j.cascadeConflict ? "oklch(0.88 0.08 25)" : "var(--border)",
                    background: j.cascadeConflict
                      ? "oklch(0.98 0.015 25)"
                      : idx % 2 === 0
                      ? "var(--card)"
                      : "oklch(0.97 0.003 80 / 0.5)",
                  }}
                >
                  <span className="text-[10px] font-black" style={{ color }}>
                    {MACHINE_DISPLAY[j.machine]}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate">{j.customer}</span>
                      {j.cascadeConflict && <Zap className="h-3 w-3 shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />}
                      {j.isNew && (
                        <span className="text-[8px] font-bold rounded-full px-1.5 py-0.5 shrink-0"
                          style={{ background: "oklch(0.92 0.08 145 / 0.3)", color: "oklch(0.35 0.18 145)" }}>NEU</span>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground leading-none">{j.product}</span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {PHASES.map((_, i) => (
                      <div key={i} className="h-1 flex-1 rounded-full"
                        style={{
                          background: i < phaseIdx ? "oklch(0.72 0.18 145)"
                            : i === phaseIdx ? (j.cascadeConflict ? "oklch(0.50 0.22 25)" : color)
                            : "var(--border)",
                        }}
                      />
                    ))}
                  </div>

                  <div><ZeitPill status={j.status} /></div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {j.delivery}
                  </div>

                  <div>
                    {j.druckfreigabe === "Fehlt" && (
                      <span className="text-[8px] font-semibold rounded-md px-1.5 py-0.5 whitespace-nowrap"
                        style={{ background: "oklch(0.94 0.10 85 / 0.35)", color: "oklch(0.45 0.16 85)" }}>
                        Freigabe fehlt
                      </span>
                    )}
                    {j.druckfreigabe === "Erteilt" && (
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "oklch(0.65 0.18 145)" }} />
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
