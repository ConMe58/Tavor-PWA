const KEY_LOG = "tavorLog";
const KEY_DOSES = "tavorDoses";
const loadLog = () => JSON.parse(localStorage.getItem(KEY_LOG) || "[]");
const saveLog = arr => localStorage.setItem(KEY_LOG, JSON.stringify(arr));
const loadDoses = () => JSON.parse(localStorage.getItem(KEY_DOSES) || "[]");
const saveDoses = arr => localStorage.setItem(KEY_DOSES, JSON.stringify(arr));

const doseSel = document.getElementById("dose");
const timeModeSel = document.getElementById("timeMode");
const customDT = document.getElementById("customDateTime");
const saveBtn = document.getElementById("saveBtn");
const lastEntryEl = document.getElementById("lastEntry");
const tableBody = document.getElementById("logBody");
const addDoseBtn = document.getElementById("addDoseBtn");
const removeDoseBtn = document.getElementById("removeDoseBtn");
const exportCSVBtn = document.getElementById("exportCSV");
const exportPDFBtn = document.getElementById("exportPDF");
const exportDaysInput = document.getElementById("exportDays");

const daysCountEl = document.getElementById("daysCount");
const avgTotalEl = document.getElementById("avgTotal");
const avg7El = document.getElementById("avg7");

// -------------------- Dosen-Setup --------------------
function initDoses() {
  const saved = loadDoses();
  const defaults = [
    "0,5 Expedit","1,0 Expedit","1,5 Expedit",
    "0,5 Normal","1,0 Normal","1,5 Normal"
  ];
  const list = [...new Set([...defaults, ...saved])];
  doseSel.innerHTML = "";
  list.forEach(d => {
    const opt = document.createElement("option");
    opt.textContent = d;
    doseSel.appendChild(opt);
  });
  saveDoses(list);
}

// -------------------- Speicherung --------------------
function saveDose() {
  const selected = Array.from(doseSel.selectedOptions).map(o => o.value);
  if (!selected.length) return alert("Bitte mindestens eine Dosis auswählen!");

  let when = new Date();
  if (timeModeSel.value === "custom" && customDT.value) {
    when = new Date(customDT.value);
  }

  const log = loadLog();
  selected.forEach(dose => log.push({ dose, time: when.toISOString() }));
  log.sort((a,b)=> new Date(a.time) - new Date(b.time));
  saveLog(log);
  render();
}

// -------------------- Darstellung --------------------
function render() {
  const log = loadLog();
  if (log.length) {
    const last = log[log.length - 1];
    lastEntryEl.textContent = humanText(last);
  } else {
    lastEntryEl.textContent = "Noch keine Daten";
  }

  // Verlauf
  tableBody.innerHTML = "";
  log.forEach((e, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td>
                    <td>${new Date(e.time).toLocaleString()}</td>
                    <td>${e.dose}</td>`;
    tableBody.appendChild(tr);
  });

  updateStats(log);
}

// -------------------- Statistik --------------------
function parseMg(text) {
  // Extrahiere Zahlen wie 1,5 oder 2.0 aus Dosis-Text
  const n = text.match(/[\d,.]+/);
  if (!n) return 0;
  return parseFloat(n[0].replace(",", "."));
}

function updateStats(log) {
  if (!log.length) {
    daysCountEl.textContent = avgTotalEl.textContent = avg7El.textContent = "–";
    return;
  }

  // Alle einzigartigen Tage zählen
  const uniqueDays = [...new Set(log.map(e => new Date(e.time).toDateString()))];
  daysCountEl.textContent = uniqueDays.length;

  // Gesamt-Durchschnitt (mg pro Tag)
  const totalMg = log.map(e => parseMg(e.dose)).reduce((a,b) => a + b, 0);
  const avgTotal = totalMg / uniqueDays.length;
  avgTotalEl.textContent = `${avgTotal.toFixed(2)} mg/Tag`;

  // Durchschnitt der letzten 7 Tage
  const sevenDaysAgo = Date.now() - 7*24*60*60*1000;
  const recent = log.filter(e => new Date(e.time).getTime() >= sevenDaysAgo);
  if (!recent.length) {
    avg7El.textContent = "–";
  } else {
    const days7 = [...new Set(recent.map(e => new Date(e.time).toDateString()))];
    const mg7 = recent.map(e => parseMg(e.dose)).reduce((a,b) => a + b, 0);
    avg7El.textContent = `${(mg7 / days7.length).toFixed(2)} mg/Tag`;
  }
}

// -------------------- Hilfsfunktionen --------------------
function humanText(entry) {
  const t = new Date(entry.time).getTime();
  const diffMin = Math.round((Date.now() - t) / 60000);
  const h = Math.floor(diffMin / 60), m = diffMin % 60;
  return `${entry.dose} – vor ${h} Std ${m} Min (${new Date(t).toLocaleString()})`;
}

// -------------------- Export --------------------
function filterByDays(arr, days) {
  if (!days) return arr;
  const limit = Date.now() - days * 24 * 60 * 60 * 1000;
  return arr.filter(e => new Date(e.time).getTime() >= limit);
}

function exportCSV(days) {
  const log = filterByDays(loadLog(), days);
  if (!log.length) return alert("Keine Daten zum Exportieren.");

  const csv = "Datum,Dosis\n" + log.map(e => 
    `${new Date(e.time).toLocaleString()},${e.dose}`).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tavor_tracker.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(days) {
  const log = filterByDays(loadLog(), days);
  if (!log.length) return alert("Keine Daten zum Exportieren.");
  let html = "<h1>Tavor Tracker Verlauf</h1><table border='1' cellspacing='0' cellpadding='4'><tr><th>Datum</th><th>Dosis</th></tr>";
  log.forEach(e => {
    html += `<tr><td>${new Date(e.time).toLocaleString()}</td><td>${e.dose}</td></tr>`;
  });
  html += "</table>";
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.print();
}

// -------------------- Events --------------------
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
  let doses = loadDoses().filter(d => !selected.includes(d));
  saveDoses(doses);
  initDoses();
});
saveBtn.addEventListener("click", saveDose);
exportCSVBtn.addEventListener("click", () => exportCSV(Number(exportDaysInput.value)));
exportPDFBtn.addEventListener("click", () => exportPDF(Number(exportDaysInput.value)));

// -------------------- Start --------------------
document.addEventListener("DOMContentLoaded", () => {
  initDoses();
  render();
});