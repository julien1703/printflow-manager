import { JOBS } from "@/lib/mock-data";
import { StatusGlowDot, MachineBadge } from "../dots";
import { Play, BellRing } from "lucide-react";

const COLS = [
  { day: 0, label: "Heute" },
  { day: 1, label: "Morgen" },
  { day: 2, label: "Übermorgen" },
];

export function BuchbindereiView() {
  const bereit = JOBS.filter((j) => j.wvStatus === "Bereit für WV").length;

  return (
    <div className="p-6 space-y-5 fade-swap">
      {bereit > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-[oklch(0.72_0.18_145/0.12)] border border-[oklch(0.72_0.18_145/0.3)] px-4 py-3">
          <BellRing className="h-4 w-4 text-[oklch(0.45_0.18_145)]" />
          <span className="text-sm font-semibold text-[oklch(0.40_0.18_145)]">
            {bereit} Aufträge bereit für Weiterverarbeitung
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {COLS.map((c) => {
          const jobs = JOBS.filter((j) => j.wvDay === c.day);
          return (
            <div key={c.day} className="rounded-xl bg-card border border-border shadow-sm p-4 min-h-[400px]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">{c.label}</div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{jobs.length}</span>
              </div>
              <div className="space-y-2.5">
                {jobs.map((j) => {
                  const ready = j.wvStatus === "Bereit für WV";
                  const dot = j.wvStatus === "Bereit für WV" ? "green" : j.wvStatus === "Druck läuft" ? "yellow" : "red";
                  return (
                    <div
                      key={j.id}
                      className={`rounded-lg border bg-card p-3 transition ${
                        ready ? "border-[oklch(0.72_0.18_145/0.4)] shadow-[0_0_18px_oklch(0.72_0.18_145/0.18)]" : "border-border shadow-sm"
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
                          <button className="inline-flex items-center gap-1 rounded-md bg-[oklch(0.55_0.18_145)] text-white text-xs font-medium px-2.5 py-1 hover:opacity-90">
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
    </div>
  );
}
