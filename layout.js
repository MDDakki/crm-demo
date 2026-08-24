/* ============================================================
   Gemeinsames Layout — rendert die Sidebar auf jeder Seite.
   Aktive Seite wird über  <body data-page="...">  gesteuert.
   ============================================================ */

/* ---- gemeinsame Helfer (layout.js lädt vor jedem Seitenskript) ---- */
const $  = (s, e=document) => e.querySelector(s);
const $$ = (s, e=document) => [...e.querySelectorAll(s)];

// Pfad-Helfer für "a.b.c"-Bindungen (nur firma/akte)
const getP = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => {
  const ks = p.split("."); const last = ks.pop();
  let t = o; ks.forEach(k => t = (t[k] = t[k] ?? {}));
  t[last] = v;
};

// Karten-Baustein
function card(title, icon, body){
  return `<div class="card">
    <div class="card-head"><span class="ci">${icon}</span><h2>${title}</h2></div>
    <div class="card-body">${body}</div></div>`;
} 

const NAV = [
  { group:"Arbeitsbereich" },
  { key:"uebersicht",  label:"Übersicht",          href:"index.html",
    icon:`<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>` },
  { key:"teilnehmer",  label:"Teilnehmer", href:"teilnehmer.html", badge:"8",
    icon:`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>` },
  { key:"unternehmen", label:"Unternehmen", href:"unternehmen.html",
    icon:`<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/>` },
  { key:"matching",    label:"Matching &amp; Umkreis", href:"#",
    icon:`<path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0Z"/ ><circle cx="12" cy="10" r="3"/>` },
  { group:"Organisation" },
  { key:"aufgaben",    label:"Aufgaben", href:"#", badge:"5",
    icon:`<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
  { key:"statistiken", label:"Statistiken", href:"#",
    icon:`<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>` },
  { key:"manager", label:"Manager &amp; Rollen", href:"manager.html",
    icon:`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` },
  { key:"einstellungen", label:"Einstellungen", href:"#",
    icon:`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.14.31.4.55.71.69.31.14.66.18 1 .12H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>` },
];

function renderSidebar(){
  const active = document.body.dataset.page || "uebersicht";
  const items = NAV.map(n => {
    if (n.group) return `<div class="nav-label">${n.group}</div>`;
    const cls = n.key === active ? "active" : "";
    const badge = n.badge ? `<span class="badge">${n.badge}</span>` : "";
    // Seiten ohne Ziel (#) bekommen einen „kommt noch"-Hinweis statt Sprung
    const soon = n.href === "#" ? ` data-soon="${n.label}"` : "";
    return `<a href="${n.href}" class="${cls}"${soon}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${n.icon}</svg>
      ${n.label} ${badge}
    </a>`;
  }).join("");

  document.getElementById("sidebar").innerHTML = `
    <div class="brand">
      <div class="mark">f</div>
      <div><b>future&nbsp;CRM</b><span> Team Praktikum</span></div>
    </div>
    <nav class="nav">${items}</nav>
    <button class="side-reset" onclick="resetDemo()" title="Selbst eingegebene Demo-Daten löschen">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
      Demo-Daten zurücksetzen
    </button>
    <div class="side-foot">
      <div class="av">M1</div>
      <div><b>Musterkollege 1</b><span>Administrator</span></div>
    </div>`;
}

/* ============================================================
   Benachrichtigungs-Glocke (oben rechts)
   - baut echte Hinweise aus den Teilnehmerdaten
   ============================================================ */
const _icBell = {
  clock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  alert:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>`,
};

function buildNotifs(){
  const list = window.TN || [];
  const items = [];
  list.filter(t => t.nextWhen === "heute").forEach(t =>
    items.push({ title:t.next, sub:`${t.vn} ${t.nn} · heute fällig`, icon:_icBell.clock, urgent:true, href:`akte.html?id=${t.id}` }));
  list.filter(t => t.nextWhen === "morgen").forEach(t =>
    items.push({ title:t.next, sub:`${t.vn} ${t.nn} · morgen fällig`, icon:_icBell.clock, urgent:false, href:`akte.html?id=${t.id}` }));
  list.filter(t => t.risk === "r").forEach(t =>
    items.push({ title:"Risiko Rot", sub:`${t.vn} ${t.nn} · ${t.kurs}`, icon:_icBell.alert, urgent:false, href:`akte.html?id=${t.id}` }));
  return items.slice(0, 8);
}

function wireBell(){
  const btn = document.querySelector(".topbar .icon-btn");
  if (!btn) return;
  const notifs = buildNotifs();

  // Zähler-Badge statt totem Punkt
  const dot = btn.querySelector(".dot");
  if (dot){
    if (notifs.length){ dot.classList.add("count"); dot.textContent = notifs.length; }
    else dot.remove();
  }

  const menu = document.createElement("div");
  menu.className = "notif-menu";
  menu.innerHTML = `
    <div class="notif-head">Benachrichtigungen <span>${notifs.length}</span></div>
    ${notifs.length
      ? notifs.map(n => `
        <a class="notif-item ${n.urgent ? "urgent" : ""}" href="${n.href}">
          <span class="ni-ic">${n.icon}</span>
          <span class="ni-main"><b>${n.title}</b><span>${n.sub}</span></span>
        </a>`).join("")
      : `<div class="notif-empty">Keine neuen Benachrichtigungen</div>`}`;
  document.body.appendChild(menu);

  const place = () => {
    const r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + 8) + "px";
    menu.style.right = (window.innerWidth - r.right) + "px";
  };
  btn.addEventListener("click", e => {
    e.stopPropagation();
    place();
    menu.classList.toggle("open");
  });
  document.addEventListener("click", e => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) menu.classList.remove("open");
  });
  window.addEventListener("resize", () => { if (menu.classList.contains("open")) place(); });
}

/* ============================================================
   Hinweis für noch nicht gebaute Seiten (Matching, Aufgaben, …)
   ============================================================ */
let _toastTimer;
function showToast(label){
  let t = document.getElementById("app-toast");
  if (!t){
    t = document.createElement("div");
    t.id = "app-toast";
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>
    <span>Die Seite <b>${label}</b> ist noch nicht verfügbar.</span>`;
  t.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

function wireSoon(){
  document.querySelectorAll(".nav a[data-soon]").forEach(a => {
    a.addEventListener("click", e => { e.preventDefault(); showToast(a.dataset.soon); });
  });
}

document.addEventListener("DOMContentLoaded", () => { renderSidebar(); wireBell(); wireSoon(); });
