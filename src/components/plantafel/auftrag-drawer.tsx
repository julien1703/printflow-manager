import { type Job } from "@/lib/mock-data";
import { ZeitPill } from "@/components/plantafel/zeit-pill";
import { JobBadges } from "@/components/plantafel/job-badges";
import { PHASES, MACHINE_META } from "@/lib/mock-data";
import {
  AlertTriangle, Clock, Package, Layers, FileText,
  Truck, X, Settings,
} from "lucide-react";

export interface AuftragDrawerProps {
  job: Job;
  onClose: () => void;
  onToggleFestgepinnt?: () => void;
  onPrioritaetChange?: (p: "normal" | "eilig" | "express") => void;
  onNotizChange?: (text: string) => void;
}

export function AuftragDrawer({
  job,
  onClose,
  onToggleFestgepinnt,
  onPrioritaetChange,
  onNotizChange,
}: AuftragDrawerProps) {
  const meta = MACHINE_META[job.machine];
  const currentIdx = PHASES.indexOf(job.phase);

  return (
    <>
      <div className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-110 bg-card drawer-panel z-50 overflow-y-auto flex flex-col">
        {/* Header */}
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
          <JobBadges job={job} onToggleFestgepinnt={onToggleFestgepinnt} />
        </div>

        {/* Produktionsfortschritt */}
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
          {/* Termin & Versand */}
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

          {/* Druckdetails — extended */}
          <Section icon={<Layers className="h-3.5 w-3.5" />} title="Druckdetails">
            {job.paper && <Row label="Papier" value={job.paper} />}
            {job.auflage !== undefined && (
              <Row label="Auflage" value={`${job.auflage.toLocaleString("de-DE")} Stk.`} mono />
            )}
            {job.quantity && !job.auflage && <Row label="Auflage" value={job.quantity} mono />}
            {job.seitenanzahl !== undefined && job.seitenanzahl !== null && (
              <Row label="Seitenanzahl" value={`${job.seitenanzahl} Seiten`} mono />
            )}
            {job.grammatur !== undefined && (
              <Row label="Grammatur" value={`${job.grammatur} g/m²`} mono />
            )}
            {job.druckzeitStunden !== undefined && (
              <Row label="Druckzeit" value={`~${job.druckzeitStunden} h`} mono />
            )}
            {job.druckdatenEingang !== undefined && (
              <Row
                label="Druckdaten-Eingang"
                value={
                  job.druckdatenEingang ? (
                    <span>{job.druckdatenEingang}</span>
                  ) : (
                    <span style={{ color: "oklch(0.50 0.20 25)", fontWeight: 600 }}>
                      Noch nicht eingegangen
                    </span>
                  )
                }
              />
            )}
            {job.dispersionslack !== undefined && (
              <Row
                label="Dispersionslack"
                value={
                  job.dispersionslack ? (
                    <span style={{ color: "oklch(0.38 0.14 153)" }}>
                      Ja — Lackwerk-Reinigung ~1.5h einplanen
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Nein</span>
                  )
                }
              />
            )}
            {job.sonderfarbe && (
              <Row
                label="Sonderfarbe"
                value={
                  <span className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                    <span>{job.sonderfarbe}</span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{
                        background: "oklch(0.93 0.12 50 / 0.25)",
                        color: "oklch(0.50 0.18 50)",
                      }}
                    >
                      Lagerbestand prüfen
                    </span>
                  </span>
                }
              />
            )}
          </Section>

          {/* Weiterverarbeitung — extended */}
          {(job.finishing || job.weiterverarbeitungStunden !== undefined) && (
            <Section icon={<Package className="h-3.5 w-3.5" />} title="Weiterverarbeitung">
              {job.finishing && <Row label="Verfahren" value={job.finishing} />}
              {job.finishingHours !== undefined && (
                <Row label="Finishingzeit" value={`ca. ${job.finishingHours}h`} mono />
              )}
              {job.weiterverarbeitungStunden !== undefined && (
                <Row
                  label="WV-Stunden gesamt"
                  value={`${job.weiterverarbeitungStunden}h`}
                  mono
                />
              )}
              {(job.paper?.toLowerCase().includes("metallic") || !!job.sonderfarbe) && (
                <div
                  className="mt-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium"
                  style={{
                    background: "oklch(0.95 0.08 60 / 0.4)",
                    color: "oklch(0.50 0.16 55)",
                  }}
                >
                  ⏱ 2 Tage Trocknungszeit beachten
                </div>
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

          {/* Planung — new */}
          <Section icon={<Settings className="h-3.5 w-3.5" />} title="Planung">
            {onToggleFestgepinnt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Festgepinnt</span>
                <button
                  type="button"
                  onClick={onToggleFestgepinnt}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    job.festgepinnt
                      ? "bg-[oklch(0.92_0.08_280)] text-[oklch(0.35_0.20_280)]"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {job.festgepinnt ? "🔒 Gepinnt" : "Pinnen"}
                </button>
              </div>
            )}
            {onPrioritaetChange && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Priorität</span>
                <div className="flex gap-1">
                  {(["normal", "eilig", "express"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onPrioritaetChange(p)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition capitalize ${
                        job.prioritaet === p
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {onNotizChange !== undefined && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Notiz
                </span>
                <textarea
                  className="w-full rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-border"
                  rows={3}
                  placeholder="Interne Notiz..."
                  value={job.notiz ?? ""}
                  onChange={(e) => onNotizChange(e.target.value)}
                />
              </div>
            )}
          </Section>

          {/* Kaskadenwarnung — new */}
          {job.cascadeConflict && (
            <Section icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Kaskadenwarnung">
              <div
                className="rounded-lg p-3 text-xs space-y-1"
                style={{
                  background: "oklch(0.95 0.05 25)",
                  border: "1px solid oklch(0.85 0.10 25)",
                }}
              >
                <div className="font-semibold" style={{ color: "oklch(0.45 0.18 25)" }}>
                  Folgeaufträge betroffen
                </div>
                <div className="text-muted-foreground leading-relaxed">
                  Dieser Auftrag hat Verzögerungen, die nachfolgende Produktionsschritte
                  blockieren können. Weiterverarbeitung und Versand bitte prüfen.
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

export function Section({
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

export function Row({
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
