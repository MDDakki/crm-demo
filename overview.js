/* ============================================================
   Übersicht / Dashboard — fasst Teilnehmer UND Unternehmen zusammen.
   Die vollen Listen liegen auf teilnehmer.html / unternehmen.html.
   ============================================================ */


const lightClass  = { g:"l-g", a:"l-a", r:"l-r" };
const fachKeyByCode = {};
FACHRICHTUNGEN.forEach(f => { fachKeyByCode[f.code] = f.key; });

/* ---- Aktivitäten ---- */
function relTime(ts){
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "gerade eben";
  const m = Math.floor(s / 60); if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60); if (h < 24) return `vor ${h} Std`;
  const d = Math.floor(h / 24); return `vor ${d} Tag${d > 1 ? "en" : ""}`;
}
const actInit  = n => n.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
const actColor = n => ["#2f6df6","#0f9c6b","#c2418c","#e8932a","#1d4ed8","#6b4dff"][n.length % 6];

function renderActivity(){
  $("#act-count").textContent = ACTIVITY.length;
  $("#activity").innerHTML = ACTIVITY.slice(0, 6).map(a => `
    <div class="act-item">
      <div class="act-av" style="background:${actColor(a.user)}">${actInit(a.user)}</div>
      <div class="act-main"><b>${a.user}</b> ${a.text}</div>
      <span class="act-time">${relTime(a.ts)}</span>
    </div>`).join("");
}

/* ---- KPIs (Teilnehmer + Unternehmen gemischt) ---- */
function renderKpis(){
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("kpi-total", TN.length);
  set("kpi-prakt", TN.filter(t => t.pstatus === "run").length);
  set("kpi-un",    UNTERNEHMEN.filter(u => u.aktiv).length);
  set("kpi-frei",  UNTERNEHMEN.reduce((s, u) => s + u.plaetze.filter(p => p.belegtBis === null).length, 0));
}

const fachTags = codes => `<div class="mtags">${codes.map(c => `<span class="tag ${fachKeyByCode[c]||'fachi'}">${c}</span>`).join("")}</div>`;

/* ---- Kurzübersicht Teilnehmer (Prio + Risiko zuerst) ---- */
function renderTnSummary(){
  const rank = t => (4 - t.prio) * 10 + (t.risk === "r" ? 3 : t.risk === "a" ? 2 : 1);
  const list = [...TN].sort((a, b) => rank(b) - rank(a)).slice(0, 5);
  $("#tn-summary").innerHTML = list.map(t => `
    <a class="sum-item" href="akte.html?id=${t.id}">
      <div class="av" style="background:${t.color}">${t.init}</div>
      <div class="sum-main"><b>${t.vn} ${t.nn}</b><span>${t.kurs} · ${t.fach}</span></div>
      <span class="light ${lightClass[t.risk]}"></span>
      <span class="prio p${t.prio}">${t.prio}</span>
    </a>`).join("");
}

/* ---- Kurzübersicht Unternehmen (freie Plätze zuerst) ---- */
function renderUnSummary(){
  const freiN = u => u.plaetze.filter(p => p.belegtBis === null).length;
  const list = [...UNTERNEHMEN].filter(u => u.aktiv).sort((a, b) => freiN(b) - freiN(a)).slice(0, 5);
  $("#un-summary").innerHTML = list.map(u => {
    const n = freiN(u);
    return `
    <a class="sum-item" href="firma.html?id=${u.id}">
      <div class="av" style="background:${u.color}">${u.init}</div>
      <div class="sum-main"><b>${u.name}</b><span>${u.plz} ${u.ort}</span></div>
      ${fachTags(u.fach)}
      <span class="sum-stat ${n ? 'frei' : 'belegt'}">${n ? n + " frei" : "belegt"}</span>
    </a>`;
  }).join("");
}

/* ---- Init ---- */
function init(){
  renderKpis();
  renderActivity();
  renderTnSummary();
  renderUnSummary();
  document.addEventListener("activity-logged", renderActivity);
  document.addEventListener("data-changed", () => { renderKpis(); renderTnSummary(); renderUnSummary(); });
}
document.addEventListener("DOMContentLoaded", init);
