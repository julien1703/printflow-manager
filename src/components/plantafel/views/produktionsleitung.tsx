import { useState } from "react";
import {
  JOBS, MACHINE_META, PHASES, CASCADE_CONFLICTS,
  type Job, type Machine,
} from "@/lib/mock-data";
import { ZeitPill } from "../zeit-pill";
import { MachineBadge } from "../dots";
import {
  AlertTriangle, Zap, Clock, Package, Layers, FileText,
  Truck, X, ChevronRight, TrendingDown,
} from "lucide-react";

const ALL_MACHINES: Machine[] = ["CD", "RZK", "SM5", "Digi"];

function getCurrentJob(machine: Machine): Job | undefined {
  return (
    JOBS.find(
      (j) =>
        j.machine === machine &&
        (j.orderStatus === "In Produktion" || j.orderStatus === "Blockiert")
    ) ??
    JOBS.find(
      (j) =>
        j.machine === machine &&
        j.orderStatus !== "Abgeschlossen" &&
        j.orderStatus !== "Storniert"
    )
  );
}

function getMachineStatus(machine: Machine): "Läuft" | "Bereit" | "Blockiert" {
  const job = JOBS.find(
    (j) =>
      j.machine === machine &&
      j.orderStatus !== "Abgeschlossen" &&
      j.orderStatus !== "Storniert"
  );
  if (!job) return "Bereit";
  if (job.cascadeConflict || job.orderStatus === "Blockiert") return "Blockiert";
  if (job.orderStatus === "In Produktion") return "Läuft";
  return "Bereit";
}

export function ProduktionsleitungView() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const activeJobs = JOBS.filter(
    (j) => j.orderStatus !== "Abgeschlossen" && j.orderStatus !== "Storniert"
  ).sort((a, b) => {
    const d = (s: string) => parseInt(s.split(".")[0]);
    return d(a.delivery) - d(b.delivery);
  });

  const missingFreigabe = JOBS.filter(
    (j) => j.druckfreigabe === "Fehlt" && j.orderStatus !== "Abgeschlossen"
  );

  return (
    <div className="relative">
      <div className="p-8 space-y-6 fade-swap">

        {/* Header */}
        <header>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
            Produktionsleitung · G. Maisch
          </div>
          <h1 className="editorial-header text-4xl">Übersicht</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            KW 20 · Montag, 20. Mai 2026
          </p>
        </header>

        {/* Compact alerts */}
        {CASCADE_CONFLICTS.map((cc) => (
          <div
            key={cc.triggerId}
            className="flex items-start gap-3 rounded-2xl px-5 py-3.5 border"
            style={{
              backgroundColor: "oklch(0.65 0.22 25 / 0.05)",
              borderColor: "oklch(0.65 0.22 25 / 0.35)",
            }}
          >
            <Zap className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold" style={{ color: "oklch(0.38 0.20 25)" }}>
                Kaskaden-Konflikt: {cc.triggerCustomer}
              </span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{cc.reason}</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cc.affected.map((a) => (
                  <span
                    key={a.role}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      backgroundColor:
                        a.severity === "high"
                          ? "oklch(0.65 0.22 25 / 0.12)"
                          : "oklch(0.85 0.17 85 / 0.15)",
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
            </div>
          </div>
        ))}

        {missingFreigabe.length > 0 && (
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3 border"
            style={{
              backgroundColor: "oklch(0.85 0.17 85 / 0.10)",
              borderColor: "oklch(0.78 0.18 85 / 0.35)",
            }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "oklch(0.52 0.17 85)" }} />
            <span className="text-sm font-semibold" style={{ color: "oklch(0.40 0.16 85)" }}>
              {missingFreigabe.length} Auftrag{missingFreigabe.length > 1 ? "e" : ""} ohne Druckfreigabe:
            </span>
            <span className="text-sm text-muted-foreground">
              {missingFreigabe.map((j) => `${j.customer} (${j.id})`).join(" · ")}
            </span>
          </div>
        )}

        {/* Machine tiles — 4 across */}
        <div className="grid grid-cols-4 gap-4">
          {ALL_MACHINES.map((machine) => {
            const job = getCurrentJob(machine);
            const status = getMachineStatus(machine);
            const color = MACHINE_META[machine].color;
            return (
              <MachineKachel
                key={machine}
                machine={machine}
                job={job}
                status={status}
                color={color}
                onClick={job ? () => setSelectedJob(job) : undefined}
              />
            );
          })}
        </div>

        {/* Compact job list */}
        <div className="soft-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground">
              Alle aktiven Aufträge
            </div>
            <div className="text-[11px] text-muted-foreground">{activeJobs.length} Aufträge</div>
          </div>
          <div className="divide-y divide-border">
            {activeJobs.map((j) => {
              const color = MACHINE_META[j.machine].color;
              const phaseIdx = PHASES.indexOf(j.phase);
              return (
                <button
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition group text-left"
                  style={j.cascadeConflict ? { backgroundColor: "oklch(0.65 0.22 25 / 0.03)" } : undefined}
                >
                  <MachineBadge machine={j.machine} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{j.customer}</span>
                      {j.cascadeConflict && (
                        <span className="text-[10px] font-semibold text-destructive shrink-0">⚠ Konflikt</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{j.id}</span>
                  </div>
                  {/* 4-segment progress */}
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
                  <div className="flex items-center gap-1 shrink-0 text-[11px] text-muted-foreground font-mono">
                    <Clock className="h-3 w-3" />
                    {j.delivery}
                  </div>
                  <ZeitPill status={j.status} />
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </button>
              );
            })}
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
  machine, job, status, color, onClick,
}: {
  machine: Machine;
  job: Job | undefined;
  status: "Läuft" | "Bereit" | "Blockiert";
  color: string;
  onClick?: () => void;
}) {
  const isBlocked = status === "Blockiert";
  const isRunning = status === "Läuft";

  return (
    <div
      className={`rounded-2xl border p-5 transition ${onClick ? "cursor-pointer hover:shadow-md hover:translate-y-[-1px]" : ""}`}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: color,
        backgroundColor: isBlocked ? "oklch(0.65 0.22 25 / 0.05)" : "var(--card)",
        borderColor: isBlocked ? "oklch(0.65 0.22 25 / 0.30)" : "var(--border)",
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color }}>
          {machine}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{
            backgroundColor: isBlocked
              ? "oklch(0.65 0.22 25 / 0.12)"
              : isRunning
              ? "oklch(0.72 0.18 145 / 0.15)"
              : "var(--muted)",
            color: isBlocked
              ? "oklch(0.40 0.20 25)"
              : isRunning
              ? "oklch(0.40 0.18 145)"
              : "var(--muted-foreground)",
          }}
        >
          {isBlocked ? "⚠ Blockiert" : isRunning ? "● Läuft" : "○ Bereit"}
        </span>
      </div>
      {job ? (
        <>
          <div className="text-base font-semibold leading-tight truncate">{job.customer}</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: `color-mix(in oklab, ${color} 12%, white)`, color }}
            >
              {job.phase}
            </span>
            {isBlocked && job.problem && (
              <span className="text-[10px] text-destructive truncate">{job.problem.split("—")[0]}</span>
            )}
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Kein aktiver Auftrag</div>
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
      <div className="fixed right-0 top-0 h-full w-[440px] bg-card drawer-panel z-50 overflow-y-auto flex flex-col">
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

        {/* Phase progress */}
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
                        ? "text-[var(--machine-rzk)]"
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
                        : "text-[var(--machine-cd)]"
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
  icon,
  title,
  children,
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
  label,
  value,
  mono,
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
