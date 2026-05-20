import { GF_KPIS, JOBS, CASCADE_CONFLICTS } from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, AlertTriangle, Package, CheckCircle2 } from "lucide-react";

const MACHINE_COLORS: Record<string, string> = {
  CD:   "oklch(0.65 0.21 48)",
  RZK:  "oklch(0.55 0.22 258)",
  SM5:  "oklch(0.60 0.20 145)",
  Digi: "oklch(0.65 0.19 320)",
};

const PIE_DATA = Object.entries(GF_KPIS.maschinenauslastung).map(([machine, value]) => ({
  name: machine,
  value,
  color: MACHINE_COLORS[machine],
}));

export function GeschaeftsfuehrungView() {
  const activeOrders = JOBS.filter((j) => j.orderStatus !== "Abgeschlossen" && j.orderStatus !== "Storniert");
  const completedThisWeek = JOBS.filter((j) => j.orderStatus === "Abgeschlossen").length;
  const atRisk = JOBS.filter((j) => j.status === "Hinterher" || j.cascadeConflict).length;

  return (
    <div className="p-8 space-y-8 fade-swap">
      {/* Header */}
      <header>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Geschäftsführung · R. Pfitzer
        </div>
        <h1 className="editorial-header text-4xl">Betriebsübersicht</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          KW 20 · 18. – 22. Mai 2026
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={<Package className="h-5 w-5" />}
          label="Aktive Aufträge"
          value={String(activeOrders.length)}
          sub={`${completedThisWeek} diese Woche abgeschlossen`}
          tone="neutral"
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Pünktlichkeitsrate"
          value={`${GF_KPIS.puenktlichkeitsrate}%`}
          sub="letzte 4 Wochen"
          tone={GF_KPIS.puenktlichkeitsrate >= 85 ? "ok" : GF_KPIS.puenktlichkeitsrate >= 70 ? "warn" : "critical"}
        />
        <KpiCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Offene Konflikte"
          value={String(GF_KPIS.offeneKonflikte + CASCADE_CONFLICTS.length)}
          sub={`${CASCADE_CONFLICTS.length} Kaskadenkonflikt${CASCADE_CONFLICTS.length !== 1 ? "e" : ""}`}
          tone={GF_KPIS.offeneKonflikte > 0 ? "warn" : "ok"}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Aufträge gefährdet"
          value={String(atRisk)}
          sub="Verzögert oder blockiert"
          tone={atRisk > 2 ? "critical" : atRisk > 0 ? "warn" : "ok"}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weekly volume bar chart */}
        <div className="soft-card p-6">
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-1">
            Auftragsvolumen
          </div>
          <div className="text-lg font-semibold mb-5">Letzte 4 Kalenderwochen</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={GF_KPIS.wochenChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0.003 80)" vertical={false} />
              <XAxis
                dataKey="woche"
                tick={{ fontSize: 11, fill: "oklch(0.50 0.006 255)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "oklch(0.50 0.006 255)" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid oklch(0.88 0.003 80)",
                  fontSize: 12,
                  background: "white",
                }}
                cursor={{ fill: "oklch(0.95 0.003 80)" }}
              />
              <Bar dataKey="auftraege" name="Aufträge gesamt" fill="oklch(0.22 0.008 255)" radius={[5, 5, 0, 0]} />
              <Bar dataKey="puenktlich" name="Pünktlich" fill="oklch(0.72 0.18 145)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-[oklch(0.22_0.008_255)]" />Aufträge gesamt
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-[oklch(0.72_0.18_145)]" />Pünktlich
            </span>
          </div>
        </div>

        {/* Machine utilization donut */}
        <div className="soft-card p-6">
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-1">
            Maschinenauslastung
          </div>
          <div className="text-lg font-semibold mb-3">Aktuelle Woche</div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {PIE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {PIE_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="font-medium">{d.name}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border text-[11px] text-muted-foreground">
            SM5 aktuell eingeschränkt — Maschinenstörung (Rossmann GmbH)
          </div>
        </div>
      </div>

      {/* Order status breakdown */}
      <div className="soft-card p-6">
        <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground mb-1">
          Auftragsverteilung
        </div>
        <div className="text-lg font-semibold mb-5">Status aller laufenden Aufträge</div>
        <StatusBreakdown />
      </div>
    </div>
  );
}

function StatusBreakdown() {
  const statuses = [
    "Auftragseingang", "Druckvorstufe", "Druckfreigabe",
    "In Produktion", "Weiterverarbeitung", "Versandbereit", "Abgeschlossen",
  ] as const;

  const colors: Record<string, string> = {
    "Auftragseingang":  "oklch(0.78 0.08 240)",
    "Druckvorstufe":    "oklch(0.70 0.14 240)",
    "Druckfreigabe":    "oklch(0.78 0.18 85)",
    "In Produktion":    "oklch(0.65 0.21 48)",
    "Weiterverarbeitung": "oklch(0.60 0.20 145)",
    "Versandbereit":    "oklch(0.55 0.22 258)",
    "Abgeschlossen":    "oklch(0.72 0.18 145)",
    "Blockiert":        "oklch(0.50 0.22 25)",
  };

  const counts = statuses.map((s) => ({
    status: s,
    count: JOBS.filter((j) => j.orderStatus === s).length,
    color: colors[s],
  }));

  const total = JOBS.length;

  return (
    <div className="space-y-2.5">
      {counts.map(({ status, count, color }) => (
        <div key={status} className="flex items-center gap-4">
          <div className="w-36 shrink-0 text-xs font-medium text-muted-foreground">{status}</div>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(count / total) * 100}%`, backgroundColor: color }}
            />
          </div>
          <div className="w-8 text-right text-sm font-semibold tabular-nums">{count}</div>
        </div>
      ))}
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "ok" | "warn" | "critical" | "neutral";
}) {
  const iconCls =
    tone === "critical" ? "text-destructive" :
    tone === "warn" ? "text-[oklch(0.52_0.17_85)]" :
    tone === "ok" ? "text-[oklch(0.45_0.18_145)]" :
    "text-muted-foreground";

  const valueCls =
    tone === "critical" ? "text-destructive" :
    tone === "warn" ? "text-[oklch(0.45_0.17_85)]" :
    "text-foreground";

  return (
    <div className="soft-card p-5">
      <div className={`mb-3 ${iconCls}`}>{icon}</div>
      <div className={`text-3xl font-bold tabular-nums mb-1 ${valueCls}`}>{value}</div>
      <div className="text-xs font-semibold text-foreground mb-0.5">{label}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
