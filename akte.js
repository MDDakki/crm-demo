/* ============================================================
   Teilnehmer-Akte — vollständige Detailseite eines Teilnehmers
   Aufruf: akte.html?id=1
   Alles editierbar, speichert über store.js (localStorage).
   ============================================================ */


const lightClass = { g:"l-g", a:"l-a", r:"l-r" };
const riskLabel  = { g:"Grün: kein Risiko", a:"Gelb: 1 Risiko", r:"Rot: mehrere Risiken" };

// Risiko-Faktoren (Ja = ein Risiko); * = mit Kommentarfeld
const RISK_FACTORS = [
  { key:"mobilitaet",  label:"Mobilität" },
  { key:"fachrichtung",label:"Fachrichtung" },
  { key:"sozial",      label:"Soziale Umstände", kom:"sozialKom" },
  { key:"region",      label:"Region" },
  { key:"sprache",     label:"Sprachbarriere" },
  { key:"gesundheit",  label:"Gesundheit", kom:"gesundheitKom" },
  { key:"kooperation", label:"Kooperation", kom:"kooperationKom" },
];

const HAKEN = [
  { key:"P",  label:"Portalvorstellung" },
  { key:"BT", label:"Bewerbungstipps" },
  { key:"GF", label:"Gesprächsführung" },
  { key:"BU", label:"Bewerbungsunterlagen" },
  { key:"BN", label:"Bewerbungsnachweise" },
];

const OUTCOMES = [
  "Situationsanalyse/ Angebot & Prozess TP",
  "Bewerbungsstrategie",
  "BWU - Lebenslauf",
  "BWU - Anschreiben",
  "Gesprächstraining",
  "Vorstellungsgespräch - Vor-/Nachbereitung",
  "Fortschrittskontrolle",
  "Info zum TN",
  "Sonstiges",
];

/* ---- fehlende Felder mit sinnvollen Defaults füllen ---- */
function withDefaults(t){
  if (!t.risiko){
    const n = t.risk === "r" ? 2 : t.risk === "a" ? 1 : 0;
    t.risiko = { mobilitaet:n>0, sprache:n>1, fachrichtung:false, sozial:false, region:false,
                 gesundheit:false, kooperation:false, sozialKom:"", gesundheitKom:"", kooperationKom:"" };
  }
  if (t.pv === undefined) t.pv = false;
  if (!t.ap1) t.ap1 = "";
  if (!t.zeitraeume){
    t.zeitraeume = t.pstatus === "run"
      ? [{ von:"", bis:(t.pSub||"").replace("bis ",""), unternehmen:t.pTitle }, {von:"",bis:"",unternehmen:""}, {von:"",bis:"",unternehmen:""}]
      : [{von:"",bis:"",unternehmen:""},{von:"",bis:"",unternehmen:""},{von:"",bis:"",unternehmen:""}];
  }
  if (!t.reminder) t.reminder = { text:t.next || "", betreuer:t.betreuer || "", datum:"", done:false };
  if (!t.history)  t.history  = [
    { datum:"06.06.2026", outcome:"Proaktive Fortschrittskontrolle", kommentar:"Zwischenstand besprochen.\nNächste Schritte gemeinsam festgelegt, Teilnehmer:in wirkt motiviert." },
    { datum:"05.06.2026", outcome:"Bewerbungscoaching", kommentar:"Telefonisches Coaching zur Vorbereitung auf das Vorstellungsgespräch." },
    { datum:"03.06.2026", outcome:"Bewerbungsunterlagen Feedback", kommentar:"Lebenslauf und Anschreiben gemeinsam überarbeitet. Bewerbungsfoto fehlt noch." },
    { datum:t.melde || "01.06.2026", outcome:"Termin", kommentar:"Erstgespräch geführt, Profil aufgenommen." },
  ];
  if (!t.teamsLink) t.teamsLink = "#";
  if (!t.akteLink)  t.akteLink  = "#";
  return t;
}

function completeReminder(reminder, contact, nextReminder, datum){
  return {
    historyEntry: {
      datum,
      outcome: contact.outcome,
      kommentar: contact.kommentar,
      erinnerung: { ...reminder, done: true },
    },
    nextReminder: { ...nextReminder, done: false },
  };
}

/* ---- Ampel aus Risikoanalyse berechnen ---- */
function calcRisk(t){
  const n = RISK_FACTORS.filter(f => t.risiko[f.key]).length;
  return n === 0 ? "g" : n === 1 ? "a" : "r";
}

/* ---- speichern + kurzer Hinweis ---- */
let hintTimer;
function persist(){
  saveTN();
  const h = $("#saved");
  h.classList.add("show");
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => h.classList.remove("show"), 1100);
}

// Bearbeitung protokollieren (entprellt – sammelt schnelle Änderungen)
let actTimer;
function logEdit(){
  clearTimeout(actTimer);
  actTimer = setTimeout(() => logActivity(`hat die Akte von <b>${T.vn} ${T.nn}</b> aktualisiert`), 1500);
}

/* ============================================================
   Render
   ============================================================ */
let T; // aktueller Teilnehmer
let showAllHistory = false; // Kontakthistorie: alle Einträge zeigen?

function init(){
  const id = +new URLSearchParams(location.search).get("id") || (TN[0] && TN[0].id);
  T = TN.find(t => t.id === id);
  if (!T){ $("#akte").innerHTML = `<div class="empty">Teilnehmer nicht gefunden.</div>`; return; }
  withDefaults(T);
  document.title = `future CRM · ${T.vn} ${T.nn}`;
  render();
  persist(); // Defaults sichern (Hinweis erscheint kurz – ok)
}

function render(){
  $("#akte").innerHTML = hero() + `
    <div class="akte-grid">
      <div class="akte-col">${stammdaten()}${risikoCard()}</div>
      <div class="akte-col">${fortschritt()}${erinnerung()}${historie()}${links()}</div>
    </div>`;
  wire();
}

/* ---- Kopf ---- */
function hero(){
  const haken = [...HAKEN.map(h=>h.key), "PV"];
  const hk = haken.map(k => {
    const on = k === "PV" ? T.pv : T.checks[k];
    return `<div class="hk ${on?'on':''}">${k}</div>`;
  }).join("");
  return `
    <div class="akte-hero">
      <div class="av">${T.init}</div>
      <div>
        <h1>${T.vn} ${T.nn}</h1>
        <div class="sub"><span>${T.kurs}</span><span class="dot"></span><span>Fachrichtung ${T.fach}</span><span class="dot"></span><span>${T.standort}</span><span class="dot"></span><span>Betreuer: ${T.betreuer}</span></div>
      </div>
      <div class="hero-right">
        <div class="hero-prio">Prio <b class="p${T.prio}" id="hero-prio">${T.prio}</b></div>
        <div class="hero-haken" id="hero-haken">${hk}</div>
        <div class="hero-amp" id="hero-amp"><span class="light ${lightClass[T.risk]}"></span><span id="hero-amp-txt">${riskLabel[T.risk].split(':')[0].trim()}</span></div>
      </div>
    </div>`;
}

/* ---- Stammdaten ---- */
function fld(label, bind, opt={}){
  return `<div class="frow"><label>${label}</label>
    <input class="fin ${opt.ro?'ro':''}" data-bind="${bind}" value="${getP(T,bind)??''}" placeholder="${opt.ph||''}" ${opt.ro?'readonly':''}></div>`;
}
function stammdaten(){
  const z = T.zeitraeume.map((p,i) => `
    <div class="zeile">
      ${i===0?'<div class="lbl">Praktikumszeiträume (verknüpft mit Unternehmen)</div>':''}
      <input class="fin" data-bind="zeitraeume.${i}.von" value="${p.von||''}" placeholder="von (TT.MM.JJJJ)">
      <input class="fin" data-bind="zeitraeume.${i}.bis" value="${p.bis||''}" placeholder="bis">
      <input class="fin" data-bind="zeitraeume.${i}.unternehmen" value="${p.unternehmen||''}" placeholder="Unternehmen">
    </div>`).join("");
  return card("Stammdaten", iconUser, `
    ${fld("Vorname","vn")}
    ${fld("Name","nn")}
    ${fld("Kurs","kurs")}
    ${fld("Fachrichtung","fach")}
    ${fld("Straße & Hausnr.","str")}
    ${fld("PLZ","plz")}
    ${fld("Wohnort","ort")}
    ${fld("Standortzugehörigkeit","standort")}
    ${fld("Zuständige IHK","ihk")}
    ${fld("IHK-Meldung","melde",{ph:"TT.MM.JJJJ"})}
    ${fld("AP1 (Datum)","ap1",{ph:"TT.MM.JJJJ"})}
    ${fld("Praktikumsunternehmen","pTitle")}
    ${fld("Betreuer","betreuer")}
    ${z}
  `);
}

/* ---- Risikoanalyse ---- */
function risikoCard(){
  const items = RISK_FACTORS.map(f => {
    const on = T.risiko[f.key];
    const kom = f.kom ? `<input class="kom" data-bind="risiko.${f.kom}" value="${T.risiko[f.kom]||''}" placeholder="Kommentar…">` : "";
    return `<div class="risk-item">
      <div class="risk-cb ${on?'on':''}" data-risk="${f.key}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></div>
      <div class="risk-main"><b data-risk="${f.key}">${f.label}</b>${kom}</div>
    </div>`;
  }).join("");
  return card("Risikoanalyse", iconShield, `
    <div class="risk-summary ${T.risk}" id="risk-summary">
      <span class="lg"></span><span id="risk-summary-txt">${riskLabel[T.risk]}</span>
    </div>
    ${items}`);
}

/* ---- Fortschritt: Haken + PV + Prio ---- */
function fortschritt(){
  const hk = HAKEN.map(h => haken(h.key, h.label, T.checks[h.key])).join("")
           + haken("PV", "PV liegt vor", T.pv, true);
  const prio = [1,2,3].map(n => `<button class="pb ${T.prio===n?'on':''}" data-p="${n}">${n}</button>`).join("");
  return card("Fortschritt", iconCheck, `
    <div class="haken-row">${hk}</div>
    <div class="sublabel">Priorität</div>
    <div class="prio-pick" id="prio-pick">${prio}</div>`);
}
function haken(key, label, on, isPv){
  return `<div class="haken ${on?'on':''}" data-haken="${key}" ${isPv?'data-pv="1"':''}>
    <span class="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></span>${label}</div>`;
}

/* ---- Erinnerung / nächster Schritt ---- */
function erinnerung(){
  // ponytail: OUTCOMES ist die Dropdown-Quelle (max. 10). Endgültige Liste kommt vom Kunden, dann OUTCOMES ersetzen.
  return card("Erinnerung · nächster Schritt", iconBell, `
    <div class="current-reminder">
      <span>Aktuelle Erinnerung</span>
      <b>${T.reminder.text || "Kein nächster Schritt hinterlegt"}</b>
      <small>${[T.reminder.datum, T.reminder.betreuer].filter(Boolean).join(" · ") || "Kein Termin hinterlegt"}</small>
    </div>
    <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:8px">Kontakt protokollieren</div>
    <div class="frow"><label>Art</label>
      <select class="fin" id="rem-outcome">
        <option value="">Art wählen…</option>
        ${OUTCOMES.slice(0,10).map(o => `<option>${o}</option>`).join("")}
      </select>
    </div>
    <div class="frow"><label>Kommentar</label>
      <textarea class="fin full" id="rem-kom" rows="3" maxlength="300" placeholder="Was ist passiert?" required></textarea>
    </div>
    <div style="text-align:right;font-size:11px;color:var(--ink-faint);margin:-4px 0 10px"><span id="rem-count">0</span>/300</div>
    <div class="sep" style="height:1px;background:var(--line);margin:2px 0 12px"></div>
    <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:8px">Neue Erinnerung <span style="color:var(--red)">*</span></div>
    ${frow("Nächster Schritt", `<input class="fin" id="next-rem-text" placeholder="z. B. Praktikumsbesuch nach 4 Wochen">`)}
    ${frow("Betreuer", `<input class="fin" id="next-rem-betreuer" placeholder="zuständige Person">`)}
    ${frow("Fällig am", `<input class="fin" id="next-rem-date" placeholder="TT.MM.JJJJ">`)}
    <button class="btn pri" id="rem-done-btn" style="width:100%;margin-top:12px">Erledigt &amp; protokollieren</button>`);
}

/* ---- Kontakthistorie ---- */
const HIST_LIMIT = 3; // wie viele Einträge zuerst angezeigt werden

function historie(){
  // Einträge entstehen automatisch beim Abschließen einer Erinnerung (siehe erinnerung()).
  return card("Kontakthistorie", iconClock, `<div id="hist-list"></div>`);
}

// Einträge anzeigen (nur die neuesten, ältere per „mehr zeigen")
function fillHistList(){
  const wrap = document.getElementById("hist-list");
  if (!wrap) return;
  const all = T.history;
  if (!all.length){ wrap.innerHTML = `<div class="empty" style="padding:14px">Noch keine Einträge.</div>`; return; }

  const shown = showAllHistory ? all : all.slice(0, HIST_LIMIT);
  let html = `<div class="hist">${shown.map(h => `
    <div class="hist-item">
      <div><span class="when">${h.datum || "—"}</span><span class="out">${h.outcome}</span></div>
      <div class="kom">${(h.kommentar || "").replace(/\n/g, "<br>")}</div>
      ${h.erinnerung ? `<div class="hist-reminder">Erledigte Erinnerung: <b>${h.erinnerung.text || "ohne nächsten Schritt"}</b>${h.erinnerung.datum ? ` · fällig ${h.erinnerung.datum}` : ""}</div>` : ""}
    </div>`).join("")}</div>`;

  if (all.length > HIST_LIMIT){
    html += `<button class="hist-more" id="hist-more">${
      showAllHistory ? "weniger zeigen" : `mehr zeigen (${all.length - HIST_LIMIT} ältere)`
    }</button>`;
  }
  wrap.innerHTML = html;

  const mb = document.getElementById("hist-more");
  if (mb) mb.addEventListener("click", () => { showAllHistory = !showAllHistory; fillHistList(); });
}

/* ---- Links ---- */
function links(){
  return card("Verknüpfungen", iconLink, `
    <a class="linkrow" href="${T.teamsLink}" target="_blank" rel="noopener">
      <span class="li teams">${iconTeams}</span>
      <span><b>MS-Teams-Ordner</b><span>Team Praktikum</span></span>
      <span class="go">${iconArrow}</span>
    </a>
    <a class="linkrow" href="${T.akteLink}" target="_blank" rel="noopener">
      <span class="li akte">${iconFolder}</span>
      <span><b>Verwaltungsnetzwerk-Akte</b><span>TN-Akte öffnen</span></span>
      <span class="go">${iconArrow}</span>
    </a>`);
}

/* ---- kleine Bausteine ---- */
function frow(label, inner){ return `<div class="frow"><label>${label}</label>${inner}</div>`; }

/* ============================================================
   Interaktion
   ============================================================ */
function wire(){
  // editierbare Textfelder (data-bind)
  $$("[data-bind]").forEach(el => {
    el.addEventListener("input", () => {
      setP(T, el.dataset.bind, el.value);
      persist();
      logEdit();
    });
  });

  // Risiko-Häkchen (Checkbox + Label klickbar)
  $$("[data-risk]").forEach(el => {
    el.addEventListener("click", () => {
      const key = el.dataset.risk;
      T.risiko[key] = !T.risiko[key];
      T.risk = calcRisk(T);
      persist();
      logEdit();
      render(); // einfach neu rendern (Ampel + Kopf aktualisieren sich)
    });
  });

  // Fortschritt-Haken (inkl. PV)
  $$("[data-haken]").forEach(el => {
    el.addEventListener("click", () => {
      const key = el.dataset.haken;
      if (el.dataset.pv) T.pv = !T.pv;
      else T.checks[key] = T.checks[key] ? 0 : 1;
      el.classList.toggle("on");
      el.querySelector(".box").classList; // visuell schon via .on
      updateHeroHaken();
      persist();
      logEdit();
    });
  });

  // Prio
  $$("#prio-pick .pb").forEach(b => {
    b.addEventListener("click", () => {
      T.prio = +b.dataset.p;
      $$("#prio-pick .pb").forEach(x => x.classList.toggle("on", x === b));
      const hp = $("#hero-prio"); hp.textContent = T.prio; hp.className = "p"+T.prio;
      persist();
      logEdit();
    });
  });

  // Kontakthistorie anzeigen
  fillHistList();

  // Zeichenzähler für den Kommentar (max. 300)
  const remKom = $("#rem-kom"), remCount = $("#rem-count");
  if (remKom && remCount){
    const upd = () => remCount.textContent = remKom.value.length;
    remKom.addEventListener("input", upd); upd();
  }

  // Erinnerung abschließen: Kontakt und erledigte Erinnerung archivieren, dann neue Erinnerung setzen.
  const remBtn = $("#rem-done-btn");
  if (remBtn) remBtn.addEventListener("click", () => {
    const outcome = $("#rem-outcome").value.trim();
    const kommentar = $("#rem-kom").value.trim();
    const nextReminder = {
      text: $("#next-rem-text").value.trim(),
      betreuer: $("#next-rem-betreuer").value.trim(),
      datum: $("#next-rem-date").value.trim(),
    };
    if (!outcome){ alert("Bitte eine Art wählen."); return; }
    if (!kommentar){ alert("Bitte einen Kommentar eintragen."); return; }
    if (!nextReminder.text || !nextReminder.datum){
      alert("Bitte zuerst eine neue Erinnerung setzen (Nächster Schritt + Fällig am), bevor du abschließt.");
      return;
    }
    const p = n => String(n).padStart(2, "0"), d = new Date();
    const heute = `${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()}`;
    const result = completeReminder(T.reminder, { outcome, kommentar }, nextReminder, heute);
    T.history.unshift(result.historyEntry);
    T.reminder = result.nextReminder;
    persist();
    logActivity(`hat einen Kontakt bei <b>${T.vn} ${T.nn}</b> protokolliert`);
    render();
  });
}

function updateHeroHaken(){
  const haken = [...HAKEN.map(h=>h.key), "PV"];
  $$("#hero-haken .hk").forEach((el, i) => {
    const k = haken[i];
    const on = k === "PV" ? T.pv : T.checks[k];
    el.classList.toggle("on", !!on);
  });
}

/* ---- Icons ---- */
const iconUser  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>`;
const iconShield= `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>`;
const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
const iconBell  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`;
const iconClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
const iconLink  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>`;
const iconTeams = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 9l5-2v10l-5-2"/></svg>`;
const iconFolder= `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h5l2 3h9a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Z"/></svg>`;
const iconArrow = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M7 7h10v10"/></svg>`;

document.addEventListener("DOMContentLoaded", init);
