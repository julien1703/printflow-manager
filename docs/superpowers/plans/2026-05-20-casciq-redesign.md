# Casciq Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Produktionsleitung dashboard (Maschinen-Kacheln), add interactive Wochenplanung view with Auftragstasche + KI-Planungsvorschlag, and simplify all phase labels to 4 steps.

**Architecture:** Single-pass implementation. Mock-data types change first (Phase), then views consuming them. New WochenplanungView uses local useState only — no backend. Drag & drop via native HTML5 API.

**Tech Stack:** React + TypeScript + Vite, shadcn/ui, Tailwind CSS, lucide-react. No new dependencies.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/mock-data.ts` | Modify | Phase type → 4 values, update all JOBS + WEEK_PLAN phase fields |
| `src/components/plantafel/phase-tracker.tsx` | Modify | Render new 4-step phases |
| `src/components/plantafel/wochenplan.tsx` | Modify | Update `inFocus` phase name checks |
| `src/components/plantafel/views/produktionsleitung.tsx` | Rewrite | Maschinen-Kacheln + compact list + compact alerts |
| `src/components/plantafel/views/wochenplanung.tsx` | Create | Interactive grid + Auftragstasche + KI flow |
| `src/routes/index.tsx` | Modify | Route "Wochenplan" for PL → WochenplanungView |

---

## Task 1: Update Phase type and all mock data

**Files:**
- Modify: `src/lib/mock-data.ts`

- [ ] **Step 1: Replace Phase type and PHASES array**

In `src/lib/mock-data.ts`, replace lines 2 and 15:

```typescript
// Line 2 — replace:
export type Phase = "Vorstufe" | "Im Druck" | "Weiterverarbeitung" | "Versandbereit";

// Line 15 — replace:
export const PHASES: Phase[] = ["Vorstufe", "Im Druck", "Weiterverarbeitung", "Versandbereit"];
```

- [ ] **Step 2: Update all phase fields in JOBS**

Mapping: `"Schneiden" | "Vordruck" → "Vorstufe"`, `"Hauptdruck" → "Im Druck"`, `"Nachbereitung" → "Weiterverarbeitung"`, `"Versandfertig" → "Versandbereit"`

Apply to each job in `JOBS`:
```typescript
// #2024-0847 Mustermann GmbH — line ~64
phase: "Im Druck",

// #2024-0848 Schmidt Verlag — line ~89
phase: "Vorstufe",

// #2024-0849 Weber AG — line ~113
phase: "Versandbereit",

// #2024-0850 Rossmann GmbH — line ~135
phase: "Im Druck",

// #2024-0851 Becker & Partner — line ~164
phase: "Weiterverarbeitung",

// #2024-0852 Technik GmbH — line ~188
phase: "Vorstufe",

// #2024-0853 Müller Verlag — line ~213
phase: "Vorstufe",

// #2024-0854 Baumarkt AG — line ~237
phase: "Versandbereit",

// #2024-0855 Schulz Textil — line ~258
phase: "Vorstufe",

// #2024-0856 Kaiser Industries — line ~281
phase: "Im Druck",

// #2024-0857 Meyer Consulting — line ~307
phase: "Versandbereit",
```

- [ ] **Step 3: Update all phase fields in WEEK_PLAN**

In `WEEK_PLAN`, replace every old phase string (use find & replace in file):
```
"Schneiden"    → "Vorstufe"
"Vordruck"     → "Vorstufe"
"Hauptdruck"   → "Im Druck"
"Nachbereitung"→ "Weiterverarbeitung"
"Versandfertig"→ "Versandbereit"
```

- [ ] **Step 4: Remove PHASE_PRIORITY string references (produktionsleitung.tsx)**

This is currently in `produktionsleitung.tsx` line 22 — it will be replaced entirely in Task 3. No action needed here.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/julienoffray/Documents/HFG/7Semester/BA-Druckerei/Prototype1
npx tsc --noEmit
```

Expected: zero errors (only phase-related errors from files not yet updated)

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "refactor: simplify Phase type to 4 steps (Vorstufe/Im Druck/WV/Versandbereit)"
```

---

## Task 2: Update PhaseTracker component

**Files:**
- Modify: `src/components/plantafel/phase-tracker.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat src/components/plantafel/phase-tracker.tsx
```

- [ ] **Step 2: Update any hardcoded phase name checks**

The component renders dots/segments based on `PHASES.indexOf(job.phase)`. Since `PHASES` is now 4 items and `job.phase` uses new values, this should work automatically. Check for any hardcoded strings like `"Hauptdruck"`, `"Schneiden"`, `"Vordruck"`, `"Nachbereitung"`, `"Versandfertig"` and replace:

- `"Schneiden"` or `"Vordruck"` → `"Vorstufe"`
- `"Hauptdruck"` → `"Im Druck"`
- `"Nachbereitung"` → `"Weiterverarbeitung"`
- `"Versandfertig"` → `"Versandbereit"`

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors in phase-tracker.tsx

- [ ] **Step 4: Commit**

```bash
git add src/components/plantafel/phase-tracker.tsx
git commit -m "refactor: update PhaseTracker for 4-step phase system"
```

---

## Task 3: Update wochenplan.tsx inFocus logic

**Files:**
- Modify: `src/components/plantafel/wochenplan.tsx`

- [ ] **Step 1: Update inFocus phase name checks**

In `src/components/plantafel/wochenplan.tsx`, the `inFocus` function at lines 18–33 checks phase strings. Replace:

```typescript
const inFocus = (s: WeekSlot): boolean => {
  if (!s.jobId) return true;
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
```

- [ ] **Step 2: Update SUBTITLES if they contain old phase names**

Check the `SUBTITLES` record at the bottom of the file for any mentions of old phase names and update to new terminology.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/components/plantafel/wochenplan.tsx
git commit -m "fix: update wochenplan inFocus for new 4-step phase names"
```

---

## Task 4: Redesign ProduktionsleitungView

**Files:**
- Rewrite: `src/components/plantafel/views/produktionsleitung.tsx`

- [ ] **Step 1: Write the new ProduktionsleitungView**

Replace the entire file `src/components/plantafel/views/produktionsleitung.tsx` with:

```typescript
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
                    {a.role.replace("buchbinderei", "Buchbinderei").replace("logistik", "Logistik").replace("projektmanager", "PM")}
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
        backgroundColor: isBlocked
          ? "oklch(0.65 0.22 25 / 0.05)"
          : "var(--card)",
        borderColor: isBlocked ? "oklch(0.65 0.22 25 / 0.30)" : "var(--border)",
        borderLeftColor: color,
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/components/plantafel/views/produktionsleitung.tsx
git commit -m "feat: redesign ProduktionsleitungView with Maschinen-Kacheln"
```

---

## Task 5: Create WochenplanungView

**Files:**
- Create: `src/components/plantafel/views/wochenplanung.tsx`

- [ ] **Step 1: Create the WochenplanungView file**

Create `src/components/plantafel/views/wochenplanung.tsx`:

```typescript
import { useState } from "react";
import {
  JOBS, MACHINE_META, PHASES, WEEKDAYS, SLOTS,
  TODAY_INDEX,
  type Job, type Machine, type Phase,
} from "@/lib/mock-data";
import type { Weekday, Slot } from "@/lib/mock-data";
import { Check, Sparkles, X } from "lucide-react";

const ALL_MACHINES: Machine[] = ["CD", "RZK", "SM5", "Digi"];

type SlotKey = string; // `${Machine}|${Weekday}|${Slot}`

interface PlacedJob {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  phase: Phase;
  aiSuggested: boolean;
}

function slotKey(machine: Machine, day: Weekday, slot: Slot): SlotKey {
  return `${machine}|${day}|${slot}`;
}

const TASCHE_JOBS: Job[] = JOBS.filter(
  (j) =>
    j.druckfreigabe === "Erteilt" &&
    j.orderStatus !== "Abgeschlossen" &&
    j.orderStatus !== "Storniert" &&
    j.orderStatus !== "Versandbereit"
);

function buildKiPlan(jobs: Job[]): Record<SlotKey, PlacedJob> {
  const plan: Record<SlotKey, PlacedJob> = {};
  const sorted = [...jobs].sort((a, b) => {
    const d = (s: string) => parseInt(s.split(".")[0]);
    return d(a.delivery) - d(b.delivery);
  });

  for (const job of sorted) {
    let placed = false;
    for (const day of WEEKDAYS) {
      if (placed) break;
      for (const slot of SLOTS) {
        const key = slotKey(job.machine, day, slot);
        if (!plan[key]) {
          plan[key] = {
            jobId: job.id,
            customer: job.customer,
            machine: job.machine,
            delivery: job.delivery,
            phase: "Im Druck",
            aiSuggested: true,
          };
          placed = true;
          break;
        }
      }
    }
  }
  return plan;
}

export function WochenplanungView() {
  const [grid, setGrid] = useState<Record<SlotKey, PlacedJob>>({});
  const [tasche, setTasche] = useState<Job[]>(TASCHE_JOBS);
  const [dragging, setDragging] = useState<Job | null>(null);

  const hasKiSlots = Object.values(grid).some((s) => s.aiSuggested);

  function handleKiPlan() {
    const plan = buildKiPlan(tasche);
    setGrid(plan);
  }

  function confirmKiPlan() {
    const confirmed: Record<SlotKey, PlacedJob> = {};
    for (const [key, slot] of Object.entries(grid)) {
      confirmed[key] = { ...slot, aiSuggested: false };
    }
    setGrid(confirmed);
    // Remove confirmed jobs from tasche
    const placedIds = new Set(Object.values(confirmed).map((s) => s.jobId));
    setTasche((prev) => prev.filter((j) => !placedIds.has(j.id)));
  }

  function handleDragStart(job: Job) {
    setDragging(job);
  }

  function handleDrop(machine: Machine, day: Weekday, slot: Slot) {
    if (!dragging) return;
    const key = slotKey(machine, day, slot);
    setGrid((prev) => ({
      ...prev,
      [key]: {
        jobId: dragging.id,
        customer: dragging.customer,
        machine: dragging.machine,
        delivery: dragging.delivery,
        phase: "Im Druck",
        aiSuggested: false,
      },
    }));
    setTasche((prev) => prev.filter((j) => j.id !== dragging.id));
    setDragging(null);
  }

  function removeFromGrid(key: SlotKey) {
    const removed = grid[key];
    if (!removed) return;
    const originalJob = JOBS.find((j) => j.id === removed.jobId);
    setGrid((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (originalJob && !tasche.find((j) => j.id === removed.jobId)) {
      setTasche((prev) => [...prev, originalJob]);
    }
  }

  return (
    <div className="flex flex-col h-full fade-swap" style={{ minHeight: "calc(100vh - 88px)" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-4 flex items-start justify-between shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
            Produktionsleitung · Wochenplanung
          </div>
          <h1 className="editorial-header text-4xl">Wochenplanung</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            KW 20 · 20.–24. Mai 2026 — Aufträge per Drag & Drop planen
          </p>
        </div>
        {hasKiSlots && (
          <button
            onClick={confirmKiPlan}
            className="flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold shadow-md hover:opacity-85 transition"
          >
            <Check className="h-4 w-4" />
            Plan bestätigen
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto px-8 pb-4">
        <div className="soft-card overflow-hidden">
          {/* Header row */}
          <div
            className="grid border-b border-border bg-muted/40"
            style={{ gridTemplateColumns: `100px repeat(${WEEKDAYS.length}, 1fr)` }}
          >
            <div className="px-3 py-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              Maschine
            </div>
            {WEEKDAYS.map((d, i) => {
              const isToday = i === TODAY_INDEX;
              return (
                <div
                  key={d}
                  className={`px-3 py-3 text-center border-l border-border ${
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
          {ALL_MACHINES.map((machine) => {
            const color = MACHINE_META[machine].color;
            return (
              <div
                key={machine}
                className="grid border-b border-border last:border-0"
                style={{ gridTemplateColumns: `100px repeat(${WEEKDAYS.length}, 1fr)` }}
              >
                {/* Machine label */}
                <div className="flex items-center px-3 py-2 border-r border-border">
                  <span className="text-sm font-bold" style={{ color }}>
                    {machine}
                  </span>
                </div>

                {/* Day cells */}
                {WEEKDAYS.map((day, di) => {
                  const isToday = di === TODAY_INDEX;
                  return (
                    <div
                      key={day}
                      className={`border-l border-border p-1.5 space-y-1 ${
                        isToday ? "bg-[oklch(0.97_0.06_95)]" : ""
                      }`}
                    >
                      {SLOTS.map((slot) => {
                        const key = slotKey(machine, day, slot);
                        const placed = grid[key];
                        return (
                          <GridSlotCell
                            key={slot}
                            slotName={slot}
                            placed={placed}
                            color={color}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(machine, day, slot)}
                            onRemove={() => removeFromGrid(key)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Auftragstasche */}
      <div className="shrink-0 border-t border-border bg-card px-8 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">
              Auftragstasche
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {tasche.length} bereit
            </span>
          </div>
          <button
            onClick={handleKiPlan}
            className="flex items-center gap-2 rounded-xl border border-dashed border-[oklch(0.55_0.22_258/0.6)] bg-[oklch(0.55_0.22_258/0.06)] px-4 py-2 text-xs font-semibold text-[oklch(0.40_0.22_258)] hover:bg-[oklch(0.55_0.22_258/0.12)] transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            KI verplant
          </button>
        </div>
        <div className="flex gap-3 flex-wrap">
          {tasche.length === 0 && (
            <div className="text-sm text-muted-foreground italic">
              Alle Aufträge verplant.
            </div>
          )}
          {tasche.map((job) => {
            const color = MACHINE_META[job.machine].color;
            return (
              <TascheCard
                key={job.id}
                job={job}
                color={color}
                onDragStart={() => handleDragStart(job)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GridSlotCell({
  slotName,
  placed,
  color,
  onDragOver,
  onDrop,
  onRemove,
}: {
  slotName: Slot;
  placed: PlacedJob | undefined;
  color: string;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onRemove: () => void;
}) {
  if (placed) {
    const isAi = placed.aiSuggested;
    return (
      <div
        className="relative rounded-lg px-2 py-1.5 text-left group"
        style={{
          backgroundColor: isAi
            ? "oklch(0.55 0.22 258 / 0.08)"
            : `color-mix(in oklab, ${color} 10%, white)`,
          borderLeft: `3px solid ${isAi ? "oklch(0.55 0.22 258)" : color}`,
          borderRadius: 8,
          border: isAi ? "1.5px dashed oklch(0.55 0.22 258 / 0.7)" : undefined,
        }}
      >
        <div className="text-[9px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: isAi ? "oklch(0.40 0.22 258)" : color }}>
          {slotName} {isAi && "· KI"}
        </div>
        <div className="text-[11px] font-semibold leading-tight truncate">{placed.customer}</div>
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/60 transition"
        >
          <X className="h-2.5 w-2.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="rounded-lg border border-dashed border-[oklch(0.82_0.05_240)] bg-[oklch(0.97_0.03_240)] px-2 py-1.5 text-[9px] text-[oklch(0.60_0.08_240)] font-medium hover:border-[oklch(0.65_0.12_240)] hover:bg-[oklch(0.94_0.05_240)] transition"
      style={{ minHeight: 40 }}
    >
      <span className="opacity-60">{slotName}</span>
    </div>
  );
}

function TascheCard({
  job,
  color,
  onDragStart,
}: {
  job: Job;
  color: string;
  onDragStart: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="rounded-xl border px-3 py-2.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:translate-y-[-1px] transition select-none"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: color,
        backgroundColor: `color-mix(in oklab, ${color} 8%, white)`,
        minWidth: 130,
      }}
    >
      <div className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color }}>
        {job.machine}
      </div>
      <div className="text-sm font-semibold leading-tight">{job.customer}</div>
      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
        {job.id} · {job.delivery}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors

- [ ] **Step 3: Commit**

```bash
git add src/components/plantafel/views/wochenplanung.tsx
git commit -m "feat: add WochenplanungView with drag-and-drop + KI planning flow"
```

---

## Task 6: Wire up routing

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Add WochenplanungView import**

In `src/routes/index.tsx`, add import after existing view imports:

```typescript
import { WochenplanungView } from "@/components/plantafel/views/wochenplanung";
```

- [ ] **Step 2: Update the Wochenplan routing condition**

Replace the current `effectiveNav === "Wochenplan"` block (lines ~51-52):

```typescript
// Before:
{effectiveNav === "Wochenplan" ? (
  <Wochenplan role={role} />
) : (

// After:
{effectiveNav === "Wochenplan" && role === "produktionsleitung" ? (
  <WochenplanungView />
) : effectiveNav === "Wochenplan" ? (
  <Wochenplan role={role} />
) : (
```

Note: the closing `)}` stays the same — you are inserting one extra condition before the existing else branch, so the structure becomes a 3-way conditional.

Full updated main block:

```tsx
<main className="flex-1 overflow-auto" key={`${role}-${effectiveNav}`}>
  {effectiveNav === "Wochenplan" && role === "produktionsleitung" ? (
    <WochenplanungView />
  ) : effectiveNav === "Wochenplan" ? (
    <Wochenplan role={role} />
  ) : (
    <>
      {role === "produktionsleitung" && <ProduktionsleitungView />}
      {role === "buchbinderei"       && <BuchbindereiView />}
      {role === "logistik"           && <LogistikView />}
      {role === "druckvorstufe"      && <DruckvorstufeView />}
      {role === "projektmanager"     && <ProjektmanagerView />}
      {role === "geschaeftsfuehrung" && <GeschaeftsfuehrungView />}
    </>
  )}
</main>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors

- [ ] **Step 4: Commit**

```bash
git add src/routes/index.tsx
git commit -m "feat: route Wochenplan to WochenplanungView for Produktionsleitung"
```

---

## Task 7: Smoke test in browser

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Check Produktionsleitung Übersicht**

Open browser. Select role "Produktionsleitung". Verify:
- 4 Maschinen-Kacheln visible (CD/RZK/SM5/Digi)
- SM5 shows "⚠ Blockiert" with red tint
- Cascade alert banner visible (compact, 1 row)
- Fehlende Druckfreigabe alert visible (compact, 1 row)
- Job list shows all active orders with 4-segment progress bars
- Clicking a job row opens the drawer

- [ ] **Step 3: Check Wochenplanung**

Click "Wochenplan" in sidebar. Verify:
- Full-width grid with Mo–Fr columns and 4 machine rows
- Each cell has Früh/Spät slots (dashed/empty initially)
- Auftragstasche strip at bottom shows 4 cards (Mustermann, Rossmann, Becker, Kaiser)
- "KI verplant" button visible in strip header
- Click "KI verplant" → grid fills with blue-dashed KI suggestions
- "Plan bestätigen" button appears in header
- Drag a card from Auftragstasche to an empty slot → card appears in grid, removed from strip
- Click X on a grid card → card returns to Auftragstasche
- Click "Plan bestätigen" → all dashed borders become solid

- [ ] **Step 4: Check other roles**

Switch to Buchbinderei → "Wochenplan" nav → shows old read-only Wochenplan (not the new interactive one).

Switch to Druckvorstufe → phase labels in Freigabe cards should read "Vorstufe", "Im Druck" etc.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final smoke-test pass — Casciq redesign complete"
```
