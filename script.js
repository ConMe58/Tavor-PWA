// ---------- Speicher ----------
const KEY_LOG = "tavorLog";
const KEY_DOSES = "tavorDoses";
const loadLog = () => JSON.parse(localStorage.getItem(KEY_LOG) || "[]");
const saveLog = arr => localStorage.setItem(KEY_LOG, JSON.stringify(arr));
const loadDoses = () => JSON.parse(localStorage.getItem(KEY_DOSES) || "[]");
const saveDoses = arr => localStorage.setItem(KEY_DOSES, JSON.stringify(arr));

// ---------- DOM-Elemente ----------
const doseSel = document.getElementById("dose");
const timeModeSel = document.getElementById("timeMode");
const customDT = document.getElementById("customDateTime");
const saveBtn = document.getElementById("saveBtn");
const lastEntryEl = document.getElementById("lastEntry");
const tableBody = document.getElementById("logBody");
const addDoseBtn = document.getElementById("addDoseBtn");
const removeDoseBtn = document.getElementById("removeDoseBtn");

// ---------- Funktionen ----------
function initDoses() {
  const saved = loadDoses();
  const defaults = [
    "0,5 Expedit","1,0 Expedit","1,5 Expedit",
    "0,5 Normal","1,0 Normal","1,5 Normal"
  ];
  const list = [...new Set([...defaults, ...saved])]; // Duplikate vermeiden
  doseSel.innerHTML = "";
  list.forEach(d => {
    const opt = document.createElement("option");
    opt.textContent = d;
    doseSel.appendChild(opt);
  });
  saveDoses(list);
}

function saveDose() {
  const selected = Array.from(doseSel.selectedOptions).map(o => o.value);
  if (!selected.length) {
    alert("Bitte mindestens eine Dosis auswählen!");
    return;
  }

  let when = new Date();
  if (timeModeSel.value === "custom" && customDT.value) {
    when = new Date(customDT.value);
  }

  const log = loadLog();
  selected.forEach(dose => log.push({ dose, time: when.toISOString() }));
  log.sort((a,b) => new Date(a.time) - new Date(b.time));
  saveLog(log);
  render();

  doseSel.selectedIndex = -1;
  timeModeSel.value = "now";
  customDT.value = "";
  customDT.style.display = "none";
}

function render() {
  const log = loadLog();
  if (log.length) {
    const last = log[log.length - 1];
    lastEntryEl.textContent = humanText(last);
  } else {
    lastEntryEl.textContent = "Noch keine Daten";
  }

  tableBody.innerHTML = "";
  log.forEach((e, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td>
                    <td>${new Date(e.time).toLocaleString()}</td>
                    <td>${e.dose}</td>`;
    tableBody.appendChild(tr);
  });
}

function humanText(entry) {
  const t = new Date(entry.time).getTime();
  const diffMin = Math.round((Date.now() - t) / 60000);
  const h = Math.floor(diffMin / 60), m = diffMin % 60;
  return `${entry.dose} – vor ${h} Std ${m} Min (${new Date(t).toLocaleString()})`;
}

// ---------- Ereignisse ----------
timeModeSel.addEventListener("change", () => {
  customDT.style.display = timeModeSel.value === "custom" ? "inline-block" : "none";
});

addDoseBtn.addEventListener("click", () => {
  const val = document.getElementById("newDose").value.trim();
  if (!val) return;
  const doses = loadDoses();
  if (doses.includes(val)) return alert("Dieser Eintrag existiert bereits.");

  doses.push(val);
  saveDoses(doses);
  initDoses();
  doseSel.value = val;
  document.getElementById("newDose").value = "";
});

removeDoseBtn.addEventListener("click", () => {
  const selected = Array.from(doseSel.selectedOptions).map(o => o.value);
  if (!selected.length) return alert("Wähle zuerst einen Menüpunkt zum Löschen aus.");

  if (!confirm(`Willst du ${selected.join(", ")} wirklich löschen?`)) return;

  let doses = loadDoses();
  doses = doses.filter(d => !selected.includes(d));
  saveDoses(doses);
  initDoses();
});

saveBtn.addEventListener("click", saveDose);

// ---------- Start ----------
document.addEventListener("DOMContentLoaded", () => {
  initDoses();
  render();
});