import {
  WEEK_PLAN, WEEKDAYS, SLOTS, TODAY_INDEX,
  MACHINE_META, Machine, WeekSlot, JOBS, CURRENT_PM, RoleKey,
} from "@/lib/mock-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ALL_MACHINES: Machine[] = ["CD", "RZK", "SM5", "Digi"];

interface Props {
  role: RoleKey;
}

export function Wochenplan({ role }: Props) {
  const subtitle = SUBTITLES[role];

  // Decide which slots are "in focus" vs greyed out
  const inFocus = (s: WeekSlot): boolean => {
    if (!s.jobId) return true; // empty slots always visible
    switch (role) {
      case "produktionsleitung":
        return true;
      case "projektmanager":
        return s.ownerPM === CURRENT_PM;
      case "buchbinderei":
        return s.phase === "Weiterverarbeitung" || s.phase === "Versandbereit";
      case "logistik":
        return s.phase === "Versandbereit";
      case "druckvorstufe":
        return s.phase === "Vorstufe";
      case "geschaeftsfuehrung":
        return true;
    }
  };

  const machinesShown: Machine[] = ALL_MACHINES;

  return (
    <div className="relative p-8 fade-swap">
      <header className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Kalenderwoche 18
        </div>
        <h1 className="editorial-header text-4xl mb-2">Wochenplan</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
      </header>

      <div className="soft-card soft-card-lg overflow-hidden">
        {/* Header row */}
        <div
          className="grid border-b border-border bg-muted/40"
          style={{ gridTemplateColumns: `120px repeat(${WEEKDAYS.length}, 1fr)` }}
        >
          <div className="px-4 py-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
            Maschine
          </div>
          {WEEKDAYS.map((d, i) => {
            const isToday = i === TODAY_INDEX;
            return (
              <div
                key={d}
                className={`px-4 py-3 text-center border-l border-border ${
                  isToday ? "bg-[oklch(0.95_0.09_95)]" : ""
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
                  {d}
                </div>
                {isToday && (
                  <div className="mt-0.5 text-[10px] font-semibold text-[oklch(0.50_0.16_85)]">
                    Heute
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Machine rows */}
        {machinesShown.map((m, mi) => (
          <div
            key={m}
            className="grid border-b border-border last:border-0"
            style={{ gridTemplateColumns: `120px repeat(${WEEKDAYS.length}, 1fr)` }}
          >
            {/* machine label cell */}
            <div className="flex flex-col justify-center px-4 py-4 border-r border-border">
              <span
                className="inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: MACHINE_META[m].color }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: MACHINE_META[m].color,
                    boxShadow: `0 0 0 3px white, 0 0 8px ${MACHINE_META[m].color}`,
                  }}
                />
                {MACHINE_META[m].label}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{mi === 0 ? "Großformat" : ""}</span>
            </div>

            {WEEKDAYS.map((d, di) => {
              const isToday = di === TODAY_INDEX;
              const slots = WEEK_PLAN.filter((s) => s.machine === m && s.day === d);
              return (
                <div
                  key={d}
                  className={`border-l border-border p-2 space-y-1.5 ${
                    isToday ? "bg-[oklch(0.97_0.06_95)]" : ""
                  }`}
                >
                  {SLOTS.map((slotName) => {
                    const slot = slots.find((s) => s.slot === slotName);
                    if (!slot) return null;
                    return (
                      <SlotCard
                        key={slotName}
                        slot={slot}
                        focus={inFocus(slot)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[oklch(0.95_0.09_95)] ring-1 ring-[oklch(0.85_0.12_85)]" />
          Heute
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[oklch(0.85_0.05_240)]" />
          Frei
        </span>
        {role !== "produktionsleitung" && role !== "geschaeftsfuehrung" && (
          <span>Aufträge außerhalb deines Fokus sind ausgegraut.</span>
        )}
      </div>
    </div>
  );
}

function SlotCard({ slot, focus }: { slot: WeekSlot; focus: boolean }) {
  if (!slot.jobId) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.85_0.05_240)] bg-[oklch(0.97_0.03_240)] px-2.5 py-2 text-[11px] text-[oklch(0.55_0.12_240)] font-medium">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider opacity-70">{slot.slot}</span>
          <span>Frei</span>
        </div>
      </div>
    );
  }
  const color = MACHINE_META[slot.machine].color;
  const job = JOBS.find((j) => j.id === slot.jobId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`block w-full rounded-xl px-2.5 py-2 text-left transition hover:translate-y-[-1px] hover:shadow-md ${
            focus ? "" : "opacity-30 grayscale"
          }`}
          style={{
            backgroundColor: `color-mix(in oklab, ${color} 10%, white)`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 14,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[9px] uppercase tracking-wider font-semibold"
              style={{ color }}
            >
              {slot.slot}
            </span>
            {slot.phase && (
              <span className="text-[9px] text-muted-foreground">{slot.phase}</span>
            )}
          </div>
          <div className="mt-0.5 text-[12px] font-semibold leading-tight truncate">
            {slot.customer}
          </div>
          <div className="text-[10px] text-muted-foreground">{slot.jobId}</div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ color }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
              {MACHINE_META[slot.machine].label} · {slot.slot}
            </span>
            <span className="text-[10px] text-muted-foreground">{slot.jobId}</span>
          </div>
          <div className="text-base font-semibold">{slot.customer}</div>
          {job && (
            <div className="text-[12px] text-muted-foreground space-y-0.5">
              <div><span className="text-foreground font-medium">Phase:</span> {slot.phase}</div>
              <div><span className="text-foreground font-medium">Auflage:</span> {job.quantity}</div>
              <div><span className="text-foreground font-medium">Papier:</span> {job.paper}</div>
              <div><span className="text-foreground font-medium">Lieferung:</span> {job.delivery}</div>
            </div>
          )}
          {slot.ownerPM && (
            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border">
              PM-Betreuung: {slot.ownerPM}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const SUBTITLES: Record<RoleKey, string> = {
  produktionsleitung:  "Vollständige Wochenübersicht — alle Maschinen, alle Aufträge, Früh- und Spätschicht.",
  projektmanager:      "Deine Kundenaufträge sind farbig markiert. Andere Aufträge zeigen den Maschinen-Kontext.",
  druckvorstufe:       "Aufträge in Vorstufe — Freigabe-relevante Slots hervorgehoben.",
  buchbinderei:        "Aufträge, die diese Woche Weiterverarbeitung oder Versandbereitschaft erreichen.",
  logistik:            "Aufträge, die diese Woche versandbereit werden.",
  geschaeftsfuehrung:  "Vollständige Wochenübersicht — alle Maschinen und Aufträge.",
};
