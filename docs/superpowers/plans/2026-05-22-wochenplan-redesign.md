# Wochenplan Redesign — Sub-Projekt 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Wochenplanung view with proportional time blocks, week navigation, a new-orders inbox (EingangStreifen), and extract the AuftragDrawer into a shared component.

**Architecture:** Extend `Job` with 6 new fields and add 12 mock jobs; extract `AuftragDrawer` from `produktionsleitung.tsx` into its own file with new Planung/Kaskadenwarnung sections; completely rewrite `wochenplanung.tsx` with a proportional grid (cards sized by `druckzeitStunden / 8 * 160px`), week navigation via `currentWeekOffset`, and a horizontal `EingangStreifen` for `isNew` jobs. Grid state changes from `Record<SlotKey, GridJob>` to `Record<SlotKey, GridJob[]>` to support stacking multiple jobs per shift cell.

**Tech Stack:** React 19 + TypeScript + Tailwind 4 + OKLCH colors + HTML5 DnD (no library) — pure `useState`, no backend.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/lib/mock-data.ts` | Modify | Add 6 new fields to `Job` interface; add 12 new mock jobs (#2024-0860–#2024-0871) |
| `src/components/plantafel/auftrag-drawer.tsx` | **Create** | Extract `AuftragDrawer`, `Section`, `Row` from produktionsleitung; add Druckdetails extended, Planung section, Kaskadenwarnung |
| `src/components/plantafel/views/produktionsleitung.tsx` | Modify | Replace inline `AuftragDrawer`/`Section`/`Row` with import from new file; add `onPrioritaetChange`/`onNotizChange` handlers |
| `src/components/plantafel/views/wochenplanung.tsx` | **Rewrite** | New proportional grid, week navigation, EingangStreifen, RZK collapsible, Digi status strip |

---

## Task 1: Extend Job data model + add 12 mock jobs

**Files:**
- Modify: `src/lib/mock-data.ts:29-64` (Job interface) and end of JOBS array

- [ ] **Step 1: Add 6 new fields to the `Job` interface**

In `src/lib/mock-data.ts`, after the `paletten` field (line 63), add:

```typescript
  // --- Wochenplan Redesign additions ---
  prioritaet?: "normal" | "eilig" | "express";
  notiz?: string | null;
  seitenanzahl?: number | null;
  auflage?: number;
  druckdatenEingang?: string | null;  // "DD.MM." format; null = not yet received
  weiterverarbeitungStunden?: number;
```

- [ ] **Step 2: Add 12 new mock jobs to the JOBS array**

Append these 12 entries at the end of the `JOBS` array in `src/lib/mock-data.ts` (before the closing `];`):

```typescript
  // --- Wochenplan Redesign mock jobs ---
  {
    id: "#2024-0860",
    customer: "Bosch E-Bike GmbH",
    product: "Broschüre A4",
    machine: "CD",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Nach Plan",
    delivery: "27.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Falzen",
    finishingHours: 2,
    paper: "Bilderdruck matt 135g",
    druckzeitStunden: 4.5,
    dispersionslack: true,
    grammatur: 135,
    prioritaet: "normal",
    auflage: 8000,
    seitenanzahl: 8,
    druckdatenEingang: "19.05.",
    weiterverarbeitungStunden: 2,
  },
  {
    id: "#2024-0861",
    customer: "Kirchengemeindeblatt",
    product: "Gemeindebrief 16-seitig",
    machine: "CD",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Nach Plan",
    delivery: "28.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Falzen",
    finishingHours: 3,
    paper: "Offsetdruck 90g",
    druckzeitStunden: 8,
    dispersionslack: true,
    sonderfarbe: "HKS 43",
    grammatur: 90,
    festgepinnt: true,
    prioritaet: "normal",
    auflage: 3000,
    seitenanzahl: 16,
    druckdatenEingang: "17.05.",
    weiterverarbeitungStunden: 3,
  },
  {
    id: "#2024-0862",
    customer: "Buteros Catering",
    product: "Speisekarte",
    machine: "CD",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Hinterher",
    delivery: "28.05.",
    openSubsteps: 1,
    druckfreigabe: "Erteilt",
    finishing: "Schneiden",
    finishingHours: 1,
    paper: "Bilderdruck glänzend 170g",
    druckzeitStunden: 5,
    cascadeConflict: true,
    grammatur: 170,
    prioritaet: "express",
    auflage: 500,
    seitenanzahl: 4,
    druckdatenEingang: "20.05.",
    weiterverarbeitungStunden: 1,
  },
  {
    id: "#2024-0863",
    customer: "Literaturhaus Stuttgart",
    product: "Programmheft",
    machine: "CD",
    phase: "Vorstufe",
    orderStatus: "Druckfreigabe",
    status: "Nach Plan",
    delivery: "30.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Heften",
    finishingHours: 2,
    paper: "Munken Pure 120g",
    druckzeitStunden: 6,
    grammatur: 120,
    isNew: true,
    prioritaet: "normal",
    auflage: 1200,
    seitenanzahl: 24,
    druckdatenEingang: null,
    weiterverarbeitungStunden: 2,
  },
  {
    id: "#2024-0864",
    customer: "Logoprint Express",
    product: "Flyer DIN lang",
    machine: "SM5",
    phase: "Vorstufe",
    orderStatus: "Druckfreigabe",
    status: "Nach Plan",
    delivery: "26.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Schneiden",
    finishingHours: 1,
    paper: "Bilderdruck glänzend 135g",
    druckzeitStunden: 2,
    sonderfarbe: "Gold",
    grammatur: 135,
    isNew: true,
    prioritaet: "eilig",
    auflage: 10000,
    seitenanzahl: 2,
    druckdatenEingang: "20.05.",
    weiterverarbeitungStunden: 1,
  },
  {
    id: "#2024-0865",
    customer: "Rossmann GmbH",
    product: "Produktkatalog",
    machine: "SM5",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Nach Plan",
    delivery: "26.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Binden",
    finishingHours: 4,
    paper: "Bilderdruck matt 135g",
    druckzeitStunden: 3,
    dispersionslack: false,
    grammatur: 135,
    prioritaet: "normal",
    auflage: 20000,
    seitenanzahl: 48,
    druckdatenEingang: "16.05.",
    weiterverarbeitungStunden: 4,
  },
  {
    id: "#2024-0866",
    customer: "Mustermann GmbH",
    product: "Jahresbericht",
    machine: "CD",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Nach Plan",
    delivery: "27.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Binden",
    finishingHours: 3,
    paper: "Bilderdruck matt 135g",
    druckzeitStunden: 4.5,
    dispersionslack: true,
    grammatur: 135,
    festgepinnt: true,
    prioritaet: "normal",
    auflage: 500,
    seitenanzahl: 32,
    druckdatenEingang: "18.05.",
    weiterverarbeitungStunden: 3,
  },
  {
    id: "#2024-0867",
    customer: "Metallbau Hoffmann",
    product: "Firmenbroschüre",
    machine: "SM5",
    phase: "Vorstufe",
    orderStatus: "Druckfreigabe",
    status: "Nach Plan",
    delivery: "03.06.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Falzen",
    finishingHours: 2,
    paper: "Bilderdruck matt 170g",
    druckzeitStunden: 6,
    sonderfarbe: "Pantone 877 C Silber",
    grammatur: 170,
    isNew: true,
    prioritaet: "normal",
    auflage: 2000,
    seitenanzahl: 16,
    druckdatenEingang: null,
    weiterverarbeitungStunden: 2,
  },
  {
    id: "#2024-0868",
    customer: "Dresdner Druck GmbH",
    product: "Flyer A5",
    machine: "CD",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Nach Plan",
    delivery: "29.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Schneiden",
    finishingHours: 1,
    paper: "Bilderdruck glänzend 170g",
    druckzeitStunden: 3.5,
    dispersionslack: true,
    grammatur: 170,
    prioritaet: "normal",
    auflage: 15000,
    seitenanzahl: 2,
    druckdatenEingang: "19.05.",
    weiterverarbeitungStunden: 1,
  },
  {
    id: "#2024-0869",
    customer: "Schmidt Verlag",
    product: "Buchumschlag",
    machine: "RZK",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Nach Plan",
    delivery: "25.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishingHours: 1,
    paper: "Chromokarton 300g",
    druckzeitStunden: 3,
    grammatur: 300,
    prioritaet: "normal",
    auflage: 800,
    seitenanzahl: 1,
    druckdatenEingang: "15.05.",
    weiterverarbeitungStunden: 1,
  },
  {
    id: "#2024-0870",
    customer: "Weber AG",
    product: "Visitenkarten",
    machine: "Digi",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Nach Plan",
    delivery: "22.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    prioritaet: "normal",
    auflage: 500,
    seitenanzahl: 2,
    druckdatenEingang: "20.05.",
  },
  {
    id: "#2024-0871",
    customer: "Meyer Consulting",
    product: "Präsentation",
    machine: "Digi",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Nach Plan",
    delivery: "29.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    prioritaet: "normal",
    auflage: 50,
    seitenanzahl: 20,
    druckdatenEingang: "19.05.",
  },
```

- [ ] **Step 3: Verify build passes**

```bash
bun run build
```

Expected: no TypeScript errors. If TypeScript errors appear, they will be about the new optional fields — confirm all new fields in the interface are marked `?`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "feat: extend Job interface with 6 new fields, add 12 Wochenplan mock jobs"
```

---

## Task 2: Create shared AuftragDrawer component

**Files:**
- Create: `src/components/plantafel/auftrag-drawer.tsx`

This file extracts `AuftragDrawer`, `Section`, and `Row` from `produktionsleitung.tsx` and extends them with four new/extended sections per the spec.

- [ ] **Step 1: Create `src/components/plantafel/auftrag-drawer.tsx`**

Write the entire file:

```typescript
import { type Job } from "@/lib/mock-data";
import { ZeitPill } from "@/components/plantafel/zeit-pill";
import { JobBadges } from "@/components/plantafel/job-badges";
import { PHASES, MACHINE_META } from "@/lib/mock-data";
import {
  AlertTriangle, Clock, Package, Layers, FileText,
  Truck, X, Settings,
} from "lucide-react";

export interface AuftragDrawerProps {
  job: Job;
  onClose: () => void;
  onToggleFestgepinnt?: () => void;
  onPrioritaetChange?: (p: "normal" | "eilig" | "express") => void;
  onNotizChange?: (text: string) => void;
}

export function AuftragDrawer({
  job,
  onClose,
  onToggleFestgepinnt,
  onPrioritaetChange,
  onNotizChange,
}: AuftragDrawerProps) {
  const meta = MACHINE_META[job.machine];
  const currentIdx = PHASES.indexOf(job.phase);

  return (
    <>
      <div className="fixed inset-0 bg-foreground/10 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-110 bg-card drawer-panel z-50 overflow-y-auto flex flex-col">
        {/* Header */}
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
          <JobBadges job={job} onToggleFestgepinnt={onToggleFestgepinnt} />
        </div>

        {/* Produktionsfortschritt */}
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
          {/* Termin & Versand */}
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
                        ? "text-machine-rzk"
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
                        : "text-machine-cd"
                    }`}
                  >
                    {job.druckfreigabe}
                  </span>
                }
              />
            )}
          </Section>

          {/* Druckdetails — extended */}
          <Section icon={<Layers className="h-3.5 w-3.5" />} title="Druckdetails">
            {job.paper && <Row label="Papier" value={job.paper} />}
            {job.auflage !== undefined && (
              <Row label="Auflage" value={`${job.auflage.toLocaleString("de-DE")} Stk.`} mono />
            )}
            {job.quantity && !job.auflage && <Row label="Auflage" value={job.quantity} mono />}
            {job.seitenanzahl !== undefined && job.seitenanzahl !== null && (
              <Row label="Seitenanzahl" value={`${job.seitenanzahl} Seiten`} mono />
            )}
            {job.grammatur !== undefined && (
              <Row label="Grammatur" value={`${job.grammatur} g/m²`} mono />
            )}
            {job.druckzeitStunden !== undefined && (
              <Row label="Druckzeit" value={`~${job.druckzeitStunden} h`} mono />
            )}
            {job.druckdatenEingang !== undefined && (
              <Row
                label="Druckdaten-Eingang"
                value={
                  job.druckdatenEingang ? (
                    <span>{job.druckdatenEingang}</span>
                  ) : (
                    <span style={{ color: "oklch(0.50 0.20 25)", fontWeight: 600 }}>
                      Noch nicht eingegangen
                    </span>
                  )
                }
              />
            )}
            {job.dispersionslack !== undefined && (
              <Row
                label="Dispersionslack"
                value={
                  job.dispersionslack ? (
                    <span style={{ color: "oklch(0.38 0.14 153)" }}>
                      Ja — Lackwerk-Reinigung ~1.5h einplanen
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Nein</span>
                  )
                }
              />
            )}
            {job.sonderfarbe && (
              <Row
                label="Sonderfarbe"
                value={
                  <span className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                    <span>{job.sonderfarbe}</span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{
                        background: "oklch(0.93 0.12 50 / 0.25)",
                        color: "oklch(0.50 0.18 50)",
                      }}
                    >
                      Lagerbestand prüfen
                    </span>
                  </span>
                }
              />
            )}
          </Section>

          {/* Weiterverarbeitung — extended */}
          {(job.finishing || job.weiterverarbeitungStunden !== undefined) && (
            <Section icon={<Package className="h-3.5 w-3.5" />} title="Weiterverarbeitung">
              {job.finishing && <Row label="Verfahren" value={job.finishing} />}
              {job.finishingHours !== undefined && (
                <Row label="Finishingzeit" value={`ca. ${job.finishingHours}h`} mono />
              )}
              {job.weiterverarbeitungStunden !== undefined && (
                <Row
                  label="WV-Stunden gesamt"
                  value={`${job.weiterverarbeitungStunden}h`}
                  mono
                />
              )}
              {(job.paper?.toLowerCase().includes("metallic") || !!job.sonderfarbe) && (
                <div
                  className="mt-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium"
                  style={{
                    background: "oklch(0.95 0.08 60 / 0.4)",
                    color: "oklch(0.50 0.16 55)",
                  }}
                >
                  ⏱ 2 Tage Trocknungszeit beachten
                </div>
              )}
            </Section>
          )}

          {/* Offene Schritte */}
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

          {/* Planung — new */}
          <Section icon={<Settings className="h-3.5 w-3.5" />} title="Planung">
            {onToggleFestgepinnt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Festgepinnt</span>
                <button
                  type="button"
                  onClick={onToggleFestgepinnt}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    job.festgepinnt
                      ? "bg-[oklch(0.92_0.08_280)] text-[oklch(0.35_0.20_280)]"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {job.festgepinnt ? "🔒 Gepinnt" : "Pinnen"}
                </button>
              </div>
            )}
            {onPrioritaetChange && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Priorität</span>
                <div className="flex gap-1">
                  {(["normal", "eilig", "express"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onPrioritaetChange(p)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition capitalize ${
                        job.prioritaet === p
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {onNotizChange !== undefined && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Notiz
                </span>
                <textarea
                  className="w-full rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-border"
                  rows={3}
                  placeholder="Interne Notiz..."
                  value={job.notiz ?? ""}
                  onChange={(e) => onNotizChange(e.target.value)}
                />
              </div>
            )}
          </Section>

          {/* Kaskadenwarnung — new */}
          {job.cascadeConflict && (
            <Section icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Kaskadenwarnung">
              <div
                className="rounded-lg p-3 text-xs space-y-1"
                style={{
                  background: "oklch(0.95 0.05 25)",
                  border: "1px solid oklch(0.85 0.10 25)",
                }}
              >
                <div className="font-semibold" style={{ color: "oklch(0.45 0.18 25)" }}>
                  Folgeaufträge betroffen
                </div>
                <div className="text-muted-foreground leading-relaxed">
                  Dieser Auftrag hat Verzögerungen, die nachfolgende Produktionsschritte
                  blockieren können. Weiterverarbeitung und Versand bitte prüfen.
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

export function Section({
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

export function Row({
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

- [ ] **Step 2: Verify build passes**

```bash
bun run build
```

Expected: no errors. If `ZeitPill` import path fails, check the correct relative path from `plantafel/` — it should be `"@/components/plantafel/zeit-pill"`.

- [ ] **Step 3: Commit**

```bash
git add src/components/plantafel/auftrag-drawer.tsx
git commit -m "feat: create shared AuftragDrawer component with extended Druckdetails, Planung, Kaskadenwarnung"
```

---

## Task 3: Update produktionsleitung.tsx to use shared drawer

**Files:**
- Modify: `src/components/plantafel/views/produktionsleitung.tsx`

- [ ] **Step 1: Replace the import block and add the new AuftragDrawer import**

At the top of `produktionsleitung.tsx`, add this import after the existing imports:

```typescript
import { AuftragDrawer } from "@/components/plantafel/auftrag-drawer";
```

Remove `Clock, Package, Layers, FileText, Truck` from the lucide-react import (they are now only needed in auftrag-drawer.tsx). The remaining lucide imports should be:

```typescript
import {
  AlertTriangle, Zap, X, TrendingDown, ArrowRight, Activity, Printer,
  AlertOctagon, FileWarning, ChevronDown, ChevronUp,
} from "lucide-react";
```

- [ ] **Step 2: Add local `prioritaet` and `notiz` override state**

Inside `ProduktionsleitungView`, after the `pinnedIds` state (around line 54), add:

```typescript
const [prioritaetOverrides, setPrioritaetOverrides] = useState<Record<string, Job["prioritaet"]>>({});
const [notizOverrides, setNotizOverrides] = useState<Record<string, string>>({});
```

- [ ] **Step 3: Replace the selectedJob rendering in the return JSX**

Find the block that renders `AuftragDrawer` (around line 443–447). Replace it with:

```tsx
{selectedJob && (
  <AuftragDrawer
    job={{
      ...selectedJob,
      festgepinnt: pinnedIds.has(selectedJob.id),
      prioritaet: prioritaetOverrides[selectedJob.id] ?? selectedJob.prioritaet,
      notiz: notizOverrides[selectedJob.id] ?? selectedJob.notiz,
    }}
    onClose={() => setSelectedJob(null)}
    onToggleFestgepinnt={() => togglePinned(selectedJob.id)}
    onPrioritaetChange={(p) =>
      setPrioritaetOverrides((prev) => ({ ...prev, [selectedJob.id]: p }))
    }
    onNotizChange={(text) =>
      setNotizOverrides((prev) => ({ ...prev, [selectedJob.id]: text }))
    }
  />
)}
```

- [ ] **Step 4: Remove the inline `AuftragDrawer`, `Section`, and `Row` functions**

Delete the functions `AuftragDrawer` (starting around line 603), `Section` (around line 787), and `Row` (around line 805) from `produktionsleitung.tsx`. These are now in `auftrag-drawer.tsx`.

- [ ] **Step 5: Verify build passes**

```bash
bun run build
```

Expected: no errors. If there are "unused variable" errors from the removed icon imports, confirm Step 1 icon list is complete.

- [ ] **Step 6: Commit**

```bash
git add src/components/plantafel/views/produktionsleitung.tsx
git commit -m "refactor: use shared AuftragDrawer in ProduktionsleitungView"
```

---

## Task 4: Rewrite wochenplanung.tsx with proportional grid + week navigation

**Files:**
- Rewrite: `src/components/plantafel/views/wochenplanung.tsx`

This is a full file replacement. The new file has these sub-components:
- `WochenplanungView` — main component with all state
- `EingangStreifen` — horizontal inbox bar for isNew jobs
- `SchichtZelle` — one shift cell: `position:relative; height:160px`, drops allowed, renders `AuftragKarte` children
- `AuftragKarte` — `position:absolute`, proportional height = `(druckzeitStunden/8)*160px`
- `TascheCard` — sidebar card (unchanged from current version)
- `DigiRow` — 48px status strip for the Digi machine (no drag)

The grid state changes from `Record<SlotKey, GridJob>` to `Record<SlotKey, GridJob[]>` to support stacking.

The slot key format changes to `"${weekOffset}|${machine}|${day}|${slot}"` to store placements per week.

When calling `buildKIPlan`, its returned keys are in `"Machine|Day|Slot"` format — prefix them with `${currentWeekOffset}|` before storing.

- [ ] **Step 1: Replace the entire file with the new implementation**

```typescript
import { useState } from "react";
import {
  JOBS, MACHINE_META, WEEKDAYS, SLOTS_BY_MACHINE, TODAY_INDEX,
  type Job, type Machine, type Weekday, type Slot,
} from "@/lib/mock-data";
import { buildKIPlan, type PlacedJob } from "@/lib/planning-ai";
import { AuftragDrawer } from "@/components/plantafel/auftrag-drawer";
import { Check, Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type SlotKey = string;

interface ManualJob {
  jobId: string;
  customer: string;
  machine: Machine;
  delivery: string;
  phase: "Im Druck";
  aiSuggested: false;
  reason?: string;
}

type GridJob = PlacedJob | ManualJob;

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_MACHINES: Machine[] = ["CD", "SM5", "RZK", "Digi"];

const WEEK_META = [
  { kw: 21, label: "20.–24. Mai 2026" },
  { kw: 22, label: "27.–31. Mai 2026" },
  { kw: 23, label: "03.–07. Jun. 2026" },
  { kw: 24, label: "10.–14. Jun. 2026" },
];

const MAX_WEEK_OFFSET = WEEK_META.length - 1;

// Jobs with druckzeitStunden defined (or Digi jobs) are plannable in this view
const PLANNABLE_JOBS = JOBS.filter(
  (j) => j.druckzeitStunden !== undefined || j.machine === "Digi"
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slotKey(weekOffset: number, machine: Machine, day: Weekday, slot: Slot): SlotKey {
  return `${weekOffset}|${machine}|${day}|${slot}`;
}

function cardStyle(job: Job, isPinned: boolean): React.CSSProperties {
  let bg: string;
  let border: string;

  if (job.cascadeConflict) {
    bg = "oklch(0.93 0.10 25 / 0.9)";
    border = "1.5px solid oklch(0.55 0.22 25)";
  } else if (job.prioritaet === "express" || job.prioritaet === "eilig") {
    bg = "oklch(0.93 0.12 50 / 0.9)";
    border = "1.5px solid oklch(0.62 0.16 50)";
  } else if (
    job.druckfreigabe === "Fehlt" ||
    job.druckfreigabe === "Angefordert"
  ) {
    bg = "oklch(0.96 0.10 85 / 0.9)";
    border = "1.5px solid oklch(0.60 0.18 85)";
  } else {
    bg = "oklch(0.93 0.07 145 / 0.9)";
    border = "1.5px solid oklch(0.55 0.18 145)";
  }

  if (isPinned) {
    border = "2px solid oklch(0.55 0.22 280)";
  }

  return { background: bg, border };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WochenplanungView() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [grid, setGrid] = useState<Record<SlotKey, GridJob[]>>({});
  const [eingang, setEingang] = useState<Job[]>(() =>
    PLANNABLE_JOBS.filter((j) => j.isNew)
  );
  const [tasche, setTasche] = useState<Job[]>(() =>
    PLANNABLE_JOBS.filter(
      (j) => !j.isNew && j.machine !== "Digi" && j.druckzeitStunden !== undefined
    )
  );
  const [dragSourceMachine, setDragSourceMachine] = useState<Machine | null>(null);
  const [newlyPlaced, setNewlyPlaced] = useState<Set<SlotKey>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    () => new Set(JOBS.filter((j) => j.festgepinnt).map((j) => j.id))
  );
  const [expandedRzk, setExpandedRzk] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [prioritaetOverrides, setPrioritaetOverrides] = useState<
    Record<string, Job["prioritaet"]>
  >({});
  const [notizOverrides, setNotizOverrides] = useState<Record<string, string>>({});

  const hasKiSlots = Object.values(grid)
    .flat()
    .some((s) => s.aiSuggested);

  const selectedJob = selectedJobId
    ? JOBS.find((j) => j.id === selectedJobId) ?? null
    : null;

  function togglePinned(jobId: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  function handleKiPlan() {
    const allUnplaced = [...eingang, ...tasche];
    const plan = buildKIPlan(
      allUnplaced.map((j) => ({ ...j, festgepinnt: pinnedIds.has(j.id) }))
    );
    setGrid((prev) => {
      const merged: Record<SlotKey, GridJob[]> = { ...prev };
      for (const [planKey, slot] of Object.entries(plan)) {
        const key = `${currentWeekOffset}|${planKey}`;
        if (!merged[key] || merged[key].length === 0) {
          merged[key] = [slot];
        }
      }
      return merged;
    });
  }

  function confirmKiPlan() {
    setGrid((prev) => {
      const confirmed: Record<SlotKey, GridJob[]> = {};
      for (const [key, jobs] of Object.entries(prev)) {
        confirmed[key] = jobs.map(
          (gj) => ({ ...gj, aiSuggested: false }) as ManualJob
        );
      }
      return confirmed;
    });
    const placedIds = new Set(Object.values(grid).flat().map((gj) => gj.jobId));
    setEingang((prev) => prev.filter((j) => !placedIds.has(j.id)));
    setTasche((prev) => prev.filter((j) => !placedIds.has(j.id)));
  }

  function resetKiPlan() {
    setGrid((prev) => {
      const next: Record<SlotKey, GridJob[]> = {};
      for (const [key, jobs] of Object.entries(prev)) {
        const kept = jobs.filter((gj) => !gj.aiSuggested);
        if (kept.length > 0) next[key] = kept;
      }
      return next;
    });
  }

  function handleDrop(
    e: React.DragEvent,
    machine: Machine,
    day: Weekday,
    slot: Slot
  ) {
    e.preventDefault();
    const jobId = e.dataTransfer.getData("jobId");
    const job =
      eingang.find((j) => j.id === jobId) ??
      tasche.find((j) => j.id === jobId);
    if (!job) return;
    if (!SLOTS_BY_MACHINE[machine].includes(slot)) return;

    const key = slotKey(currentWeekOffset, machine, day, slot);
    const cellJobs = grid[key] ?? [];

    const newGridJob: ManualJob = {
      jobId: job.id,
      customer: job.customer,
      machine: job.machine,
      delivery: job.delivery,
      phase: "Im Druck",
      aiSuggested: false,
    };

    setGrid((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), newGridJob],
    }));

    if (eingang.find((j) => j.id === jobId)) {
      setEingang((prev) => prev.filter((j) => j.id !== jobId));
    } else {
      setTasche((prev) => prev.filter((j) => j.id !== jobId));
    }

    setNewlyPlaced((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setTimeout(() => {
      setNewlyPlaced((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 300);
    setDragSourceMachine(null);
  }

  function removeFromGrid(key: SlotKey, jobId: string) {
    setGrid((prev) => {
      const cell = prev[key] ?? [];
      const kept = cell.filter((gj) => gj.jobId !== jobId);
      const next = { ...prev };
      if (kept.length === 0) {
        delete next[key];
      } else {
        next[key] = kept;
      }
      return next;
    });
    const originalJob = JOBS.find((j) => j.id === jobId);
    if (!originalJob) return;
    if (originalJob.isNew) {
      setEingang((prev) =>
        prev.find((j) => j.id === jobId) ? prev : [...prev, originalJob]
      );
    } else {
      setTasche((prev) =>
        prev.find((j) => j.id === jobId) ? prev : [...prev, originalJob]
      );
    }
  }

  const weekInfo = WEEK_META[Math.min(currentWeekOffset, MAX_WEEK_OFFSET)];

  return (
    <div className="flex flex-col fade-swap" style={{ minHeight: "calc(100vh - 88px)" }}>
      {/* Page header */}
      <div className="px-8 pt-8 pb-5 shrink-0 border-b border-border">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Produktionsleitung · Wochenplanung
        </div>
        <h1 className="editorial-header text-4xl">Wochenplanung</h1>
      </div>

      {/* EingangStreifen */}
      {eingang.length > 0 && (
        <EingangStreifen
          jobs={eingang}
          onDragStart={(machine) => setDragSourceMachine(machine)}
          onDragEnd={() => setDragSourceMachine(null)}
          onKiVorschlag={handleKiPlan}
        />
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="soft-card overflow-hidden">
            {/* Week navigation header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
              <button
                type="button"
                onClick={() =>
                  setCurrentWeekOffset((o) => Math.max(0, o - 1))
                }
                disabled={currentWeekOffset === 0}
                className="rounded-lg p-1.5 hover:bg-muted transition disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold">KW {weekInfo.kw}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {weekInfo.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCurrentWeekOffset((o) =>
                    Math.min(MAX_WEEK_OFFSET, o + 1)
                  )
                }
                disabled={currentWeekOffset === MAX_WEEK_OFFSET}
                className="rounded-lg p-1.5 hover:bg-muted transition disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {currentWeekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentWeekOffset(0)}
                  className="text-xs text-muted-foreground hover:text-foreground transition px-2 py-1 rounded-lg hover:bg-muted"
                >
                  Heute
                </button>
              )}
            </div>

            {/* Day column headers */}
            <div
              className="grid border-b border-border bg-muted/20"
              style={{
                gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)`,
              }}
            >
              <div className="px-3 py-2 border-r border-border" />
              {WEEKDAYS.map((d, i) => {
                const isToday = currentWeekOffset === 0 && i === TODAY_INDEX;
                return (
                  <div
                    key={d}
                    className={`px-3 py-2 text-center border-l border-border ${
                      isToday ? "bg-[oklch(0.94_0.08_85)]" : ""
                    }`}
                  >
                    <div
                      className={`text-[10px] uppercase tracking-[0.14em] font-bold ${
                        isToday
                          ? "text-[oklch(0.42_0.16_85)]"
                          : "text-muted-foreground"
                      }`}
                    >
                      {d}
                    </div>
                    {isToday && (
                      <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[oklch(0.90_0.10_85)] px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.18_85)]" />
                        <span className="text-[9px] font-bold text-[oklch(0.42_0.16_85)]">
                          Heute
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Machine rows */}
            {ALL_MACHINES.map((machine) => {
              const color = MACHINE_META[machine].color;
              const slots = SLOTS_BY_MACHINE[machine];

              // Digi: status strip only
              if (machine === "Digi") {
                const digiJob = JOBS.find(
                  (j) =>
                    j.machine === "Digi" &&
                    j.orderStatus === "In Produktion"
                );
                const status = digiJob?.problem
                  ? { label: "Rückstau", color: "oklch(0.55 0.17 85)" }
                  : digiJob
                  ? { label: "Läuft", color: "oklch(0.45 0.18 145)" }
                  : { label: "Ok", color: "oklch(0.60 0.04 255)" };
                return (
                  <DigiRow key={machine} color={color} status={status} />
                );
              }

              // RZK: collapsible when empty
              if (machine === "RZK") {
                const rzkHasJobs = WEEKDAYS.some((day) =>
                  slots.some(
                    (slot) =>
                      (grid[slotKey(currentWeekOffset, machine, day, slot)] ?? []).length > 0
                  )
                );
                const isExpanded = rzkHasJobs || expandedRzk;

                return (
                  <div
                    key={machine}
                    className="border-b border-border last:border-0"
                    style={{ opacity: isExpanded ? 1 : 0.5 }}
                  >
                    {!isExpanded ? (
                      <div
                        className="grid cursor-pointer hover:opacity-80 transition"
                        style={{
                          gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)`,
                          height: 32,
                        }}
                        onClick={() => setExpandedRzk(true)}
                      >
                        <div className="flex items-center px-3 border-r border-border">
                          <span
                            className="text-xs font-black"
                            style={{ color }}
                          >
                            RZK
                          </span>
                          <span className="text-[9px] text-muted-foreground ml-1">
                            ▸
                          </span>
                        </div>
                        {WEEKDAYS.map((d) => (
                          <div
                            key={d}
                            className="border-l border-border flex items-center justify-center"
                          >
                            <span className="text-[9px] text-muted-foreground italic">
                              leer
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)`,
                        }}
                      >
                        <div className="flex flex-col items-center justify-center px-2 py-2 border-r border-border gap-0.5">
                          <button
                            type="button"
                            onClick={() => setExpandedRzk(false)}
                            className="text-[9px] text-muted-foreground hover:text-foreground transition"
                          >
                            ▴
                          </button>
                          <span
                            className="text-xs font-black"
                            style={{ color }}
                          >
                            RZK
                          </span>
                        </div>
                        {WEEKDAYS.map((day, di) => {
                          const isToday =
                            currentWeekOffset === 0 && di === TODAY_INDEX;
                          return (
                            <div
                              key={day}
                              className={`border-l border-border p-1.5 ${
                                isToday ? "bg-[oklch(0.97_0.06_95)]" : ""
                              }`}
                            >
                              {slots.map((slot) => {
                                const key = slotKey(
                                  currentWeekOffset,
                                  machine,
                                  day,
                                  slot
                                );
                                const cellJobs = grid[key] ?? [];
                                return (
                                  <SchichtZelle
                                    key={slot}
                                    slotName={slot}
                                    cellJobs={cellJobs}
                                    allJobs={JOBS}
                                    color={color}
                                    machine={machine}
                                    dragSourceMachine={dragSourceMachine}
                                    newlyPlaced={newlyPlaced}
                                    slotKeyVal={key}
                                    pinnedIds={pinnedIds}
                                    onDrop={(e) =>
                                      handleDrop(e, machine, day, slot)
                                    }
                                    onRemove={(jobId) =>
                                      removeFromGrid(key, jobId)
                                    }
                                    onCardClick={(jobId) =>
                                      setSelectedJobId(jobId)
                                    }
                                    height={100}
                                  />
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // CD and SM5: standard proportional rows
              const isCd = machine === "CD";
              return (
                <div
                  key={machine}
                  className="grid border-b border-border last:border-0"
                  style={{
                    gridTemplateColumns: `80px repeat(${WEEKDAYS.length}, 1fr)`,
                    background: isCd
                      ? `color-mix(in oklab, ${color} 4%, var(--background))`
                      : undefined,
                  }}
                >
                  {/* Machine label */}
                  <div className="flex flex-col items-center justify-center px-2 py-3 border-r border-border gap-1">
                    <span
                      className={`font-black ${isCd ? "text-base" : "text-sm"}`}
                      style={{ color }}
                    >
                      {machine}
                    </span>
                    <div
                      className="h-1 w-8 rounded-full"
                      style={{ backgroundColor: color, opacity: 0.4 }}
                    />
                    <div className="flex flex-col gap-0.5 mt-1 w-full px-1">
                      {slots.map((s) => (
                        <span
                          key={s}
                          className="text-[8px] text-muted-foreground text-center truncate"
                          style={{ lineHeight: `${160 / (isCd ? 1 : 1)}px` }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Day columns */}
                  {WEEKDAYS.map((day, di) => {
                    const isToday =
                      currentWeekOffset === 0 && di === TODAY_INDEX;
                    return (
                      <div
                        key={day}
                        className={`border-l border-border p-1.5 space-y-1 ${
                          isToday ? "bg-[oklch(0.97_0.06_95/0.5)]" : ""
                        }`}
                      >
                        {slots.map((slot) => {
                          const key = slotKey(
                            currentWeekOffset,
                            machine,
                            day,
                            slot
                          );
                          const cellJobs = grid[key] ?? [];
                          return (
                            <SchichtZelle
                              key={slot}
                              slotName={slot}
                              cellJobs={cellJobs}
                              allJobs={JOBS}
                              color={color}
                              machine={machine}
                              dragSourceMachine={dragSourceMachine}
                              newlyPlaced={newlyPlaced}
                              slotKeyVal={key}
                              pinnedIds={pinnedIds}
                              onDrop={(e) => handleDrop(e, machine, day, slot)}
                              onRemove={(jobId) => removeFromGrid(key, jobId)}
                              onCardClick={(jobId) => setSelectedJobId(jobId)}
                              height={160}
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

        {/* Auftragstasche sidebar */}
        <div className="w-64 shrink-0 border-l border-border flex flex-col bg-muted/20">
          <div className="px-4 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                Auftragstasche
              </span>
              <span className="rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-bold">
                {tasche.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleKiPlan}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white transition hover:opacity-90 shadow-md"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.22 280), oklch(0.48 0.19 295))",
                boxShadow: "0 4px 16px oklch(0.55 0.22 280 / 0.30)",
              }}
            >
              <Sparkles className="h-4 w-4" />
              KI-Plan
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tasche.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground italic">
                Alle Aufträge verplant.
              </div>
            )}
            {tasche.map((job) => {
              const color = MACHINE_META[job.machine].color;
              return (
                <TascheCard
                  key={job.id}
                  job={{ ...job, festgepinnt: pinnedIds.has(job.id) }}
                  color={color}
                  onDragStart={(machine) => setDragSourceMachine(machine)}
                  onDragEnd={() => setDragSourceMachine(null)}
                  onToggleFestgepinnt={() => togglePinned(job.id)}
                />
              );
            })}
          </div>

          {hasKiSlots && (
            <div className="shrink-0 p-3 border-t border-border space-y-2">
              <button
                type="button"
                onClick={confirmKiPlan}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white transition shadow-sm hover:opacity-90"
                style={{ background: "oklch(0.52 0.14 153)" }}
              >
                <Check className="h-4 w-4" />
                Plan bestätigen
              </button>
              <button
                type="button"
                onClick={resetKiPlan}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition"
              >
                Zurücksetzen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedJob && (
        <AuftragDrawer
          job={{
            ...selectedJob,
            festgepinnt: pinnedIds.has(selectedJob.id),
            prioritaet:
              prioritaetOverrides[selectedJob.id] ?? selectedJob.prioritaet,
            notiz: notizOverrides[selectedJob.id] ?? selectedJob.notiz,
          }}
          onClose={() => setSelectedJobId(null)}
          onToggleFestgepinnt={() => togglePinned(selectedJob.id)}
          onPrioritaetChange={(p) =>
            setPrioritaetOverrides((prev) => ({ ...prev, [selectedJob.id]: p }))
          }
          onNotizChange={(text) =>
            setNotizOverrides((prev) => ({ ...prev, [selectedJob.id]: text }))
          }
        />
      )}
    </div>
  );
}

// ─── EingangStreifen ─────────────────────────────────────────────────────────

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
      style={{ background: "oklch(0.97 0.02 255 / 0.5)" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-bold uppercase tracking-[0.14em]">
          📥 Eingang
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            background: "oklch(0.70 0.04 255 / 0.3)",
            color: "oklch(0.40 0.10 255)",
          }}
        >
          {jobs.length}
        </span>
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
      <div className="flex gap-2 overflow-x-auto pb-1">
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
      className={`shrink-0 rounded-xl px-3 py-2 cursor-grab select-none transition ${
        isDragging ? "opacity-40" : "hover:opacity-90"
      }`}
      style={{
        background: "oklch(0.95 0.02 255)",
        border: "1.5px solid oklch(0.70 0.04 255)",
        minWidth: 140,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
          style={{
            background: "oklch(0.70 0.04 255 / 0.25)",
            color: "oklch(0.40 0.10 255)",
          }}
        >
          {job.machine}
        </span>
        <span
          className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
          style={{
            background: "oklch(0.52 0.20 145 / 0.15)",
            color: "oklch(0.35 0.18 145)",
          }}
        >
          NEU
        </span>
      </div>
      <div className="text-xs font-semibold truncate max-w-[130px]">
        {job.customer}
      </div>
      <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
        {job.druckzeitStunden}h · {job.delivery}
      </div>
      {job.sonderfarbe && (
        <div className="text-[8px] mt-0.5" style={{ color: "oklch(0.55 0.16 50)" }}>
          ⬟ {job.sonderfarbe}
        </div>
      )}
    </div>
  );
}

// ─── SchichtZelle ────────────────────────────────────────────────────────────

function SchichtZelle({
  slotName,
  cellJobs,
  allJobs,
  color,
  machine,
  dragSourceMachine,
  newlyPlaced,
  slotKeyVal,
  pinnedIds,
  onDrop,
  onRemove,
  onCardClick,
  height,
}: {
  slotName: Slot;
  cellJobs: GridJob[];
  allJobs: Job[];
  color: string;
  machine: Machine;
  dragSourceMachine: Machine | null;
  newlyPlaced: Set<SlotKey>;
  slotKeyVal: SlotKey;
  pinnedIds: Set<string>;
  onDrop: (e: React.DragEvent) => void;
  onRemove: (jobId: string) => void;
  onCardClick: (jobId: string) => void;
  height: number;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isMismatch = dragSourceMachine !== null && dragSourceMachine !== machine;

  // Calculate total hours in cell
  const totalHours = cellJobs.reduce((acc, gj) => {
    const j = allJobs.find((j2) => j2.id === gj.jobId);
    return acc + (j?.druckzeitStunden ?? 0);
  }, 0);
  const isOverCapacity = totalHours > 8;

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition ${
        isDragOver && !isMismatch
          ? "ring-2 ring-[oklch(0.55_0.22_280)]"
          : isDragOver && isMismatch
          ? "ring-2 ring-destructive/50"
          : ""
      } ${isOverCapacity ? "ring-2 ring-destructive" : ""}`}
      style={{
        height,
        position: "relative",
        background: isDragOver && !isMismatch
          ? "oklch(0.96 0.04 280)"
          : "oklch(0.97 0.00 0 / 0.4)",
        border: `1px dashed ${
          isDragOver && !isMismatch
            ? "oklch(0.55 0.22 280 / 0.6)"
            : "var(--border)"
        }`,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e);
      }}
    >
      {/* Slot label */}
      {cellJobs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground/40 font-medium">
            {slotName}
          </span>
        </div>
      )}

      {/* Proportional job cards */}
      {(() => {
        let stackOffset = 0;
        return cellJobs.map((gridJob) => {
          const fullJob = allJobs.find((j) => j.id === gridJob.jobId);
          const jobHeight = fullJob?.druckzeitStunden
            ? Math.max(28, (fullJob.druckzeitStunden / 8) * height)
            : 36;
          const top = stackOffset;
          stackOffset += jobHeight;
          const isPinned = pinnedIds.has(gridJob.jobId);
          const isNew = newlyPlaced.has(slotKeyVal);
          return (
            <AuftragKarte
              key={gridJob.jobId}
              gridJob={gridJob}
              fullJob={fullJob}
              top={top}
              height={Math.min(jobHeight, height - top)}
              isPinned={isPinned}
              isAi={gridJob.aiSuggested}
              isNew={isNew}
              color={color}
              onRemove={() => onRemove(gridJob.jobId)}
              onClick={() => onCardClick(gridJob.jobId)}
            />
          );
        });
      })()}

      {/* Free time indicator */}
      {cellJobs.length > 0 && !isOverCapacity && (() => {
        const usedPx = cellJobs.reduce((acc, gj) => {
          const j = allJobs.find((j2) => j2.id === gj.jobId);
          return acc + Math.max(28, ((j?.druckzeitStunden ?? 0) / 8) * height);
        }, 0);
        const freePx = height - usedPx;
        if (freePx < 16) return null;
        const freeHours = ((freePx / height) * 8).toFixed(1);
        return (
          <div
            className="absolute left-0 right-0 flex items-center justify-center"
            style={{ top: usedPx, height: freePx }}
          >
            <span className="text-[8px] text-muted-foreground/50 italic">
              {freeHours}h frei
            </span>
          </div>
        );
      })()}

      {/* Mismatch hint */}
      {isDragOver && isMismatch && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 rounded-xl">
          <span className="text-[9px] text-destructive/70 font-medium">
            Falsche Maschine
          </span>
        </div>
      )}
    </div>
  );
}

// ─── AuftragKarte ────────────────────────────────────────────────────────────

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
    : { background: "oklch(0.93 0.07 145 / 0.9)", border: "1.5px solid oklch(0.55 0.18 145)" };

  const aiStyle: React.CSSProperties = isAi
    ? {
        background: "oklch(0.95 0.04 280)",
        border: "1.5px dashed oklch(0.55 0.22 258 / 0.7)",
      }
    : {};

  return (
    <div
      className={`absolute group cursor-pointer rounded-lg overflow-hidden ${
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
        <div style={{ height: 2, backgroundColor: color, flexShrink: 0 }} />
      )}
      <div className="px-1.5 py-1 h-full overflow-hidden">
        {height >= 48 && (
          <div
            className="text-[10px] font-semibold truncate"
            style={{ color: isAi ? "oklch(0.40 0.22 258)" : undefined }}
          >
            {isAi && "✦ "}
            {gridJob.customer}
          </div>
        )}
        {height >= 64 && fullJob && (
          <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
            {fullJob.druckzeitStunden}h · {gridJob.delivery}
          </div>
        )}
        {height >= 80 && fullJob && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {fullJob.dispersionslack && (
              <span className="text-[7px] bg-white/60 rounded px-0.5">
                Lack ✓
              </span>
            )}
            {fullJob.grammatur && (
              <span className="text-[7px] bg-white/60 rounded px-0.5">
                {fullJob.grammatur}g
              </span>
            )}
            {fullJob.sonderfarbe && (
              <span className="text-[7px] bg-white/60 rounded px-0.5">⬟</span>
            )}
            {isPinned && (
              <span className="text-[7px] bg-white/60 rounded px-0.5">🔒</span>
            )}
          </div>
        )}
        {isAi && gridJob.aiSuggested && gridJob.reason && height >= 80 && (
          <div className="text-[7px] italic text-muted-foreground mt-0.5 leading-tight opacity-80 line-clamp-2">
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

// ─── DigiRow ──────────────────────────────────────────────────────────────────

function DigiRow({
  color,
  status,
}: {
  color: string;
  status: { label: string; color: string };
}) {
  return (
    <div
      className="grid border-b border-border last:border-0"
      style={{ gridTemplateColumns: `80px repeat(5, 1fr)`, height: 48 }}
    >
      <div className="flex items-center justify-center px-2 border-r border-border">
        <span className="text-xs font-black" style={{ color }}>
          Digi
        </span>
      </div>
      <div className="col-span-5 border-l border-border flex items-center px-4 gap-3">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: status.color }}
        />
        <span className="text-xs font-medium" style={{ color: status.color }}>
          {status.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          Digitaldruck — Weber AG, Meyer Consulting
        </span>
      </div>
    </div>
  );
}

// ─── TascheCard ──────────────────────────────────────────────────────────────

function TascheCard({
  job,
  color,
  onDragStart,
  onDragEnd,
  onToggleFestgepinnt,
}: {
  job: Job;
  color: string;
  onDragStart: (machine: Machine) => void;
  onDragEnd: () => void;
  onToggleFestgepinnt?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
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
          <span className="text-[9px] text-muted-foreground font-mono">
            {job.delivery}
          </span>
          {job.prioritaet && job.prioritaet !== "normal" && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                background:
                  job.prioritaet === "express"
                    ? "oklch(0.93 0.12 50 / 0.25)"
                    : "oklch(0.93 0.10 50 / 0.15)",
                color: "oklch(0.50 0.18 50)",
              }}
            >
              {job.prioritaet}
            </span>
          )}
          {job.festgepinnt && (
            <span className="text-[9px]">🔒</span>
          )}
        </div>
        <div className="text-xs font-semibold leading-tight truncate">
          {job.customer}
        </div>
        {job.druckzeitStunden && (
          <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
            {job.druckzeitStunden}h
            {job.dispersionslack ? " · Lack ✓" : ""}
            {job.sonderfarbe ? " · ⬟" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
bun run build
```

Expected: no errors. Common issues to watch for:
- `cardStyle` referenced before declaration → move it above `WochenplanungView`
- `React.CSSProperties` needs `import type React from "react"` if not already imported — add `import React from "react"` or change to use `CSSProperties` from `"react"`
- `line-clamp-2` — Tailwind 4 utility, should work. If not, replace with `overflow-hidden` + `style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}`

- [ ] **Step 3: Commit**

```bash
git add src/components/plantafel/views/wochenplanung.tsx
git commit -m "feat: rewrite Wochenplanung with proportional grid, week navigation, EingangStreifen"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Task 1: 6 new Job fields + 12 mock jobs (Teil 1)
- ✅ Task 2: AuftragDrawer extracted, extended Druckdetails, Planung section, Kaskadenwarnung (Teil 4)
- ✅ Task 3: produktionsleitung.tsx uses shared drawer (Datei-Map)
- ✅ Task 4: Week navigation (currentWeekOffset, KW label, Pfeile, Heute-Button) (Teil 2 — Navigation)
- ✅ Task 4: EingangStreifen for isNew jobs, draggable (Teil 3)
- ✅ Task 4: CD 160px × 3 shifts prominent; SM5 160px × 1 shift (Teil 2 — Maschinenzeilen)
- ✅ Task 4: RZK collapsible 32px → expanded (Teil 2 — RZK)
- ✅ Task 4: Digi status strip 48px, no drag (Teil 2 — Digi)
- ✅ Task 4: Proportional AuftragKarte (height = druckzeitStunden/8 * 160, min 28px) (Teil 2 — Proportionale Slots)
- ✅ Task 4: Card color system (Grün/Gelb/Orange/Rot/Blau-Rand/Grau) (Teil 2 — Auftragskarten)
- ✅ Task 4: Adaptive card content (≥48px customer, ≥64px hours+delivery, ≥80px badges) (Teil 2 — Auftragskarten)
- ✅ Task 4: Click → opens AuftragDrawer
- ✅ Task 4: Drop capacity guard (grid stores arrays, over-capacity shows red ring)
- ✅ Task 4: Free time indicator when stack < cell height

**Type consistency:**
- `GridJob = PlacedJob | ManualJob` used consistently in Tasks 4 (grid state, drop handler, confirmKiPlan)
- `slotKey(weekOffset, machine, day, slot)` → format `"weekOffset|machine|day|slot"` used in Task 4 everywhere
- `buildKIPlan` returns keys in `"machine|day|slot"` format → prefixed with `${currentWeekOffset}|` in `handleKiPlan`
- `AuftragDrawerProps` defined in Task 2, consumed in Task 3 and Task 4 identically
