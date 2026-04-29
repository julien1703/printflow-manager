import { JOBS } from "@/lib/mock-data";
import { MachineBadge } from "../dots";
import { AlertTriangle } from "lucide-react";

export function LogistikView() {
  const sorted = [...JOBS].sort((a, b) => a.delivery.localeCompare(b.delivery));
  const urgent = sorted.filter((j) => j.shipUrgency === "high" && j.shipStatus !== "Versendet").length;

  const costMap = {
    low:    { color: "oklch(0.45 0.18 145)", bg: "oklch(0.72 0.18 145 / 0.12)", label: "~200€", note: "Rechtzeitig" },
    medium: { color: "oklch(0.55 0.17 85)",  bg: "oklch(0.85 0.17 85 / 0.18)",  label: "~350€", note: "Zeitnah" },
    high:   { color: "oklch(0.50 0.22 25)",  bg: "oklch(0.65 0.22 25 / 0.15)",  label: "~600€+", note: "Express" },
  } as const;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Offen: "bg-muted text-muted-foreground",
      Gebucht: "bg-[oklch(0.70_0.14_240/0.15)] text-[oklch(0.45_0.18_245)]",
      Versendet: "bg-[oklch(0.72_0.18_145/0.15)] text-[oklch(0.45_0.18_145)]",
    };
    return map[s] || "";
  };

  return (
    <div className="p-8 space-y-6 fade-swap">
      <header>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Logistik & Versand
        </div>
        <h1 className="editorial-header text-4xl">Versand-Übersicht</h1>
      </header>
      {urgent > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-[oklch(0.65_0.22_25/0.10)] border border-[oklch(0.65_0.22_25/0.35)] px-5 py-3.5 pulse-border-red">
          <AlertTriangle className="h-4 w-4 text-[oklch(0.55_0.22_25)]" />
          <span className="text-sm font-semibold text-[oklch(0.45_0.22_25)]">
            ⚠ {urgent} Aufträge benötigen sofortige Buchung!
          </span>
        </div>
      )}

      <div className="soft-card soft-card-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Kunde / Auftrag</th>
              <th className="text-left font-semibold px-4 py-3">Maschine</th>
              <th className="text-left font-semibold px-4 py-3">Adresse</th>
              <th className="text-left font-semibold px-4 py-3">Versandfertig ab</th>
              <th className="text-left font-semibold px-4 py-3">Lieferdatum</th>
              <th className="text-left font-semibold px-4 py-3">Transport</th>
              <th className="text-left font-semibold px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((j) => {
              const c = costMap[j.shipUrgency!];
              return (
                <tr key={j.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{j.customer}</div>
                    <div className="text-[11px] text-muted-foreground">{j.id}</div>
                  </td>
                  <td className="px-4 py-3"><MachineBadge machine={j.machine} /></td>
                  <td className="px-4 py-3">{j.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">{j.versandfertigAb}</td>
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
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${statusBadge(j.shipStatus!)}`}>
                      {j.shipStatus}
                    </span>
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
