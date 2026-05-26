# Wochenplanung Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the Wochenplanung view so new orders are immediately recognizable, key job facts are visible on cards, cards feel clickable, and the overall layout is cleaner and more readable — inspired by Calendar.me and Boardmix reference designs.

**Architecture:** All visual changes are in `wochenplanung.tsx` (sub-components `AuftragKarte`, `EingangKarte`, `EingangStreifen`, `TascheCard`) and a single CSS animation addition to `styles.css`. No data model changes. No new files except the CSS keyframe.

**Tech Stack:** React 19, TypeScript, Tailwind 4, OKLCH colors, DM Sans/DM Mono fonts, no emoji (per project rules)

**Working directory for all commands:** `/Users/julienoffray/Documents/HFG/7Semester/BA-Druckerei/Prototype1/.worktrees/wochenplanung-v2`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/components/plantafel/views/wochenplanung.tsx` | Modify | `AuftragKarte`, `FlagChip` (new helper), `EingangKarte`, `EingangStreifen`, `TascheCard`, today-column border |
| `src/styles.css` | Modify | Add `neu-ring` keyframe + class for pulsing card glow on Eingang cards |

---

## Task 1: AuftragKarte — hover elevation, better hierarchy, FlagChip helper

**Files:**
- Modify: `src/components/plantafel/views/wochenplanung.tsx` — `AuftragKarte` function (~line 869) + add `FlagChip` helper after it

**What this achieves:** Cards feel clickable (hover elevation). Customer name is the dominant visual element. Hours + delivery date are always visible when space allows. Flags (Lack, Grammatur, Sonderfarbe, Gepinnt) display as compact colored chips. Delivery date turns amber/red when the job is behind schedule.

- [ ] **Step 1: Read the current `AuftragKarte` function**

Read `src/components/plantafel/views/wochenplanung.tsx` lines 869–973. Understand the current structure before editing.

- [ ] **Step 2: Replace `AuftragKarte` with the improved version**

Replace the entire `AuftragKarte` function (from `function AuftragKarte(` to its closing `}`) with:

```tsx
function FlagChip({
  label,
  accent,
}: {
  label: string;
  accent?: string;
}) {
  return (
    <span
      className="text-[7px] rounded px-1 py-0.5 font-medium leading-none"
      style={{
        background: accent
          ? `color-mix(in oklab, ${accent} 15%, white)`
          : "oklch(1 0 0 / 0.55)",
        color: accent ?? "oklch(0.40 0.04 0)",
      }}
    >
      {label}
    </span>
  );
}

function AuftragKarte({
  gridJob,
  fullJob,
  top,
  height,
  isPinned,
  isAi,
  isNew,
  color,
  onRemove,
  onClick,
}: {
  gridJob: GridJob;
  fullJob: Job | undefined;
  top: number;
  height: number;
  isPinned: boolean;
  isAi: boolean;
  isNew: boolean;
  color: string;
  onRemove: () => void;
  onClick: () => void;
}) {
  const style = fullJob
    ? cardStyle(fullJob, isPinned)
    : {
        background: "oklch(0.93 0.07 145 / 0.9)",
        border: "1.5px solid oklch(0.55 0.18 145)",
      };

  const aiStyle: React.CSSProperties = isAi
    ? {
        background: "oklch(0.95 0.04 280)",
        border: "1.5px dashed oklch(0.55 0.22 258 / 0.7)",
      }
    : {};

  const deliveryColor =
    fullJob?.status === "Hinterher"
      ? "oklch(0.52 0.20 25)"
      : fullJob?.status === "Knapp"
      ? "oklch(0.55 0.16 55)"
      : "oklch(0.45 0.04 0)";

  return (
    <div
      className={`absolute group cursor-pointer rounded-lg overflow-hidden transition-all duration-150 hover:shadow-[0_3px_12px_oklch(0_0_0/0.18)] hover:brightness-[1.03] ${
        isNew ? "pop-in" : ""
      } ${isAi ? "ki-pulse" : ""}`}
      style={{
        top,
        height,
        left: 4,
        right: 4,
        ...style,
        ...aiStyle,
      }}
      onClick={onClick}
    >
      {!isAi && (
        <div style={{ height: 3, backgroundColor: color, flexShrink: 0 }} />
      )}

      <div className="px-1.5 pt-1 pb-0.5 overflow-hidden flex flex-col" style={{ height: height - (isAi ? 0 : 3) }}>
        {height >= 36 && (
          <div
            className="text-[11px] font-bold truncate leading-tight"
            style={{ color: isAi ? "oklch(0.40 0.22 258)" : undefined }}
          >
            {isAi && "✦ "}
            {gridJob.customer}
          </div>
        )}

        {height >= 52 && fullJob && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[9px] font-mono text-muted-foreground">
              {fullJob.druckzeitStunden}h
            </span>
            <span className="text-[9px] text-muted-foreground/40">·</span>
            <span className="text-[9px] font-mono" style={{ color: deliveryColor }}>
              {gridJob.delivery}
            </span>
          </div>
        )}

        {height >= 68 && fullJob && (
          <div className="flex flex-wrap gap-0.5 mt-auto pb-0.5">
            {fullJob.dispersionslack && <FlagChip label="Lack" />}
            {fullJob.grammatur && (
              <FlagChip label={`${fullJob.grammatur}g`} />
            )}
            {fullJob.sonderfarbe && (
              <FlagChip label="Sonderf." accent="oklch(0.62 0.16 50)" />
            )}
            {isPinned && <FlagChip label="Gepinnt" accent="oklch(0.55 0.22 280)" />}
            {(fullJob.prioritaet === "eilig" ||
              fullJob.prioritaet === "express") && (
              <FlagChip label={fullJob.prioritaet} accent="oklch(0.62 0.16 50)" />
            )}
          </div>
        )}

        {isAi && gridJob.aiSuggested && gridJob.reason && height >= 80 && (
          <div className="text-[7px] italic text-muted-foreground mt-0.5 leading-tight opacity-80 overflow-hidden">
            {gridJob.reason}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-0.5 right-0.5 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/70 transition"
        aria-label="Entfernen"
      >
        <X className="h-2.5 w-2.5 text-muted-foreground" />
      </button>
    </div>
  );
}
```

**Important:** `FlagChip` must be defined **before** `AuftragKarte` in the file so TypeScript can see it.

- [ ] **Step 3: Verify build**

```bash
bun run build 2>&1 | tail -8
```

Expected: `✓ built in X.XXs` — no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/plantafel/views/wochenplanung.tsx
git commit -m "feat: AuftragKarte hover elevation, bold hierarchy, FlagChip badges"
```

---

## Task 2: EingangKarte pulse animation + EingangStreifen redesign

**Files:**
- Modify: `src/styles.css` — add `neu-ring` keyframe + class
- Modify: `src/components/plantafel/views/wochenplanung.tsx` — `EingangKarte` and `EingangStreifen` functions

**What this achieves:** Cards in the Eingang pulsate with a subtle blue ring so "new orders" are unmistakably visible. The NEU badge uses the existing `pulse-chip` animation. The EingangStreifen gets a left accent border and a cleaner header. Key facts (machine, hours, delivery, Lack/Sonderfarbe) all visible on each Eingang card.

- [ ] **Step 1: Add `neu-ring` animation to `src/styles.css`**

In `src/styles.css`, find the `pulse-chip` block (around line 280). Add directly after the closing `}` of `.pulse-chip`:

```css
  @keyframes neu-ring {
    0%, 100% { box-shadow: 0 0 0 0 oklch(0.52 0.18 255 / 0.45); }
    50%       { box-shadow: 0 0 0 5px oklch(0.52 0.18 255 / 0); }
  }
  .neu-ring {
    animation: neu-ring 2.2s ease-in-out infinite;
  }
```

- [ ] **Step 2: Replace `EingangKarte` function in `wochenplanung.tsx`**

Replace the entire `EingangKarte` function (from `function EingangKarte(` to its closing `}`) with:

```tsx
function EingangKarte({
  job,
  onDragStart,
  onDragEnd,
}: {
  job: Job;
  onDragStart: (machine: Machine) => void;
  onDragEnd: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const machineColor = MACHINE_META[job.machine].color;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("jobId", job.id);
        setIsDragging(true);
        onDragStart(job.machine);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      className={`shrink-0 rounded-xl select-none transition-all overflow-hidden ${
        isDragging
          ? "opacity-40 scale-95 cursor-grabbing"
          : "cursor-grab hover:shadow-md hover:-translate-y-0.5 neu-ring"
      }`}
      style={{
        background: "oklch(0.97 0.02 255)",
        border: "1.5px solid oklch(0.65 0.10 255)",
        minWidth: 152,
      }}
    >
      <div style={{ height: 3, backgroundColor: machineColor }} />
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              backgroundColor: `color-mix(in oklab, ${machineColor} 15%, white)`,
              color: machineColor,
            }}
          >
            {job.machine}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[8px] font-bold pulse-chip"
            style={{
              background: "oklch(0.35 0.18 145 / 0.12)",
              color: "oklch(0.30 0.16 145)",
            }}
          >
            NEU
          </span>
          {job.prioritaet && job.prioritaet !== "normal" && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                background: "oklch(0.93 0.12 50 / 0.25)",
                color: "oklch(0.50 0.18 50)",
              }}
            >
              {job.prioritaet}
            </span>
          )}
        </div>

        <div className="text-xs font-bold truncate" style={{ maxWidth: 140 }}>
          {job.customer}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[9px] font-mono text-muted-foreground">
            {job.druckzeitStunden}h
          </span>
          <span className="text-[9px] text-muted-foreground/40">·</span>
          <span
            className="text-[9px] font-mono"
            style={{ color: "oklch(0.50 0.08 25)" }}
          >
            {job.delivery}
          </span>
        </div>

        {(job.dispersionslack || job.sonderfarbe) && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {job.dispersionslack && (
              <span className="text-[7px] bg-white/70 rounded px-1 py-0.5 text-muted-foreground font-medium">
                Lack
              </span>
            )}
            {job.sonderfarbe && (
              <span
                className="text-[7px] rounded px-1 py-0.5 font-medium"
                style={{
                  background: "oklch(0.93 0.12 50 / 0.18)",
                  color: "oklch(0.50 0.16 50)",
                }}
              >
                {job.sonderfarbe}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `EingangStreifen` function**

Replace the entire `EingangStreifen` function with:

```tsx
function EingangStreifen({
  jobs,
  onDragStart,
  onDragEnd,
  onKiVorschlag,
}: {
  jobs: Job[];
  onDragStart: (machine: Machine) => void;
  onDragEnd: () => void;
  onKiVorschlag: () => void;
}) {
  return (
    <div
      className="shrink-0 border-b border-border px-6 py-3"
      style={{
        background: "oklch(0.97 0.02 255 / 0.6)",
        borderLeft: "3px solid oklch(0.60 0.14 255)",
      }}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
            Neue Aufträge
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold pulse-chip"
            style={{
              background: "oklch(0.55 0.18 255 / 0.15)",
              color: "oklch(0.38 0.16 255)",
            }}
          >
            {jobs.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onKiVorschlag}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.48 0.19 295))",
          }}
        >
          <Sparkles className="h-3 w-3" />
          KI-Vorschlag
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {jobs.map((job) => (
          <EingangKarte
            key={job.id}
            job={job}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
bun run build 2>&1 | tail -8
```

Expected: `✓ built in X.XXs` — no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/components/plantafel/views/wochenplanung.tsx
git commit -m "feat: EingangKarte neu-ring pulse, EingangStreifen accent border, key facts visible"
```

---

## Task 3: TascheCard key facts + today-column left accent

**Files:**
- Modify: `src/components/plantafel/views/wochenplanung.tsx` — `TascheCard` function + today-column cell style in `WochenplanungView`

**What this achieves:** Auftragstasche cards show delivery date, Lack/Sonderfarbe flags, and Eilig/Express urgency visibly. The today column gets a subtle amber left-border on each cell so it stands out more without being distracting — matching the Calendar.me reference.

- [ ] **Step 1: Replace `TascheCard` function**

Replace the entire `TascheCard` function (from `function TascheCard(` to its closing `}`) with:

```tsx
function TascheCard({
  job,
  color,
  onDragStart,
  onDragEnd,
  onToggleFestgepinnt: _onToggleFestgepinnt,
}: {
  job: Job;
  color: string;
  onDragStart: (machine: Machine) => void;
  onDragEnd: () => void;
  onToggleFestgepinnt?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const deliveryColor =
    job.status === "Hinterher"
      ? "oklch(0.52 0.20 25)"
      : job.status === "Knapp"
      ? "oklch(0.55 0.16 55)"
      : "oklch(0.45 0.04 0)";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("jobId", job.id);
        setIsDragging(true);
        onDragStart(job.machine);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      className={`drag-card rounded-xl select-none overflow-hidden ${
        isDragging ? "dragging" : ""
      }`}
      style={{
        border: `1px solid color-mix(in oklab, ${color} 25%, var(--border))`,
        backgroundColor: `color-mix(in oklab, ${color} 8%, var(--card))`,
      }}
    >
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="px-3 py-2">
        {/* Top row: machine + delivery + urgency */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              backgroundColor: `color-mix(in oklab, ${color} 18%, white)`,
              color,
            }}
          >
            {job.machine}
          </span>
          <span
            className="text-[9px] font-mono font-semibold"
            style={{ color: deliveryColor }}
          >
            {job.delivery}
          </span>
          {job.prioritaet && job.prioritaet !== "normal" && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                background: "oklch(0.93 0.12 50 / 0.25)",
                color: "oklch(0.50 0.18 50)",
              }}
            >
              {job.prioritaet}
            </span>
          )}
          {job.festgepinnt && (
            <span className="text-[8px] text-muted-foreground font-medium">
              Gepinnt
            </span>
          )}
        </div>

        {/* Customer name */}
        <div className="text-xs font-bold leading-tight truncate">{job.customer}</div>

        {/* Hours + flags */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {job.druckzeitStunden && (
            <span className="text-[9px] font-mono text-muted-foreground">
              {job.druckzeitStunden}h
            </span>
          )}
          {job.dispersionslack && (
            <span className="text-[8px] bg-white/60 rounded px-1 py-0.5 text-muted-foreground font-medium">
              Lack
            </span>
          )}
          {job.sonderfarbe && (
            <span
              className="text-[8px] rounded px-1 py-0.5 font-medium"
              style={{
                background: "oklch(0.93 0.12 50 / 0.18)",
                color: "oklch(0.50 0.16 50)",
              }}
            >
              Sonderf.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add today-column left accent in `WochenplanungView`**

In `WochenplanungView`, find the two places where today-column cells are rendered for CD/SM5 rows and RZK rows. They currently use `bg-[oklch(0.97_0.06_95/0.5)]`. Change **both** occurrences to add a left border:

Find this pattern (appears twice — once in the CD/SM5 block, once in the RZK block):
```tsx
className={`border-l border-border p-1.5 space-y-1 ${
  isToday ? "bg-[oklch(0.97_0.06_95/0.5)]" : ""
}`}
```

Replace with (CD/SM5 version):
```tsx
className={`border-l border-border p-1.5 space-y-1 ${
  isToday ? "bg-[oklch(0.97_0.06_95/0.5)]" : ""
}`}
style={isToday ? { borderLeft: "3px solid oklch(0.72 0.14 85)" } : undefined}
```

Find the RZK version:
```tsx
className={`border-l border-border p-1.5 ${
  isToday ? "bg-[oklch(0.97_0.06_95)]" : ""
}`}
```

Replace with:
```tsx
className={`border-l border-border p-1.5 ${
  isToday ? "bg-[oklch(0.97_0.06_95)]" : ""
}`}
style={isToday ? { borderLeft: "3px solid oklch(0.72 0.14 85)" } : undefined}
```

- [ ] **Step 3: Verify build**

```bash
bun run build 2>&1 | tail -8
```

Expected: `✓ built in X.XXs` — no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/plantafel/views/wochenplanung.tsx
git commit -m "feat: TascheCard key facts, delivery urgency color, today-column amber accent"
```

---

## Verification Checklist (after all 3 tasks)

- [ ] Build passes: `bun run build` shows `✓ built` with no errors
- [ ] AuftragKarte: hover shows elevation shadow + brightness
- [ ] AuftragKarte: `FlagChip` renders Lack/Grammatur/Sonderfarbe/Gepinnt
- [ ] AuftragKarte: delivery date is red/amber for `Hinterher`/`Knapp` status
- [ ] EingangKarte: `neu-ring` pulsing glow visible, `pulse-chip` on NEU badge
- [ ] EingangKarte: machine-colored top bar, all key facts (machine, hours, delivery, flags)
- [ ] EingangStreifen: left blue accent border, "Neue Aufträge" label with pulsing count
- [ ] TascheCard: delivery date colored by urgency, Lack/Sonderfarbe chips visible
- [ ] Today column: amber `3px` left border visible on current-week cells
