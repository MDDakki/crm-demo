/* ============================================================
   future CRM · Team Praktikum — App-Logik
   - rendert die Teilnehmerliste
   - funktionierende Dropdown-Filter (Fachrichtung, Standort, Risiko)
   - funktionierende Suche
   - Detail-Karte rechts
   ============================================================ */

// ---- kleine Helfer ----
const $  = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

const fachClass   = { fachi:"fachi", tpd:"tpd", mg:"mg" };
const lightClass  = { g:"l-g", a:"l-a", r:"l-r" };
const riskLabel   = { g:"Grün", a:"Gelb", r:"Rot" };

// Aktiver Filter-Zustand (null = kein Filter)
const filter = { fach:null, standort:null, risk:null, search:"" };
let selectedId = null;

const tickSVG  = `<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="#2f6df6" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>`;
const checkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>`;

/* ----------------------------------------------------------
   Dropdown-Menüs aufbauen
   ---------------------------------------------------------- */
function buildMenus(){
  // Fachrichtung
  $("#menu-fach").innerHTML =
    optHTML("fach", null, "Alle Fachrichtungen") +
    `<div class="sep"></div>` +
    FACHRICHTUNGEN.map(f =>
      optHTML("fach", f.code, `<span class="tag ${fachClass[f.key]}" style="margin-right:2px">${f.code}</span> ${f.label.split("·").pop().trim()}`)
    ).join("");

  // Standort
  $("#menu-standort").innerHTML =
    optHTML("standort", null, "Alle Standorte") +
    `<div class="sep"></div>` +
    STANDORTE.map(s => optHTML("standort", s.code, `${s.label} <span class="muted">(${s.code})</span>`)).join("");

  // Risiko
  $("#menu-risk").innerHTML =
    optHTML("risk", null, "Alle Risiken") +
    `<div class="sep"></div>` +
    RISIKO.map(r => optHTML("risk", r.code,
      `<span class="swatch" style="background:${r.swatch}"></span> ${r.label}`)).join("");
}

function optHTML(group, value, inner){
  const v = value === null ? "" : value;
  return `<div class="opt" data-group="${group}" data-value="${v}">
            <span style="display:flex;align-items:center;gap:8px">${inner}</span>${tickSVG}
          </div>`;
}

/* ----------------------------------------------------------
   Filter anwenden + Tabelle rendern
   ---------------------------------------------------------- */
function visibleRows(){
  const q = filter.search.trim().toLowerCase();
  return TN.filter(t => {
    if (filter.fach     && t.fach      !== filter.fach)     return false;
    if (filter.standort && t.standortK !== filter.standort) return false;
    if (filter.risk     && t.risk      !== filter.risk)     return false;
    if (q){
      const hay = `${t.vn} ${t.nn} ${t.kurs} ${t.fach} ${t.standort} ${t.betreuer} ${t.pTitle}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderTable(){
  const list = visibleRows();
  $("#count").textContent = `${list.length} ${list.length === 1 ? "Treffer" : "Teilnehmer"}`;

  if (!list.length){
    $("#rows").innerHTML = `<tr><td colspan="7"><div class="empty">Keine Teilnehmer für diese Filter. <a href="#" onclick="resetFilters();return false" style="color:var(--blue);font-weight:600">Filter zurücksetzen</a></div></td></tr>`;
    return;
  }

  $("#rows").innerHTML = list.map(t => `
    <tr data-id="${t.id}" class="${t.id===selectedId ? 'sel' : ''}">
      <td>
        <div class="tn">
          <div class="av" style="background:${t.color}">${t.init}</div>
          <div><b>${t.vn} ${t.nn}</b><span>${t.betreuer}</span></div>
        </div>
      </td>
      <td><span class="muted">${t.kurs}</span></td>
      <td><span class="tag ${fachClass[t.fachKey]}">${t.fach}</span></td>
      <td><span class="muted">${t.standort}</span></td>
      <td><div class="pstatus ${t.pstatus}">${t.pTitle}<small>${t.pSub}</small></div></td>
      <td><span class="ampel"><span class="light ${lightClass[t.risk]}"></span></span></td>
      <td><span class="prio p${t.prio}">${t.prio}</span></td>
    </tr>`).join("");

  // Klick-Handler für Zeilen
  $$("#rows tr[data-id]").forEach(tr =>
    tr.addEventListener("click", () => selectTN(+tr.dataset.id)));
}

/* ----------------------------------------------------------
   Detail-Karte rechts
   ---------------------------------------------------------- */
function selectTN(id){
  const t = TN.find(x => x.id === id);
  if (!t) return;
  selectedId = id;
  $$("#rows tr").forEach(r => r.classList.toggle("sel", +r.dataset.id === id));

  const ch = t.checks;
  const chk = k => `<div class="chk ${ch[k] ? 'done' : ''}">${ch[k] ? checkSVG : ''}${k}</div>`;

  $("#detail").innerHTML = `
    <div class="detail-top">
      <div class="amp"><span class="light ${lightClass[t.risk]}"></span>${riskLabel[t.risk]}</div>
      <div class="av">${t.init}</div>
      <h3>${t.vn} ${t.nn}</h3>
      <p>${t.kurs} · Fachrichtung ${t.fach}</p>
    </div>
    <div class="drows">
      ${drow(pin, "Wohnort", `${t.str}, ${t.plz} ${t.ort}`)}
      ${drow(building, "Standort", `${t.standort} (${t.standortK})`)}
      ${drow(briefcase, "Zuständige IHK", t.ihk)}
      ${drow(cal, "IHK-Meldung", t.melde)}
      ${drow(check, "Praktikum", t.pTitle)}
      ${drow(user, "Betreuer", t.betreuer)}
    </div>
    <div class="checks">
      <div class="ttl">Bewerbungs-Fortschritt</div>
      <div class="check-grid">${chk('P')}${chk('BT')}${chk('GF')}${chk('BU')}${chk('BN')}</div>
    </div>
    <div class="tasks">
      <div class="checks" style="padding:0"><div class="ttl">Nächster Schritt</div></div>
      <div class="task">
        <div class="tic">${clock}</div>
        <div><b>${t.next}</b><span>Betreuer: ${t.betreuer}</span></div>
        <span class="when">${t.nextWhen}</span>
      </div>
    </div>
    <div class="det-actions">
      <a class="btn pri" href="akte.html?id=${t.id}">${file} Akte öffnen</a>
      <button class="btn sec">${pencil} Notiz</button>
    </div>`;
}

function drow(icon, k, v){
  return `<div class="drow">${icon}<span class="k">${k}</span><span class="v">${v}</span></div>`;
}

// Inline-Icons (klein gehalten)
const pin      = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const building = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`;
const briefcase= `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></svg>`;
const cal      = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
const check    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>`;
const user     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>`;
const clock    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
const file     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>`;
const pencil   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>`;

/* ----------------------------------------------------------
   Dropdown-Interaktion
   ---------------------------------------------------------- */
function setupDropdowns(){
  // Chip klick -> Menü auf/zu
  $$(".dd").forEach(dd => {
    $(".chip", dd).addEventListener("click", e => {
      // Klick auf das X (Clear) -> nur Filter löschen
      if (e.target.closest(".clear")){
        e.stopPropagation();
        clearFilter(dd.dataset.group);
        return;
      }
      const wasOpen = dd.classList.contains("open");
      closeAllMenus();
      if (!wasOpen) dd.classList.add("open");
    });
  });

  // Option klick / Klick außerhalb (Event-Delegation am Dokument)
  document.addEventListener("click", e => {
    const opt = e.target.closest(".menu .opt");
    if (opt){
      const group = opt.dataset.group;
      const value = opt.dataset.value || null;
      filter[group] = value;
      updateChip(group);
      markSelectedOptions(group);
      closeAllMenus();
      renderTable();
      return;
    }
    // Klick außerhalb -> Menüs schließen
    if (!e.target.closest(".dd")) closeAllMenus();
  });
}

function closeAllMenus(){ $$(".dd").forEach(d => d.classList.remove("open")); }

function clearFilter(group){
  filter[group] = null;
  updateChip(group);
  markSelectedOptions(group);
  closeAllMenus();
  renderTable();
}

function resetFilters(){
  ["fach","standort","risk"].forEach(g => { filter[g] = null; updateChip(g); markSelectedOptions(g); });
  filter.search = "";
  $("#search").value = "";
  renderTable();
}

// Chip-Beschriftung je nach Auswahl
function updateChip(group){
  const dd   = $(`.dd[data-group="${group}"]`);
  const chip = $(".chip", dd);
  const labelEl = $(".chip-label", chip);
  const val  = filter[group];

  const defaults = { fach:"Fachrichtung", standort:"Standort", risk:"Risiko" };
  if (!val){
    labelEl.textContent = defaults[group];
    chip.classList.remove("active");
  } else {
    labelEl.textContent = chipText(group, val);
    chip.classList.add("active");
  }
}

function chipText(group, val){
  if (group === "fach")     return val;
  if (group === "standort") return (STANDORTE.find(s => s.code === val) || {}).label || val;
  if (group === "risk")     return riskLabel[val];
  return val;
}

function markSelectedOptions(group){
  const menu = $(`#menu-${group}`);
  $$(".opt", menu).forEach(o =>
    o.classList.toggle("sel", (o.dataset.value || null) === filter[group]));
}

/* ----------------------------------------------------------
   KPIs (aus den echten Teilnehmerdaten berechnet)
   ---------------------------------------------------------- */
function renderKpis(){
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("kpi-total", TN.length);
  set("kpi-prakt", TN.filter(t => t.pstatus === "run").length);
  set("kpi-offen", TN.filter(t => t.pstatus === "open").length);
  set("kpi-rot",   TN.filter(t => t.risk === "r").length);
}

/* ----------------------------------------------------------
   Init
   ---------------------------------------------------------- */
function init(){
  buildMenus();
  setupDropdowns();
  ["fach","standort","risk"].forEach(markSelectedOptions);
  renderKpis();
  renderTable();
  if (TN[0]) selectTN(TN[0].id);

  $("#search").addEventListener("input", e => {
    filter.search = e.target.value;
    renderTable();
  });

  // Reagiert auf neu angelegte Teilnehmer (forms.js)
  document.addEventListener("data-changed", e => {
    renderKpis();
    renderTable();
    if (e.detail && e.detail.type === "tn" && e.detail.id) selectTN(e.detail.id);
  });
}

window.resetFilters = resetFilters; // für den Inline-Link im leeren Zustand
document.addEventListener("DOMContentLoaded", init);
