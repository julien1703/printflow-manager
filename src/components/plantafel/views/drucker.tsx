import { useState } from "react";
import { JOBS, Machine, MACHINE_META } from "@/lib/mock-data";
import { MachineBadge } from "../dots";
import { AlertOctagon } from "lucide-react";

const MACHINES: Machine[] = ["CD", "RZK", "SM5", "Digi"];

export function DruckerView() {
  const [machine, setMachine] = useState<Machine>("CD");
  const [problemOpen, setProblemOpen] = useState(false);
  const queue = JOBS.filter((j) => j.machine === machine);
  const current = queue[0];
  const next = queue.slice(1, 3);

  return (
    <div className="p-6 space-y-5 fade-swap">
      {/* Machine selector */}
      <div className="flex items-center gap-2 rounded-xl bg-card border border-border shadow-sm p-2 w-fit">
        {MACHINES.map((m) => {
          const active = m === machine;
          return (
            <button
              key={m}
              onClick={() => setMachine(m)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                active ? "text-white shadow-md" : "hover:bg-muted text-muted-foreground"
              }`}
              style={active ? { backgroundColor: MACHINE_META[m].color } : undefined}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: MACHINE_META[m].color,
                  boxShadow: active ? "0 0 12px white" : `0 0 10px ${MACHINE_META[m].color}`,
                }}
              />
              {m}
            </button>
          );
        })}
      </div>

      {current ? (
        <div
          className="rounded-2xl bg-card border-2 shadow-lg p-8"
          style={{ borderColor: MACHINE_META[current.machine].color }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Aktueller Auftrag</div>
              <div className="text-3xl font-bold mt-1">{current.customer}</div>
              <div className="text-base text-muted-foreground mt-0.5">{current.id}</div>
            </div>
            <MachineBadge machine={current.machine} />
          </div>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <Field label="Papier" value={current.paper!} />
            <Field label="Auflage" value={current.quantity!} />
            <Field label="Lieferung" value={current.delivery} />
          </div>
          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Anweisungen</div>
            <div className="text-base">{current.instructions}</div>
          </div>
          <button
            onClick={() => setProblemOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition"
          >
            <AlertOctagon className="h-4 w-4" />Problem melden
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border p-12 text-center text-muted-foreground">
          Keine aktiven Aufträge auf dieser Maschine.
        </div>
      )}

      {next.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Als Nächstes</div>
          <div className="grid grid-cols-2 gap-4">
            {next.map((j) => (
              <div
                key={j.id}
                className="rounded-xl bg-card border border-border shadow-sm p-4"
                style={{ borderLeftWidth: 4, borderLeftColor: MACHINE_META[j.machine].color }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg">{j.customer}</div>
                  <span className="text-xs text-muted-foreground">{j.delivery}</span>
                </div>
                <div className="text-xs text-muted-foreground">{j.id}</div>
                <div className="text-sm mt-1.5 text-muted-foreground">{j.quantity} · {j.paper}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {problemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setProblemOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-4">Problem melden</div>
            <label className="text-xs font-medium text-muted-foreground">Problem-Typ</label>
            <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Maschinenstörung</option>
              <option>Materialproblem</option>
              <option>Druckqualität</option>
              <option>Sonstiges</option>
            </select>
            <label className="mt-3 block text-xs font-medium text-muted-foreground">Beschreibung</label>
            <textarea className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24" placeholder="Was ist passiert?" />
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setProblemOpen(false)} className="rounded-md bg-muted px-4 py-2 text-sm">Abbrechen</button>
              <button onClick={() => setProblemOpen(false)} className="rounded-md bg-destructive text-destructive-foreground px-4 py-2 text-sm font-semibold">Senden</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
