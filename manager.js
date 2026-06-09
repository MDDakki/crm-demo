/* ============================================================
   Manager-Dashboard — Benutzer & Rollen verwalten
   - Rolle inline ändern, aktiv/inaktiv, hinzufügen, entfernen
   - speichert über store.js (localStorage)
   ============================================================ */

const $  = (s, e=document) => e.querySelector(s);
const $$ = (s, e=document) => [...e.querySelectorAll(s)];

const ROLES = ["Admin","Bearbeiter","Leser"];
const TEAMS = ["Leitung","Koordination","NLL","Verwaltung","Zusätzlich"];
const roleColor = { Admin:"#6b4dff", Bearbeiter:"#2f6df6", Leser:"#8a94ab" };

/* ---------- Icons (vor PERMS definiert) ---------- */
const iconShield = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>`;
const iconEdit   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>`;
const iconEye    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const iconCheck  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>`;

const PERMS = [
  { role:"Admin", cls:"admin", title:"Admin · Vollzugriff", icon:iconShield,
    can:["Teilnehmer & Unternehmen bearbeiten","Benutzer & Rollen verwalten","Exportieren & löschen"] },
  { role:"Bearbeiter", cls:"bearb", title:"Bearbeiter", icon:iconEdit,
    can:["Teilnehmer & Unternehmen anlegen/bearbeiten","Aufgaben & Notizen pflegen","keine Benutzerverwaltung"] },
  { role:"Leser", cls:"leser", title:"Leser · nur lesen", icon:iconEye,
    can:["Daten ansehen & filtern","Berichte ansehen","keine Änderungen möglich"] },
];

const filter = { rolle:"", team:"", search:"" };

const initials = name => name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
const avatarColor = name => ["#2f6df6","#0f9c6b","#c2418c","#e8932a","#1d4ed8","#6b4dff"][name.length % 6];

/* ---------- KPIs + Berechtigungskarten ---------- */
function renderKpis(){
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("kpi-total", USERS.length);
  ROLES.forEach(r => set("kpi-"+r, USERS.filter(u => u.rolle === r).length));
}

function renderPermCards(){
  $("#perm-cards").innerHTML = PERMS.map(p => `
    <div class="perm-card ${p.cls}">
      <div class="ph">
        <span class="pic">${p.icon}</span>
        <h3>${p.title}</h3>
        <span class="cnt">${USERS.filter(u => u.rolle === p.role).length}</span>
      </div>
      <ul>${p.can.map(c => `<li>${iconCheck}${c}</li>`).join("")}</ul>
    </div>`).join("");
}

/* ---------- Tabelle ---------- */
function visible(){
  const q = filter.search.trim().toLowerCase();
  return USERS.filter(u => {
    if (filter.rolle && u.rolle !== filter.rolle) return false;
    if (filter.team  && u.team  !== filter.team)  return false;
    if (q && !`${u.name} ${u.email} ${u.team}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderTable(){
  const list = visible();
  $("#count").textContent = `${list.length} ${list.length === 1 ? "Benutzer" : "Benutzer"}`;

  if (!list.length){
    $("#rows").innerHTML = `<tr><td colspan="6"><div class="empty">Keine Benutzer für diese Auswahl.</div></td></tr>`;
    return;
  }

  $("#rows").innerHTML = list.map(u => `
    <tr data-id="${u.id}" class="${u.aktiv ? "" : "inactive"}">
      <td>
        <div class="tn">
          <div class="av" style="background:${avatarColor(u.name)}">${initials(u.name)}</div>
          <div><b>${u.name}</b><span>${u.email}</span></div>
        </div>
      </td>
      <td><span class="team-tag">${u.team}</span></td>
      <td><span class="muted">${u.standort || "—"}</span></td>
      <td>
        <select class="role-select" data-role-for="${u.id}" style="color:${roleColor[u.rolle]}">
          ${ROLES.map(r => `<option value="${r}" ${r===u.rolle?"selected":""}>${r}</option>`).join("")}
        </select>
      </td>
      <td>
        <div class="toggle ${u.aktiv ? "on" : ""} u-toggle" data-toggle-for="${u.id}">
          <span class="track"></span>${u.aktiv ? "Aktiv" : "Inaktiv"}
        </div>
      </td>
      <td>
        <button class="icon-del" data-del-for="${u.id}" title="Benutzer entfernen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>
        </button>
      </td>
    </tr>`).join("");

  // Rolle ändern
  $$("[data-role-for]").forEach(sel => sel.addEventListener("change", () => {
    const u = USERS.find(x => x.id === +sel.dataset.roleFor);
    u.rolle = sel.value;
    sel.style.color = roleColor[u.rolle];
    saveUsers(); logActivity(`hat die Rolle von <b>${u.name}</b> auf <b>${u.rolle}</b> geändert`);
    renderKpis(); renderPermCards();
  }));
  // aktiv/inaktiv
  $$("[data-toggle-for]").forEach(t => t.addEventListener("click", () => {
    const u = USERS.find(x => x.id === +t.dataset.toggleFor);
    u.aktiv = !u.aktiv; saveUsers();
    logActivity(`hat den Zugang von <b>${u.name}</b> ${u.aktiv ? "aktiviert" : "deaktiviert"}`);
    renderTable();
  }));
  // entfernen
  $$("[data-del-for]").forEach(b => b.addEventListener("click", () => {
    const u = USERS.find(x => x.id === +b.dataset.delFor);
    if (!confirm(`Benutzer „${u.name}" wirklich entfernen?`)) return;
    const i = USERS.indexOf(u); USERS.splice(i, 1);
    saveUsers(); renderKpis(); renderPermCards(); renderTable();
  }));
}

/* ---------- Benutzer hinzufügen (Modal) ---------- */
function openUserForm(){
  let ov = document.getElementById("modal-overlay");
  if (!ov){
    ov = document.createElement("div");
    ov.className = "modal-overlay"; ov.id = "modal-overlay";
    document.body.appendChild(ov);
    ov.addEventListener("click", e => { if (e.target === ov || e.target.closest("[data-close]")) ov.classList.remove("open"); });
  } 
  const sel = (name, opts) => `<select name="${name}">${opts.map(o=>`<option>${o}</option>`).join("")}</select>`;
  ov.innerHTML = `
    <div class="modal" role="dialog">
      <div class="modal-head"><h3>Neuer Benutzer</h3>
        <button class="modal-x" type="button" data-close><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
      <form id="user-form">
        <div class="form-grid">
          <label class="field full"><span>Name <i>*</i></span><input name="name" placeholder="Vorname Nachname" required></label>
          <label class="field full"><span>E-Mail</span><input name="email" placeholder="wird sonst automatisch erzeugt"></label>
          <label class="field"><span>Team</span>${sel("team", TEAMS)}</label>
          <label class="field"><span>Rolle</span>${sel("rolle", ROLES)}</label>
          <label class="field full"><span>Standort (optional)</span><input name="standort" placeholder="z. B. Leipzig"></label>
        </div>
        <div class="modal-foot">
          <button class="btn sec" type="button" data-close>Abbrechen</button>
          <button class="btn pri" type="submit">Benutzer anlegen</button>
        </div>
      </form>`;
  ov.classList.add("open");

  $("#user-form").onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const name = d.name.trim();
    const email = d.email.trim() || name.toLowerCase()
      .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss")
      .replace(/[^a-z0-9 ]/g,"").trim().replace(/\s+/g,".") + "@future-training.de";
    addUser({ name, email, team:d.team, rolle:d.rolle, standort:d.standort.trim(), aktiv:true });
    ov.classList.remove("open");
    renderKpis(); renderPermCards(); renderTable();
  };
}

/* ---------- Init ---------- */
function init(){
  renderKpis();
  renderPermCards();
  renderTable();
  $("#search").addEventListener("input", e => { filter.search = e.target.value; renderTable(); });
  $("#f-rolle").addEventListener("change", e => { filter.rolle = e.target.value; renderTable(); });
  $("#f-team").addEventListener("change", e => { filter.team = e.target.value; renderTable(); });
  $(".btn-new").addEventListener("click", openUserForm);
}

document.addEventListener("DOMContentLoaded", init);
