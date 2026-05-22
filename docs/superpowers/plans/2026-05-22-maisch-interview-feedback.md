# Maisch Interview Feedback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporate all feedback from the interview with Hr. Maisch (Produktionsleiter): add new Job fields for Lack/Sonderfarbe/Grammatur/Druckzeit/Festpinnen/NEU, show these as badges on Auftragskarten, extend the Wochenplan to 3 Schichten for CD and replace the inline KI logic with a dedicated planning-ai.ts service that carries human-readable `reason` text per suggestion.

**Architecture:** Extend mock-data.ts first (types + data), then build a shared `JobBadges` component, then wire it into the two consuming views (produktionsleitung Drawer + wochenplanung TascheCard/GridSlot). The KI service is extracted to src/lib/planning-ai.ts and the Wochenplanung grid is updated to drive slot rendering from `SLOTS_BY_MACHINE`. Small satellite updates touch projektmanager, buchbinderei, logistik, and sidebar.

**Tech Stack:** React 19 + TypeScript + Tailwind 4 + Vite, OKLCH colors, lucide-react. No new npm packages. Mock-only prototype.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/mock-data.ts` | Modify | New Job fields, 2 isNew jobs, SLOTS_BY_MACHINE, update Slot type |
| `src/lib/planning-ai.ts` | **Create** | KI planning service with reason strings |
| `src/components/plantafel/job-badges.tsx` | **Create** | Shared badge row: Lack, Sonderfarbe, Grammatur, Druckzeit, Festpinnen, NEU |
| `src/components/plantafel/views/produktionsleitung.tsx` | Modify | Import JobBadges in AuftragDrawer, add Festpinnen toggle, NEU badge in job list |
| `src/components/plantafel/views/wochenplanung.tsx` | Modify | Import JobBadges in TascheCard, SLOTS_BY_MACHINE grid, KI reason text, update buildKiPlan |
| `src/components/plantafel/views/projektmanager.tsx` | Modify | NEU badge in ProjectCard |
| `src/components/plantafel/views/buchbinderei.tsx` | Modify | Trocknungszeit-Hinweis badge per card |
| `src/components/plantafel/views/logistik.tsx` | Modify | paletten field, "Palette offen" warning |
| `src/components/plantafel/sidebar.tsx` | Modify | Bundle neue Aufträge in TopBar bell dropdown |

---

## Task 1: Mock-Daten — neue Job-Felder + 2 neue isNew-Aufträge

**Files:**
- Modify: `src/lib/mock-data.ts`

- [ ] **Step 1: Extend the Job interface**

In `src/lib/mock-data.ts`, after the `projectManager?: string;` line (currently line 55), add:

```typescript
  // --- Maisch interview additions ---
  dispersionslack?: boolean;
  sonderfarbe?: string;
  grammatur?: number;
  druckzeitStunden?: number;
  festgepinnt?: boolean;
  isNew?: boolean;
  paletten?: number;
```

- [ ] **Step 2: Update 3 existing JOBS entries with the new fields**

Patch `#2024-0847` (Mustermann GmbH) — add after `projectManager: "Müller",`:
```typescript
    dispersionslack: true,
    sonderfarbe: "Pantone 286 C",
    grammatur: 135,
    druckzeitStunden: 4.5,
    festgepinnt: true,
```

Patch `#2024-0850` (Rossmann GmbH) — add after `projectManager: "Müller",`:
```typescript
    dispersionslack: false,
    sonderfarbe: "Pantone 485 C",
    grammatur: 135,
    druckzeitStunden: 3.0,
```

Patch `#2024-0853` (Müller Verlag) — add after `projectManager: "Schmidt",`:
```typescript
    dispersionslack: true,
    grammatur: 120,
    druckzeitStunden: 5.0,
    paletten: 3,
```

- [ ] **Step 3: Add 2 new isNew jobs**

Append to the JOBS array (before the closing `];`):

```typescript
  {
    id: "#2024-0858",
    customer: "Dresdner Druck GmbH",
    product: "Geschäftsbericht 2025",
    machine: "CD",
    phase: "Vorstufe",
    orderStatus: "Auftragseingang",
    status: "Nach Plan",
    delivery: "28.05.",
    openSubsteps: 0,
    druckfreigabe: "Angefordert",
    finishing: "Binden",
    finishingHours: 3.5,
    wvDay: 2,
    wvStatus: "Wartet auf Druck",
    city: "Dresden",
    versandfertigAb: "27.05.",
    shipStatus: "Offen",
    shipUrgency: "medium",
    paper: "Bilderdruck matt 170g",
    quantity: "1.500 Stk.",
    instructions: "4/4-farbig, Klebebindung, Dispersionslack",
    projectManager: "Schmidt",
    dispersionslack: true,
    grammatur: 170,
    druckzeitStunden: 3.5,
    isNew: true,
  },
  {
    id: "#2024-0859",
    customer: "Metallbau Hoffmann",
    product: "Produktkatalog Metallic",
    machine: "SM5",
    phase: "Vorstufe",
    orderStatus: "Auftragseingang",
    status: "Nach Plan",
    delivery: "29.05.",
    openSubsteps: 0,
    druckfreigabe: "Fehlt",
    finishing: "Falzen",
    finishingHours: 2.0,
    wvDay: 2,
    wvStatus: "Wartet auf Druck",
    city: "Stuttgart",
    versandfertigAb: "28.05.",
    shipStatus: "Offen",
    shipUrgency: "low",
    paper: "Metallic-Karton 250g",
    quantity: "800 Stk.",
    instructions: "5-farbig inkl. Sonderfarbe, Lacküberzug",
    projectManager: "Müller",
    dispersionslack: false,
    sonderfarbe: "Pantone 877 C Silber",
    grammatur: 250,
    druckzeitStunden: 6.0,
    isNew: true,
    paletten: 1,
  },
```

- [ ] **Step 4: Extend Slot type and add SLOTS_BY_MACHINE**

Replace the existing lines in `src/lib/mock-data.ts`:
```typescript
// BEFORE (lines ~478-481):
export type Slot = "Früh" | "Spät";
export const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr"] as const;
export type Weekday = typeof WEEKDAYS[number];
export const SLOTS: Slot[] = ["Früh", "Spät"];

// AFTER:
export type Slot = "Früh" | "Spät" | "Nacht";
export const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr"] as const;
export type Weekday = typeof WEEKDAYS[number];
export const SLOTS: Slot[] = ["Früh", "Spät"];
export const SLOTS_BY_MACHINE: Record<Machine, Slot[]> = {
  CD:   ["Früh", "Spät", "Nacht"],
  RZK:  ["Früh"],
  SM5:  ["Früh"],
  Digi: ["Früh"],
};
```

- [ ] **Step 5: Add Nacht slots to WEEK_PLAN for CD**

After each existing CD day pair in WEEK_PLAN, add a Nacht slot:
```typescript
  // CD Nacht slots (append to existing CD entries)
  { machine: "CD", day: "Mo", slot: "Nacht" },
  { machine: "CD", day: "Di", slot: "Nacht" },
  { machine: "CD", day: "Mi", slot: "Nacht" },
  { machine: "CD", day: "Do", slot: "Nacht" },
  { machine: "CD", day: "Fr", slot: "Nacht" },
```

```bash
git add src/lib/mock-data.ts
git commit -m "feat(data): add new Job fields (Lack, Grammatur, Druckzeit, Festpinnen, NEU), 2 isNew jobs, SLOTS_BY_MACHINE with Nacht for CD"
```

---

## Task 2: Job-Badges Komponente (neue Datei)

**Files:**
- Create: `src/components/plantafel/job-badges.tsx`

- [ ] **Step 1: Create the file**

```typescript
// src/components/plantafel/job-badges.tsx
import { Lock, Unlock } from "lucide-react";
import type { Job } from "@/lib/mock-data";

interface JobBadgesProps {
  job: Job;
  /** If provided, clicking the Lock icon calls this to toggle festgepinnt */
  onToggleFestgepinnt?: () => void;
  /** compact = smaller text for TascheCard / GridSlotCell */
  compact?: boolean;
}

export function JobBadges({ job, onToggleFestgepinnt, compact = false }: JobBadgesProps) {
  const textCls = compact ? "text-[8px]" : "text-[10px]";
  const pxCls   = compact ? "px-1.5 py-0.5" : "px-2 py-0.5";

  return (
    <div className={`flex flex-wrap items-center gap-1 ${compact ? "mt-0.5" : "mt-1.5"}`}>
      {/* NEU badge */}
      {job.isNew && (
        <span
          className={`inline-flex items-center rounded-full font-bold ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "oklch(0.52 0.20 145 / 0.15)",
            color: "oklch(0.35 0.18 145)",
            border: "1px solid oklch(0.60 0.18 145 / 0.40)",
          }}
        >
          NEU
        </span>
      )}

      {/* Dispersionslack badge */}
      {job.dispersionslack === true && (
        <span
          className={`inline-flex items-center rounded-full font-semibold ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "oklch(0.52 0.14 153 / 0.12)",
            color: "oklch(0.38 0.14 153)",
            border: "1px solid oklch(0.52 0.14 153 / 0.30)",
          }}
        >
          Lack ✓
        </span>
      )}
      {job.dispersionslack === false && (
        <span
          className={`inline-flex items-center rounded-full font-medium ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          Lack –
        </span>
      )}

      {/* Sonderfarbe badge */}
      {job.sonderfarbe && (
        <span
          className={`inline-flex items-center rounded-full font-semibold ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "oklch(0.72 0.18 55 / 0.14)",
            color: "oklch(0.42 0.18 55)",
            border: "1px solid oklch(0.65 0.18 55 / 0.30)",
          }}
        >
          Sonderf. {job.sonderfarbe}
        </span>
      )}

      {/* Grammatur pill */}
      {job.grammatur !== undefined && (
        <span
          className={`inline-flex items-center rounded-full font-mono font-medium ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "oklch(0.70 0.14 240 / 0.10)",
            color: "oklch(0.42 0.14 245)",
            border: "1px solid oklch(0.65 0.14 240 / 0.22)",
          }}
        >
          {job.grammatur}g
        </span>
      )}

      {/* Druckzeit */}
      {job.druckzeitStunden !== undefined && (
        <span
          className={`inline-flex items-center rounded-full font-mono font-medium ${textCls} ${pxCls}`}
          style={{
            backgroundColor: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          ~{job.druckzeitStunden}h
        </span>
      )}

      {/* Festpinnen icon */}
      {job.festgepinnt !== undefined && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFestgepinnt?.();
          }}
          title={job.festgepinnt ? "Auftrag festgepinnt — KI bewegt ihn nicht" : "Auftrag freigeben"}
          className="inline-flex items-center rounded-full transition hover:opacity-70"
          style={{
            backgroundColor: job.festgepinnt
              ? "oklch(0.55 0.22 280 / 0.12)"
              : "var(--muted)",
            color: job.festgepinnt
              ? "oklch(0.42 0.20 280)"
              : "var(--muted-foreground)",
            padding: compact ? "2px 4px" : "2px 6px",
          }}
        >
          {job.festgepinnt
            ? <Lock className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
            : <Unlock className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
          }
        </button>
      )}
    </div>
  );
}
```

```bash
git add src/components/plantafel/job-badges.tsx
git commit -m "feat(components): add shared JobBadges component (Lack, Sonderfarbe, Grammatur, Druckzeit, Festpinnen, NEU)"
```

---

## Task 3: Badges in AuftragDrawer + Festpinnen-Toggle (produktionsleitung.tsx)

**Files:**
- Modify: `src/components/plantafel/views/produktionsleitung.tsx`

- [ ] **Step 1: Add import for JobBadges and useState for festgepinnt overrides**

At the top of the file, add to existing imports:
```typescript
import { JobBadges } from "@/components/plantafel/job-badges";
import { Lock } from "lucide-react"; // already imported via lucide; add Lock if missing
```

- [ ] **Step 2: Add pinnedIds state to ProduktionsleitungView**

Inside `ProduktionsleitungView`, after the existing `useState` calls:
```typescript
  // Track locally which jobs are festgepinnt (overrides mock default)
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    () => new Set(JOBS.filter((j) => j.festgepinnt).map((j) => j.id))
  );

  function togglePinned(jobId: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }
```

- [ ] **Step 3: Show NEU badge in the active jobs list**

Inside the `.map((j) => ...)` for `activeJobs`, after the customer name `<span>` and cascade chip, add:
```tsx
{j.isNew && (
  <span
    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
    style={{
      backgroundColor: "oklch(0.52 0.20 145 / 0.15)",
      color: "oklch(0.35 0.18 145)",
      border: "1px solid oklch(0.60 0.18 145 / 0.40)",
    }}
  >
    NEU
  </span>
)}
```

- [ ] **Step 4: Pass pinnedIds to AuftragDrawer and wire JobBadges**

Change the `setSelectedJob` call site to also pass the toggle:
```tsx
{selectedJob && (
  <AuftragDrawer
    job={{ ...selectedJob, festgepinnt: pinnedIds.has(selectedJob.id) }}
    onClose={() => setSelectedJob(null)}
    onToggleFestgepinnt={() => togglePinned(selectedJob.id)}
  />
)}
```

Update the `AuftragDrawer` function signature:
```typescript
function AuftragDrawer({
  job,
  onClose,
  onToggleFestgepinnt,
}: {
  job: Job;
  onClose: () => void;
  onToggleFestgepinnt?: () => void;
}) {
```

- [ ] **Step 5: Insert JobBadges in AuftragDrawer header**

In `AuftragDrawer`, after the `<div className="flex flex-wrap items-center gap-2 mt-2">` block (the one with ZeitPill and orderStatus chip), add:
```tsx
<JobBadges job={job} onToggleFestgepinnt={onToggleFestgepinnt} />
```

- [ ] **Step 6: Add Druckdetails rows for new fields**

Inside `<Section title="Druckdetails">`, after the existing `{job.instructions && <Row ... />}` line, add:
```tsx
{job.grammatur !== undefined && (
  <Row label="Grammatur" value={`${job.grammatur} g/m²`} mono />
)}
{job.druckzeitStunden !== undefined && (
  <Row label="Berechnete Druckzeit" value={`~${job.druckzeitStunden} h`} mono />
)}
{job.dispersionslack !== undefined && (
  <Row
    label="Dispersionslack"
    value={
      <span style={{ color: job.dispersionslack ? "oklch(0.38 0.14 153)" : "var(--muted-foreground)" }}>
        {job.dispersionslack ? "Ja — Lack-Rüstzeit beachten" : "Nein"}
      </span>
    }
  />
)}
{job.sonderfarbe && (
  <Row label="Sonderfarbe" value={job.sonderfarbe} />
)}
```

```bash
git add src/components/plantafel/views/produktionsleitung.tsx
git commit -m "feat(produktionsleitung): JobBadges in AuftragDrawer, Festpinnen-Toggle, NEU badge in job list"
```

---

## Task 4: Badges in TascheCard + GridSlotCell + NEU-Badge (wochenplanung.tsx)

**Files:**
- Modify: `src/components/plantafel/views/wochenplanung.tsx`

- [ ] **Step 1: Import JobBadges and add pinnedIds state to WochenplanungView**

Add to imports at the top:
```typescript
import { JobBadges } from "@/components/plantafel/job-badges";
```

Inside `WochenplanungView`, after `const [newlyPlaced, ...]`:
```typescript
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    () => new Set(JOBS.filter((j) => j.festgepinnt).map((j) => j.id))
  );

  function togglePinned(jobId: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }
```

- [ ] **Step 2: Thread pinnedIds/togglePinned into TascheCard**

In the `tasche.map((job) => ...)` JSX, update the `<TascheCard>` element:
```tsx
<TascheCard
  key={job.id}
  job={{ ...job, festgepinnt: pinnedIds.has(job.id) }}
  color={color}
  onDragStart={(machine) => setDragMachine(machine)}
  onDragEnd={handleDragEnd}
  onToggleFestgepinnt={() => togglePinned(job.id)}
/>
```

- [ ] **Step 3: Update TascheCard props and render JobBadges**

Change `TascheCard` signature to accept the new prop:
```typescript
function TascheCard({
  job, color, onDragStart, onDragEnd, onToggleFestgepinnt,
}: {
  job: Job;
  color: string;
  onDragStart: (machine: Machine) => void;
  onDragEnd: () => void;
  onToggleFestgepinnt?: () => void;
}) {
```

Inside `TascheCard`, after the `<div className="text-[10px] text-muted-foreground font-mono mt-0.5">{job.id}</div>` line, add:
```tsx
<JobBadges job={job} onToggleFestgepinnt={onToggleFestgepinnt} compact />
```

Also add the NEU indicator before the machine badge (inside the `flex items-center gap-1.5 mb-1` div):
```tsx
{job.isNew && (
  <span
    className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
    style={{
      backgroundColor: "oklch(0.52 0.20 145 / 0.15)",
      color: "oklch(0.35 0.18 145)",
    }}
  >
    NEU
  </span>
)}
```

- [ ] **Step 4: Add reason text to GridSlotCell for KI suggestions**

Update `PlacedJob` interface (local type in wochenplanung.tsx) to add `reason`:
```typescript
interface PlacedJob {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  phase: Phase;
  aiSuggested: boolean;
  reason?: string;
}
```

In `GridSlotCell`, inside the `placed &&` branch, after the `<div className="text-[9px] text-muted-foreground font-mono mt-0.5">{placed.delivery}</div>` line, add:
```tsx
{placed.aiSuggested && placed.reason && (
  <div className="text-[8px] italic text-muted-foreground mt-1 leading-tight opacity-80">
    {placed.reason}
  </div>
)}
```

```bash
git add src/components/plantafel/views/wochenplanung.tsx
git commit -m "feat(wochenplanung): JobBadges + NEU badge in TascheCard, reason text in KI GridSlotCell"
```

---

## Task 5: SLOTS_BY_MACHINE in wochenplanung.tsx Wochenplan-Grid

**Files:**
- Modify: `src/components/plantafel/views/wochenplanung.tsx`

- [ ] **Step 1: Import SLOTS_BY_MACHINE**

Replace the existing import line:
```typescript
// BEFORE:
import {
  JOBS, MACHINE_META, WEEKDAYS, SLOTS,
  TODAY_INDEX,
  type Job, type Machine, type Phase, type Weekday, type Slot,
} from "@/lib/mock-data";

// AFTER:
import {
  JOBS, MACHINE_META, WEEKDAYS, SLOTS_BY_MACHINE,
  TODAY_INDEX,
  type Job, type Machine, type Phase, type Weekday, type Slot,
} from "@/lib/mock-data";
```

- [ ] **Step 2: Replace SLOTS iteration with SLOTS_BY_MACHINE in grid rendering**

Find the inner `{SLOTS.map((slot) => {` loop inside the WEEKDAYS map, inside the ALL_MACHINES map. Replace it:
```tsx
// BEFORE:
{SLOTS.map((slot) => {
  const key = slotKey(machine, day, slot);
  const placed = grid[key];
  return (
    <GridSlotCell
      key={slot}
      slotName={slot}
      placed={placed}
      color={color}
      dragMachine={dragMachine}
      gridMachine={machine}
      isNew={newlyPlaced.has(key)}
      onDrop={(e) => handleDrop(e, machine, day, slot)}
      onRemove={() => removeFromGrid(key)}
    />
  );
})}

// AFTER:
{SLOTS_BY_MACHINE[machine].map((slot) => {
  const key = slotKey(machine, day, slot);
  const placed = grid[key];
  return (
    <GridSlotCell
      key={slot}
      slotName={slot}
      placed={placed}
      color={color}
      dragMachine={dragMachine}
      gridMachine={machine}
      isNew={newlyPlaced.has(key)}
      onDrop={(e) => handleDrop(e, machine, day, slot)}
      onRemove={() => removeFromGrid(key)}
    />
  );
})}
```

- [ ] **Step 3: Update handleDrop to only allow drops onto valid slots**

In `handleDrop`, after `const job = tasche.find(...)`, add a guard:
```typescript
// Guard: reject drop if slot is not in SLOTS_BY_MACHINE for this machine
if (!SLOTS_BY_MACHINE[machine].includes(slot)) return;
```

```bash
git add src/components/plantafel/views/wochenplanung.tsx
git commit -m "feat(wochenplanung): drive grid slot rows from SLOTS_BY_MACHINE (CD=3 Schichten, rest=1)"
```

---

## Task 6: KI-Service (src/lib/planning-ai.ts)

**Files:**
- Create: `src/lib/planning-ai.ts`

- [ ] **Step 1: Create the file with full logic**

```typescript
// src/lib/planning-ai.ts
import {
  WEEKDAYS,
  SLOTS_BY_MACHINE,
  type Job,
  type Machine,
  type Weekday,
  type Slot,
} from "@/lib/mock-data";

// ── Types ──────────────────────────────────────────────────────────────────────

export type SlotKey = string;

export interface PlacedJob {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  phase: "Im Druck";
  aiSuggested: true;
  reason: string;
}

export type PlanSuggestion = Record<SlotKey, PlacedJob>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function slotKey(machine: Machine, day: Weekday, slot: Slot): SlotKey {
  return `${machine}|${day}|${slot}`;
}

function deliveryOrdinal(delivery: string): number {
  const [day, month] = delivery.split(".").map(Number);
  return month * 100 + day;
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Build a KI plan from a list of plannable jobs.
 *
 * Rules applied in order:
 * 1. Skip festgepinnt jobs — the user has locked them manually.
 * 2. Sort by delivery date (earliest first).
 * 3. Within each machine, group Lack-jobs (dispersionslack===true) before
 *    no-Lack jobs to minimise Rüstzeit changes (~2h saved per group boundary).
 * 4. Within each Lack group, sort by grammatur (ascending) to batch similar
 *    paper weights together.
 * 5. Fill slots in WEEKDAY × SLOTS_BY_MACHINE order, skipping occupied slots.
 *
 * Each PlacedJob carries a human-readable `reason` string explaining why it
 * was placed where it was.
 */
export function buildKIPlan(
  jobs: Job[],
  existingPlan: PlanSuggestion = {}
): PlanSuggestion {
  const plan: PlanSuggestion = { ...existingPlan };

  // Step 1: filter out festgepinnt
  const plannable = jobs.filter((j) => !j.festgepinnt);

  // Step 2: sort by delivery
  const sorted = [...plannable].sort(
    (a, b) => deliveryOrdinal(a.delivery) - deliveryOrdinal(b.delivery)
  );

  // Step 3+4: group per machine: Lack-jobs first (sorted by grammatur),
  // then no-Lack jobs (sorted by grammatur)
  const machines = [...new Set(sorted.map((j) => j.machine))] as Machine[];
  const orderedJobs: Job[] = [];

  for (const machine of machines) {
    const machineJobs = sorted.filter((j) => j.machine === machine);
    const lackJobs    = machineJobs.filter((j) => j.dispersionslack === true)
                          .sort((a, b) => (a.grammatur ?? 0) - (b.grammatur ?? 0));
    const noLackJobs  = machineJobs.filter((j) => j.dispersionslack !== true)
                          .sort((a, b) => (a.grammatur ?? 0) - (b.grammatur ?? 0));
    orderedJobs.push(...lackJobs, ...noLackJobs);
  }

  // Step 5: fill slots
  for (const job of orderedJobs) {
    let placed = false;

    for (const day of WEEKDAYS) {
      if (placed) break;
      const slots = SLOTS_BY_MACHINE[job.machine];

      for (const slot of slots) {
        const key = slotKey(job.machine, day, slot);
        if (plan[key]) continue;

        // Build reason string
        let reason = `Liefertermin ${job.delivery}`;
        if (job.festgepinnt) {
          // should never reach here, but guard
          reason = "Festgepinnt — nicht bewegt";
        } else if (job.dispersionslack === true) {
          reason = `Lack-Gruppierung spart ~2h Rüstzeit · Liefertermin ${job.delivery}`;
          if (job.grammatur !== undefined) {
            reason += ` · ${job.grammatur}g/m² Grammatur-Batch`;
          }
        } else if (job.grammatur !== undefined) {
          reason = `Grammatur-Batch ${job.grammatur}g/m² · Liefertermin ${job.delivery}`;
        }

        plan[key] = {
          jobId: job.id,
          customer: job.customer,
          machine: job.machine,
          delivery: job.delivery,
          phase: "Im Druck",
          aiSuggested: true,
          reason,
        };

        placed = true;
        break;
      }
    }
  }

  return plan;
}
```

```bash
git add src/lib/planning-ai.ts
git commit -m "feat(lib): add planning-ai.ts KI service with Lack-grouping, Grammatur-batching, festgepinnt skip, and reason strings"
```

---

## Task 7: Wochenplanung KI-Integration mit reason-Text

**Files:**
- Modify: `src/components/plantafel/views/wochenplanung.tsx`

- [ ] **Step 1: Replace inline buildKiPlan with imported buildKIPlan**

Remove the local `buildKiPlan` function definition (lines ~34–66 in the current file).

Add import at the top:
```typescript
import { buildKIPlan, type PlanSuggestion, type SlotKey } from "@/lib/planning-ai";
import type { PlacedJob } from "@/lib/planning-ai";
```

- [ ] **Step 2: Remove the local PlacedJob and SlotKey type declarations**

Delete the local `type SlotKey = string;` and `interface PlacedJob { ... }` declarations from wochenplanung.tsx — they now come from planning-ai.ts.

- [ ] **Step 3: Update handleKiPlan to call buildKIPlan**

Replace the `handleKiPlan` function body:
```typescript
function handleKiPlan() {
  const plan = buildKIPlan(
    tasche.map((j) => ({ ...j, festgepinnt: pinnedIds.has(j.id) }))
  );
  setGrid((prev) => {
    const merged: PlanSuggestion = { ...prev };
    for (const [key, slot] of Object.entries(plan)) {
      if (!merged[key]) merged[key] = slot;
    }
    return merged;
  });
}
```

- [ ] **Step 4: Ensure grid state type matches**

Change the grid useState type annotation:
```typescript
const [grid, setGrid] = useState<PlanSuggestion>({});
```

- [ ] **Step 5: Verify reason text renders in GridSlotCell**

The `reason` field is now populated by `buildKIPlan`. The rendering added in Task 4 Step 4 will display it automatically. No additional change needed — verify in the browser that the italic reason text appears under KI-suggested cards.

```bash
git add src/components/plantafel/views/wochenplanung.tsx
git commit -m "feat(wochenplanung): replace inline buildKiPlan with buildKIPlan from planning-ai.ts; KI reason text visible on grid cards"
```

---

## Task 8: PM / Buchbinderei / Logistik Updates + Notification Bundling

**Files:**
- Modify: `src/components/plantafel/views/projektmanager.tsx`
- Modify: `src/components/plantafel/views/buchbinderei.tsx`
- Modify: `src/components/plantafel/views/logistik.tsx`
- Modify: `src/components/plantafel/sidebar.tsx`

### 8a — Projektmanager: NEU badge in ProjectCard

- [ ] **Step 1: Add NEU badge to ProjectCard**

In `src/components/plantafel/views/projektmanager.tsx`, inside `function ProjectCard`, find the header row `<div className="flex items-start justify-between gap-2 mb-1">`. After the `<span className={...}>{k.label}</span>` status badge, add:
```tsx
{job.isNew && (
  <span
    className="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0"
    style={{
      backgroundColor: "oklch(0.52 0.20 145 / 0.15)",
      color: "oklch(0.35 0.18 145)",
      border: "1px solid oklch(0.60 0.18 145 / 0.40)",
    }}
  >
    NEU
  </span>
)}
```

### 8b — Buchbinderei: Trocknungszeit-Hinweis

- [ ] **Step 2: Add a helper and badge to WV job cards**

In `src/components/plantafel/views/buchbinderei.tsx`, add a helper function before the component:

```typescript
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
```

In the WV job card rendering (wherever JOBS are mapped for wvDay columns), after the customer name, add:
```tsx
{needsTrocknungshinweis(job) && (
  <span
    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
    style={{
      backgroundColor: "oklch(0.72 0.18 55 / 0.14)",
      color: "oklch(0.42 0.18 55)",
      border: "1px solid oklch(0.65 0.18 55 / 0.30)",
    }}
  >
    2T Trocknung
  </span>
)}
```

### 8c — Logistik: Palette offen warning

- [ ] **Step 3: Add "Palette offen" warning row**

In `src/components/plantafel/views/logistik.tsx`, in the job table/list rendering, find where `shipStatus` is displayed. After the shipStatus badge row, add a warning for jobs that are Offen within 2 days:

```typescript
// Helper — place above the LogistikView component
function daysUntilDelivery(delivery: string): number {
  const [day, month] = delivery.split(".").map(Number);
  // Using today as 2026-05-20 (TODAY_INDEX=0, Mo = 20.05.)
  const todayOrdinal = 5 * 100 + 20;
  const deliveryOrdinal = month * 100 + day;
  return deliveryOrdinal - todayOrdinal;
}
```

In the job card/row, after the existing shipStatus display:
```tsx
{job.shipStatus === "Offen" && daysUntilDelivery(job.delivery) <= 2 && (
  <div
    className="mt-1.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
    style={{
      backgroundColor: "oklch(0.65 0.22 25 / 0.08)",
      border: "1px solid oklch(0.65 0.22 25 / 0.25)",
    }}
  >
    <AlertTriangle
      className="h-3 w-3 shrink-0"
      style={{ color: "oklch(0.50 0.22 25)" }}
    />
    <span
      className="text-[10px] font-semibold"
      style={{ color: "oklch(0.40 0.20 25)" }}
    >
      Palette offen
      {job.paletten !== undefined ? ` · ${job.paletten} Pal.` : ""}
      {" "}— Versand in ≤2 Tagen
    </span>
  </div>
)}
```

### 8d — Sidebar TopBar: Notification Bundling

- [ ] **Step 4: Bundle neue Aufträge in TopBar bell**

In `src/components/plantafel/sidebar.tsx`, inside `TopBar`, modify the bell dropdown to group messages. Add a helper above the TopBar function:

```typescript
type MessageGroup = {
  type: "neue-auftraege" | "standard";
  count?: number;
  messages: typeof MESSAGES;
};

function groupMessages(messages: typeof MESSAGES): MessageGroup[] {
  const neueAuftraege = messages.filter((m) =>
    m.text.toLowerCase().includes("auftrag") || m.text.toLowerCase().includes("freigabe")
  );
  const rest = messages.filter(
    (m) =>
      !m.text.toLowerCase().includes("auftrag") &&
      !m.text.toLowerCase().includes("freigabe")
  );

  const groups: MessageGroup[] = [];
  if (neueAuftraege.length > 1) {
    groups.push({ type: "neue-auftraege", count: neueAuftraege.length, messages: neueAuftraege });
  } else {
    neueAuftraege.forEach((m) => groups.push({ type: "standard", messages: [m] }));
  }
  rest.forEach((m) => groups.push({ type: "standard", messages: [m] }));
  return groups;
}
```

Replace the `MESSAGES.map(...)` in the bell dropdown with:
```tsx
{groupMessages(MESSAGES).map((group, i) => {
  if (group.type === "neue-auftraege") {
    const anyUnread = group.messages.some((m) => m.unread);
    return (
      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition">
        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${anyUnread ? "bg-destructive" : "bg-border"}`} />
        <div>
          <div className="text-xs font-semibold">Neue Aufträge</div>
          <div className="text-xs text-muted-foreground">
            {group.count} neue Aufträge eingegangen
          </div>
        </div>
      </div>
    );
  }
  const m = group.messages[0];
  return (
    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition">
      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${m.unread ? "bg-destructive" : "bg-border"}`} />
      <div>
        <div className="text-xs font-semibold">{m.from}</div>
        <div className="text-xs text-muted-foreground">{m.text}</div>
      </div>
    </div>
  );
})}
```

```bash
git add src/components/plantafel/views/projektmanager.tsx src/components/plantafel/views/buchbinderei.tsx src/components/plantafel/views/logistik.tsx src/components/plantafel/sidebar.tsx
git commit -m "feat(views): NEU badge in PM, Trocknungszeit badge in Buchbinderei, Palette offen warning in Logistik, bundled bell notifications in Sidebar"
```

---

## Implementation Order

Execute tasks in this order to avoid type errors cascading:

1. **Task 1** (mock-data.ts) — all type/data changes first
2. **Task 2** (job-badges.tsx) — new file, depends only on Job type
3. **Task 3** (produktionsleitung.tsx) — consumes JobBadges
4. **Task 5** (SLOTS_BY_MACHINE grid wiring) — safe to do before KI refactor
5. **Task 4** (TascheCard badges + reason type) — extends PlacedJob interface before Task 6 replaces it
6. **Task 6** (planning-ai.ts) — depends on SLOTS_BY_MACHINE being in mock-data
7. **Task 7** (KI integration in wochenplanung) — imports from planning-ai.ts
8. **Task 8** (satellite views + sidebar) — independent, can run in parallel with Tasks 3–7

## Potential Pitfalls

- **PlacedJob double-definition**: Tasks 4 and 7 both touch the PlacedJob type. In Task 4 add `reason?: string` to the local interface; in Task 7 delete the local interface and import from planning-ai.ts. Do not do both in the same edit pass.
- **SLOTS import removal**: When switching from `SLOTS` to `SLOTS_BY_MACHINE` in wochenplanung.tsx, ensure `SLOTS` is also removed from the import statement or TypeScript will complain about an unused import.
- **Nacht slots in drop handler**: The `handleDrop` guard added in Task 5 Step 3 ensures that dragging an RZK card over a CD Nacht slot (which only appears for CD) is correctly rejected.
- **deliveryOrdinal in logistik**: The `daysUntilDelivery` helper hard-codes today as 20.05. For a production build this would use `new Date()`, but in this mock prototype the date is fixed to `TODAY_INDEX=0` (Mo 20.05.2026).
