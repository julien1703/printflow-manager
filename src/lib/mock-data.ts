export type Machine = "CD" | "RZK" | "SM5" | "Digi";
export type Phase = "Vorstufe" | "Im Druck" | "Weiterverarbeitung" | "Versandbereit";
export type ZeitStatus = "Vorzeitig" | "Nach Plan" | "Hinterher";
export type OrderStatus =
  | "Auftragseingang"
  | "Druckvorstufe"
  | "Druckfreigabe"
  | "In Produktion"
  | "Weiterverarbeitung"
  | "Versandbereit"
  | "Abgeschlossen"
  | "Blockiert"
  | "Storniert";

export const PHASES: Phase[] = ["Vorstufe", "Im Druck", "Weiterverarbeitung", "Versandbereit"];

export const ORDER_STATUS_CHAIN: OrderStatus[] = [
  "Auftragseingang", "Druckvorstufe", "Druckfreigabe", "In Produktion",
  "Weiterverarbeitung", "Versandbereit", "Abgeschlossen",
];

export const MACHINE_META: Record<Machine, { label: string; color: string; bg: string; text: string }> = {
  CD:   { label: "CD",   color: "var(--machine-cd)",   bg: "bg-machine-cd",   text: "text-machine-cd" },
  RZK:  { label: "RZK",  color: "var(--machine-rzk)",  bg: "bg-machine-rzk",  text: "text-machine-rzk" },
  SM5:  { label: "SM5",  color: "var(--machine-sm5)",  bg: "bg-machine-sm5",  text: "text-machine-sm5" },
  Digi: { label: "Digi", color: "var(--machine-digi)", bg: "bg-machine-digi", text: "text-machine-digi" },
};

export interface Job {
  id: string;
  customer: string;
  product: string;
  machine: Machine;
  phase: Phase;
  orderStatus: OrderStatus;
  status: ZeitStatus;
  delivery: string;
  openSubsteps: number;
  problem?: string;
  druckfreigabe?: "Erteilt" | "Fehlt" | "Angefordert";
  productionScheduled?: boolean;
  finishing?: "Falzen" | "Binden" | "Heften" | "Schneiden" | "Sonderverarbeitung";
  finishingHours?: number;
  wvDay?: 0 | 1 | 2;
  wvStatus?: "Wartet auf Druck" | "Druck läuft" | "Bereit für WV";
  city?: string;
  versandfertigAb?: string;
  shipStatus?: "Offen" | "Gebucht" | "Versendet";
  shipUrgency?: "low" | "medium" | "high";
  paper?: string;
  quantity?: string;
  instructions?: string;
  cascadeConflict?: boolean;
  cascadeDelay?: string;
  projectManager?: string;
  // --- Maisch interview additions ---
  dispersionslack?: boolean;
  sonderfarbe?: string;
  grammatur?: number;
  druckzeitStunden?: number;
  festgepinnt?: boolean;
  isNew?: boolean;
  paletten?: number;
  // --- Wochenplan Redesign additions ---
  prioritaet?: "normal" | "eilig" | "express";
  notiz?: string | null;
  seitenanzahl?: number | null;
  auflage?: number;
  druckdatenEingang?: string | null;  // "DD.MM." format; null = not yet received
  weiterverarbeitungStunden?: number; // total WV hours (complements finishingHours which is for the specific finishing step)
}

export const JOBS: Job[] = [
  {
    id: "#2024-0847",
    customer: "Mustermann GmbH",
    product: "Broschüre A4",
    machine: "CD",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Hinterher",
    delivery: "20.05.",
    openSubsteps: 3,
    problem: "Farbabweichung Pantone 286 C — Andrucktest wiederholen",
    druckfreigabe: "Erteilt",
    finishing: "Falzen",
    finishingHours: 3,
    wvDay: 1,
    wvStatus: "Druck läuft",
    city: "Stuttgart",
    versandfertigAb: "19.05.",
    shipStatus: "Offen",
    shipUrgency: "high",
    paper: "Bilderdruck matt 135g",
    quantity: "5.000 Stk.",
    instructions: "4/4-farbig, Sonderfarbe Pantone 286 C",
    projectManager: "Müller",
    dispersionslack: true,
    sonderfarbe: "Pantone 286 C",
    grammatur: 135,
    druckzeitStunden: 4.5,
    festgepinnt: true,
  },
  {
    id: "#2024-0848",
    customer: "Schmidt Verlag",
    product: "Katalog A4",
    machine: "RZK",
    phase: "Vorstufe",
    orderStatus: "Druckfreigabe",
    status: "Nach Plan",
    delivery: "22.05.",
    openSubsteps: 1,
    druckfreigabe: "Fehlt",
    finishing: "Binden",
    finishingHours: 3,
    wvDay: 1,
    wvStatus: "Wartet auf Druck",
    city: "München",
    versandfertigAb: "21.05.",
    shipStatus: "Offen",
    shipUrgency: "medium",
    paper: "Offset 80g weiß",
    quantity: "2.000 Stk.",
    instructions: "1/1-farbig, Rückendrahtheftung",
    projectManager: "Schmidt",
  },
  {
    id: "#2024-0849",
    customer: "Weber AG",
    product: "Flyer A5",
    machine: "Digi",
    phase: "Versandbereit",
    orderStatus: "Versandbereit",
    status: "Vorzeitig",
    delivery: "19.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Schneiden",
    finishingHours: 0.5,
    wvDay: 0,
    wvStatus: "Bereit für WV",
    city: "Frankfurt",
    versandfertigAb: "18.05.",
    shipStatus: "Gebucht",
    shipUrgency: "low",
    paper: "Digitaldruck 170g",
    quantity: "10.000 Stk.",
    instructions: "4/4-farbig, Wickelfalz",
    projectManager: "Müller",
  },
  {
    id: "#2024-0850",
    customer: "Rossmann GmbH",
    product: "Plakat B1",
    machine: "SM5",
    phase: "Im Druck",
    orderStatus: "Blockiert",
    status: "Hinterher",
    delivery: "21.05.",
    openSubsteps: 2,
    problem: "SM5 Maschinenstörung — Verzögerung +2 Tage",
    druckfreigabe: "Erteilt",
    cascadeConflict: true,
    cascadeDelay: "+2 Tage",
    finishing: "Schneiden",
    finishingHours: 2,
    wvDay: 2,
    wvStatus: "Druck läuft",
    city: "Köln",
    versandfertigAb: "21.05.",
    shipStatus: "Gebucht",
    shipUrgency: "high",
    paper: "Plakardruck 135g",
    quantity: "1.500 Stk.",
    instructions: "5-farbig inkl. Glanzlack",
    projectManager: "Müller",
    dispersionslack: false,
    sonderfarbe: "Pantone 485 C",
    grammatur: 135,
    druckzeitStunden: 3.0,
  },
  {
    id: "#2024-0851",
    customer: "Becker & Partner",
    product: "Geschäftsbericht",
    machine: "CD",
    phase: "Weiterverarbeitung",
    orderStatus: "Weiterverarbeitung",
    status: "Nach Plan",
    delivery: "23.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Binden",
    finishingHours: 4,
    wvDay: 0,
    wvStatus: "Bereit für WV",
    city: "Hamburg",
    versandfertigAb: "22.05.",
    shipStatus: "Offen",
    shipUrgency: "low",
    paper: "Recyclingpapier 90g",
    quantity: "800 Stk.",
    instructions: "4/0 einseitig, Klebebindung",
    projectManager: "Schmidt",
  },
  {
    id: "#2024-0852",
    customer: "Technik GmbH",
    product: "Produktkatalog A4",
    machine: "RZK",
    phase: "Vorstufe",
    orderStatus: "Druckvorstufe",
    status: "Hinterher",
    delivery: "24.05.",
    openSubsteps: 2,
    problem: "Druckfreigabe fehlt — Produktion morgen 08:00 Uhr geplant!",
    druckfreigabe: "Fehlt",
    productionScheduled: true,
    finishing: "Falzen",
    finishingHours: 2,
    wvDay: 2,
    wvStatus: "Wartet auf Druck",
    city: "Berlin",
    versandfertigAb: "23.05.",
    shipStatus: "Offen",
    shipUrgency: "medium",
    paper: "Bilderdruck glänzend 150g",
    quantity: "3.000 Stk.",
    instructions: "4/4-farbig, Klebebindung A4",
    projectManager: "Müller",
  },
  {
    id: "#2024-0853",
    customer: "Müller Verlag",
    product: "Jahreskalender",
    machine: "SM5",
    phase: "Vorstufe",
    orderStatus: "Auftragseingang",
    status: "Vorzeitig",
    delivery: "30.05.",
    openSubsteps: 0,
    druckfreigabe: "Angefordert",
    finishing: "Heften",
    finishingHours: 2.5,
    wvDay: 2,
    wvStatus: "Wartet auf Druck",
    city: "Düsseldorf",
    versandfertigAb: "29.05.",
    shipStatus: "Offen",
    shipUrgency: "low",
    paper: "Naturpapier 120g",
    quantity: "2.000 Stk.",
    instructions: "5-farbig inkl. Folienprägung",
    projectManager: "Schmidt",
    dispersionslack: true,
    grammatur: 120,
    druckzeitStunden: 5.0,
    paletten: 3,
  },
  {
    id: "#2024-0854",
    customer: "Baumarkt AG",
    product: "Werbeheft",
    machine: "Digi",
    phase: "Versandbereit",
    orderStatus: "Abgeschlossen",
    status: "Vorzeitig",
    delivery: "17.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    city: "Mannheim",
    versandfertigAb: "16.05.",
    shipStatus: "Versendet",
    shipUrgency: "low",
    paper: "Digitaldruck 80g",
    quantity: "20.000 Stk.",
    instructions: "4/4-farbig, Rückendrahtheftung",
    projectManager: "Müller",
  },
  {
    id: "#2024-0855",
    customer: "Schulz Textil",
    product: "Produktfolder",
    machine: "CD",
    phase: "Vorstufe",
    orderStatus: "Druckfreigabe",
    status: "Nach Plan",
    delivery: "25.05.",
    openSubsteps: 1,
    druckfreigabe: "Erteilt",
    finishing: "Falzen",
    finishingHours: 2.5,
    wvDay: 2,
    wvStatus: "Wartet auf Druck",
    city: "Nürnberg",
    versandfertigAb: "24.05.",
    shipStatus: "Offen",
    shipUrgency: "low",
    paper: "Naturpapier 150g",
    quantity: "5.000 Stk.",
    instructions: "4/4-farbig, Wickelfalz",
    projectManager: "Schmidt",
  },
  {
    id: "#2024-0856",
    customer: "Kaiser Industries",
    product: "Technisches Handbuch",
    machine: "RZK",
    phase: "Im Druck",
    orderStatus: "In Produktion",
    status: "Nach Plan",
    delivery: "26.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    finishing: "Binden",
    finishingHours: 5,
    wvDay: 2,
    wvStatus: "Druck läuft",
    city: "Leipzig",
    versandfertigAb: "25.05.",
    shipStatus: "Offen",
    shipUrgency: "low",
    paper: "Offset 100g weiß",
    quantity: "1.200 Stk.",
    instructions: "1/1-farbig, Klebebindung",
    projectManager: "Müller",
  },
  {
    id: "#2024-0857",
    customer: "Meyer Consulting",
    product: "Visitenkarten Premium",
    machine: "Digi",
    phase: "Versandbereit",
    orderStatus: "Versandbereit",
    status: "Nach Plan",
    delivery: "19.05.",
    openSubsteps: 0,
    druckfreigabe: "Erteilt",
    city: "Stuttgart",
    versandfertigAb: "18.05.",
    shipStatus: "Offen",
    shipUrgency: "high",
    paper: "Chromokarton 350g",
    quantity: "500 Stk.",
    instructions: "4/4-farbig, Ecken abrunden",
    projectManager: "Schmidt",
  },
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
    customer: "Bauer Druck GmbH",
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
    customer: "Stadtwerke Heidelberg",
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
];

export const UPCOMING = JOBS.filter((j) => j.orderStatus === "Auftragseingang");

export const MESSAGES = [
  { from: "H. Seifert",  text: "Rossmann WV-Slot Di jetzt frei — umplanen?", unread: true },
  { from: "A. Batt",     text: "Rossmann-Versand 21.05. storniert", unread: true },
  { from: "K. Weber",    text: "Technik GmbH: Freigabe bis 17:00 ausstehend", unread: true },
  { from: "T. Schmidt",  text: "Schulz Textil Druckfreigabe erteilt", unread: false },
];

export const AI_SUGGESTIONS = [
  {
    id: 1,
    icon: "⚡",
    text: "Rossmann-Slot (SM5 Mo/Di) freigeben — Müller Verlag Jahreskalender vorziehen, SM5-Auslastung auf 70% heben",
    isNew: true,
  },
  {
    id: 2,
    icon: "⚠",
    text: "Technik GmbH Druckfreigabe fehlt — RZK morgen 08:00 blockiert. Alternativ: Kaiser Industries auf diesen Slot?",
    isNew: true,
  },
  {
    id: 3,
    icon: "💡",
    text: "Weber AG + Meyer Consulting: beide Stuttgart-Lieferungen heute zusammenfassen → 1 Lieferlauf statt 2 (~150€ sparen)",
    isNew: false,
  },
];

export interface CascadeConflict {
  triggerId: string;
  triggerCustomer: string;
  reason: string;
  since: string;
  affected: {
    role: RoleKey;
    impact: string;
    severity: "high" | "medium" | "low";
    actionRequired: boolean;
  }[];
}

export const CASCADE_CONFLICTS: CascadeConflict[] = [
  {
    triggerId: "#2024-0850",
    triggerCustomer: "Rossmann GmbH",
    reason: "SM5 Maschinenstörung — Produktion um +2 Tage verschoben",
    since: "Heute, 07:30 Uhr",
    affected: [
      {
        role: "buchbinderei",
        impact: "Weiterverarbeitung verschiebt sich: Schneiden Di → Do",
        severity: "high",
        actionRequired: true,
      },
      {
        role: "logistik",
        impact: "Versanddatum 21.05. (bereits gebucht) nicht mehr haltbar — Stornierung prüfen",
        severity: "high",
        actionRequired: true,
      },
      {
        role: "projektmanager",
        impact: "Kundentermin Rossmann GmbH (21.05.) ist gefährdet",
        severity: "medium",
        actionRequired: false,
      },
    ],
  },
];

export interface MorningUpdate {
  type: "cascade" | "problem" | "versand" | "neu" | "erledigt";
  text: string;
  jobId?: string;
  severity: "critical" | "warn" | "info";
}

export const MORNING_BRIEFING: MorningUpdate[] = [
  {
    type: "cascade",
    text: "Rossmann GmbH (SM5): Maschinenstörung seit 07:30 — +2 Tage. Buchbinderei und Logistik betroffen.",
    jobId: "#2024-0850",
    severity: "critical",
  },
  {
    type: "problem",
    text: "Technik GmbH: Druckfreigabe fehlt — Produktion morgen 08:00 Uhr geplant!",
    jobId: "#2024-0852",
    severity: "warn",
  },
  {
    type: "versand",
    text: "Weber AG + Meyer Consulting heute versandbereit — Zusammenführung nach Stuttgart möglich",
    severity: "info",
  },
  {
    type: "neu",
    text: "Müller Verlag: Neuer Auftrag eingegangen — Jahreskalender, Deadline 30.05.",
    jobId: "#2024-0853",
    severity: "info",
  },
  {
    type: "erledigt",
    text: "Baumarkt AG erfolgreich versendet — Auftrag abgeschlossen",
    jobId: "#2024-0854",
    severity: "info",
  },
];

export const GF_KPIS = {
  maschinenauslastung: { CD: 85, RZK: 65, SM5: 40, Digi: 75 },
  puenktlichkeitsrate: 82,
  offeneKonflikte: 2,
  atRiskOrders: 3,
  auftragsvolumenWoche: 11,
  auftragsvolumenMonat: 47,
  wochenChartData: [
    { woche: "KW 17", auftraege: 9,  puenktlich: 8 },
    { woche: "KW 18", auftraege: 12, puenktlich: 10 },
    { woche: "KW 19", auftraege: 8,  puenktlich: 7 },
    { woche: "KW 20", auftraege: 11, puenktlich: 9 },
  ],
};

export type RoleKey = "produktionsleitung" | "buchbinderei" | "logistik" | "druckvorstufe" | "projektmanager" | "geschaeftsfuehrung";

export const ROLES: { key: RoleKey; name: string; person: string; nav: string[] }[] = [
  { key: "produktionsleitung", name: "Produktionsleitung", person: "G. Maisch",  nav: ["Übersicht", "Wochenplan"] },
  { key: "projektmanager",     name: "Projektmanager",     person: "T. Schmidt", nav: ["Übersicht"] },
  { key: "druckvorstufe",      name: "Druckvorstufe",      person: "K. Weber",   nav: ["Übersicht"] },
  { key: "buchbinderei",       name: "Buchbinderei / WV",  person: "H. Seifert", nav: ["Übersicht", "Wochenplan"] },
  { key: "logistik",           name: "Logistik & Versand", person: "A. Batt",    nav: ["Übersicht"] },
  { key: "geschaeftsfuehrung", name: "Geschäftsführung",   person: "R. Pfitzer", nav: ["Übersicht"] },
];

/* ========== Live print status ========== */
export interface LivePrintJob {
  id: string;
  customer: string;
  machine: Machine;
  progress: number;
  finishInMin: number;
  wvInHours: number;
  cascadeWarning?: boolean;
}

export const LIVE_PRINT: LivePrintJob[] = [
  { id: "#2024-0847", customer: "Mustermann GmbH",  machine: "CD",  progress: 67, finishInMin: 45,  wvInHours: 2 },
  { id: "#2024-0856", customer: "Kaiser Industries", machine: "RZK", progress: 45, finishInMin: 85,  wvInHours: 4 },
  { id: "#2024-0850", customer: "Rossmann GmbH",     machine: "SM5", progress: 23, finishInMin: 180, wvInHours: 8, cascadeWarning: true },
];

/* ========== Wochenplan slot grid ========== */
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
export const TODAY_INDEX = 0; // Mo = today (2026-05-18)

export interface WeekSlot {
  machine: Machine;
  day: Weekday;
  slot: Slot;
  jobId?: string;
  customer?: string;
  phase?: Phase;
  ownerPM?: string;
  cascadeConflict?: boolean;
}

export const WEEK_PLAN: WeekSlot[] = [
  // CD: Schulz Textil (0855), Mustermann (0847), Becker & Partner (0851)
  { machine: "CD", day: "Mo", slot: "Früh", jobId: "#2024-0855", customer: "Schulz Textil",    phase: "Vorstufe",         ownerPM: "Schmidt" },
  { machine: "CD", day: "Mo", slot: "Spät", jobId: "#2024-0847", customer: "Mustermann GmbH",  phase: "Vorstufe",         ownerPM: "Müller" },
  { machine: "CD", day: "Di", slot: "Früh", jobId: "#2024-0847", customer: "Mustermann GmbH",  phase: "Im Druck",         ownerPM: "Müller" },
  { machine: "CD", day: "Di", slot: "Spät", jobId: "#2024-0847", customer: "Mustermann GmbH",  phase: "Im Druck",         ownerPM: "Müller" },
  { machine: "CD", day: "Mi", slot: "Früh", jobId: "#2024-0851", customer: "Becker & Partner", phase: "Weiterverarbeitung", ownerPM: "Schmidt" },
  { machine: "CD", day: "Mi", slot: "Spät", jobId: "#2024-0855", customer: "Schulz Textil",    phase: "Im Druck",         ownerPM: "Schmidt" },
  { machine: "CD", day: "Do", slot: "Früh", jobId: "#2024-0855", customer: "Schulz Textil",    phase: "Im Druck",         ownerPM: "Schmidt" },
  { machine: "CD", day: "Do", slot: "Spät" },
  { machine: "CD", day: "Fr", slot: "Früh" },
  { machine: "CD", day: "Fr", slot: "Spät" },
  // RZK: Kaiser Industries (0856), Technik GmbH (0852), Schmidt Verlag (0848)
  { machine: "RZK", day: "Mo", slot: "Früh", jobId: "#2024-0856", customer: "Kaiser Industries", phase: "Im Druck", ownerPM: "Müller" },
  { machine: "RZK", day: "Mo", slot: "Spät", jobId: "#2024-0856", customer: "Kaiser Industries", phase: "Im Druck", ownerPM: "Müller" },
  { machine: "RZK", day: "Di", slot: "Früh", jobId: "#2024-0852", customer: "Technik GmbH",      phase: "Vorstufe", ownerPM: "Müller" },
  { machine: "RZK", day: "Di", slot: "Spät", jobId: "#2024-0852", customer: "Technik GmbH",      phase: "Im Druck", ownerPM: "Müller" },
  { machine: "RZK", day: "Mi", slot: "Früh", jobId: "#2024-0848", customer: "Schmidt Verlag",    phase: "Vorstufe", ownerPM: "Schmidt" },
  { machine: "RZK", day: "Mi", slot: "Spät", jobId: "#2024-0848", customer: "Schmidt Verlag",    phase: "Im Druck", ownerPM: "Schmidt" },
  { machine: "RZK", day: "Do", slot: "Früh" },
  { machine: "RZK", day: "Do", slot: "Spät" },
  { machine: "RZK", day: "Fr", slot: "Früh" },
  { machine: "RZK", day: "Fr", slot: "Spät" },
  // SM5: Rossmann (0850 – CASCADE CONFLICT), Müller Verlag (0853)
  { machine: "SM5", day: "Mo", slot: "Früh", jobId: "#2024-0850", customer: "Rossmann GmbH", phase: "Im Druck",           ownerPM: "Müller", cascadeConflict: true },
  { machine: "SM5", day: "Mo", slot: "Spät", jobId: "#2024-0850", customer: "Rossmann GmbH", phase: "Im Druck",           ownerPM: "Müller", cascadeConflict: true },
  { machine: "SM5", day: "Di", slot: "Früh", jobId: "#2024-0850", customer: "Rossmann GmbH", phase: "Im Druck", ownerPM: "Müller", cascadeConflict: true },
  { machine: "SM5", day: "Di", slot: "Spät" },
  { machine: "SM5", day: "Mi", slot: "Früh" },
  { machine: "SM5", day: "Mi", slot: "Spät" },
  { machine: "SM5", day: "Do", slot: "Früh", jobId: "#2024-0853", customer: "Müller Verlag", phase: "Vorstufe", ownerPM: "Schmidt" },
  { machine: "SM5", day: "Do", slot: "Spät", jobId: "#2024-0853", customer: "Müller Verlag", phase: "Vorstufe", ownerPM: "Schmidt" },
  { machine: "SM5", day: "Fr", slot: "Früh", jobId: "#2024-0853", customer: "Müller Verlag", phase: "Im Druck", ownerPM: "Schmidt" },
  { machine: "SM5", day: "Fr", slot: "Spät" },
  // Digi: Weber AG (0849), Meyer Consulting (0857), rest frei
  { machine: "Digi", day: "Mo", slot: "Früh", jobId: "#2024-0849", customer: "Weber AG",         phase: "Versandbereit", ownerPM: "Müller" },
  { machine: "Digi", day: "Mo", slot: "Spät", jobId: "#2024-0857", customer: "Meyer Consulting", phase: "Versandbereit", ownerPM: "Schmidt" },
  { machine: "Digi", day: "Di", slot: "Früh" },
  { machine: "Digi", day: "Di", slot: "Spät" },
  { machine: "Digi", day: "Mi", slot: "Früh" },
  { machine: "Digi", day: "Mi", slot: "Spät" },
  { machine: "Digi", day: "Do", slot: "Früh" },
  { machine: "Digi", day: "Do", slot: "Spät" },
  { machine: "Digi", day: "Fr", slot: "Früh" },
  { machine: "Digi", day: "Fr", slot: "Spät" },
  // CD Nacht-Schicht (3-schichtig)
  { machine: "CD", day: "Mo", slot: "Nacht" },
  { machine: "CD", day: "Di", slot: "Nacht" },
  { machine: "CD", day: "Mi", slot: "Nacht" },
  { machine: "CD", day: "Do", slot: "Nacht" },
  { machine: "CD", day: "Fr", slot: "Nacht" },
];

export const CURRENT_PM = "Müller";
