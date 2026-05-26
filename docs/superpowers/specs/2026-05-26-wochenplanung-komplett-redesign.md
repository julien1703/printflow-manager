# Wochenplanung Komplett-Redesign — Design Spec

**Datum:** 2026-05-26
**Branch:** `feature/wochenplanung-redesign`
**Scope:** Maschinen-Tabs · Horizontale Gantt-Karten · dnd-kit · Erweiterter Drawer · Digi-Statusansicht

---

## Ziel

Die Wochenplanung komplett neu bauen: Maschinen-Tabs statt gemeinsamer Grid, horizontale proportionale Auftrags­karten (Gantt-Stil), dnd-kit für robustes Drag & Drop, festgepinnter-Schutz mit Shake-Animation, erweiterter Drawer mit farbigen Hinweis-Boxen.

---

## Architektur-Entscheidungen

| Frage | Entscheidung | Begründung |
|---|---|---|
| DnD-Library | `@dnd-kit/core` + `@dnd-kit/utilities` | Bessere UX, Touch-Support, einfacher festgepinnte Karten zu blockieren |
| Drawer | Bestehende `auftrag-drawer.tsx` erweitern | 80% bereits vorhanden, kein Neu-Aufbau nötig |
| Kartenausrichtung | Horizontal proportional (1h = 60px) | Entspricht dem echten Zettelschnitt-Workflow von Hr. Maisch |
| SM528-Naming | Anzeige "SM528", intern bleibt `SM5` | Keine Breaking Changes an bestehenden Daten |
| Farben | Ausschließlich OKLCH | Projektregel |

---

## Datei-Map

| Datei | Aktion | Verantwortung |
|---|---|---|
| `src/components/plantafel/views/wochenplanung.tsx` | **Rewrite** | State-Orchestrierung, Tab-Auswahl, Eingang, Drawer-Trigger |
| `src/components/plantafel/machine-tabs.tsx` | **Create** | 4 Tab-Buttons mit Farbe, Badge, Beschreibung |
| `src/components/plantafel/wochenplan-grid.tsx` | **Create** | Wochenraster für eine Maschine: KW-Navigation, Schichtreihen, Drop-Zones |
| `src/components/plantafel/job-card.tsx` | **Create** | Horizontale proportionale Karte, Badges, Shake-Animation |
| `src/components/plantafel/auftrag-drawer.tsx` | **Modify** | Footer-Buttons ergänzen, Hinweis-Boxen für Lack/Sonderfarbe/Trocknung ausbauen |
| `src/styles.css` | **Modify** | `shake`-Keyframe, `gepinnt-blocked` Klasse |

---

## Teil 1: Maschinen-Tabs (`machine-tabs.tsx`)

### Props

```typescript
interface MachineTabsProps {
  activeMachine: Machine;
  onChange: (m: Machine) => void;
  eingang: Job[];
}
```

### Tab-Definitionen

```typescript
const TAB_META: Record<Machine, {
  display: string;
  badge: string;
  description: string;
  accent: string; // OKLCH
}> = {
  CD:   { display: "CD",    badge: "3-schichtig",        description: "Hauptmaschine · Früh / Spät / Nacht", accent: "oklch(0.55 0.18 255)" },
  SM5:  { display: "SM528", badge: "1-schichtig",         description: "5-Farb · Frühschicht · Sonderfarben",  accent: "oklch(0.55 0.18 295)" },
  RZK:  { display: "RZK",   badge: "Gering ausgelastet",  description: "2-Farb · Nur Frühschicht · ~30% Auslastung", accent: "oklch(0.55 0.04 255)" },
  Digi: { display: "Digi",  badge: "Eigenständig",        description: "Digitaldruck · Läuft selbstständig",   accent: "oklch(0.52 0.18 145)" },
};
```

### Visual

- Aktiver Tab: gefüllter Hintergrund in `accent`-Farbe, weißer Text, kein Unterstrich
- Inaktive Tabs: `bg-muted/30`, grauer Text, Hover → leichter Hintergrund
- Jeder Tab zeigt: großer Name + kleines Badge-Chip + Beschreibungszeile darunter
- `eingang.length > 0` → kleines roter Punkt-Badge an Tab-Leiste oben rechts

---

## Teil 2: Wochenraster (`wochenplan-grid.tsx`)

### Props

```typescript
interface WochenplanGridProps {
  machine: Machine;
  weekOffset: number;
  grid: Record<SlotKey, GridJob[]>;
  pinnedIds: Set<string>;
  onDrop: (jobId: string, machine: Machine, day: Weekday, slot: Slot) => void;
  onCardClick: (jobId: string) => void;
  onRemove: (key: SlotKey, jobId: string) => void;
}
```

### KW-Navigation

```
← KW 21   [KW 22]   KW 23   KW 24   →
           ↑ aktiv: gefüllt, andere: subtil
```
- Alle 4 KWs sichtbar, aktive KW hervorgehoben
- `← / →` blendet sich aus wenn am Rand

### Grid-Struktur pro Maschine

```
         Mo 19.05  Di 20.05  Mi 21.05  Do 22.05  Fr 23.05
Früh  F  [──Job──] [──────Job────────]           [Job]
Spät  S  [─────────Job─────────────]                      ← nur CD
Nacht N                    [────────Job────────────────]  ← nur CD
```

- Schicht-Label: kleines Chip `F` / `S` / `N` in Akzentfarbe der Maschine
- Jede Schichtreihe: `height: 88px`, `position: relative`, Drop-Zone
- Karten: `position: absolute`, `top: 4px`, `height: 80px`
- Heute-Spalte: `border-l-2` in Akzentfarbe + leicht getönter Hintergrund
- RZK-Reihen: `opacity-60`, Höhe 64px (kleiner)

### SlotKey Format

```typescript
type SlotKey = `${number}|${Machine}|${Weekday}|${Slot}`;
// z.B. "1|CD|Mo|Früh"
```

---

## Teil 3: Horizontale JobCard (`job-card.tsx`)

### Props

```typescript
interface JobCardProps {
  job: Job;
  gridJob: GridJob;
  isPinned: boolean;
  isAi: boolean;
  width: number;       // (druckzeitStunden / 8) * 480, min 60
  left: number;        // stackOffset in px
  onClick: () => void;
  onRemove: () => void;
  machineAccent: string;
}
```

### Proportionalität

```
1h = 60px  →  Schicht (8h) = 480px
Karte width = Math.max(60, (druckzeitStunden / 8) * 480)
```

### Karten-Layout

```
┌─────────────────────────────────────┐
│  [NEU] [Lack] [HKS43] [🔒]         │  ← Badge-Zeile (8px Chips)
│                                     │
│  Bosch E-Bike                       │  ← Kundenname (11px bold)
│  Katalog · 135g                     │  ← Details (9px grau)
│                                     │
│  28.05.                      4.5h  │  ← Termin links, Stunden rechts
└─────────────────────────────────────┘
```

### Karten-Farben (OKLCH)

| Zustand | Background | Linker Rand |
|---|---|---|
| Standard | `oklch(0.98 0.01 0)` | `oklch(0.55 0.05 0)` |
| Freigabe ausstehend | `oklch(0.98 0.04 85)` | `oklch(0.60 0.18 85)` |
| Eilig / Express | `oklch(0.97 0.04 55)` | `oklch(0.62 0.16 55)` |
| Überfällig / Kaskade | `oklch(0.97 0.03 25)` | `oklch(0.55 0.22 25)` |
| NEU | `oklch(0.98 0.04 145)` | `oklch(0.55 0.18 145)` |
| Festgepinnt | beliebig | `4px solid oklch(0.55 0.22 255)` |

### Festgepinnt-Schutz

- `useDraggable` wird mit `disabled: pinnedIds.has(job.id)` aufgerufen
- Beim Klick-Drag-Versuch auf gepinnte Karte: CSS-Klasse `gepinnt-blocked` → `shake`-Animation (0.3s)
- Tooltip: "Festgepinnt — nicht verschiebbar"

### Shake-Animation in `styles.css`

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  40%       { transform: translateX(4px); }
  60%       { transform: translateX(-3px); }
  80%       { transform: translateX(3px); }
}
.gepinnt-blocked {
  animation: shake 0.3s ease forwards;
}
```

---

## Teil 4: Digi-Tab (direkt in `wochenplanung.tsx` als inline-Komponente `DigiStatus`)

Keine Slots, kein DnD. Stattdessen:

```
┌────────────────────────────────────────┐
│  ℹ Digitaldruck läuft eigenständig     │
│  Eingriff nur bei Rückstau nötig       │
└────────────────────────────────────────┘

Status: ● Läuft normal

Laufende Aufträge:
  Weber AG · Flyer A5 · 10.000 Stück
  Meyer Consulting · Visitenkarten · 500 Stück
```

Status-Farben:
- Läuft: `oklch(0.45 0.18 145)`
- Rückstau: `oklch(0.55 0.17 85)`
- Kapazität erreicht: `oklch(0.55 0.22 25)`

---

## Teil 5: Erweiterter Drawer (`auftrag-drawer.tsx`)

Bestehende Sektionen bleiben. Ergänzungen:

### Farbige Hinweis-Boxen in Sektion "Druckdetails"

**Wenn `dispersionslack: true`:**
```
🔵 Dispersionslack aktiv
   Lackwerk-Reinigung nach Verwendung: 30 Min bis 3h
   Tipp: Lackaufträge gruppieren um Rüstzeit zu sparen
```
Farbe: `oklch(0.95 0.04 255)` Hintergrund, `oklch(0.45 0.18 255)` Text

**Wenn `sonderfarbe !== null`:**
```
🟠 Sonderfarbe: [Name]
   Lagerbestand prüfen! Mind. 2 Tage Vorlauf für Bestellung.
   Einmal An- und Abwaschen einplanen (+30–60 Min)
```
Farbe: `oklch(0.96 0.06 55)` Hintergrund, `oklch(0.45 0.18 55)` Text

**Wenn `paper?.includes("Metallic")` ODER (`sonderfarbe` gesetzt UND `paper` enthält NICHT "gestrichen"):**
```
🟡 Trocknungshinweis
   Mind. 2 Tage Trocknungszeit vor Weiterverarbeitung
```
Farbe: `oklch(0.97 0.05 85)` Hintergrund, `oklch(0.42 0.16 85)` Text

### Neuer Footer

```
[Auftrag verschieben]   [Als gedruckt markieren]
```
- Beide Buttons: Prototype-only (kein Backend, nur `console.log` + Drawer schließen)
- "Auftrag verschieben": ghost/outline style
- "Als gedruckt markieren": filled, grün `oklch(0.52 0.14 145)`

---

## Teil 6: EingangStreifen (in `wochenplanung.tsx`)

Bleibt konzeptuell wie bisher, wird auf dnd-kit umgestellt:
- `useDraggable` auf EingangKarten
- Nach Drop: Job aus `eingang` entfernen, in `grid` eintragen
- Visuell: bestehende Implementierung aus dem letzten Commit bleibt erhalten

---

## dnd-kit Integration

### Installation
```bash
bun add @dnd-kit/core @dnd-kit/utilities
```

### Struktur

```typescript
// In wochenplanung.tsx:
<DndContext onDragEnd={handleDragEnd} sensors={sensors}>
  <EingangStreifen ... />
  <WochenplanGrid ... />
</DndContext>

// Sensors: PointerSensor mit activationConstraint { distance: 8 }
// → verhindert versehentliche Drags beim Klicken
```

### `handleDragEnd`

```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;
  const jobId = active.id as string;
  const slotKey = over.id as SlotKey; // direkt als Grid-Key nutzbar
  const [, machine, day, slot] = slotKey.split("|") as [string, Machine, Weekday, Slot];
  // Maschinen-Check: job.machine === machine
  // Kapazitäts-Check: Summe bestehender druckzeitStunden ≤ 8h
  // Grid-Update: setGrid(prev => ({ ...prev, [slotKey]: [...(prev[slotKey] ?? []), newGridJob] }))
}
```

### Drop-Zone IDs

Format: `"${weekOffset}|${machine}|${day}|${slot}"` — identisch mit SlotKey.

---

## UX-Regeln (aus Interview Hr. Maisch)

1. **Festgepinnte Aufträge**: `disabled` in `useDraggable` → Shake + Tooltip
2. **Neue Aufträge**: landen im EingangStreifen, NICHT direkt im Grid
3. **Proportionale Karten**: PFLICHT — 1h = 60px
4. **Liefertermin**: immer sichtbar auf Karte (rechts unten)
5. **Lack + Sonderfarbe**: Badges oben auf der Karte
6. **RZK**: `opacity-60`, kleinere Zeilenhöhe, grauer Tab-Akzent
7. **Digi**: kein DnD-System, nur Statusübersicht

---

## Nicht in diesem Redesign (→ später)

- Backend-Anbindung für "Als gedruckt markieren" / "Auftrag verschieben"
- KI-Planungs­assistent mit Vorschlag-UI (Sub-Projekt 2)
- Notifications-Center
