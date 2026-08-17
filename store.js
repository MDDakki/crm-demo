/* ============================================================
   Store — speichert Daten temporär im Browser (localStorage).
   - Beim ersten Laden: Seed-Daten aus data.js
   - Danach: gespeicherter Stand (übersteht Reload)
   - resetDemo() löscht alles und lädt die Seed-Daten neu
   Hinweis: rein lokal im Browser, kein Server.
   ============================================================ */

// Version hochzählen, sobald sich die Beispieldaten ändern → alter Speicher wird ignoriert
const STORE_KEYS = { tn: "crm_tn_v3", un: "crm_un_v3", users: "crm_users_v3", activity: "crm_activity_v3" };

// Angemeldeter Nutzer (im Mockup fest) — wird Aktivitäten zugeschrieben
const CURRENT_USER = "Musterkollege 1";

const clone = obj => JSON.parse(JSON.stringify(obj));

function load(key, seed){
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : clone(seed);
  } catch (e){
    console.warn("Store-Lesefehler, nutze Seed:", e);
    return clone(seed);
  }
}

// Start-Aktivitäten (damit der Verlauf nicht leer ist)
const SEED_ACTIVITY = (() => {
  const now = Date.now(), m = 60000, h = 60 * m;
  return [
    { user:"Musterkollege 11", text:'hat die Akte von <b>Mustername 1</b> aktualisiert',         ts: now - 9 * m },
    { user:"Musterkollege 12", text:'hat <b>Mustername 3</b> als Risiko <b>Rot</b> markiert',    ts: now - 35 * m },
    { user:"Musterkollege 14", text:'hat einen Kontakt bei <b>Musterfirma 2</b> vermerkt',       ts: now - 1 * h - 20 * m },
    { user:"Musterkollege 1",  text:'hat das Unternehmen <b>Musterfirma 4</b> hinzugefügt',      ts: now - 2 * h - 10 * m },
    { user:"Musterkollege 10", text:'hat den Teilnehmer <b>Mustername 8</b> hinzugefügt',        ts: now - 4 * h },
  ].map((a, i) => ({ id: i + 1, ...a }));
})();

// Live-Arrays, die die ganze App nutzt (global)
window.TN          = load(STORE_KEYS.tn, SEED_TN);
window.UNTERNEHMEN = load(STORE_KEYS.un, SEED_UNTERNEHMEN);
window.USERS       = load(STORE_KEYS.users, SEED_USERS);
window.ACTIVITY    = load(STORE_KEYS.activity, SEED_ACTIVITY);

// "Angelegt am" für Beispiel-Firmen + alte Daten nachrüsten
const _seedCreated = {1:"12.03.2024, 09:15",2:"03.07.2024, 11:40",3:"21.11.2024, 14:05",4:"08.01.2025, 10:30",5:"19.02.2025, 16:20",6:"27.05.2026, 08:50"};
UNTERNEHMEN.forEach(u => { if (!u.createdAt) u.createdAt = _seedCreated[u.id] || "—"; });

// aktuelles Datum + Uhrzeit als "TT.MM.JJJJ, HH:MM"
function fmtNow(){
  const d = new Date(), p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()}, ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function saveTN(){ localStorage.setItem(STORE_KEYS.tn, JSON.stringify(TN)); }
function saveUN(){ localStorage.setItem(STORE_KEYS.un, JSON.stringify(UNTERNEHMEN)); }
function saveUsers(){ localStorage.setItem(STORE_KEYS.users, JSON.stringify(USERS)); }
function saveActivity(){ localStorage.setItem(STORE_KEYS.activity, JSON.stringify(ACTIVITY)); }

function nextId(arr){ return arr.reduce((m, x) => Math.max(m, x.id), 0) + 1; }

// Aktivität protokollieren (max. 60 Einträge) + Seite informieren
function logActivity(text, user){
  ACTIVITY.unshift({ id: nextId(ACTIVITY), user: user || CURRENT_USER, text, ts: Date.now() });
  if (ACTIVITY.length > 60) ACTIVITY.length = 60;
  saveActivity();
  document.dispatchEvent(new CustomEvent("activity-logged"));
}

function addTN(obj){ obj.id = nextId(TN); TN.unshift(obj); saveTN(); logActivity(`hat den Teilnehmer <b>${obj.vn} ${obj.nn}</b> hinzugefügt`); return obj.id; }
function addUN(obj){ obj.id = nextId(UNTERNEHMEN); obj.createdAt = fmtNow(); UNTERNEHMEN.unshift(obj); saveUN(); logActivity(`hat das Unternehmen <b>${obj.name}</b> hinzugefügt`); return obj.id; }
function addUser(obj){ obj.id = nextId(USERS); USERS.unshift(obj); saveUsers(); logActivity(`hat den Benutzer <b>${obj.name}</b> angelegt`); return obj.id; }

function resetDemo(){
  if (!confirm("Alle selbst eingegebenen Demo-Daten löschen und Beispieldaten wiederherstellen?")) return;
  localStorage.removeItem(STORE_KEYS.tn);
  localStorage.removeItem(STORE_KEYS.un);
  localStorage.removeItem(STORE_KEYS.users);
  localStorage.removeItem(STORE_KEYS.activity);
  location.reload();
}

// global verfügbar machen
Object.assign(window, { saveTN, saveUN, saveUsers, saveActivity, logActivity, addTN, addUN, addUser, resetDemo });
  