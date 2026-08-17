/* ============================================================
   future CRM · Unternehmen (Praktikumsbetriebe)
   - Liste + Detail, Filter (Fachrichtung, Ort, Plätze, Aktiv), Suche
   - funktionierender Aktiv-Schalter (Toggle)
   ============================================================ */


const fachKeyByCode = {};
FACHRICHTUNGEN.forEach(f => { fachKeyByCode[f.code] = f.key; });

// eindeutige Orte aus den Daten
const ORTE = [...new Set(UNTERNEHMEN.map(u => u.ort))].sort();

// Anlage-Jahr aus "TT.MM.JJJJ, HH:MM" ziehen + eindeutige Jahre (neueste zuerst)
const yearOf = u => (u.createdAt || "").split(",")[0].split(".").pop().trim();
const JAHRE = [...new Set(UNTERNEHMEN.map(yearOf).filter(Boolean))].sort((a, b) => b - a);

const filter = { fach:null, ort:null, status:null, aktiv:null, jahr:null, search:"" };
let selectedId = null;

const tickSVG  = `<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="#2f6df6" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>`;

/* ---- Helfer ---- */
const hasFreiPlatz = u => u.plaetze.some(p => p.belegtBis === null);
const fachTags = (codes) =>
  `<div class="mtags">${codes.map(c => `<span class="tag ${fachKeyByCode[c]||'fachi'}">${c}</span>`).join("")}</div>`;

/* ----------------------------------------------------------
   Dropdown-Menüs
   ---------------------------------------------------------- */
function opt(group, value, inner){
  const v = value === null ? "" : value;
  return `<div class="opt" data-group="${group}" data-value="${v}">
            <span style="display:flex;align-items:center;gap:8px">${inner}</span>${tickSVG}</div>`;
}
function buildMenus(){
  $("#menu-fach").innerHTML =
    opt("fach", null, "Alle Fachrichtungen") + `<div class="sep"></div>` +
    FACHRICHTUNGEN.map(f => opt("fach", f.code,
      `<span class="tag ${f.key}" style="margin-right:2px">${f.code}</span> ${f.label.split("·").pop().trim()}`)).join("");

  $("#menu-ort").innerHTML =
    opt("ort", null, "Alle Orte") + `<div class="sep"></div>` +
    ORTE.map(o => opt("ort", o, o)).join("");

  $("#menu-status").innerHTML =
    opt("status", null, "Alle Plätze") + `<div class="sep"></div>` +
    opt("status", "frei",   `<span class="swatch" style="background:var(--green)"></span> Platz frei`) +
    opt("status", "belegt", `<span class="swatch" style="background:var(--ink-faint)"></span> Voll belegt`);

  $("#menu-aktiv").innerHTML =
    opt("aktiv", null, "Alle") + `<div class="sep"></div>` +
    opt("aktiv", "1", `<span class="swatch" style="background:var(--green)"></span> Aktiv`) +
    opt("aktiv", "0", `<span class="swatch" style="background:var(--ink-faint)"></span> Inaktiv`);

  $("#menu-jahr").innerHTML =
    opt("jahr", null, "Alle Jahre") + `<div class="sep"></div>` +
    JAHRE.map(j => opt("jahr", j, j)).join("");
}

/* ----------------------------------------------------------
   Filter + Tabelle
   ---------------------------------------------------------- */
function visibleRows(){
  const q = filter.search.trim().toLowerCase();
  return UNTERNEHMEN.filter(u => {
    if (filter.fach   && !u.fach.includes(filter.fach))               return false;
    if (filter.ort    && u.ort !== filter.ort)                        return false;
    if (filter.status === "frei"   && !hasFreiPlatz(u))               return false;
    if (filter.status === "belegt" &&  hasFreiPlatz(u))               return false;
    if (filter.aktiv  === "1" && !u.aktiv)                            return false;
    if (filter.aktiv  === "0" &&  u.aktiv)                            return false;
    if (filter.jahr   && yearOf(u) !== filter.jahr)                   return false;
    if (q){
      const hay = `${u.name} ${u.ort} ${u.plz} ${u.fach.join(" ")} ${u.ansprech.map(a=>a.vn+" "+a.nn).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderTable(){
  const list = visibleRows();
  $("#count").textContent = `${list.length} ${list.length === 1 ? "Treffer" : "Unternehmen"}`;

  if (!list.length){
    $("#rows").innerHTML = `<tr><td colspan="7"><div class="empty">Keine Unternehmen für diese Filter. <a href="#" onclick="resetFilters();return false" style="color:var(--blue);font-weight:600">Filter zurücksetzen</a></div></td></tr>`;
    return;
  }

  $("#rows").innerHTML = list.map(u => {
    const frei = hasFreiPlatz(u);
    const freiN = u.plaetze.filter(p => p.belegtBis === null).length;
    return `
    <tr data-id="${u.id}" class="${u.id===selectedId?'sel':''} ${u.aktiv?'':'inactive'}">
      <td>
        <div class="tn">
          <div class="av" style="background:${u.color}">${u.init}</div>
          <div><b>${u.name}</b><span>${u.plz} ${u.ort}</span></div>
        </div>
      </td>
      <td>${fachTags(u.fach)}</td>
      <td><span class="muted">${u.filialen.length} ${u.filialen.length===1?'Standort':'Standorte'}</span></td>
      <td>${u.koop
        ? `<span class="pill koop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>Vertrag</span>`
        : `<span class="pill nokoop">offen</span>`}</td>
      <td>
        <div class="platzcell">
          ${frei ? `<span class="frei">${freiN} ${freiN===1?'Platz':'Plätze'} frei</span>` : `<span class="belegt">voll belegt</span>`}
          <small>${u.plaetze.length} ${u.plaetze.length===1?'Platz':'Plätze'} gesamt</small>
        </div>
      </td>
      <td><span class="dotstate ${u.aktiv?'on':'off'}"><span class="d"></span>${u.aktiv?'Aktiv':'Inaktiv'}</span></td>
      <td><span class="muted" style="white-space:nowrap">${(u.createdAt||'—').split(',')[0]}</span></td>
    </tr>`;
  }).join("");

  $$("#rows tr[data-id]").forEach(tr =>
    tr.addEventListener("click", () => selectU(+tr.dataset.id)));
}

/* ----------------------------------------------------------
   Detail
   ---------------------------------------------------------- */
const ic = {
  pin:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  phone:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>`,
  mail:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
  doc:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`,
  branch:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></svg>`,
  clock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
};

function selectU(id){
  const u = UNTERNEHMEN.find(x => x.id === id);
  if (!u) return;
  selectedId = id;
  $$("#rows tr").forEach(r => r.classList.toggle("sel", +r.dataset.id === id));

  const filialen = u.filialen.map(f => `
    <div class="listcard branch">
      <div class="bi">${ic.branch}</div>
      <div><b>${f.ort}</b>${fachTags(f.fach)}</div>
    </div>`).join("");

  const ansprech = u.ansprech.map(a => `
    <div class="listcard contact ${a.aktiv?'':'dim'}">
      <div class="top">
        <div class="av">${a.vn[0]}${a.nn[0]}</div>
        <div><b>${a.vn} ${a.nn}</b><span class="job">${a.job}</span></div>
      </div>
      <div class="lines">
        <span class="ln">${ic.mail}<a href="mailto:${a.email}">${a.email}</a></span>
        <span class="ln">${ic.phone}${a.tel}</span>
      </div>
      <div class="meta">
        ${fachTags(a.fach)}
        <span class="outcome">${a.outcome}</span>
        <span class="dotstate ${a.aktiv?'on':'off'}" style="margin-left:auto"><span class="d"></span>${a.aktiv?'aktiv':'inaktiv'}</span>
      </div>
    </div>`).join("");

  const plaetze = u.plaetze.map(p => `
    <div class="platzrow">
      <span class="tag ${fachKeyByCode[p.fach]||'fachi'}">${p.fach}</span>
      ${p.belegtBis === null
        ? `<span class="st frei">Platz frei</span>`
        : `<span class="st belegt">belegt<small>${p.tn} · bis ${p.belegtBis}</small></span>`}
    </div>`).join("");

  const tnLinks = u.verknuepfteTn.length
    ? u.verknuepfteTn.map(n => `<span class="outcome" style="background:var(--blue-soft);color:var(--blue)">${n}</span>`).join(" ")
    : `<span class="muted" style="font-size:12.5px">— noch keine —</span>`;

  $("#detail").innerHTML = `
    <div class="detail-top">
      <div class="toggle ${u.aktiv?'on':''}" id="aktiv-toggle" style="position:absolute;top:18px;right:18px;color:#fff">
        <span class="track"></span>${u.aktiv?'Aktiv':'Inaktiv'}
      </div>
      <div class="av">${u.init}</div>
      <h3>${u.name}</h3>
      <p>${u.plz} ${u.ort}</p>
    </div>

    <div class="drows">
      <div class="drow">${ic.pin}<span class="k">Adresse</span><span class="v">${u.str}, ${u.plz} ${u.ort}</span></div>
      <div class="drow">${ic.phone}<span class="k">Telefon</span><span class="v">${u.tel}</span></div>
      <div class="drow">${ic.mail}<span class="k">E-Mail</span><span class="v">${u.email}</span></div>
      <div class="drow">${ic.doc}<span class="k">Kooperationsvertrag</span><span class="v">${u.koop?`Ja · seit ${u.koopSeit}`:'offen'}</span></div>
      <div class="drow">${ic.clock}<span class="k">Angelegt am</span><span class="v">${u.createdAt||'—'}</span></div>
    </div>

    <div class="section">
      <div class="ttl">Fachrichtungen</div>
      ${fachTags(u.fach)}
    </div>

    <div class="section">
      <div class="ttl">Praktikumsplätze <span class="n">${u.plaetze.length}</span></div>
      ${plaetze}
    </div>

    <div class="section">
      <div class="ttl">Filialen / Standorte <span class="n">${u.filialen.length}</span></div>
      ${filialen}
    </div>

    <div class="section">
      <div class="ttl">Ansprechpartner <span class="n">${u.ansprech.length}</span></div>
      ${ansprech}
    </div>

    <div class="section">
      <div class="ttl">Verknüpfte Teilnehmer</div>
      <div class="mtags">${tnLinks}</div>
    </div>

    <div class="det-actions">
      <a class="btn pri" href="firma.html?id=${u.id}">${ic.doc} Unternehmen öffnen</a>
      <a class="btn sec" href="firma.html?id=${u.id}">+ Bearbeiten</a>
    </div>`;

  // Aktiv-Schalter funktionsfähig machen (+ speichern)
  $("#aktiv-toggle").addEventListener("click", () => {
    u.aktiv = !u.aktiv;
    saveUN();
    logActivity(`hat <b>${u.name}</b> ${u.aktiv ? "aktiviert" : "deaktiviert"}`);
    renderTable();
    selectU(id);          // Detail neu aufbauen
    renderKpis();
  });
}

/* ----------------------------------------------------------
   KPIs
   ---------------------------------------------------------- */
function renderKpis(){
  const total = UNTERNEHMEN.length;
  const aktiv = UNTERNEHMEN.filter(u => u.aktiv).length;
  const koop  = UNTERNEHMEN.filter(u => u.koop).length;
  const frei  = UNTERNEHMEN.reduce((s,u) => s + u.plaetze.filter(p => p.belegtBis===null).length, 0);
  $("#kpi-total").textContent = total;
  $("#kpi-aktiv").textContent = aktiv;
  $("#kpi-koop").textContent  = koop;
  $("#kpi-frei").textContent  = frei;
}

/* ----------------------------------------------------------
   Dropdown-Interaktion (wie auf der Übersicht)
   ---------------------------------------------------------- */
const chipDefaults = { fach:"Fachrichtung", ort:"Ort", status:"Plätze", aktiv:"Status", jahr:"Jahr" };

function setupDropdowns(){
  $$(".dd").forEach(dd => {
    $(".chip", dd).addEventListener("click", e => {
      if (e.target.closest(".clear")){ e.stopPropagation(); clearFilter(dd.dataset.group); return; }
      const wasOpen = dd.classList.contains("open");
      closeAllMenus();
      if (!wasOpen) dd.classList.add("open");
    });
  });
  document.addEventListener("click", e => {
    const o = e.target.closest(".menu .opt");
    if (o){
      const g = o.dataset.group;
      filter[g] = o.dataset.value || null;
      updateChip(g); markSel(g); closeAllMenus(); renderTable();
      return;
    }
    if (!e.target.closest(".dd")) closeAllMenus();
  });
}
function closeAllMenus(){ $$(".dd").forEach(d => d.classList.remove("open")); }
function clearFilter(g){ filter[g]=null; updateChip(g); markSel(g); closeAllMenus(); renderTable(); }
function resetFilters(){
  ["fach","ort","status","aktiv","jahr"].forEach(g => { filter[g]=null; updateChip(g); markSel(g); });
  filter.search=""; $("#search").value=""; renderTable();
}
function chipText(g,v){
  if (g==="status") return v==="frei"?"Platz frei":"Voll belegt";
  if (g==="aktiv")  return v==="1"?"Aktiv":"Inaktiv";
  return v;
}
function updateChip(g){
  const chip = $(`.dd[data-group="${g}"] .chip`);
  const lbl  = $(".chip-label", chip);
  if (!filter[g]){ lbl.textContent = chipDefaults[g]; chip.classList.remove("active"); }
  else { lbl.textContent = chipText(g, filter[g]); chip.classList.add("active"); }
}
function markSel(g){
  $$(".opt", $(`#menu-${g}`)).forEach(o =>
    o.classList.toggle("sel", (o.dataset.value||null) === filter[g]));
}

/* ---- Init ---- */
function init(){
  buildMenus();
  setupDropdowns();
  ["fach","ort","status","aktiv","jahr"].forEach(markSel);
  renderKpis();
  renderTable();
  if (UNTERNEHMEN[0]) selectU(UNTERNEHMEN[0].id);
  $("#search").addEventListener("input", e => { filter.search = e.target.value; renderTable(); });

  // Reagiert auf neu angelegte Unternehmen (forms.js)
  document.addEventListener("data-changed", e => {
    renderKpis();
    renderTable();
    if (e.detail && e.detail.type === "un" && e.detail.id) selectU(e.detail.id);
  });
}
window.resetFilters = resetFilters;
document.addEventListener("DOMContentLoaded", init);
