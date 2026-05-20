# Casciq Redesign — Design Spec
**Datum:** 2026-05-20  
**Projekt:** BA-Thesis — KI-assistierte Produktionsplanung, Druckerei Pfitzer GmbH  
**App:** Casciq

---

## 1. Überblick

Komplettes Redesign des Produktionsleiter-Dashboards sowie eine neue Wochenplanungsansicht. Ziel: einfacheres, schneller scannendes UI mit klareren Phasennamen und einem Human-in-the-Loop KI-Planungsflow.

**Scope:**
- Produktionsleitung Übersicht → Maschinen-Kacheln (ersetzt bisherige Tabelle + Morning Briefing)
- Neue Ansicht: Wochenplanung (nur für Produktionsleitung sichtbar)
- Phasennamen vereinfachen: 4 Stufen statt 5
- Alle anderen Rollen (PM, Druckvorstufe, Buchbinderei, Logistik, GF) bleiben unverändert

---

## 2. Navigation & Struktur

Die Sidebar zeigt für die Rolle `produktionsleitung` zwei Einträge:
- **Übersicht** (bestehend, redesigned)
- **Wochenplanung** (neu)

Für alle anderen Rollen ändert sich die Navigation nicht.

---

## 3. Vereinfachte Phasennamen

Alle Phasenbezeichnungen werden von 5 auf 4 Stufen reduziert:

| Alt (5 Stufen) | Neu (4 Stufen) |
|---|---|
| Schneiden / Vordruck | Vorstufe |
| Hauptdruck | Im Druck |
| Nachbearbeitung | Weiterverarbeitung |
| Versandfertig | Versandbereit |

Die neuen Labels ersetzen alle bisherigen Phasenbezeichnungen in Mock-Daten, Wochenplan-Slots, Kacheln und allen Views.

---

## 4. Produktionsleitung — Übersicht (Redesign)

### Layout
- **Oben:** 4 Maschinen-Kacheln (CD, RZK, SM5, Digi) in einem 2×2 oder 4er-Grid
- **Unten:** Kompakte Auftragsliste (restliche Aufträge, nicht gerade im Druck), sortiert nach Lieferdatum

### Maschinen-Kachel (je Maschine)
- Farbiger linker Akzent (maschinenspezifische Farbe aus `MACHINE_META`)
- Maschinenname + Kurzname
- Aktueller Auftrag: Kundenname + Phase-Pill
- Maschinenstatus-Badge: **Läuft** (grün) / **Bereit** (grau) / **Blockiert** (rot)
- Bei Blockiert: roter Hintergrund-Tint + kurze Problembeschreibung (z.B. "Maschinenstörung")

### Alerts (bleiben, aber kompakter)
- Cascade-Konflikt-Banner: einzeiliger Alert oben (Rossmann/SM5, +2 Tage)
- Fehlende Druckfreigabe: einzeiliger Alert (Technik GmbH, Produktion morgen 08:00)

### Was wegfällt
- Morning Briefing Accordion
- KI-Suggestions-Panel (gehört in Wochenplanung)
- Detaillierte Job-Tabelle → wird zur kompakten Liste

---

## 5. Wochenplanung (neue Ansicht)

### Layout
- **Hauptbereich:** Vollbild-Grid, 4 Maschinen × 5 Wochentage, je 2 Slots (Früh/Spät)
- **Fixierter Streifen unten:** Auftragstasche

### Grid
- Spalten: Mo–Fr, Heute-Spalte leicht hervorgehoben (gelb-tint wie bisher)
- Zeilen: CD, RZK, SM5, Digi
- Je Zelle: 2 Slots (Früh / Spät)
- Belegter Slot: Kunden-Kachel (Kundenname + Phase-Pill + Maschinenfarbe)
- Leerer Slot: gestrichelter Drop-Bereich, nimmt Drag-and-Drop entgegen
- KI-vorgeschlagene Slots: blaue gestrichelte Umrandung, noch nicht bestätigt

### Auftragstasche (fixierter Bottom-Strip)
- Titel: „Auftragstasche · N bereit"
- Zeigt alle Aufträge mit erteilter Druckfreigabe, die noch nicht im Grid verplant sind
- Karten gruppiert nach passender Maschine (CD-Gruppe, RZK-Gruppe etc.)
- Rechts: **„✦ KI verplant"**-Button

### Drag & Drop
- Karten aus der Auftragstasche per HTML5 Drag & Drop in freie Grid-Slots ziehen
- Bereits im Grid platzierte Karten können zwischen Slots getauscht werden
- Kein externes DnD-Library — natives HTML5 `draggable` + `onDragOver`/`onDrop`

### KI-Flow (Human-in-the-Loop)
1. User klickt „✦ KI verplant"
2. Grid füllt sich mit KI-Vorschlägen (blau gestrichelte Kacheln, Status: `pending`)
3. User kann einzelne Slots per Drag & Drop umschichten
4. **„Plan bestätigen"**-Button (erscheint sobald KI-Vorschläge vorhanden): alle `pending`-Slots werden `confirmed`
5. Alternativ: direkt manuell per Drag ohne KI

### State-Management
- Reiner React-`useState` in der Wochenplanung-Komponente
- Keine Persistenz (Mock-Only für Prototype)
- KI-Vorschläge: deterministischer Mock-Algorithmus (füllt freie Slots nach Lieferdatum-Priorität)

---

## 6. Dateien & Komponenten

| Datei | Änderung |
|---|---|
| `src/lib/mock-data.ts` | Phasennamen aktualisieren (`WeekSlot.phase` auf 4 Werte) |
| `src/components/plantafel/views/produktionsleitung.tsx` | Komplett neu: Maschinen-Kacheln + kompakte Liste + reduzierte Alerts |
| `src/components/plantafel/views/wochenplanung.tsx` | Neu: Grid + Auftragstasche + KI-Flow |
| `src/components/plantafel/sidebar.tsx` | Nav-Eintrag „Wochenplanung" für Produktionsleitung hinzufügen |
| `src/routes/index.tsx` | Route/View für Wochenplanung verdrahten |
| `src/components/plantafel/wochenplan.tsx` | Phasennamen anpassen (bestehend, Leseansicht — bleibt) |

---

## 7. Nicht im Scope

- Backend / Persistenz
- Andere Rollen verändern
- Echte KI-Integration (deterministischer Mock genügt)
- Neue Abhängigkeiten (nur lucide-react + recharts erlaubt)
