const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("akte.js", "utf8");
const sandbox = { document: { addEventListener() {} } };
vm.runInNewContext(source, sandbox);

const result = sandbox.completeReminder(
  { text: "Praktikumsbesuch", betreuer: "Musterkollege 1", datum: "30.08.2026", done: false },
  { outcome: "Fortschrittskontrolle", kommentar: "Besuch dokumentiert." },
  { text: "Rückruf vereinbaren", betreuer: "Musterkollege 2", datum: "15.09.2026" },
  "24.08.2026",
);

assert.equal(result.historyEntry.outcome, "Fortschrittskontrolle");
assert.equal(result.historyEntry.erinnerung.done, true);
assert.equal(result.nextReminder.text, "Rückruf vereinbaren");
assert.equal(result.nextReminder.done, false);
