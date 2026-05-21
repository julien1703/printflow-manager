import { useState } from "react";
import {
  JOBS, MACHINE_META, PHASES, CASCADE_CONFLICTS, LIVE_PRINT,
  type Job, type Machine,
} from "@/lib/mock-data";
import { ZeitPill } from "../zeit-pill";
import { KISuggestionsPanel } from "@/components/plantafel/ki-suggestions";
import {
  AlertTriangle, Zap, Clock, Package, Layers, FileText,
  Truck, X, TrendingDown, ArrowRight, Activity, Printer,
  AlertOctagon, FileWarning, ChevronDown, ChevronUp,
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

export function ProduktionsleitungView() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const activeJobs = JOBS.filter(
    (j) => j.orderStatus !== "Abgeschlossen" && j.orderStatus !== "Storniert"
  ).sort(sortByDelivery);

  const inProduction = JOBS.filter((j) => j.orderStatus === "In Produktion").length;
  const blockedCount = JOBS.filter((j) => j.orderStatus === "Blockiert" || j.cascadeConflict).length;

  const missingFreigabe = JOBS.filter(
    (j) => j.druckfreigabe === "Fehlt" &&
      j.orderStatus !== "Abgeschlossen" &&
      j.orderStatus !== "Storniert"
  );

  function toggleAlert(id: string) {
    setExpandedAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const kpiItems = [
    {
      count: activeJobs.length,
      label: "Aufträge aktiv",
      Icon: Activity,
      accent: false,
      color: "oklch(0.55 0.008 255)",
      borderCls: "",
    },
    {
      count: inProduction,
      label: "Im Druck",
      Icon: Printer,
      accent: false,
      color: "oklch(0.40 0.18 145)",
      borderCls: "",
    },
    {
      count: blockedCount,
      label: "Blockiert",
      Icon: AlertOctagon,
      accent: blockedCount > 0,
      color: "oklch(0.50 0.22 25)",
      borderCls: "border-l-destructive",
    },
    {
      count: missingFreigabe.length,
      label: "Freigabe fehlt",
      Icon: FileWarning,
      accent: missingFreigabe.length > 0,
      color: "oklch(0.55 0.17 85)",
      borderCls: "border-l-[oklch(0.55_0.17_85)]",
    },
  ];

  return (
    <div className="relative">
      <div className="fade-swap" style={{ minHeight: "calc(100vh - 88px)" }}>

        {/* ── Header — clean, no gantt ── */}
        <div className="px-8 pt-8 pb-6 border-b border-border">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
            Produktionsleitung · G. Maisch
          </div>
          <h1 className="editorial-header leading-none" style={{ fontSize: "clamp(2.8rem, 5vw, 4rem)" }}>
            Montag
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">20. Mai 2026 · KW 20</p>
        </div>

        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
          {kpiItems.map((item, i) => (
            <div
              key={i}
              className={[
                "px-7 py-6",
                item.accent ? `border-l-4 ${item.borderCls}` : "",
              ].filter(Boolean).join(" ")}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor:
                      item.accent && item.count > 0
                        ? `color-mix(in oklab, ${item.color} 15%, white)`
                        : "var(--muted)",
                  }}
                >
                  <item.Icon
                    className="h-4 w-4"
                    style={{
                      color:
                        item.accent && item.count > 0
                          ? item.color
                          : "var(--muted-foreground)",
                    }}
                  />
                </div>
              </div>
              <div
                className="text-4xl font-black number-display leading-none mb-1.5"
                style={{
                  color:
                    item.accent && item.count > 0
                      ? item.color
                      : "var(--foreground)",
                }}
              >
                {item.count}
              </div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="px-8 py-5 space-y-5">

          {/* ── Alerts ── */}
          <div className="space-y-2">
            {CASCADE_CONFLICTS.map((cc) => {
              const isExpanded = expandedAlerts.has(cc.triggerId);
              return (
                <div
                  key={cc.triggerId}
                  className="rounded-xl border cursor-pointer"
                  style={{
                    backgroundColor: "oklch(0.65 0.22 25 / 0.05)",
                    borderColor: "oklch(0.65 0.22 25 / 0.22)",
                  }}
                  onClick={() => toggleAlert(cc.triggerId)}
                >
                  {/* Collapsed header row */}
                  <div className="flex items-start gap-3 px-4 py-3 text-sm">
                    <Zap
                      className="h-3.5 w-3.5 mt-0.5 shrink-0"
                      style={{ color: "oklch(0.50 0.22 25)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold" style={{ color: "oklch(0.38 0.20 25)" }}>
                        Kaskaden-Konflikt: {cc.triggerCustomer}
                      </span>
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{cc.reason}</span>
                      {!isExpanded && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {cc.affected.map((a) => (
                            <span
                              key={a.role}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor:
                                  a.severity === "high"
                                    ? "oklch(0.65 0.22 25 / 0.10)"
                                    : "oklch(0.85 0.17 85 / 0.12)",
                                color:
                                  a.severity === "high"
                                    ? "oklch(0.40 0.20 25)"
                                    : "oklch(0.42 0.16 85)",
                              }}
                            >
                              {a.actionRequired && <TrendingDown className="h-3 w-3" />}
                              {a.role
                                .replace("buchbinderei", "Buchbinderei")
                                .replace("logistik", "Logistik")
                                .replace("projektmanager", "PM")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-muted-foreground mt-0.5">
                      {isExpanded
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />
                      }
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-2 mb-4">
                        {cc.affected.map((a) => (
                          <div key={a.role} className="flex items-start gap-3">
                            <div
                              className="mt-1 h-2 w-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  a.severity === "high"
                                    ? "oklch(0.50 0.22 25)"
                                    : a.severity === "medium"
                                    ? "oklch(0.55 0.17 85)"
                                    : "oklch(0.60 0.04 255)",
                              }}
                            />
                            <div>
                              <span
                                className="text-[11px] font-semibold"
                                style={{
                                  color:
                                    a.severity === "high"
                                      ? "oklch(0.40 0.20 25)"
                                      : "oklch(0.42 0.16 85)",
                                }}
                              >
                                {a.role
                                  .replace("buchbinderei", "Buchbinderei")
                                  .replace("logistik", "Logistik")
                                  .replace("projektmanager", "Projektmanager")}
                              </span>
                              <span className="mx-1.5 text-muted-foreground text-[11px]">·</span>
                              <span className="text-[11px] text-muted-foreground">{a.impact}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <KISuggestionsPanel role="produktionsleitung" context={cc.reason} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {missingFreigabe.length > 0 && (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm border"
                style={{
                  backgroundColor: "oklch(0.85 0.17 85 / 0.08)",
                  borderColor: "oklch(0.78 0.18 85 / 0.25)",
                }}
              >
                <AlertTriangle
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "oklch(0.52 0.17 85)" }}
                />
                <span className="font-semibold" style={{ color: "oklch(0.40 0.16 85)" }}>
                  {missingFreigabe.length}× Druckfreigabe fehlt:
                </span>
                <span className="text-muted-foreground">
                  {missingFreigabe.map((j) => j.customer).join(" · ")}
                </span>
              </div>
            )}
          </div>

          {/* ── Machine Cards — 4 columns horizontal ── */}
          <div className="grid grid-cols-4 gap-4">
            {ALL_MACHINES.map((machine) => {
              const currentJob = getCurrentJob(machine);
              const nextJob = getNextJob(machine, currentJob?.id);
              const color = MACHINE_META[machine].color;
              const status: "Läuft" | "Bereit" | "Blockiert" = !currentJob
                ? "Bereit"
                : currentJob.cascadeConflict || currentJob.orderStatus === "Blockiert"
                ? "Blockiert"
                : currentJob.orderStatus === "In Produktion"
                ? "Läuft"
                : "Bereit";
              return (
                <MachineKachel
                  key={machine}
                  machine={machine}
                  currentJob={currentJob}
                  nextJob={nextJob}
                  status={status}
                  color={color}
                  onClickCurrent={currentJob ? () => setSelectedJob(currentJob) : undefined}
                  onClickNext={nextJob ? () => setSelectedJob(nextJob) : undefined}
                />
              );
            })}
          </div>

          {/* ── Active Jobs List — card-based ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
                Alle aktiven Aufträge
              </span>
              <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                {activeJobs.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {activeJobs.map((j) => {
                const color = MACHINE_META[j.machine].color;
                const phaseIdx = PHASES.indexOf(j.phase);
                return (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJob(j)}
                    className="card-lift w-full text-left rounded-xl border bg-card p-4 flex items-center gap-4"
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: color,
                      borderColor: j.cascadeConflict
                        ? "oklch(0.65 0.22 25 / 0.22)"
                        : "var(--border)",
                      backgroundColor: j.cascadeConflict
                        ? "oklch(0.65 0.22 25 / 0.03)"
                        : "var(--card)",
                    }}
                  >
                    {/* Machine label */}
                    <div
                      className="shrink-0 text-[10px] font-black uppercase w-8 text-center"
                      style={{ color }}
                    >
                      {j.machine}
                    </div>

                    {/* Customer + job ID */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold truncate">{j.customer}</span>
                        {j.cascadeConflict && (
                          <span className="pulse-chip inline-flex items-center gap-0.5 text-[10px] font-semibold text-destructive shrink-0">
                            <Zap className="h-3 w-3" />
                            Konflikt
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{j.id}</span>
                    </div>

                    {/* Phase progress dots */}
                    <div className="flex items-center gap-1 shrink-0">
                      {PHASES.map((_, i) => (
                        <div
                          key={i}
                          className="h-1.5 w-5 rounded-full"
                          style={{
                            backgroundColor:
                              i < phaseIdx
                                ? "oklch(0.72 0.18 145)"
                                : i === phaseIdx
                                ? j.cascadeConflict ? "oklch(0.50 0.22 25)" : color
                                : "var(--border)",
                          }}
                        />
                      ))}
                    </div>

                    {/* Delivery date */}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono shrink-0">
                      <Clock className="h-3 w-3" />
                      {j.delivery}
                    </div>

                    <ZeitPill status={j.status} />
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {selectedJob && (
        <AuftragDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}

function MachineKachel({
  machine, currentJob, nextJob, status, color, onClickCurrent, onClickNext,
}: {
  machine: Machine;
  currentJob: Job | undefined;
  nextJob: Job | undefined;
  status: "Läuft" | "Bereit" | "Blockiert";
  color: string;
  onClickCurrent?: () => void;
  onClickNext?: () => void;
}) {
  const isBlocked = status === "Blockiert";
  const isRunning = status === "Läuft";
  const livePrint = LIVE_PRINT.find((lp) => lp.machine === machine);

  return (
    <div
      className="rounded-2xl overflow-hidden border flex flex-col"
      style={{
        borderColor: isBlocked ? "oklch(0.65 0.22 25 / 0.28)" : "var(--border)",
        backgroundColor: isBlocked ? "oklch(0.65 0.22 25 / 0.03)" : "var(--card)",
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
    >
      {/* Machine header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <div className="text-2xl font-black leading-none" style={{ color }}>
            {machine}
          </div>
          <div
            className="text-[10px] uppercase tracking-[0.12em] font-semibold mt-0.5"
            style={{
              color: isBlocked
                ? "oklch(0.50 0.22 25)"
                : isRunning
                ? "oklch(0.45 0.18 145)"
                : "var(--muted-foreground)",
            }}
          >
            {status}
          </div>
        </div>
        {/* Status glow dot */}
        <div
          className={`h-3 w-3 rounded-full${isRunning ? " pulse-chip" : ""}`}
          style={{
            backgroundColor: isBlocked
              ? "oklch(0.55 0.22 25)"
              : isRunning
              ? "oklch(0.52 0.20 145)"
              : "oklch(0.72 0.04 240)",
            boxShadow: isRunning
              ? "0 0 0 4px oklch(0.52 0.20 145 / 0.20)"
              : isBlocked
              ? "0 0 0 4px oklch(0.55 0.22 25 / 0.18)"
              : "none",
          }}
        />
      </div>

      {/* Current job */}
      <div className="flex-1 px-3 pb-3">
        {currentJob ? (
          <button
            type="button"
            onClick={onClickCurrent}
            className="card-lift w-full text-left rounded-xl p-3 transition"
            style={{
              backgroundColor: isBlocked
                ? "oklch(0.65 0.22 25 / 0.08)"
                : `color-mix(in oklab, ${color} 8%, var(--background))`,
              border: `1px solid ${
                isBlocked
                  ? "oklch(0.65 0.22 25 / 0.20)"
                  : `color-mix(in oklab, ${color} 18%, var(--border))`
              }`,
            }}
          >
            <div
              className="text-[9px] uppercase tracking-[0.14em] font-semibold mb-1"
              style={{ color: isBlocked ? "oklch(0.50 0.22 25)" : color }}
            >
              Jetzt
            </div>
            <div className="text-sm font-bold leading-tight mb-2">{currentJob.customer}</div>

            {/* Progress bar for running jobs */}
            {isRunning && livePrint && (
              <>
                <div className="h-1.5 rounded-full bg-border overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full shimmer-bar"
                    style={{ width: `${livePrint.progress}%`, backgroundColor: color }}
                  />
                </div>
                <div className="text-[9px] text-muted-foreground font-mono">
                  ~{livePrint.finishInMin} min
                </div>
              </>
            )}

            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                style={{
                  backgroundColor: isBlocked
                    ? "oklch(0.65 0.22 25 / 0.15)"
                    : `color-mix(in oklab, ${color} 15%, white)`,
                  color: isBlocked ? "oklch(0.40 0.20 25)" : color,
                }}
              >
                {currentJob.phase}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">{currentJob.delivery}</span>
            </div>
          </button>
        ) : (
          <div className="rounded-xl p-3 border border-dashed border-border">
            <div className="text-[9px] uppercase tracking-wide font-semibold text-muted-foreground mb-1">
              Jetzt
            </div>
            <div className="text-xs text-muted-foreground">Kein Auftrag</div>
          </div>
        )}
      </div>

      {/* Next job */}
      {nextJob && (
        <button
          type="button"
          onClick={onClickNext}
          className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-muted/30 hover:bg-muted/50 transition text-left"
        >
          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[8px] uppercase tracking-wide font-semibold text-muted-foreground">
              Nächster
            </div>
            <div className="text-[11px] font-semibold truncate">{nextJob.customer}</div>
          </div>
          <div className="text-[9px] font-mono text-muted-foreground shrink-0">{nextJob.delivery}</div>
        </button>
      )}
    </div>
  );
}

function AuftragDrawer({ job, onClose }: { job: Job; onClose: () => void }) {
  const meta = MACHINE_META[job.machine];
  const currentIdx = PHASES.indexOf(job.phase);

  return (
    <>
      <div className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-110 bg-card drawer-panel z-50 overflow-y-auto flex flex-col">
        <div
          className="px-7 pt-7 pb-5 border-b border-border"
          style={{ borderTopWidth: 3, borderTopColor: meta.color }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1 font-mono">
                {job.id}
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{job.customer}</h2>
              {job.product && (
                <div className="text-sm text-muted-foreground mt-0.5">{job.product}</div>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-muted transition text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs font-semibold" style={{ color: meta.color }}>
              {job.machine}
            </span>
            <ZeitPill status={job.status} />
            <span className="text-[10px] rounded-full px-2 py-0.5 font-medium bg-muted text-muted-foreground">
              {job.orderStatus}
            </span>
            {job.problem && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {job.problem}
              </span>
            )}
          </div>
        </div>

        <div className="px-7 py-5 border-b border-border">
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-3">
            Produktionsfortschritt
          </div>
          <div className="flex items-center gap-2">
            {PHASES.map((p, i) => {
              const isCurrent = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <div key={p} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="h-2 w-full rounded-full"
                    style={{
                      backgroundColor: isCurrent
                        ? meta.color
                        : isDone
                        ? "oklch(0.72 0.18 145)"
                        : "var(--border)",
                    }}
                  />
                  <span
                    className={`text-[9px] text-center font-medium ${
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {p}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-7 py-5 space-y-5 flex-1">
          <Section icon={<Clock className="h-3.5 w-3.5" />} title="Termin & Versand">
            <Row label="Liefertermin" value={job.delivery} mono />
            {job.versandfertigAb && (
              <Row label="Versandfertig ab" value={job.versandfertigAb} mono />
            )}
            {job.city && <Row label="Empfänger" value={job.city} />}
            {job.shipStatus && (
              <Row
                label="Versandstatus"
                value={
                  <span
                    className={`text-xs font-medium flex items-center gap-1 ${
                      job.shipStatus === "Versendet"
                        ? "text-[oklch(0.45_0.18_145)]"
                        : job.shipStatus === "Gebucht"
                        ? "text-machine-rzk"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Truck className="h-3 w-3" />
                    {job.shipStatus}
                  </span>
                }
              />
            )}
            {job.druckfreigabe && (
              <Row
                label="Druckfreigabe"
                value={
                  <span
                    className={`text-xs font-semibold ${
                      job.druckfreigabe === "Erteilt"
                        ? "text-[oklch(0.45_0.18_145)]"
                        : job.druckfreigabe === "Fehlt"
                        ? "text-destructive"
                        : "text-machine-cd"
                    }`}
                  >
                    {job.druckfreigabe}
                  </span>
                }
              />
            )}
          </Section>

          <Section icon={<Layers className="h-3.5 w-3.5" />} title="Druckdetails">
            {job.paper && <Row label="Papier" value={job.paper} />}
            {job.quantity && <Row label="Auflage" value={job.quantity} mono />}
            {job.instructions && <Row label="Spezifikation" value={job.instructions} />}
          </Section>

          {job.finishing && (
            <Section icon={<Package className="h-3.5 w-3.5" />} title="Weiterverarbeitung">
              <Row label="Verfahren" value={job.finishing} />
              {job.finishingHours && (
                <Row label="Aufwand" value={`ca. ${job.finishingHours}h`} mono />
              )}
            </Section>
          )}

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

function Section({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-2.5">
        {icon}
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  label, value, mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`text-right ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}
