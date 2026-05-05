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
    id: "#42512-001", customer: "Mustermann GmbH", machine: "CD", phase: "Hauptdruck",
    status: "Hinterher", delivery: "30.04.", openSubsteps: 3,
    problem: "Druckfreigabe fehlt",
    finishing: "Falzen", finishingHours: 2, wvDay: 1, wvStatus: "Druck läuft",
    city: "Musterstadt", versandfertigAb: "29.04.", shipStatus: "Offen", shipUrgency: "high",
    paper: "Bilderdruck matt 135g", quantity: "12.500 Stk.", instructions: "4/4-farbig, Sonderfarbe Pantone 286 C",
  },
  {
    id: "#42512-002", customer: "Muster Verlag AG", machine: "RZK", phase: "Nachbereitung",
    status: "Nach Plan", delivery: "02.05.", openSubsteps: 1,
    finishing: "Binden", finishingHours: 3, wvDay: 0, wvStatus: "Bereit für WV",
    city: "Musterstadt", versandfertigAb: "30.04.", shipStatus: "Gebucht", shipUrgency: "medium",
    paper: "Offset 80g weiß", quantity: "4.000 Stk.", instructions: "1/1-farbig, Rückendrahtheftung",
  },
  {
    id: "#42512-003", customer: "Grünwald & Co.", machine: "SM5", phase: "Vordruck",
    status: "Vorzeitig", delivery: "05.05.", openSubsteps: 2,
    finishing: "Heften", finishingHours: 1.5, wvDay: 2, wvStatus: "Wartet auf Druck",
    city: "Musterort", versandfertigAb: "03.05.", shipStatus: "Offen", shipUrgency: "low",
    paper: "Naturpapier 120g", quantity: "2.200 Stk.", instructions: "5-farbig inkl. Lack",
  },
  {
    id: "#42512-004", customer: "Weber & Partner", machine: "Digi", phase: "Versandfertig",
    status: "Nach Plan", delivery: "29.04.", openSubsteps: 0,
    finishing: "Schneiden", finishingHours: 0.5, wvDay: 0, wvStatus: "Bereit für WV",
    city: "Musterstadt", versandfertigAb: "28.04.", shipStatus: "Versendet", shipUrgency: "low",
    paper: "Digitaldruck 200g", quantity: "500 Stk.", instructions: "Visitenkarten beidseitig",
  },
  {
    id: "#42512-005", customer: "Stadtwerk Muster", machine: "CD", phase: "Schneiden",
    status: "Nach Plan", delivery: "06.05.", openSubsteps: 4,
    finishing: "Falzen", finishingHours: 2.5, wvDay: 2, wvStatus: "Wartet auf Druck",
    city: "Musterort", versandfertigAb: "04.05.", shipStatus: "Offen", shipUrgency: "low",
    paper: "Recycling 100g", quantity: "8.000 Stk.", instructions: "4/4-farbig, Wickelfalz",
  },
  {
    id: "#42512-006", customer: "Muster Institut", machine: "RZK", phase: "Hauptdruck",
    status: "Hinterher", delivery: "01.05.", openSubsteps: 2,
    problem: "Maschine klemmt",
    finishing: "Binden", finishingHours: 4, wvDay: 1, wvStatus: "Druck läuft",
    city: "Musterstadt", versandfertigAb: "30.04.", shipStatus: "Offen", shipUrgency: "high",
    paper: "Offset 90g", quantity: "1.500 Stk.", instructions: "Klebebindung, Softcover",
  },
];

export const UPCOMING = [
  { id: "#42512-007", customer: "Bäckerei Muster", machine: "SM5" as Machine },
  { id: "#42512-008", customer: "Musterbank AG",   machine: "CD" as Machine },
  { id: "#42512-009", customer: "Muster Theater", machine: "Digi" as Machine },
];

export const MESSAGES = [
  { from: "P. Muster",  text: "WV für #42512-004 bereit", unread: true },
  { from: "A. Muster", text: "Versand #42512-002 gebucht", unread: true },
  { from: "M. Muster", text: "Schichtplan aktualisiert", unread: false },
];

export const AI_SUGGESTIONS = [
  { id: 1, icon: "⚡", text: "Rossmann-Job um 2h vorgezogen — CD Kapazität frei am Donnerstag", isNew: true },
  { id: 2, icon: "⚠", text: "RZK ist Freitag überbucht — 1 Job verschieben?", isNew: true },
  { id: 3, icon: "💡", text: "Digi-Auftrag #42512-004 könnte heute noch versendet werden", isNew: false },
];

export type RoleKey = "produktionsleitung" | "buchbinderei" | "logistik" | "drucker" | "projektmanager";

export const ROLES: { key: RoleKey; name: string; person: string; nav: string[] }[] = [
  { key: "produktionsleitung", name: "Produktionsleitung", person: "Max Mustermann",  nav: ["Übersicht","Wochenplan","Auftragsplanung","Maschinen","Versand","Einstellungen"] },
  { key: "buchbinderei",       name: "Buchbinderei / WV",  person: "Peter Muster",    nav: ["Übersicht","Wochenplan","Auftragsplanung","Einstellungen"] },
  { key: "logistik",           name: "Logistik & Versand", person: "Anna Muster",     nav: ["Übersicht","Wochenplan","Versand","Einstellungen"] },
  { key: "drucker",            name: "Drucker",            person: "Klaus Muster",    nav: ["Übersicht","Wochenplan","Maschinen","Einstellungen"] },
  { key: "projektmanager",     name: "Projektmanager",     person: "Lisa Muster",     nav: ["Übersicht","Wochenplan","Auftragsplanung","Einstellungen"] },
];

/* ========== Live print status (Im Druck) ========== */
export interface LivePrintJob {
  id: string;
  customer: string;
  machine: Machine;
  progress: number;       // 0–100
  finishInMin: number;    // estimated minutes remaining
  wvInHours: number;      // ready for WV in ~Xh
  ownerCustomer?: string; // for projektmanager filtering
}

export const LIVE_PRINT: LivePrintJob[] = [
  { id: "#42512-001", customer: "Mustermann GmbH", machine: "CD",  progress: 67, finishInMin: 45, wvInHours: 2 },
  { id: "#42512-006", customer: "Muster Institut", machine: "RZK", progress: 32, finishInMin: 110, wvInHours: 4 },
  { id: "#42512-002", customer: "Muster Verlag AG", machine: "RZK", progress: 92, finishInMin: 12, wvInHours: 1 },
];

/* ========== Wochenplan slot grid ========== */
export type Slot = "Früh" | "Spät";
export const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr"] as const;
export type Weekday = typeof WEEKDAYS[number];
export const SLOTS: Slot[] = ["Früh", "Spät"];
export const TODAY_INDEX = 2; // "Mi" highlighted as today

export interface WeekSlot {
  machine: Machine;
  day: Weekday;
  slot: Slot;
  jobId?: string;
  customer?: string;
  phase?: Phase;
  ownerPM?: string; // projektmanager owner key
}

// Mock weekly plan — gives every machine a believable weekly load
export const WEEK_PLAN: WeekSlot[] = [
  // CD
  { machine: "CD", day: "Mo", slot: "Früh", jobId: "#42512-005", customer: "Stadtwerk Muster", phase: "Schneiden", ownerPM: "Müller" },
  { machine: "CD", day: "Mo", slot: "Spät", jobId: "#42512-001", customer: "Mustermann GmbH", phase: "Vordruck", ownerPM: "Müller" },
  { machine: "CD", day: "Di", slot: "Früh", jobId: "#42512-001", customer: "Mustermann GmbH", phase: "Hauptdruck", ownerPM: "Müller" },
  { machine: "CD", day: "Di", slot: "Spät" },
  { machine: "CD", day: "Mi", slot: "Früh", jobId: "#42512-001", customer: "Mustermann GmbH", phase: "Hauptdruck", ownerPM: "Müller" },
  { machine: "CD", day: "Mi", slot: "Spät", jobId: "#42512-005", customer: "Stadtwerk Muster", phase: "Hauptdruck", ownerPM: "Müller" },
  { machine: "CD", day: "Do", slot: "Früh", jobId: "#42512-008", customer: "Musterbank AG", phase: "Vordruck", ownerPM: "Schmidt" },
  { machine: "CD", day: "Do", slot: "Spät", jobId: "#42512-008", customer: "Musterbank AG", phase: "Hauptdruck", ownerPM: "Schmidt" },
  { machine: "CD", day: "Fr", slot: "Früh" },
  { machine: "CD", day: "Fr", slot: "Spät" },
  // RZK
  { machine: "RZK", day: "Mo", slot: "Früh", jobId: "#42512-002", customer: "Muster Verlag AG", phase: "Hauptdruck", ownerPM: "Schmidt" },
  { machine: "RZK", day: "Mo", slot: "Spät", jobId: "#42512-006", customer: "Muster Institut", phase: "Vordruck", ownerPM: "Schmidt" },
  { machine: "RZK", day: "Di", slot: "Früh", jobId: "#42512-002", customer: "Muster Verlag AG", phase: "Nachbereitung", ownerPM: "Schmidt" },
  { machine: "RZK", day: "Di", slot: "Spät", jobId: "#42512-006", customer: "Muster Institut", phase: "Hauptdruck", ownerPM: "Schmidt" },
  { machine: "RZK", day: "Mi", slot: "Früh", jobId: "#42512-006", customer: "Muster Institut", phase: "Hauptdruck", ownerPM: "Schmidt" },
  { machine: "RZK", day: "Mi", slot: "Spät" },
  { machine: "RZK", day: "Do", slot: "Früh", jobId: "#42512-006", customer: "Muster Institut", phase: "Nachbereitung", ownerPM: "Schmidt" },
  { machine: "RZK", day: "Do", slot: "Spät" },
  { machine: "RZK", day: "Fr", slot: "Früh" },
  { machine: "RZK", day: "Fr", slot: "Spät" },
  // SM5
  { machine: "SM5", day: "Mo", slot: "Früh" },
  { machine: "SM5", day: "Mo", slot: "Spät", jobId: "#42512-003", customer: "Grünwald Flora & Fauna Co.", phase: "Schneiden", ownerPM: "Müller" },
  { machine: "SM5", day: "Di", slot: "Früh", jobId: "#42512-003", customer: "Grünwald Flora & Fauna Co.", phase: "Vordruck", ownerPM: "Müller" },
  { machine: "SM5", day: "Di", slot: "Spät", jobId: "#42512-003", customer: "Grünwald Flora & Fauna Co.", phase: "Vordruck", ownerPM: "Müller" },
  { machine: "SM5", day: "Mi", slot: "Früh", jobId: "#42512-003", customer: "Grünwald Flora & Fauna Co.", phase: "Hauptdruck", ownerPM: "Müller" },
  { machine: "SM5", day: "Mi", slot: "Spät", jobId: "#42512-007", customer: "Bäckerei Muster", phase: "Schneiden", ownerPM: "Müller" },
  { machine: "SM5", day: "Do", slot: "Früh", jobId: "#42512-007", customer: "Bäckerei Muster", phase: "Hauptdruck", ownerPM: "Müller" },
  { machine: "SM5", day: "Do", slot: "Spät" },
  { machine: "SM5", day: "Fr", slot: "Früh", jobId: "#42512-007", customer: "Bäckerei Muster", phase: "Nachbereitung", ownerPM: "Müller" },
  { machine: "SM5", day: "Fr", slot: "Spät" },
  // Digi
  { machine: "Digi", day: "Mo", slot: "Früh", jobId: "#42512-004", customer: "Weber Mayer & Söhne Partner", phase: "Versandfertig", ownerPM: "Schmidt" },
  { machine: "Digi", day: "Mo", slot: "Spät" },
  { machine: "Digi", day: "Di", slot: "Früh" },
  { machine: "Digi", day: "Di", slot: "Spät", jobId: "#42512-009", customer: "Muster Theater", phase: "Vordruck", ownerPM: "Müller" },
  { machine: "Digi", day: "Mi", slot: "Früh", jobId: "#42512-009", customer: "Muster Theater", phase: "Hauptdruck", ownerPM: "Müller" },
  { machine: "Digi", day: "Mi", slot: "Spät" },
  { machine: "Digi", day: "Do", slot: "Früh" },
  { machine: "Digi", day: "Do", slot: "Spät" },
  { machine: "Digi", day: "Fr", slot: "Früh" },
  { machine: "Digi", day: "Fr", slot: "Spät" },
];

// "My" projektmanager (for filtering in PM weekly view)
export const CURRENT_PM = "Müller";
