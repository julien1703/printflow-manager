import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { RoleKey } from "@/lib/mock-data";

type KISuggestion = {
  id: number;
  title: string;
  description: string;
  impact: string;
  confidence: number;
  isNew: boolean;
};

const SUGGESTIONS_BY_ROLE: Record<RoleKey, KISuggestion[]> = {
  produktionsleitung: [
    { id: 1, title: "Maschinentausch empfohlen", description: "Job #2024-0850 von SM5 auf CD verschieben — SM5 blockiert", impact: "Spart ~2h Rüstzeit", confidence: 92, isNew: true },
    { id: 2, title: "Rüstzeit-Optimierung", description: "Kaiser Industries und Becker & Partner auf selber Bogen — Farbgleichheit 94%", impact: "–30min Rüstzeit", confidence: 78, isNew: true },
    { id: 3, title: "Kapazitätspuffer verfügbar", description: "Digi hat Mi–Fr freie Slots — Müller Verlag vorziehbar", impact: "Lieferzeit –2 Tage", confidence: 71, isNew: false },
  ],
  buchbinderei: [
    { id: 1, title: "Reihenfolge optimieren", description: "Becker & Partner vor Mustermann GmbH einplanen — Gleiche Falzart, weniger Umrüsten", impact: "–45min heute", confidence: 88, isNew: true },
    { id: 2, title: "Kapazitätswarnung morgen", description: "7.5h geplante WV-Zeit übersteigt Schichtkapazität (8h)", impact: "1 Job verschieben", confidence: 95, isNew: true },
  ],
  logistik: [
    { id: 1, title: "Sammellieferung Stuttgart", description: "Weber AG + Meyer Consulting beide Stuttgart — 1 Lauf statt 2", impact: "Spart ~150€", confidence: 96, isNew: true },
    { id: 2, title: "Frühzeitig buchen", description: "Rossmann GmbH: Neuer Versandtermin 23.05. — Spedition jetzt buchen", impact: "Kein Expressaufschlag", confidence: 84, isNew: false },
  ],
  druckvorstufe: [
    { id: 1, title: "Freigabe priorisieren", description: "Technik GmbH: Produktion morgen 08:00 — Freigabe heute bis 17:00 kritisch", impact: "Produktion gesichert", confidence: 99, isNew: true },
    { id: 2, title: "Daten vorprüfen", description: "Schmidt Verlag: ICC-Profil fehlt — Farbabweichung wahrscheinlich", impact: "Andrucktest vermeiden", confidence: 72, isNew: true },
  ],
  projektmanager: [
    { id: 1, title: "Kundeninfo empfohlen", description: "Rossmann GmbH: Lieferverzögerung +2 Tage — Kunden informieren", impact: "Proaktive Kommunikation", confidence: 98, isNew: true },
    { id: 2, title: "Follow-up Freigabe", description: "Technik GmbH hat seit 3 Tagen nicht reagiert — Erinnerung senden", impact: "Produktionsblockade vermeiden", confidence: 85, isNew: false },
  ],
  geschaeftsfuehrung: [
    { id: 1, title: "Auslastung SM5 kritisch", description: "SM5 aktuell bei 40% — Maschinenstörung kostet ~€800/Tag", impact: "Tageskosten hoch", confidence: 93, isNew: true },
    { id: 2, title: "Pünktlichkeitsrate sinkt", description: "82% diese Woche — Trend abwärts gegenüber KW 19 (87%)", impact: "Kundenzufriedenheit", confidence: 80, isNew: false },
  ],
};

function confidenceColor(confidence: number): string {
  if (confidence > 80) return "oklch(0.52 0.14 153)";
  if (confidence >= 60) return "oklch(0.55 0.17 85)";
  return "oklch(0.50 0.22 25)";
}

function ConfidenceDots({ avg }: { avg: number }) {
  const filled = Math.round(avg / 20);
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.05em", color: "oklch(0.65 0.19 280)" }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ opacity: i < filled ? 1 : 0.25 }}>●</span>
      ))}
    </span>
  );
}

interface KISuggestionsPanelProps {
  role: RoleKey;
  context?: string;
}

export function KISuggestionsPanel({ role, context }: KISuggestionsPanelProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [showReason, setShowReason] = useState(false);

  const allSuggestions = SUGGESTIONS_BY_ROLE[role] ?? [];
  const visible = allSuggestions.filter((s) => !dismissed.has(s.id));
  const allDone = allSuggestions.length > 0 && visible.length === 0;

  const avgConfidence =
    visible.length > 0
      ? Math.round(visible.reduce((sum, s) => sum + s.confidence, 0) / visible.length)
      : 0;

  function dismiss(id: number) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: "0.75rem",
          border: `1px solid oklch(0.65 0.19 280 / 0.30)`,
          background: open
            ? "oklch(0.65 0.19 280 / 0.10)"
            : "oklch(0.65 0.19 280 / 0.05)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          color: "oklch(0.65 0.19 280)",
          transition: "background 0.15s",
          fontFamily: "var(--font-sans)",
        }}
      >
        {/* Pulsing dot */}
        <span
          className="ki-pulse"
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "oklch(0.65 0.19 280)",
            flexShrink: 0,
          }}
        />
        <Sparkles size={13} style={{ flexShrink: 0 }} />
        <span>KI-Vorschläge</span>
        {visible.length > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 17,
              height: 17,
              borderRadius: "50%",
              background: "oklch(0.65 0.19 280)",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {visible.length}
          </span>
        )}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fade-in-up"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 380,
            borderRadius: "1rem",
            border: `1px solid oklch(0.65 0.19 280 / 0.22)`,
            background: "oklch(1.0 0 0)",
            boxShadow: "0 8px 32px oklch(0.65 0.19 280 / 0.12), 0 2px 8px oklch(0 0 0 / 0.06)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px 10px",
              borderBottom: `1px solid oklch(0.88 0.003 80)`,
              background: "oklch(0.65 0.19 280 / 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Sparkles size={14} style={{ color: "oklch(0.65 0.19 280)" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "oklch(0.30 0.008 255)" }}>
                KI-Assistent · Casciq
              </span>
            </div>
            <ConfidenceDots avg={avgConfidence} />
          </div>
          {context && (
            <div style={{ padding: "6px 16px", fontSize: 10, color: "oklch(0.50 0.006 255)" }}>
              Kontext: {context}
            </div>
          )}

          {/* Body */}
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            {allDone ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                  fontSize: 13,
                  color: "oklch(0.52 0.14 153)",
                  fontWeight: 600,
                }}
              >
                Alle Vorschläge umgesetzt ✓
              </div>
            ) : (
              visible.map((s) => (
                <SuggestionCard key={s.id} suggestion={s} onAccept={() => dismiss(s.id)} onIgnore={() => dismiss(s.id)} />
              ))
            )}
          </div>

          {/* Footer */}
          {!allDone && (
            <div
              style={{
                padding: "10px 16px 12px",
                borderTop: `1px solid oklch(0.88 0.003 80)`,
              }}
            >
              <button
                onClick={() => setShowReason((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  color: "oklch(0.50 0.006 255)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {showReason ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                Begründung anzeigen
              </button>
              {showReason && (
                <p
                  className="fade-in-up"
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "oklch(0.50 0.006 255)",
                    lineHeight: 1.5,
                  }}
                >
                  Die KI analysiert Auftragsdaten, Maschinenkapazitäten und historische Produktionsmuster, um optimale Handlungsempfehlungen zu generieren. Konfidenzwerte basieren auf Datenverfügbarkeit und Modellsicherheit.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: KISuggestion;
  onAccept: () => void;
  onIgnore: () => void;
}

function SuggestionCard({ suggestion, onAccept, onIgnore }: SuggestionCardProps) {
  const barColor = confidenceColor(suggestion.confidence);
  const confColor = confidenceColor(suggestion.confidence);

  return (
    <div
      className={suggestion.isNew ? "ki-pulse" : undefined}
      style={{
        background: "oklch(0.65 0.19 280 / 0.05)",
        border: `1px solid oklch(0.65 0.19 280 / 0.22)`,
        borderRadius: "0.75rem",
        overflow: "hidden",
      }}
    >
      {/* Confidence bar */}
      <div style={{ height: 2, width: "100%", background: "oklch(0.92 0.003 80)" }}>
        <div
          style={{
            height: "100%",
            width: `${suggestion.confidence}%`,
            background: barColor,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Row 1: icon + title + confidence */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "oklch(0.65 0.19 280)", fontSize: 12, flexShrink: 0 }}>✦</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "oklch(0.20 0.008 255)",
              flex: 1,
              lineHeight: 1.3,
            }}
          >
            {suggestion.title}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: confColor,
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}
          >
            {suggestion.confidence}%
          </span>
        </div>

        {/* Row 2: description */}
        <p
          style={{
            fontSize: 12,
            color: "oklch(0.45 0.006 255)",
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          {suggestion.description}
        </p>

        {/* Row 3: impact badge */}
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "2px 7px",
              borderRadius: "0.4rem",
              background: "oklch(0.91 0.003 80)",
              color: "oklch(0.38 0.006 255)",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {suggestion.impact}
          </span>
        </div>

        {/* Row 4: action buttons */}
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <button
            onClick={onAccept}
            style={{
              flex: 1,
              padding: "5px 10px",
              borderRadius: "0.5rem",
              border: "none",
              background: "oklch(0.22 0.008 255)",
              color: "oklch(0.99 0 0)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Übernehmen
          </button>
          <button
            onClick={onIgnore}
            style={{
              flex: 1,
              padding: "5px 10px",
              borderRadius: "0.5rem",
              border: `1px solid oklch(0.85 0.003 80)`,
              background: "transparent",
              color: "oklch(0.45 0.006 255)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.94 0.003 80)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Ignorieren
          </button>
        </div>
      </div>
    </div>
  );
}
