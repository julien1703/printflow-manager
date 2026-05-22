# Wochenplan Redesign — Design Spec (Sub-Projekt 1)

**Datum:** 2026-05-22  
**Scope:** Datenmodell · Wochenplan-Neubau · Neue-Aufträge-Eingang · Auftragskarten · Detail-Drawer

---

## Ziel

Den Wochenplan der Produktionsleitung komplett neu bauen: proportionale Zeitdarstellung, 4-Wochen-Navigation, CD als dominante Maschine, Neue-Aufträge-Eingang als drag-bare Inbox. Der Detail-Drawer wird in eine gemeinsame Komponente extrahiert.

---

## Architektur-Entscheidungen

| Frage | Entscheidung | Begründung |
|---|---|---|
| Datenmodell | Bestehenden `Job`-Typ erweitern | Alle 6 Views bleiben funktionsfähig, kein Breaking Change |
| Feldnamen | Englische Namen beibehalten (`customer`, `delivery` etc.) | Prototype-Ziel ist Usability-Testing, nicht Code-Reinheit |
| Maschinennamen | `CD \| RZK \| SM5 \| Digi` bleibt unverändert | SM528 aus dem Spec = Anzeigename, intern bleibt SM5 |
| Layout | 1 Woche sichtbar, Pfeile vor/zurück | Mehr Platz pro Tag → Karten besser lesbar |
| Zeitdarstellung | Echte Proportionen: Karte = % der Schichtkapazität | Kapazitätslücken sofort sichtbar, wie echter Zettelschnitt |

---

## Datei-Map

| Datei | Aktion | Verantwortung |
|---|---|---|
| `src/lib/mock-data.ts` | Modify | Neue Job-Felder, 12 realistische Mock-Jobs |
| `src/components/plantafel/auftrag-drawer.tsx` | **Create** | Geteilter Detail-Drawer (aus produktionsleitung.tsx extrahiert + erweitert) |
| `src/components/plantafel/views/wochenplanung.tsx` | **Rewrite** | Neuer Wochenplan: Navigation, proportionale Grid, Eingang |
| `src/components/plantafel/views/produktionsleitung.tsx` | Modify | AuftragDrawer-Import ersetzen durch neue geteilte Komponente |

---

## Teil 1: Datenmodell

### Neue Felder in `Job`

Die folgenden Felder fehlen noch im bestehenden `Job`-Interface und werden ergänzt:

```typescript
// Neu in Job interface (src/lib/mock-data.ts)
prioritaet?: "normal" | "eilig" | "express";
notiz?: string | null;
seitenanzahl?: number | null;
auflage?: number;
druckdatenEingang?: string | null;        // "DD.MM." format wie delivery, null = noch nicht eingegangen
weiterverarbeitungStunden?: number;       // ergänzt das bestehende finishingHours
```

Bereits vorhanden und weiter genutzt: `dispersionslack`, `grammatur`, `druckzeitStunden`, `festgepinnt`, `isNew`, `sonderfarbe`, `paletten`, `cascadeConflict`.

### Mock-Daten (12 Jobs)

Realistische Aufträge für Druckerei Pfitzer:

| Kunde | Maschine | Schicht | Druckzeit | Besonderheit |
|---|---|---|---|---|
| Bosch E-Bike GmbH | CD | Früh | 4.5h | Lack ✓, 135g |
| Kirchengemeindeblatt | CD | Früh | 8h | festgepinnt, HKS 43, Lack ✓ |
| Buteros Catering | CD | Spät | 5h | express, Kaskadenwarnung |
| Literaturhaus Stuttgart | CD | Nacht | 6h | isNew |
| Logoprint Express | SM5 | Früh | 2h | isNew, Gold-Sonderfarbe |
| Rossmann GmbH | SM5 | Früh | 3h | Lack –, 135g |
| Mustermann GmbH | CD | Früh | 4.5h | festgepinnt, Lack ✓ |
| Metallbau Hoffmann | SM5 | Früh | 6h | isNew, Pantone 877 C |
| Dresdner Druck GmbH | CD | Früh | 3.5h | Lack ✓, 170g |
| Schmidt Verlag | RZK | Früh | 3h | normal |
| Weber AG | Digi | — | — | Digitaldruck |
| Meyer Consulting | Digi | — | — | Digitaldruck |

3 `isNew`-Jobs: Literaturhaus, Logoprint, Metallbau Hoffmann  
2 `festgepinnt`-Jobs: Kirchengemeindeblatt, Mustermann GmbH  
2 Sonderfarben: Gold (Logoprint), Pantone 877 C Silber (Metallbau)  
1 Kaskadenwarnung: Buteros Catering

---

## Teil 2: Wochenplan — Neubau

### Gesamtstruktur

```
wochenplanung.tsx
├── WochenplanungView          (Hauptkomponente)
│   ├── EingangStreifen        (isNew-Jobs, drag-bare Karten)
│   ├── WochenplanGrid         (das eigentliche Planungsraster)
│   │   ├── GridHeader         (KW-Navigation + Tagesspalten)
│   │   ├── MaschineZeile × 4  (CD, SM5, RZK, Digi)
│   │   │   └── SchichtZelle   (proportionale Drop-Zone)
│   │   │       └── AuftragKarte (proportionale Karte)
│   └── KIPanel                (Vorschlag-Button, aus ki-suggestions.tsx)
```

### State

```typescript
interface WochenplanState {
  currentWeekOffset: number;          // 0 = aktuelle KW, 1 = nächste KW, …
  grid: Record<SlotKey, GridJob>;     // SlotKey = "Machine|Day|Slot"
  eingang: Job[];                     // isNew-Jobs noch nicht eingeordnet
  dragJobId: string | null;
  dragSourceMachine: Machine | null;
  newlyPlaced: Set<SlotKey>;          // für pop-in Animation
  pinnedIds: Set<string>;             // lokale festgepinnt-Overrides
  expandedRzk: boolean;               // RZK-Zeile ausgeklappt
}
```

### Navigation

- `currentWeekOffset` steuert welche Woche gezeigt wird (0 = jetzt, 1 = +1 Woche, etc.)
- Pfeile `‹` / `›` ändern den Offset um ±1
- "Heute"-Button setzt Offset auf 0
- Datum im Header: `KW {n} · {Mo}.–{Fr}. {Monat} {Jahr}`
- Tage werden aus `currentWeekOffset` + `TODAY_INDEX` berechnet (kein echter Date-API-Call nötig für Mock)

### Maschinenzeilen

**CD** (prominent):
- `min-height: 160px` pro Schicht × 3 Schichten = 480px Gesamthöhe
- Linke Spalte: fetter CD-Label in `--machine-cd` Farbe, Schicht-Labels rechts davon
- Hintergrundfarbe: leicht getönt mit `color-mix(in oklab, var(--machine-cd) 4%, var(--background))`

**SM5** (normal):
- `min-height: 160px` für 1 Schicht (Früh)

**RZK** (kompakt, kollabierbar):
- Wenn leer und `expandedRzk === false`: Zeile ist 32px hoch, gedimmt (`opacity: 0.5`), Klick klappt auf
- Wenn Aufträge vorhanden: immer ausgeklappt (`min-height: 100px`, weniger als CD weil selten voll)
- Toggle-Button in der Maschinenspalte

**Digi** (Status-Zeile):
- Keine Slots, kein Drag&Drop
- Zeigt nur einen Status-Badge: `oklch(0.45 0.18 145)` Läuft / `oklch(0.55 0.17 85)` Rückstau / `oklch(0.60 0.04 255)` Ok
- Feste Höhe 48px

### Proportionale Slot-Zellen (`SchichtZelle`)

Jede SchichtZelle hat `height: 160px` = 8 Stunden.

```
position: relative
height: 160px
overflow: hidden
```

Jede `AuftragKarte` innerhalb der Zelle wird absolut positioniert:

```
position: absolute
top: {stackOffset}px          // Summe der Höhen vorheriger Jobs in dieser Zelle
height: {(druckzeitStunden / 8) * 160}px
min-height: 28px              // 1h-Jobs sind mindestens 28px
left: 4px
right: 4px
```

Stapelt mehrere Jobs: `stackOffset` wird akkumuliert. Wenn Jobs zusammen >8h sind → letzter Job wird abgeschnitten mit `overflow: hidden` + rotem Rand (Überkapazitäts-Indikator).

Freie Zeit: wenn Stack < 160px → Rest-Fläche zeigt gestrichelten "frei"-Bereich.

Drop-Zone-Verhalten: wie bestehende Grid-Logik, aber `onDrop` prüft zusätzlich ob freie Kapazität vorhanden (Summe bestehender `druckzeitStunden` + neue Job `druckzeitStunden` ≤ 8h).

### Auftragskarten (`AuftragKarte`)

Inhalt (adaptiv nach verfügbarer Höhe):

```
≥ 48px:  Kundenname
≥ 64px:  + Stunden · Liefertermin
≥ 80px:  + Icon-Badges (Lack ✓, Grammatur, Sonderfarbe, 🔒)
```

Farbsystem (via inline style, OKLCH):

| Zustand | Background | Rand |
|---|---|---|
| Alles ok | `oklch(0.93 0.07 145 / 0.9)` | `oklch(0.55 0.18 145)` |
| Freigabe ausstehend | `oklch(0.96 0.10 85 / 0.9)` | `oklch(0.60 0.18 85)` |
| Eilig / Express | `oklch(0.93 0.12 50 / 0.9)` | `oklch(0.62 0.16 50)` |
| Überfällig / Kaskade | `oklch(0.93 0.10 25 / 0.9)` | `oklch(0.55 0.22 25)` |
| Festgepinnt | beliebig + `border: 2px solid oklch(0.55 0.22 280)` | — |
| NEU (im Eingang) | `oklch(0.95 0.02 255)` | `oklch(0.70 0.04 255)` |

Klick auf Karte → öffnet `AuftragDrawer` (neue geteilte Komponente).

---

## Teil 3: Neue-Aufträge-Eingang (`EingangStreifen`)

Horizontaler Bereich ganz oben auf der Seite, vor dem Grid. Nur sichtbar wenn `eingang.length > 0`.

```
┌─────────────────────────────────────────────────────────────────┐
│  📥 Eingang (3)                              [KI-Vorschlag]      │
│  [Grau-Karte: Literaturhaus · CD · 6h · NEU]                    │
│  [Grau-Karte: Logoprint Express · SM5 · 2h · NEU · Gold]        │
│  [Grau-Karte: Metallbau Hoffmann · SM5 · 6h · NEU · Silber]     │
└─────────────────────────────────────────────────────────────────┘
```

- Karten sind horizontal scrollbar wenn viele vorhanden
- Draggable: `draggable={true}`, `onDragStart` setzt `dragJobId` + `dragSourceMachine`
- Nach Drop in Grid: Job verschwindet aus Eingang, `isNew` wird lokal auf `false` gesetzt
- "KI-Vorschlag"-Button: ruft `buildKIPlan` für alle Eingang-Jobs auf, zeigt Vorschau im Grid (aiSuggested: true)

---

## Teil 4: AuftragDrawer (geteilte Komponente)

**Neue Datei:** `src/components/plantafel/auftrag-drawer.tsx`

Extrahiert aus `produktionsleitung.tsx`, erweitert um neue Sektionen.

### Props

```typescript
interface AuftragDrawerProps {
  job: Job;
  onClose: () => void;
  onToggleFestgepinnt?: () => void;
  onPrioritaetChange?: (p: "normal" | "eilig" | "express") => void;
  onNotizChange?: (text: string) => void;
}
```

### Neue Sektionen (ergänzt zur bestehenden Struktur)

**Druckdetails** (erweitert):
- Grammatur, Druckzeit, Auflage, Seitenanzahl
- Dispersionslack mit Hinweis "Lackwerk-Reinigung ~1.5h einplanen" wenn `true`
- Sonderfarbe mit orangem Chip "Lagerbestand prüfen" wenn gesetzt
- Druckdaten-Eingang: Datum oder "Noch nicht eingegangen" in Rot

**Weiterverarbeitung** (erweitert):
- WV-Stunden
- Trocknungshinweis: wenn `paper` enthält "Metallic" oder `sonderfarbe` gesetzt → Chip "2 Tage Trocknungszeit beachten" in Orange

**Planung** (neu):
```tsx
<Section icon={<Settings />} title="Planung">
  <FestpinnenToggle job={job} onToggle={onToggleFestgepinnt} />
  <PrioritaetSelector value={job.prioritaet} onChange={onPrioritaetChange} />
  <NotizTextarea value={job.notiz} onChange={onNotizChange} />
</Section>
```

**Kaskadenwarnung** (neu, nur wenn `cascadeConflict`):
- Roter Block mit Erklärung welche Folgeaufträge betroffen sind

---

## Design-Prinzipien

- OKLCH-Farben ausschließlich (kein hex/rgb)
- DM Sans (sans) + DM Mono (mono)
- Tailwind 4 + custom utility classes aus `styles.css`
- Drag & Drop: HTML5 native (kein externes DnD-Paket)
- Kein Backend, keine echten API-Calls — reiner Mock-Prototyp
- `useState` only, kein Zustand/Redux

---

## Nicht in Sub-Projekt 1 (→ Sub-Projekt 2)

- KI-Planungsassistent mit Vorschlag-UI + "Komplett bestätigen / Ablehnen"
- Notifications-Center gebündelt
- Detaillierte KI-Erklärungen pro Positionsänderung
