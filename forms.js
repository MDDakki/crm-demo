/* ============================================================
   Formulare — Teilnehmer / Unternehmen anlegen (Modal-Dialog).
   Speichert über store.js und meldet Änderung per 'data-changed'.
   ============================================================ */

const PALETTE = ["#2f6df6","#0f9c6b","#c2418c","#e8932a","#1d4ed8","#7c4dff","#d6453d","#0e8f8a"];
const pickColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

/* ---------- Modal-Grundgerüst (einmal in den Body) ---------- */
function ensureModal(){
  if (document.getElementById("modal-overlay")) return;
  const el = document.createElement("div");
  el.className = "modal-overlay";
  el.id = "modal-overlay";
  el.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3 id="modal-title">Neu</h3>
        <button class="modal-x" type="button" aria-label="Schließen" data-close>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <form id="modal-form">
        <div class="form-grid" id="form-fields"></div>
        <div class="modal-foot">
          <button class="btn sec" type="button" data-close>Abbrechen</button>
          <button class="btn pri" type="submit" id="modal-submit">Speichern</button>
        </div>
      </form>`;
  document.body.appendChild(el);

  el.addEventListener("click", e => { if (e.target === el || e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}
function openModal(title){ ensureModal(); $("#modal-title").textContent = title; document.getElementById("modal-overlay").classList.add("open"); }
function closeModal(){ const o = document.getElementById("modal-overlay"); if (o) o.classList.remove("open"); }

/* ---------- Feld-Helfer ---------- */
const field = (label, inner, opt={}) =>
  `<label class="field ${opt.full ? 'full' : ''}">
     <span>${label}${opt.req ? ' <i>*</i>' : ''}</span>${inner}
   </label>`;
const input  = (name, ph="", opt={}) => `<input name="${name}" placeholder="${ph}" ${opt.req ? 'required' : ''} value="${opt.val||''}">`;
const select = (name, opts, opt={}) =>
  `<select name="${name}" ${opt.req ? 'required' : ''}>
     ${opt.placeholder ? `<option value="" disabled ${opt.val?'':'selected'}>${opt.placeholder}</option>` : ''}
     ${opts.map(o => `<option value="${o.v}" ${o.v===opt.val?'selected':''}>${o.t}</option>`).join("")}
   </select>`;

/* ---------- Combobox: tippen + Autovervollständigung (eigene Werte erlaubt) ---------- */
const combo = (name, opt={}) =>
  `<div class="combo">
     <input class="combo-input" name="${name}" placeholder="${opt.placeholder||''}" autocomplete="off" ${opt.req?'required':''} value="${opt.val||''}">
     <svg class="combo-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
     <div class="combo-menu" hidden></div>
   </div>`;

// Vorschlagsquellen je Feldname (aus bekannten + bereits eingegebenen Werten)
const uniq = (arr) => [...new Set(arr.filter(v => v && v !== "—"))].sort((a,b) => a.localeCompare(b, "de"));

const COMBO_SOURCES = {
  standort(){
    const map = new Map();
    STANDORTE.forEach(s => map.set(s.label, s.code));
    (window.TN || []).forEach(t => { if (t.standort && !map.has(t.standort)) map.set(t.standort, t.standortK || ""); });
    return [...map].map(([label, sub]) => ({ label, sub }));
  },
  betreuer(){
    return uniq((window.TN || []).map(t => t.betreuer)).map(label => ({ label }));
  },
  ihk(){
    const seed = ["IHK Leipzig","IHK Dresden","IHK Chemnitz","IHK Halle","IHK Berlin"];
    return uniq([...seed, ...(window.TN || []).map(t => t.ihk)]).map(label => ({ label }));
  },
  ort(){
    const seed = STANDORTE.map(s => s.label);
    const aus  = [...(window.UNTERNEHMEN || []).map(u => u.ort), ...(window.TN || []).map(t => t.ort)];
    return uniq([...seed, ...aus]).map(label => ({ label }));
  },
};

function wireCombos(root){
  root.querySelectorAll(".combo").forEach(box => {
    const inp  = box.querySelector(".combo-input");
    const menu = box.querySelector(".combo-menu");
    const src  = COMBO_SOURCES[inp.name];
    if (!src) return;
    let active = -1;

    const render = () => {
      const q = inp.value.trim().toLowerCase();
      const items = src().filter(i =>
        !q || i.label.toLowerCase().includes(q) || (i.sub||"").toLowerCase().includes(q));
      const exact = items.some(i => i.label.toLowerCase() === q);
      let html = items.map((i, idx) =>
        `<div class="combo-opt ${idx===active?'on':''}" data-val="${i.label}">
           <span>${i.label}</span>${i.sub ? `<small>${i.sub}</small>` : ""}
         </div>`).join("");
      if (q && !exact)
        html += `<div class="combo-opt neu" data-val="${inp.value.trim()}">＋ „${inp.value.trim()}" neu anlegen</div>`;
      menu.innerHTML = html || `<div class="combo-empty">Tippen, um anzulegen…</div>`;
      menu.hidden = false;
    };
    const close = () => { menu.hidden = true; active = -1; };

    inp.addEventListener("focus", render);
    inp.addEventListener("input", () => { active = -1; render(); });
    inp.addEventListener("keydown", e => {
      const opts = [...menu.querySelectorAll(".combo-opt")];
      if (e.key === "ArrowDown"){ e.preventDefault(); active = Math.min(active+1, opts.length-1); render(); }
      else if (e.key === "ArrowUp"){ e.preventDefault(); active = Math.max(active-1, 0); render(); }
      else if (e.key === "Enter"){ if (!menu.hidden && opts[active]){ e.preventDefault(); inp.value = opts[active].dataset.val; close(); } }
      else if (e.key === "Escape"){ close(); }
    });
    menu.addEventListener("mousedown", e => {        // mousedown vor blur
      const opt = e.target.closest(".combo-opt");
      if (opt){ inp.value = opt.dataset.val; close(); }
    });
    inp.addEventListener("blur", () => setTimeout(close, 120));
  });
}

/* ============================================================
   Teilnehmer-Formular
   ============================================================ */
function openTnForm(){
  openModal("Neuer Teilnehmer");

  const fachOpts = FACHRICHTUNGEN.map(f => ({ v:f.code, t:f.label }));
  const riskOpts = RISIKO.map(r => ({ v:r.code, t:r.label }));

  $("#form-fields").innerHTML =
    field("Vorname", input("vn", "Max", {req:true})) +
    field("Name", input("nn", "Mustermann", {req:true})) +
    field("Kurs", input("kurs", "FI 26 I")) +
    field("Fachrichtung", select("fach", fachOpts, {req:true, placeholder:"bitte wählen…"})) +
    field("Standortzugehörigkeit", combo("standort", {req:true, placeholder:"tippen oder wählen, z. B. Leipzig"})) +
    field("Betreuer", combo("betreuer", {placeholder:"tippen oder wählen, z. B. Musterkollege 11"})) +
    field("Straße & Hausnr.", input("str", "Musterstr. 1"), {full:true}) +
    field("PLZ", input("plz", "04109")) +
    field("Wohnort", input("ort", "Leipzig")) +
    field("Zuständige IHK", combo("ihk", {placeholder:"tippen oder wählen, z. B. IHK Leipzig"})) +
    field("IHK-Meldung", input("melde", "TT.MM.JJJJ")) +
    field("Risiko", select("risk", riskOpts, {val:"g"})) +
    field("Priorität", select("prio", [{v:"1",t:"Prio 1"},{v:"2",t:"Prio 2"},{v:"3",t:"Prio 3"}], {val:"3"})) +
    field("Praktikum", select("pstatus", [{v:"open",t:"offen / Suche läuft"},{v:"run",t:"läuft gerade"}], {val:"open"})) +
    field("Praktikumsbetrieb", input("pBetrieb", "optional")) +
    field("Praktikum bis", input("pBis", "TT.MM.JJJJ"));

  wireCombos($("#form-fields"));

  $("#modal-form").onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const fr = FACHRICHTUNGEN.find(f => f.code === d.fach) || {key:"fachi"};
    // Standort: bekannt (aus Liste) oder frei eingegeben
    const stLabel   = (d.standort || "").trim();
    const stMatch   = STANDORTE.find(s => s.label.toLowerCase() === stLabel.toLowerCase());
    const standort  = stMatch ? stMatch.label : (stLabel || "—");
    const standortK = stMatch ? stMatch.code  : (stLabel ? stLabel.slice(0,3).toUpperCase() : "—");
    const running = d.pstatus === "run";
    const tn = {
      vn:d.vn.trim(), nn:d.nn.trim(),
      init:(d.vn.trim()[0]||"").toUpperCase() + (d.nn.trim()[0]||"").toUpperCase(),
      color:pickColor(),
      kurs:d.kurs.trim() || "—",
      fachKey:fr.key, fach:d.fach,
      standort:standort, standortK:standortK,
      ihk:d.ihk.trim() || "—", melde:d.melde.trim() || "—",
      betreuer:d.betreuer.trim() || "—",
      risk:d.risk, prio:+d.prio,
      pstatus:running ? "run" : "open",
      pTitle:running ? (d.pBetrieb.trim() || "Praktikum läuft") : "Praktikum offen",
      pSub:running ? (d.pBis.trim() ? "bis " + d.pBis.trim() : "läuft") : "Suche läuft",
      str:d.str.trim() || "—", plz:d.plz.trim() || "", ort:d.ort.trim() || standort,
      checks:{P:0,BT:0,GF:0,BU:0,BN:0}, pv:false,
      next:"Erstgespräch / Profil aufnehmen", nextWhen:"offen",
    };
    const id = addTN(tn);
    closeModal();
    document.dispatchEvent(new CustomEvent("data-changed", { detail:{ type:"tn", id } }));
  };
}

/* ============================================================
   Unternehmen-Formular
   ============================================================ */
function openUnForm(){
  openModal("Neues Unternehmen");

  const fachChips = FACHRICHTUNGEN.map(f =>
    `<label class="chk-chip">
       <input type="checkbox" name="fach" value="${f.code}">
       <span class="tag ${f.key}">${f.code}</span>
     </label>`).join("");

  $("#form-fields").innerHTML =
    field("Unternehmensname", input("name", "Beispiel GmbH", {req:true}), {full:true}) +
    field("Fachrichtungen (mehrere möglich)", `<div class="chk-row">${fachChips}</div>`, {full:true}) +
    field("Straße & Hausnr.", input("str", "Hauptstr. 1"), {full:true}) +
    field("PLZ", input("plz", "04109")) +
    field("Ort", combo("ort", {req:true, placeholder:"tippen oder wählen, z. B. Leipzig"})) +
    field("Telefon", input("tel", "0341 123-0")) +
    field("E-Mail", input("email", "info@firma.de")) +
    field("Kooperationsvertrag", `<label class="inline-chk"><input type="checkbox" name="koop"> vorhanden</label>`) +
    field("seit (Jahr)", input("koopSeit", "2025")) +
    field("Status", `<label class="inline-chk"><input type="checkbox" name="aktiv" checked> aktiv</label>`, {full:true});

  wireCombos($("#form-fields"));

  $("#modal-form").onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const fach = fd.getAll("fach");
    if (!fach.length){ alert("Bitte mindestens eine Fachrichtung wählen."); return; }
    const d = Object.fromEntries(fd);
    const ort = d.ort.trim();
    const koop = fd.get("koop") === "on";
    const un = {
      name:d.name.trim(),
      init:(d.name.trim()[0]||"?").toUpperCase(),
      color:pickColor(),
      fach,
      str:d.str.trim() || "—", plz:d.plz.trim() || "", ort,
      tel:d.tel.trim() || "—", email:d.email.trim() || "—",
      aktiv:fd.get("aktiv") === "on",
      koop, koopSeit:koop ? (d.koopSeit.trim() || "—") : null,
      filialen:[{ ort:ort || "—", fach }],
      ansprech:[],
      plaetze:fach.map(c => ({ fach:c, belegtBis:null, tn:null })),
      verknuepfteTn:[],
    };
    const id = addUN(un);
    closeModal();
    document.dispatchEvent(new CustomEvent("data-changed", { detail:{ type:"un", id } }));
  };
}

/* ---------- „+ Neu“-Button je nach Seite verdrahten ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  const btn = document.querySelector(".btn-new");
  if (!btn) return;
  btn.addEventListener("click", page === "unternehmen" ? openUnForm : openTnForm);
});
