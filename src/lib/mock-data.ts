export type Machine = "CD" | "RZK" | "SM5" | "Digi";
export type Phase = "Schneiden" | "Vordruck" | "Hauptdruck" | "Nachbereitung" | "Versandfertig";
export type ZeitStatus = "Vorzeitig" | "Nach Plan" | "Hinterher";

export const PHASES: Phase[] = ["Schneiden", "Vordruck", "Hauptdruck", "Nachbereitung", "Versandfertig"];

export const MACHINE_META: Record<Machine, { label: string; color: string; bg: string; text: string }> = {
  CD:   { label: "CD",   color: "var(--machine-cd)",   bg: "bg-machine-cd",   text: "text-machine-cd" },
  RZK:  { label: "RZK",  color: "var(--machine-rzk)",  bg: "bg-machine-rzk",  text: "text-machine-rzk" },
  SM5:  { label: "SM5",  color: "var(--machine-sm5)",  bg: "bg-machine-sm5",  text: "text-machine-sm5" },
  Digi: { label: "Digi", color: "var(--machine-digi)", bg: "bg-machine-digi", text: "text-machine-digi" },
};

export interface Job {
  id: string;
  customer: string;
  machine: Machine;
  phase: Phase;
  status: ZeitStatus;
  delivery: string; // dd.mm.
  openSubsteps: number;
  problem?: string;
  finishing?: "Falzen" | "Binden" | "Heften" | "Schneiden";
  finishingHours?: number;
  wvDay?: 0 | 1 | 2; // 0=heute,1=morgen,2=übermorgen
  wvStatus?: "Wartet auf Druck" | "Druck läuft" | "Bereit für WV";
  city?: string;
  versandfertigAb?: string;
  shipStatus?: "Offen" | "Gebucht" | "Versendet";
  shipUrgency?: "low" | "medium" | "high"; // green/yellow/red cost
  paper?: string;
  quantity?: string;
  instructions?: string;
}

export const JOBS: Job[] = [
  {
    id: "#42512-001", customer: "Rossmann GmbH", machine: "CD", phase: "Hauptdruck",
    status: "Hinterher", delivery: "30.04.", openSubsteps: 3,
    problem: "Druckfreigabe fehlt",
    finishing: "Falzen", finishingHours: 2, wvDay: 1, wvStatus: "Druck läuft",
    city: "Stuttgart", versandfertigAb: "29.04.", shipStatus: "Offen", shipUrgency: "high",
    paper: "Bilderdruck matt 135g", quantity: "12.500 Stk.", instructions: "4/4-farbig, Sonderfarbe Pantone 286 C",
  },
  {
    id: "#42512-002", customer: "LCR Broschüre", machine: "RZK", phase: "Nachbereitung",
    status: "Nach Plan", delivery: "02.05.", openSubsteps: 1,
    finishing: "Binden", finishingHours: 3, wvDay: 0, wvStatus: "Bereit für WV",
    city: "München", versandfertigAb: "30.04.", shipStatus: "Gebucht", shipUrgency: "medium",
    paper: "Offset 80g weiß", quantity: "4.000 Stk.", instructions: "1/1-farbig, Rückendrahtheftung",
  },
  {
    id: "#42512-003", customer: "Flora & Fauna", machine: "SM5", phase: "Vordruck",
    status: "Vorzeitig", delivery: "05.05.", openSubsteps: 2,
    finishing: "Heften", finishingHours: 1.5, wvDay: 2, wvStatus: "Wartet auf Druck",
    city: "Tübingen", versandfertigAb: "03.05.", shipStatus: "Offen", shipUrgency: "low",
    paper: "Naturpapier 120g", quantity: "2.200 Stk.", instructions: "5-farbig inkl. Lack",
  },
  {
    id: "#42512-004", customer: "Mayer & Söhne", machine: "Digi", phase: "Versandfertig",
    status: "Nach Plan", delivery: "29.04.", openSubsteps: 0,
    finishing: "Schneiden", finishingHours: 0.5, wvDay: 0, wvStatus: "Bereit für WV",
    city: "Berlin", versandfertigAb: "28.04.", shipStatus: "Versendet", shipUrgency: "low",
    paper: "Digitaldruck 200g", quantity: "500 Stk.", instructions: "Visitenkarten beidseitig",
  },
  {
    id: "#42512-005", customer: "Stadtwerk Tü", machine: "CD", phase: "Schneiden",
    status: "Nach Plan", delivery: "06.05.", openSubsteps: 4,
    finishing: "Falzen", finishingHours: 2.5, wvDay: 2, wvStatus: "Wartet auf Druck",
    city: "Tübingen", versandfertigAb: "04.05.", shipStatus: "Offen", shipUrgency: "low",
    paper: "Recycling 100g", quantity: "8.000 Stk.", instructions: "4/4-farbig, Wickelfalz",
  },
  {
    id: "#42512-006", customer: "Uni Stuttgart", machine: "RZK", phase: "Hauptdruck",
    status: "Hinterher", delivery: "01.05.", openSubsteps: 2,
    problem: "Maschine klemmt",
    finishing: "Binden", finishingHours: 4, wvDay: 1, wvStatus: "Druck läuft",
    city: "Stuttgart", versandfertigAb: "30.04.", shipStatus: "Offen", shipUrgency: "high",
    paper: "Offset 90g", quantity: "1.500 Stk.", instructions: "Klebebindung, Softcover",
  },
];

export const UPCOMING = [
  { id: "#42512-007", customer: "Bäckerei Mock", machine: "SM5" as Machine },
  { id: "#42512-008", customer: "Sparkasse RT",  machine: "CD" as Machine },
  { id: "#42512-009", customer: "Theater Tü",    machine: "Digi" as Machine },
];

export const MESSAGES = [
  { from: "Seifert", text: "WV für #42512-004 bereit", unread: true },
  { from: "Batt",    text: "Versand #42512-002 gebucht", unread: true },
  { from: "Maisch",  text: "Schichtplan aktualisiert", unread: false },
];

export const AI_SUGGESTIONS = [
  { id: 1, icon: "⚡", text: "Rossmann-Job um 2h vorgezogen — CD Kapazität frei am Donnerstag", isNew: true },
  { id: 2, icon: "⚠", text: "RZK ist Freitag überbucht — 1 Job verschieben?", isNew: true },
  { id: 3, icon: "💡", text: "Digi-Auftrag #42512-004 könnte heute noch versendet werden", isNew: false },
];

export type RoleKey = "produktionsleitung" | "buchbinderei" | "logistik" | "drucker" | "projektmanager";

export const ROLES: { key: RoleKey; name: string; person: string; nav: string[] }[] = [
  { key: "produktionsleitung", name: "Produktionsleitung", person: "Hr. Maisch",  nav: ["Übersicht","Auftragsplanung","Maschinen","Versand","Einstellungen"] },
  { key: "buchbinderei",       name: "Buchbinderei / WV",  person: "Hr. Seifert", nav: ["Übersicht","Auftragsplanung","Einstellungen"] },
  { key: "logistik",           name: "Logistik & Versand", person: "Fr. Batt",    nav: ["Übersicht","Versand","Einstellungen"] },
  { key: "drucker",            name: "Drucker",            person: "Maschinenführer", nav: ["Übersicht","Maschinen","Einstellungen"] },
  { key: "projektmanager",     name: "Projektmanager",     person: "Kundenbetreuung", nav: ["Übersicht","Auftragsplanung","Einstellungen"] },
];
