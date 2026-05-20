import { JOBS, CASCADE_CONFLICTS } from "@/lib/mock-data";
import { MachineBadge } from "../dots";
import { AlertTriangle, Truck, Zap, CheckCircle2 } from "lucide-react";

export function LogistikView() {
  const sorted = [...JOBS]
    .filter((j) => j.orderStatus !== "Storniert")
    .sort((a, b) => a.delivery.localeCompare(b.delivery));

  const todayShipping = sorted.filter(
    (j) => (j.orderStatus === "Versandbereit" || j.versandfertigAb === "18.05.") && j.shipStatus !== "Versendet"
  );
  const urgent = sorted.filter((j) => j.shipUrgency === "high" && j.shipStatus !== "Versendet" && j.shipStatus !== undefined).length;

  const myCascade = CASCADE_CONFLICTS.filter((cc) =>
    cc.affected.some((a) => a.role === "logistik")
  );

  const costMap = {
    low:    { color: "oklch(0.45 0.18 145)", bg: "oklch(0.72 0.18 145 / 0.12)", label: "~200€", note: "Rechtzeitig" },
    medium: { color: "oklch(0.55 0.17 85)",  bg: "oklch(0.85 0.17 85 / 0.18)",  label: "~350€", note: "Zeitnah" },
    high:   { color: "oklch(0.50 0.22 25)",  bg: "oklch(0.65 0.22 25 / 0.15)",  label: "~600€+", note: "Express" },
  } as const;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Offen:     "bg-muted text-muted-foreground",
      Gebucht:   "bg-[oklch(0.70_0.14_240/0.15)] text-[oklch(0.45_0.18_245)]",
      Versendet: "bg-[oklch(0.72_0.18_145/0.15)] text-[oklch(0.45_0.18_145)]",
    };
    return map[s] ?? "";
  };

  return (
    <div className="p-8 space-y-6 fade-swap">
      {/* Header */}
      <header>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Logistik & Versand · A. Batt
        </div>
        <h1 className="editorial-header text-4xl">Versand-Übersicht</h1>
        <div className="mt-3 flex items-center gap-5">
          <KPI value={todayShipping.length} label="Heute versandbereit" tone={todayShipping.length > 0 ? "info" : undefined} />
          <KPI value={urgent} label="Dringend (Express-Risiko)" tone={urgent > 0 ? "warn" : undefined} />
          <KPI value={sorted.filter(j => j.shipStatus === "Gebucht").length} label="Gebucht" />
          <KPI value={sorted.filter(j => j.shipStatus === "Versendet").length} label="Versendet" tone="ok" />
        </div>
      </header>

      {/* Cascade conflict — shipping date at risk */}
      {myCascade.map((cc) => {
        const myImpact = cc.affected.find((a) => a.role === "logistik")!;
        const affectedJob = JOBS.find((j) => j.id === cc.triggerId);
        return (
          <div
            key={cc.triggerId}
            className="flex items-start gap-3 rounded-2xl px-5 py-4 border"
            style={{ backgroundColor: "oklch(0.65 0.22 25 / 0.07)", borderColor: "oklch(0.65 0.22 25 / 0.30)" }}
          >
            <Zap className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "oklch(0.50 0.22 25)" }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold mb-0.5" style={{ color: "oklch(0.38 0.20 25)" }}>
                Versanddatum gefährdet: {cc.triggerCustomer}
              </div>
              <div className="text-xs text-muted-foreground mb-2">{myImpact.impact}</div>
              {affectedJob?.shipStatus === "Gebucht" && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-[11px] font-semibold text-destructive">
                    ● Speditionsbuchung prüfen — ggf. stornieren
                  </span>
                  <span className="text-[11px] text-muted-foreground">{affectedJob.versandfertigAb} · {affectedJob.city}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Urgent alert */}
      {urgent > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-[oklch(0.65_0.22_25/0.10)] border border-[oklch(0.65_0.22_25/0.35)] px-5 py-3.5 pulse-border-red">
          <AlertTriangle className="h-4 w-4 text-[oklch(0.55_0.22_25)]" />
          <span className="text-sm font-semibold text-[oklch(0.45_0.22_25)]">
            {urgent} Aufträge benötigen sofortige Buchung!
          </span>
        </div>
      )}

      {/* Today's shipping — highlight panel */}
      {todayShipping.length > 0 && (
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Heute versandbereit</span>
            <span className="rounded-full bg-[oklch(0.70_0.14_240/0.15)] text-[oklch(0.45_0.18_245)] text-[10px] font-semibold px-2 py-0.5">
              {todayShipping.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {todayShipping.map((j) => (
              <div key={j.id} className="flex-1 min-w-48 rounded-xl border border-border bg-muted/30 p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">{j.customer}</span>
                  <MachineBadge machine={j.machine} />
                </div>
                <div className="text-[11px] text-muted-foreground">{j.id} · {j.city}</div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Lieferung: <span className="font-semibold text-foreground">{j.delivery}</span></span>
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${statusBadge(j.shipStatus!)}`}>
                    {j.shipStatus}
                  </span>
                </div>
                {j.shipStatus === "Offen" && (
                  <button className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-foreground text-background text-xs font-semibold px-3 py-2 hover:opacity-85 transition">
                    <Truck className="h-3 w-3" />Spedition buchen
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full shipping table */}
      <div className="soft-card soft-card-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Kunde / Auftrag</th>
              <th className="text-left font-semibold px-4 py-3">Produktionsstatus</th>
              <th className="text-left font-semibold px-4 py-3">Adresse</th>
              <th className="text-left font-semibold px-4 py-3">Versandfertig ab</th>
              <th className="text-left font-semibold px-4 py-3">Lieferdatum</th>
              <th className="text-left font-semibold px-4 py-3">Transport</th>
              <th className="text-left font-semibold px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.filter((j) => j.versandfertigAb && j.city).map((j) => {
              const c = costMap[j.shipUrgency ?? "low"];
              const isCascade = j.cascadeConflict;
              return (
                <tr
                  key={j.id}
                  className="hover:bg-muted/30 transition"
                  style={isCascade ? { backgroundColor: "oklch(0.65 0.22 25 / 0.04)" } : undefined}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div>
                        <div className="font-semibold">{j.customer}</div>
                        <div className="text-[11px] text-muted-foreground">{j.id}</div>
                      </div>
                      {isCascade && (
                        <Zap className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{j.orderStatus}</span>
                    {isCascade && (
                      <div className="text-[10px] text-destructive font-semibold mt-0.5">+2 Tage verschoben</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{j.city}</td>
                  <td className="px-4 py-3">
                    <span className={isCascade ? "text-destructive font-semibold line-through" : "text-muted-foreground"}>
                      {j.versandfertigAb}
                    </span>
                    {isCascade && <div className="text-destructive font-semibold text-xs">~23.05.</div>}
                  </td>
                  <td className="px-4 py-3 font-medium">{j.delivery}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: c.bg, color: c.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.label}
                      <span className="text-[10px] opacity-70">· {c.note}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {j.orderStatus === "Abgeschlossen" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[oklch(0.45_0.18_145)]">
                        <CheckCircle2 className="h-3 w-3" />Versendet
                      </span>
                    ) : (
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${statusBadge(j.shipStatus ?? "Offen")}`}>
                        {j.shipStatus ?? "Offen"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({ value, label, tone }: { value: number; label: string; tone?: "warn" | "info" | "ok" }) {
  const cls =
    tone === "warn" && value > 0 ? "text-destructive" :
    tone === "info" && value > 0 ? "text-[oklch(0.45_0.18_245)]" :
    tone === "ok"   && value > 0 ? "text-[oklch(0.45_0.18_145)]" :
    "text-foreground";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-base font-semibold tabular-nums ${cls}`}>{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
