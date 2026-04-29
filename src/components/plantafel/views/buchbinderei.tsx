import { JOBS, LIVE_PRINT, MACHINE_META } from "@/lib/mock-data";
import { StatusGlowDot, MachineBadge } from "../dots";
import { Play, BellRing, Printer, Clock } from "lucide-react";

const COLS = [
  { day: 0, label: "Heute" },
  { day: 1, label: "Morgen" },
  { day: 2, label: "Übermorgen" },
];

export function BuchbindereiView() {
  const bereit = JOBS.filter((j) => j.wvStatus === "Bereit für WV").length;

  return (
    <div className="relative p-8 space-y-8 fade-swap">
      {/* Header */}
      <header>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Buchbinderei · Weiterverarbeitung
        </div>
        <h1 className="editorial-header text-4xl">Was kommt heute auf dich zu?</h1>
      </header>

      {bereit > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-[oklch(0.72_0.18_145/0.10)] border border-[oklch(0.72_0.18_145/0.3)] px-5 py-3.5">
          <BellRing className="h-4 w-4 text-[oklch(0.45_0.18_145)]" />
          <span className="text-sm font-semibold text-[oklch(0.40_0.18_145)]">
            {bereit} Aufträge bereit für Weiterverarbeitung
          </span>
        </div>
      )}

      {/* ============== IM DRUCK — LIVE STATUS ============== */}
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
          {LIVE_PRINT.map((p) => {
            const color = MACHINE_META[p.machine].color;
            const almostDone = p.progress >= 90;
            return (
              <div
                key={p.id}
                className={`relative soft-card p-5 transition ${
                  almostDone ? "ring-2 ring-[oklch(0.72_0.18_145/0.4)] shadow-[0_0_24px_oklch(0.72_0.18_145/0.2)]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground">{p.id}</div>
                    <div className="font-semibold text-base truncate">{p.customer}</div>
                  </div>
                  <MachineBadge machine={p.machine} />
                </div>

                {/* progress bar */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="kpi-numeral text-2xl" style={{ color }}>{p.progress}%</span>
                    <span className="text-[11px] text-muted-foreground">
                      Fertig in ~{p.finishInMin} Min
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: `color-mix(in oklab, ${color} 14%, white)` }}
                  >
                    <div
                      className="print-shimmer h-full rounded-full transition-all"
                      style={{
                        width: `${p.progress}%`,
                        background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color} 70%, white))`,
                        boxShadow: `0 0 12px color-mix(in oklab, ${color} 60%, transparent)`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Bereit für WV in ca. ~{p.wvInHours}h
                  </span>
                  {almostDone && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.72_0.18_145/0.15)] px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.40_0.18_145)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.18_145)] glow-green" />
                      Fast fertig
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============== WV-Spalten ============== */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-1.5">
          Weiterverarbeitung
        </div>
        <h2 className="editorial-header text-2xl mb-5">Drei-Tage-Plan</h2>

        <div className="grid grid-cols-3 gap-5">
          {COLS.map((c) => {
            const jobs = JOBS.filter((j) => j.wvDay === c.day);
            return (
              <div key={c.day} className="soft-card soft-card-lg p-5 min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-base font-semibold">{c.label}</div>
                  <span className="kpi-numeral text-xl text-muted-foreground">{jobs.length}</span>
                </div>
                <div className="space-y-2.5">
                  {jobs.map((j) => {
                    const ready = j.wvStatus === "Bereit für WV";
                    const dot = j.wvStatus === "Bereit für WV" ? "green" : j.wvStatus === "Druck läuft" ? "yellow" : "red";
                    return (
                      <div
                        key={j.id}
                        className={`rounded-2xl border bg-card p-3.5 transition ${
                          ready ? "border-[oklch(0.72_0.18_145/0.4)] shadow-[0_0_18px_oklch(0.72_0.18_145/0.18)]" : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] text-muted-foreground">{j.id}</div>
                            <div className="font-semibold text-sm truncate">{j.customer}</div>
                          </div>
                          <MachineBadge machine={j.machine} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-medium">{j.finishing}</span>
                          <span className="text-muted-foreground">~{j.finishingHours}h</span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-[11px]">
                            <StatusGlowDot kind={dot as "green" | "yellow" | "red"} />
                            {j.wvStatus}
                          </span>
                          {ready && (
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
