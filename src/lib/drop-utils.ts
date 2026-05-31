/**
 * Berechnet die Snap-Position (in Stunden vom Schichtstart) für einen gezogenen Auftrag,
 * unter Berücksichtigung bereits belegter Intervalle.
 *
 * Regeln:
 * 1. Stunden-Snap (Math.round).
 *    – allowOverflow=true (Mehrschicht, nicht letzte Schicht): maxStart=7, Überlauf erlaubt.
 *    – allowOverflow=false (Einschicht oder letzte Schicht): maxStart=8−Dauer, kein Überlauf.
 * 2. Falls die Snap-Position ein bestehendes Intervall schneidet:
 *    – Alle überlappenden Jobs als Gesamtbereich betrachten.
 *    – Zeiger in oberer Hälfte des ersten betroffenen Jobs → primär: vor dem Bereich.
 *    – Zeiger in unterer Hälfte → primär: nach dem Bereich.
 *    – Falls primäre Position ebenfalls belegt → Gegenrichtung versuchen.
 * 3. Falls beide Richtungen belegt sind → blocked (Drop verhindern, Ghost rot).
 */

export interface DropInterval {
  start: number; // Stunden vom Schichtstart (0–∞, kann schichtübergreifend sein)
  end: number;
}

export interface DropResult {
  snapHour: number;   // endgültige Startposition (Stunden)
  isBlocked: boolean; // true = kein Platz, Drop verhindern
}

/** Gibt true zurück wenn [aStart, aEnd) und [bStart, bEnd) sich überlappen. */
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd - 0.01 && bStart < aEnd - 0.01;
}

function hasConflict(hour: number, duration: number, others: DropInterval[]): boolean {
  return others.some((s) => overlaps(hour, hour + duration, s.start, s.end));
}

export function computeDropHour(
  relativeY: number,          // Zeiger-Y relativ zur Oberkante der Zeile (px)
  rowHeight: number,          // Zeilenhöhe (px)
  others: DropInterval[],     // belegte Intervalle (ohne den gezogenen Auftrag)
  draggingDuration: number,   // Druckzeit des gezogenen Auftrags (Stunden)
  allowOverflow = true        // false = letzte/einzige Schicht → Karte darf nicht über 8h hinausgehen
): DropResult {
  const maxStart = allowOverflow ? 7 : Math.max(0, 8 - draggingDuration);
  const rawOffset = (relativeY / rowHeight) * 8;
  const rawSnap = Math.max(0, Math.min(maxStart, Math.round(rawOffset)));

  const sorted = [...others].sort((a, b) => a.start - b.start);

  // Alle Jobs die mit der rohen Snap-Position überlappen
  const overlapping = sorted.filter((s) =>
    overlaps(rawSnap, rawSnap + draggingDuration, s.start, s.end)
  );

  if (overlapping.length === 0) {
    return { snapHour: rawSnap, isBlocked: false };
  }

  // Gesamtbereich der überlappenden Jobs
  const firstConflict = overlapping[0];
  const lastConflict  = overlapping[overlapping.length - 1];

  // Richtung: obere / untere Hälfte des ersten Konflikts
  const conflictMidY  = ((firstConflict.start + firstConflict.end) / 2 / 8) * rowHeight;
  const preferBefore  = relativeY < conflictMidY;

  const beforePos = Math.max(0, firstConflict.start - draggingDuration);
  const afterPos  = Math.min(maxStart, lastConflict.end);

  const [primary, secondary] = preferBefore
    ? [beforePos, afterPos]
    : [afterPos, beforePos];

  if (!hasConflict(primary, draggingDuration, sorted)) {
    return { snapHour: primary, isBlocked: false };
  }
  if (!hasConflict(secondary, draggingDuration, sorted)) {
    return { snapHour: secondary, isBlocked: false };
  }

  // Kein freier Platz
  return { snapHour: rawSnap, isBlocked: true };
}
