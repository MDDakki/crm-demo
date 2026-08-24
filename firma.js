/* ============================================================
   Unternehmens-Akte — vollständige, editierbare Firmenseite
   Aufruf: firma.html?id=1
   Alles editierbar, speichert über store.js (localStorage).
   ============================================================ */

const fachKeyByCode = {};
FACHRICHTUNGEN.forEach(f => { fachKeyByCode[f.code] = f.key; });

const UN_OUTCOMES = ["Interesse", "Kein Interesse", "Noch kein Ausbildungsbetrieb",
  "Rückruf in 6 Mon.", "Rückruf in 12 Mon.", "Rückruf in 24 Mon."];

/* ---- speichern + Hinweis + Aktivität (entprellt) ---- */
let hintTimer, actTimer;
function persist() {
  saveUN();
  const h = $("#saved");
  h.classList.add("show");
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => h.classList.remove("show"), 1100);
  clearTimeout(actTimer);
  actTimer = setTimeout(() => logActivity(`hat das Unternehmen <b>${U.name}</b> aktualisiert`), 1500);
} 

let U; // aktuelles Unternehmen
function init() {
  const id = +new URLSearchParams(location.search).get("id") || (UNTERNEHMEN[0] && UNTERNEHMEN[0].id);
  U = UNTERNEHMEN.find(u => u.id === id);
  if (!U) { $("#firma").innerHTML = `<div class="empty">Unternehmen nicht gefunden.</div>`; return; }
  // sicherstellen, dass Listen existieren
  U.filialen = U.filialen || [];
  U.ansprech = U.ansprech || [];
  U.plaetze = U.plaetze || [];
  U.fach = U.fach || [];
  if (!U.notizen) U.notizen = [{ datum: "05.06.2026", text: "Langjährige Kooperation, stellt zuverlässig Praktikumsplätze bereit." }];
  document.title = `future CRM · ${U.name}`;
  render();
}

/* ============================================================
   Render
   ============================================================ */

function render() {
  const freiN = U.plaetze.filter(p => p.belegtBis === null || p.belegtBis === "").length;
  $("#firma").innerHTML = hero(freiN) + `
    <div class="akte-grid">
      <div class="akte-col">${stammdaten()}${fachCard()}${plaetzeCard()}${notizenCard()}</div>
      <div class="akte-col">${filialenCard()}${ansprechCard()}${tnCard()}</div>
    </div>`;
  wire();
}

function hero(freiN) {
  return `
    <div class="akte-hero">
      <div class="av">${U.init}</div>
      <div>
        <h1>${U.name}</h1>
        <div class="sub"><span>${U.plz} ${U.ort}</span><span class="dot"></span><span>${U.fach.join(", ") || "—"}</span></div>
      </div>
      <div class="hero-right">
        <div class="hero-prio" style="gap:10px">${U.koop
      ? `<span class="pill koop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>Kooperationsvertrag</span>`
      : `<span class="pill nokoop">kein Vertrag</span>`}</div>
          <div class="hero-amp" style="background:rgba(255,255,255,.12)">
          ${freiN ? `${freiN} Platz frei` : "voll belegt"}
        </div>
        <div class="toggle ${U.aktiv ? "on" : ""}" id="aktiv-toggle" style="color:#fff">
          <span class="track"></span>${U.aktiv ? "Aktiv" : "Inaktiv"}
        </div>
      </div>
    </div>`;
}

/* ---- Stammdaten ---- */
function fld(label, bind, opt = {}) {
  return `<div class="frow"><label>${label}</label>
    <input class="fin" data-bind="${bind}" value="${getP(U, bind) ?? ''}" placeholder="${opt.ph || ''}"></div>`;
}
function stammdaten() {
  return card("Stammdaten", iconBuilding, `
    ${fld("Unternehmensname", "name")}
    ${fld("Straße & Hausnr.", "str")}
    ${fld("PLZ", "plz")}
    ${fld("Ort", "ort")}
    ${fld("Telefon", "tel")}
    ${fld("E-Mail", "email")}
    <div class="frow"><label>Kooperationsvertrag</label>
      <label class="inline-chk"><input type="checkbox" id="koop-cb" ${U.koop ? 'checked' : ''}> vorhanden</label>
    </div>
    ${fld("seit (Jahr)", "koopSeit")}
    <div class="frow"><label>Angelegt am</label>
      <input class="fin ro" value="${U.createdAt || '—'}" readonly></div>
  `);
}

/* ---- Fachrichtungen (mehrere) ---- */
function fachCard() {
  return card("Fachrichtungen", iconTag, `
    <div class="hint-line">Mehrfachauswahl, anklicken zum An-/Abwählen</div>
    ${fachChips(U.fach, "fach")}`);
}
function fachChips(selected, path) {
  return `<div class="fach-pick">${FACHRICHTUNGEN.map(f => `
    <span class="fp ${selected.includes(f.code) ? "on" : ""}" data-fach="${path}" data-code="${f.code}">
      <span class="tag ${f.key}">${f.code}</span>
    </span>`).join("")}</div>`;
}

/* ---- Praktikumsplätze ---- */
function plaetzeCard() {
  const rows = U.plaetze.map((p, i) => {
    const frei = !p.belegtBis;
    return `
    <div class="platz-edit">
      <select class="fin" data-bind="plaetze.${i}.fach">
        ${(U.fach.length ? U.fach : [p.fach]).map(c => `<option value="${c}" ${c === p.fach ? 'selected' : ''}>${c}</option>`).join("")}
      </select>
      <input class="fin" data-bind="plaetze.${i}.belegtBis" value="${p.belegtBis || ''}" placeholder="frei lassen = verfügbar">
      <input class="fin" data-bind="plaetze.${i}.tn" value="${p.tn || ''}" placeholder="Teilnehmer (falls belegt)">
      <button class="row-del" data-del="plaetze" data-i="${i}" title="Platz entfernen">${iconTrash}</button>
      <div class="platz-state ${frei ? 'frei' : 'belegt'}">${frei ? "Platz frei" : "belegt"}</div>
    </div>`;
  }).join("");
  return card("Praktikumsplätze", iconCheck, `
    ${rows || `<div class="empty" style="padding:10px">Noch keine Plätze.</div>`}
    <button class="add-row" data-add="platz">+ Platz hinzufügen</button>`);
}

/* ---- Filialen ---- */
function filialenCard() {
  const rows = U.filialen.map((f, i) => `
    <div class="listcard">
      <div class="branch-edit">
        <input class="fin" data-bind="filialen.${i}.ort" value="${f.ort || ''}" placeholder="Ort / Standort">
        <button class="row-del" data-del="filialen" data-i="${i}" title="Filiale entfernen">${iconTrash}</button>
      </div>
      ${fachChips(f.fach || [], `filialen.${i}.fach`)}
    </div>`).join("");
  return card("Filialen / Standorte", iconBranch, `
    ${rows || `<div class="empty" style="padding:10px">Noch keine Filialen.</div>`}
    <button class="add-row" data-add="filiale">+ Filiale hinzufügen</button>`);
}

/* ---- Ansprechpartner ---- */
function ansprechCard() {
  const cards = U.ansprech.map((a, i) => `
    <div class="listcard contact ${a.aktiv ? '' : 'dim'}">  
      <div class="ap-grid">
        <input class="fin" data-bind="ansprech.${i}.vn" value="${a.vn || ''}" placeholder="Vorname">
        <input class="fin" data-bind="ansprech.${i}.nn" value="${a.nn || ''}" placeholder="Name">
        <input class="fin full" data-bind="ansprech.${i}.job" value="${a.job || ''}" placeholder="Jobtitel">
        <input class="fin" data-bind="ansprech.${i}.email" value="${a.email || ''}" placeholder="E-Mail">
        <input class="fin" data-bind="ansprech.${i}.tel" value="${a.tel || ''}" placeholder="Telefon / Durchwahl">
        <input class="fin full" data-bind="ansprech.${i}.outcome" list="ap-outcomes" value="${a.outcome || ''}" placeholder="Outcome (wählen oder neu)…">
      </div>
      ${fachChips(a.fach || [], `ansprech.${i}.fach`)}
      <div class="ap-foot">
        <div class="toggle small ${a.aktiv ? 'on' : ''}" data-aptoggle="${i}"><span class="track"></span>${a.aktiv ? 'aktiv' : 'inaktiv'}</div>
        <button class="row-del" data-del="ansprech" data-i="${i}" title="Ansprechpartner entfernen">${iconTrash}</button>
      </div>
    </div>`).join("");
  return card("Ansprechpartner", iconUser, `
    <datalist id="ap-outcomes">${UN_OUTCOMES.map(o => `<option value="${o}"></option>`).join("")}</datalist>
    ${cards || `<div class="empty" style="padding:10px">Noch keine Ansprechpartner.</div>`}
    <button class="add-row" data-add="ansprech">+ Ansprechpartner hinzufügen</button>`);
}

/* ---- Notizen ---- */
function notizenCard() {
  const items = U.notizen.length
    ? `<div class="hist">${U.notizen.map(n => `
        <div class="hist-item">
          <div><span class="when">${n.datum || "—"}</span></div>
          <div class="kom">${(n.text || "").replace(/\n/g, "<br>")}</div>
        </div>`).join("")}</div>`
    : `<div class="empty" style="padding:10px">Noch keine Notizen.</div>`;
  return card("Notizen", iconNote, `
    ${items}
    <div class="hist-add">
      <input id="n-datum" class="full" placeholder="TT.MM.JJJJ (optional)">
      <textarea id="n-text" class="full" rows="3" placeholder="Notiz, beliebig lang…"></textarea>
      <button class="btn pri" id="n-add">+ Notiz hinzufügen</button>
    </div>`);
}

/* ---- Verknüpfte Teilnehmer (aus Plätzen abgeleitet) ---- */
function tnCard() {
  const names = [...new Set(U.plaetze.map(p => p.tn).filter(Boolean))];
  const inner = names.length
    ? `<div class="mtags">${names.map(n => `<span class="outcome" style="background:var(--blue-soft);color:var(--blue)">${n}</span>`).join(" ")}</div>`
    : `<span class="muted" style="font-size:12.5px">— derzeit keine —</span>`;
  return card("Verknüpfte Teilnehmer", iconLink, inner);
}

/* ============================================================
   Interaktion
   ============================================================ */
function wire() {
  // Textfelder / Selects
  $$("[data-bind]").forEach(el => {
    const ev = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(ev, () => {
      let v = el.value;
      if (el.dataset.bind.endsWith(".belegtBis") && v.trim() === "") v = null; // leer = frei
      setP(U, el.dataset.bind, v);
      persist();
      if (el.tagName === "SELECT" || el.dataset.bind.endsWith(".belegtBis")) renderSoft();
    });
  });

  // Kooperationsvertrag
  const koop = $("#koop-cb");
  if (koop) koop.addEventListener("change", () => { U.koop = koop.checked; persist(); render(); });

  // Aktiv-Schalter (Kopf)
  const at = $("#aktiv-toggle");
  if (at) at.addEventListener("click", () => {
    U.aktiv = !U.aktiv; saveUN();
    logActivity(`hat <b>${U.name}</b> ${U.aktiv ? "aktiviert" : "deaktiviert"}`);
    render();
  });

  // Ansprechpartner aktiv/inaktiv
  $$("[data-aptoggle]").forEach(t => t.addEventListener("click", () => {
    const a = U.ansprech[+t.dataset.aptoggle];
    a.aktiv = !a.aktiv; persist(); render();
  }));

  // Fachrichtungs-Chips (an/ab)
  $$("[data-fach]").forEach(el => el.addEventListener("click", () => {
    const arr = getP(U, el.dataset.fach);
    const c = el.dataset.code;
    const idx = arr.indexOf(c);
    if (idx < 0) arr.push(c); else arr.splice(idx, 1);
    persist(); render();
  }));

  // Zeile entfernen (Filiale / Ansprechpartner / Platz)
  $$("[data-del]").forEach(b => b.addEventListener("click", () => {
    const list = U[b.dataset.del];
    list.splice(+b.dataset.i, 1);
    persist(); render();
  }));

  // Notiz hinzufügen
  const nadd = $("#n-add");
  if (nadd) nadd.addEventListener("click", () => {
    const datum = $("#n-datum").value.trim();
    const text = $("#n-text").value.trim();
    if (!text) { alert("Bitte eine Notiz eingeben."); return; }
    U.notizen.unshift({ datum, text });
    persist();
    logActivity(`hat eine Notiz bei <b>${U.name}</b> hinzugefügt`);
    render();
  });

  // Hinzufügen
  $$("[data-add]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.add === "platz") U.plaetze.push({ fach: U.fach[0] || "", belegtBis: null, tn: null });
    if (b.dataset.add === "filiale") U.filialen.push({ ort: "", fach: [] });
    if (b.dataset.add === "ansprech") U.ansprech.unshift({ vn: "", nn: "", job: "", email: "", tel: "", aktiv: true, fach: [], outcome: "Interesse" });
    persist(); render();
  }));
}

// nur Plätze-Statusanzeige aktualisieren ohne Fokusverlust bei Texteingabe
function renderSoft() { /* einfacher: voll neu rendern */ render(); }

/* ---- Icons ---- */
const iconBuilding = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></svg>`;
const iconTag = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 12 22l-9-9V3h10l7.59 7.59a2 2 0 0 1 0 2.82Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>`;
const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
const iconBranch = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></svg>`;
const iconUser = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>`;
const iconLink = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>`;
const iconTrash = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>`;
const iconNote = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>`;

document.addEventListener("DOMContentLoaded", init);
