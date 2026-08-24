/* ============================================================
   Beispieldaten — leicht zu ändern / erweitern.
   Jede Zeile = ein Teilnehmer (TN).
   ============================================================ */

// Dropdown-Optionen (zentral, damit Tabelle + Filter konsistent sind)
const FACHRICHTUNGEN = [
  { key: "fachi", code: "DPA", label: "Fachinformatik · DPA" },
  { key: "fachi", code: "DV", label: "Fachinformatik · DV" },
  { key: "fachi", code: "Sys", label: "Fachinformatik · Sys" },
  { key: "fachi", code: "AE", label: "Fachinformatik · AE" },
  { key: "tpd", code: "MAK", label: "TPD · MAK" },
  { key: "tpd", code: "PGK", label: "TPD · PGK" },
  { key: "mg", code: "Digital", label: "Mediengestaltung · Digital" },
  { key: "mg", code: "Print", label: "Mediengestaltung · Print" },
  { key: "mg", code: "GIM", label: "GIM" },
];

const STANDORTE = [
  { code: "LE", label: "Leipzig" },
  { code: "RT", label: "Reutlingen" },
  { code: "CHE", label: "Chemnitz" },
  { code: "B", label: "Berlin" },
  { code: "HAL", label: "Halle" },
];

const RISIKO = [
  { code: "g", label: "Grün: kein Risiko", swatch: "var(--green)" },
  { code: "a", label: "Gelb: 1 Risiko", swatch: "var(--amber)" },
  { code: "r", label: "Rot: mehrere Risiken", swatch: "var(--red)" },
];

const SEED_TN = [
  {
    id: 1, vn: "Mustername", nn: "1", init: "M1", color: "#2f6df6",
    kurs: "FI 26 I", fachKey: "fachi", fach: "DPA", standort: "Leipzig", standortK: "LE",
    ihk: "IHK Leipzig", melde: "15.06.2026", betreuer: "Musterkollege 11",
    risk: "g", prio: 3,
    pstatus: "run", pTitle: "Musterfirma 1", pSub: "bis 28.08.2026",
    str: "Musterweg 4", plz: "04109", ort: "Leipzig",
    checks: { P: 1, BT: 1, GF: 1, BU: 1, BN: 0 }, pv: true,
    next: "Praktikumsbesuch nach 4 Wochen", nextWhen: "in 3 Tagen"
  },
  {
    id: 2, vn: "Mustername", nn: "2", init: "M2", color: "#0f9c6b",
    kurs: "FI 26 I", fachKey: "fachi", fach: "AE", standort: "Reutlingen", standortK: "RT",
    ihk: "IHK Dresden", melde: "30.06.2026", betreuer: "Musterkollege 14",
    risk: "a", prio: 2,
    pstatus: "open", pTitle: "Praktikum offen", pSub: "Suche läuft",
    str: "Musterstr. 22", plz: "01589", ort: "Reutlingen",
    checks: { P: 1, BT: 1, GF: 0, BU: 1, BN: 1 }, pv: false,
    next: "Bewerbungsunterlagen Feedback", nextWhen: "morgen"
  },
  {
    id: 3, vn: "Mustername", nn: "3", init: "M3", color: "#c2418c",
    kurs: "TPD 26 I", fachKey: "tpd", fach: "MAK", standort: "Chemnitz", standortK: "CHE",
    ihk: "IHK Chemnitz", melde: "12.06.2026", betreuer: "Musterkollege 12",
    risk: "r", prio: 1,
    pstatus: "open", pTitle: "Praktikum offen", pSub: "kein Betrieb im Umkreis",
    str: "Musterstr. 8", plz: "09111", ort: "Chemnitz",
    checks: { P: 1, BT: 0, GF: 0, BU: 0, BN: 0 }, pv: false,
    next: "Rückkehrgespräch nach Fehlzeit", nextWhen: "heute"
  },
  {
    id: 4, vn: "Mustername", nn: "4", init: "M4", color: "#e8932a",
    kurs: "FI 26 II", fachKey: "fachi", fach: "Sys", standort: "Berlin", standortK: "B",
    ihk: "IHK Berlin", melde: "20.06.2026", betreuer: "Musterkollege 15",
    risk: "g", prio: 3,
    pstatus: "run", pTitle: "Musterfirma 2", pSub: "bis 04.09.2026",
    str: "Musterstr. 91", plz: "10627", ort: "Berlin",
    checks: { P: 1, BT: 1, GF: 1, BU: 1, BN: 1 }, pv: true,
    next: "Abschlussbesuch Praktikum", nextWhen: "in 12 Tagen"
  },
  {
    id: 5, vn: "Mustername", nn: "5", init: "M5", color: "#1d4ed8",
    kurs: "MG 26 I", fachKey: "mg", fach: "Digital", standort: "Halle", standortK: "HAL",
    ihk: "IHK Halle", melde: "18.06.2026", betreuer: "Musterkollege 13",
    risk: "a", prio: 2,
    pstatus: "run", pTitle: "Musterfirma 3", pSub: "bis 21.08.2026",
    str: "Musterplatz 3", plz: "06108", ort: "Halle",
    checks: { P: 1, BT: 1, GF: 1, BU: 0, BN: 0 }, pv: true,
    next: "Bewerbungscoaching Termin", nextWhen: "in 5 Tagen"
  },
  {
    id: 6, vn: "Mustername", nn: "6", init: "M6", color: "#0f9c6b",
    kurs: "FI 26 II", fachKey: "fachi", fach: "DV", standort: "Leipzig", standortK: "LE",
    ihk: "IHK Leipzig", melde: "22.06.2026", betreuer: "Musterkollege 16",
    risk: "g", prio: 3,
    pstatus: "run", pTitle: "Musterfirma 4", pSub: "bis 11.09.2026",
    str: "Musterstr. 17", plz: "04105", ort: "Leipzig",
    checks: { P: 1, BT: 1, GF: 1, BU: 1, BN: 1 }, pv: true,
    next: "Praktikumsbesuch (Hälfte)", nextWhen: "in 8 Tagen"
  },
  {
    id: 7, vn: "Mustername", nn: "7", init: "M7", color: "#c2418c",
    kurs: "TPD 26 I", fachKey: "tpd", fach: "PGK", standort: "Reutlingen", standortK: "RT",
    ihk: "IHK Dresden", melde: "28.06.2026", betreuer: "Musterkollege 14",
    risk: "r", prio: 1,
    pstatus: "open", pTitle: "Praktikum offen", pSub: "Mobilität + Sprachbarriere",
    str: "Musterstr. 5", plz: "01587", ort: "Reutlingen",
    checks: { P: 1, BT: 1, GF: 0, BU: 0, BN: 0 }, pv: false,
    next: "Stärken/Schwächen-Analyse", nextWhen: "morgen"
  },
  {
    id: 8, vn: "Mustername", nn: "8", init: "M8", color: "#2f6df6",
    kurs: "GIM 26 I", fachKey: "mg", fach: "GIM", standort: "Chemnitz", standortK: "CHE",
    ihk: "IHK Chemnitz", melde: "25.06.2026", betreuer: "Musterkollege 12",
    risk: "a", prio: 2,
    pstatus: "run", pTitle: "Musterfirma 5", pSub: "bis 30.08.2026",
    str: "Musterstr. 2", plz: "09120", ort: "Chemnitz",
    checks: { P: 1, BT: 1, GF: 1, BU: 1, BN: 0 }, pv: true,
    next: "Portalvorstellung Jobbörse", nextWhen: "in 2 Tagen"
  },
];

/* ============================================================
   UNTERNEHMEN (Praktikumsbetriebe)
   - fach: mehrere Fachrichtungen möglich (Mehrfachbenennung)
   - aktiv / koop: Haken-Felder
   - filialen: weitere Standorte mit eigener Fachrichtung
   - ansprech: mehrere Ansprechpartner, je mit Outcome
   - plaetze: Praktikumsplätze; belegtBis=null => Platz frei
   ============================================================ */
const SEED_UNTERNEHMEN = [
  {
    id: 1, name: "Musterfirma 1", init: "1", color: "#2f6df6",
    fach: ["DPA", "DV"], str: "Musterstr. 12", plz: "04109", ort: "Leipzig",
    tel: "0341 100-0", email: "info@musterfirma1.de",
    aktiv: true, koop: true, koopSeit: "2020",
    filialen: [
      { ort: "Leipzig (Zentrale)", fach: ["DPA", "DV"] },
      { ort: "Halle", fach: ["DPA"] },
    ],
    ansprech: [
      { vn: "Musterkontakt", nn: "1", job: "Ausbildungsleitung", email: "kontakt1@musterfirma1.de", tel: "0341 100-45", aktiv: true, fach: ["DPA"], outcome: "Interesse" },
      { vn: "Musterkontakt", nn: "2", job: "IT-Leiter", email: "kontakt2@musterfirma1.de", tel: "0341 100-67", aktiv: true, fach: ["DV"], outcome: "Rückruf in 6 Mon." },
    ],
    plaetze: [
      { fach: "DPA", belegtBis: "28.08.2026", tn: "Mustername 1" },
      { fach: "DV", belegtBis: null, tn: null },
    ],
    verknuepfteTn: ["Mustername 1"]
  },

  {
    id: 2, name: "Musterfirma 2", init: "2", color: "#0f9c6b",
    fach: ["Sys", "AE"], str: "Musterstr. 91", plz: "10627", ort: "Berlin",
    tel: "030 200-0", email: "info@musterfirma2.de",
    aktiv: true, koop: true, koopSeit: "2022",
    filialen: [{ ort: "Berlin", fach: ["Sys", "AE"] }],
    ansprech: [
      { vn: "Musterkontakt", nn: "3", job: "HR Managerin", email: "kontakt3@musterfirma2.de", tel: "030 200-101", aktiv: true, fach: ["Sys"], outcome: "Interesse" },
    ],
    plaetze: [
      { fach: "Sys", belegtBis: "04.09.2026", tn: "Mustername 4" },
      { fach: "AE", belegtBis: null, tn: null },
    ],
    verknuepfteTn: ["Mustername 4"]
  },

  {
    id: 3, name: "Musterfirma 3", init: "3", color: "#c2418c",
    fach: ["Digital", "Print"], str: "Musterplatz 3", plz: "06108", ort: "Halle",
    tel: "0345 300-0", email: "info@musterfirma3.de",
    aktiv: true, koop: false, koopSeit: null,
    filialen: [{ ort: "Halle", fach: ["Digital", "Print"] }],
    ansprech: [ 
      { vn: "Musterkontakt", nn: "4", job: "Geschäftsführer", email: "kontakt4@musterfirma3.de", tel: "0345 300-12", aktiv: true, fach: ["Print"], outcome: "Rückruf in 12 Mon." },
    ],
    plaetze: [{ fach: "Digital", belegtBis: "21.08.2026", tn: "Mustername 5" }],
    verknuepfteTn: ["Mustername 5"]
  },

  {
    id: 4, name: "Musterfirma 4", init: "4", color: "#1d4ed8",
    fach: ["DV", "Sys"], str: "Musterstr. 17", plz: "04105", ort: "Leipzig",
    tel: "0341 400-0", email: "info@musterfirma4.de",
    aktiv: true, koop: true, koopSeit: "2019",
    filialen: [
      { ort: "Leipzig", fach: ["DV"] },
      { ort: "Dresden", fach: ["Sys"] },
      { ort: "Chemnitz", fach: ["DV", "Sys"] },
    ],
    ansprech: [
      { vn: "Musterkontakt", nn: "5", job: "Teamleitung IT", email: "kontakt5@musterfirma4.de", tel: "0341 400-22", aktiv: true, fach: ["DV"], outcome: "Interesse" },
      { vn: "Musterkontakt", nn: "6", job: "Recruiting", email: "kontakt6@musterfirma4.de", tel: "0341 400-23", aktiv: false, fach: ["Sys"], outcome: "Kein Interesse" },
    ],
    plaetze: [
      { fach: "DV", belegtBis: "11.09.2026", tn: "Mustername 6" },
      { fach: "Sys", belegtBis: null, tn: null },
    ],
    verknuepfteTn: ["Mustername 6"]
  },

  {
    id: 5, name: "Musterfirma 5", init: "5", color: "#e8932a",
    fach: ["GIM", "Digital"], str: "Musterstr. 2", plz: "09120", ort: "Chemnitz",
    tel: "0371 500-0", email: "info@musterfirma5.de",
    aktiv: true, koop: true, koopSeit: "2023",
    filialen: [{ ort: "Chemnitz", fach: ["GIM", "Digital"] }],
    ansprech: [
      { vn: "Musterkontakt", nn: "7", job: "Art Director", email: "kontakt7@musterfirma5.de", tel: "0371 500-9", aktiv: true, fach: ["GIM"], outcome: "Interesse" },
    ],
    plaetze: [{ fach: "GIM", belegtBis: "30.08.2026", tn: "Mustername 8" }],
    verknuepfteTn: ["Mustername 8"]
  },

  {
    id: 6, name: "Musterfirma 6", init: "6", color: "#5a6781",
    fach: ["MAK", "PGK"], str: "Musterstr. 8", plz: "01589", ort: "Reutlingen",
    tel: "03525 600-0", email: "info@musterfirma6.de",
    aktiv: false, koop: false, koopSeit: null,
    filialen: [{ ort: "Reutlingen", fach: ["MAK", "PGK"] }],
    ansprech: [
      { vn: "Musterkontakt", nn: "8", job: "Produktionsleiter", email: "kontakt8@musterfirma6.de", tel: "03525 600-15", aktiv: false, fach: ["MAK"], outcome: "Noch kein Ausbildungsbetrieb" },
    ],
    plaetze: [
      { fach: "MAK", belegtBis: null, tn: null },
      { fach: "PGK", belegtBis: null, tn: null },
    ],
    verknuepfteTn: []
  },
];

/* ============================================================
   BENUTZER & ROLLEN (Zugänge aus dem Anforderungsdokument)
   - rolle:  Admin | Bearbeiter | Leser   (= Berechtigung)
   - team:   organisatorischer Bereich
   ============================================================ */
const SEED_USERS = (() => {
  const norm = s => s.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, ".");
  const mk = (name, team, rolle, standort = "") =>
    ({ name, team, rolle, standort, email: norm(name) + "@future-training.de", aktiv: true });

  const list = [
    // Admin (Vollzugriff)
    mk("Musterkollege 1", "Leitung", "Admin"),
    mk("Musterkollege 2", "Leitung", "Admin"),
    mk("Musterkollege 3", "Leitung", "Admin"),
    mk("Musterkollege 4", "Leitung", "Admin"),
    // Koordination
    mk("Musterkollege 5", "Koordination", "Bearbeiter"),
    mk("Musterkollege 6", "Koordination", "Bearbeiter"),
    mk("Musterkollege 7", "Koordination", "Bearbeiter"),
    mk("Musterkollege 8", "Koordination", "Bearbeiter"),
    mk("Musterkollege 9", "Koordination", "Bearbeiter"),
    mk("Musterkollege 10", "Koordination", "Bearbeiter"),
    // NLL (= Betreuer der Teilnehmer)
    mk("Musterkollege 11", "NLL", "Bearbeiter"),
    mk("Musterkollege 12", "NLL", "Bearbeiter"),
    mk("Musterkollege 13", "NLL", "Bearbeiter"),
    mk("Musterkollege 14", "NLL", "Bearbeiter"),
    mk("Musterkollege 15", "NLL", "Bearbeiter"),
    mk("Musterkollege 16", "NLL", "Bearbeiter"),
    // zusätzlich
    mk("Musterkollege 17", "Zusätzlich", "Leser"),
    mk("Musterkollege 18", "Zusätzlich", "Leser"),
    mk("Musterkollege 19", "Zusätzlich", "Leser"),
    // Verwaltungen der Standorte
    mk("Musterkollege 20", "Verwaltung", "Leser", "Leipzig"),
    mk("Musterkollege 21", "Verwaltung", "Leser", "Reutlingen"),
    mk("Musterkollege 22", "Verwaltung", "Leser", "Chemnitz"),
    mk("Musterkollege 23", "Verwaltung", "Leser", "Berlin"),
    mk("Musterkollege 24", "Verwaltung", "Leser", "Halle"),
  ];
  return list.map((u, i) => ({ id: i + 1, ...u }));
})();
