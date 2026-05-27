import { useState, useEffect } from "react";
import { JOBS, LIVE_PRINT, MACHINE_META, CASCADE_CONFLICTS } from "@/lib/mock-data";
import { StatusGlowDot, MachineBadge } from "../dots";
import { Play, BellRing, Printer, Clock, Zap } from "lucide-react";
import { FinishingBadge, FinishingType } from "../finishing-badge";

const COLS = [
  { day: 0, label: "Heute" },
  { day: 1, label: "Morgen" },
  { day: 2, label: "Übermorgen" },
];

function needsTrocknungshinweis(job: import("@/lib/mock-data").Job): boolean {
  const paperLower = (job.paper ?? "").toLowerCase();
  const hasMetallic = paperLower.includes("metall");
  const hasUngestrichenMitSonderfarbe =
    (paperLower.includes("offset") ||
      paperLower.includes("natur") ||
      paperLower.includes("recycling")) &&
    !!job.sonderfarbe;
  return hasMetallic || hasUngestrichenMitSonderfarbe;
}

export function BuchbindereiView() {
  const bereit = JOBS.filter((j) => j.wvStatus === "Bereit für WV").length;
  const myCascade = CASCADE_CONFLICTS.filter((cc) =>
    cc.affected.some((a) => a.role === "buchbinderei")
  );

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative p-8 space-y-6 fade-swap">
      {/* Header */}
      <header>
        <h1 className="editorial-header text-4xl">Was kommt heute auf dich zu?</h1>
      </header>

      {/* Cascade conflict warning */}
      {myCascade.map((cc) => {
        const myImpact = cc.affected.find((a) => a.role === "buchbinderei")!;
        return (
          <div
            key={cc.triggerId}
            className="flex items-start gap-3 rounded-2xl px-5 py-4 border"
            style={{ backgroundColor: "oklch(0.65 0.22 25 / 0.07)", borderColor: "oklch(0.65 0.22 25 / 0.30)" }}
          >
            <Zap className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
            <div>
              <div className="text-sm font-semibold mb-0.5" style={{ color: "oklch(0.38 0.20 25)" }}>
                Planänderung: {cc.triggerCustomer} — {cc.reason}
              </div>
              <div className="text-xs text-muted-foreground">{myImpact.impact}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-3 py-1 text-[11px] font-semibold text-destructive">
                  ● Handlungsbedarf
                </span>
                <span className="text-[11px] text-muted-foreground">· {cc.since}</span>
              </div>
            </div>
          </div>
        );
      })}

      {bereit > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-[oklch(0.72_0.18_145/0.10)] border border-[oklch(0.72_0.18_145/0.3)] px-5 py-3.5">
          <BellRing className="h-4 w-4 text-[oklch(0.45_0.18_145)]" />
          <span className="text-sm font-semibold text-[oklch(0.40_0.18_145)]">
            {bereit} Aufträge bereit für Weiterverarbeitung
          </span>
        </div>
      )}

      {/* Im Druck — Live Status */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1.5 flex items-center gap-2">
              <Printer className="h-3 w-3" />
              Im Druck — Live Status
            </div>
            <h2 className="editorial-header text-2xl">Was läuft gerade auf den Maschinen</h2>
          </div>
          <span className="kpi-numeral text-3xl text-foreground/80">{LIVE_PRINT.length}</span>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {LIVE_PRINT.map((lp) => {
            const color = MACHINE_META[lp.machine].color;
            const almostDone = lp.progress >= 90;
            const isCascade = lp.cascadeWarning;

            const remaining = Math.max(0, lp.finishInMin * 60 - tick);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            const timeStr = remaining > 0 ? `${mins}:${secs.toString().padStart(2, "0")} verbleibend` : "Fertig!";

            return (
              <div
                key={lp.id}
                className={`relative soft-card p-5 transition ${
                  almostDone ? "ring-2 ring-[oklch(0.72_0.18_145/0.4)] shadow-[0_0_24px_oklch(0.72_0.18_145/0.2)]" : ""
                } ${isCascade ? "ring-2 ring-[oklch(0.65_0.22_25/0.5)] animate-pulse" : ""}`}
              >
                {isCascade && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      <Zap className="h-2.5 w-2.5" />Konflikt
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground">{lp.id}</div>
                    <div className="font-semibold text-base truncate">{lp.customer}</div>
                  </div>
                  <MachineBadge machine={lp.machine} />
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="kpi-numeral text-2xl" style={{ color }}>{lp.progress}%</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {timeStr}
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: `color-mix(in oklab, ${color} 14%, white)` }}
                  >
                    <div
                      className="print-shimmer h-full rounded-full transition-all"
                      style={{
                        width: `${lp.progress}%`,
                        background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 70%, white))`,
                        boxShadow: `0 0 12px color-mix(in oklab, ${color} 60%, transparent)`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    WV bereit in ~{lp.wvInHours}h
                  </span>
                  {almostDone && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.72_0.18_145/0.15)] px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.40_0.18_145)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.18_145)] glow-green" />
                      Gleich fertig!
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mein Tagesplan */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1.5">
          Weiterverarbeitung
        </div>
        <h2 className="editorial-header text-2xl mb-5">Mein Tagesplan</h2>

        <div className="grid grid-cols-3 gap-5">
          {COLS.map((c) => {
            const jobs = JOBS.filter((j) => j.wvDay === c.day && j.finishing);
            const totalHours = jobs.reduce((sum, j) => sum + (j.finishingHours ?? 0), 0);
            const overCapacity = totalHours > 8;
            return (
              <div key={c.day} className="soft-card soft-card-lg p-5 min-h-[380px]">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-base font-semibold">{c.label}</div>
                  <span className="kpi-numeral text-xl text-muted-foreground">{jobs.length}</span>
                </div>
                <div className="mb-4">
                  <span className={overCapacity ? "text-destructive font-semibold text-[11px]" : "text-muted-foreground text-[11px]"}>
                    {totalHours}h {overCapacity ? "⚠ Überkapazität!" : ""}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {jobs.map((j) => {
                    const ready = j.wvStatus === "Bereit für WV";
                    const isCascade = j.cascadeConflict;
                    const dot = ready ? "green" : j.wvStatus === "Druck läuft" ? "yellow" : "red";
                    return (
                      <div
                        key={j.id}
                        className={`rounded-2xl border bg-card p-3.5 transition ${
                          ready && !isCascade ? "border-[oklch(0.72_0.18_145/0.4)] shadow-[0_0_18px_oklch(0.72_0.18_145/0.18)]" :
                          isCascade ? "border-destructive/30 bg-[oklch(0.65_0.22_25/0.04)]" :
                          "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] text-muted-foreground">{j.id}</div>
                            <div className="font-semibold text-sm truncate">{j.customer}</div>
                            {needsTrocknungshinweis(j) && (
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold mt-1"
                                style={{
                                  backgroundColor: "oklch(0.72 0.18 55 / 0.14)",
                                  color: "oklch(0.42 0.18 55)",
                                  border: "1px solid oklch(0.65 0.18 55 / 0.30)",
                                }}
                              >
                                2T Trocknung
                              </span>
                            )}
                          </div>
                          <MachineBadge machine={j.machine} />
                        </div>
                        {isCascade && (
                          <div className="mt-1.5 text-[10px] font-semibold text-destructive flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5" />
                            Zeitplan verschoben ({j.cascadeDelay})
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          {j.finishing ? <FinishingBadge type={j.finishing as FinishingType} /> : <span />}
                          <span className="text-muted-foreground">~{j.finishingHours}h</span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[11px]">
                            <StatusGlowDot kind={isCascade ? "red" : (dot as "green" | "yellow" | "red")} />
                            {isCascade ? "Verzögert" : j.wvStatus}
                          </span>
                          {ready && !isCascade && (
                            <button className="inline-flex items-center gap-1 rounded-xl bg-[oklch(0.55_0.18_145)] text-white text-xs font-medium px-3 py-1.5 hover:opacity-90">
                              <Play className="h-3 w-3" />Starten
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {jobs.length === 0 && (
                    <div className="text-xs text-muted-foreground italic py-8 text-center">Keine Aufträge</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
