// ---------- Storage helpers ----------
const KEY = "tavorLog";
const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));

// parse "1,5 Expedit" → 1.5 (mg)
function doseToMg(text){
  const n = text.split(" ")[0].replace(",", ".");
  const v = parseFloat(n);
  return isNaN(v) ? 0 : v;
}

// ---------- UI refs ----------
const doseSel = document.getElementById("dose");
const timeModeSel = document.getElementById("timeMode");
const customDT = document.getElementById("customDateTime");
const saveBtn = document.getElementById("saveBtn");
const lastEntryEl = document.getElementById("lastEntry");
const tableBody = document.getElementById("logBody");
const daysInput = document.getElementById("daysWindow");
const daysLabel = document.getElementById("daysLabel");
const avgWindowEl = document.getElementById("avgWindow");
const avgAllEl = document.getElementById("avgAll");
const trackedDaysEl = document.getElementById("trackedDays");
const entryCountEl = document.getElementById("entryCount");
const toggleIndex = document.getElementById("toggleIndex");

// ---------- Events ----------
timeModeSel.addEventListener("change", () => {
  customDT.style.display = timeModeSel.value === "custom" ? "inline-block" : "none";
});
daysInput.addEventListener("input", () => {
  daysLabel.textContent = daysInput.value;
  render();
});
toggleIndex.addEventListener("change", () => {
  document.querySelectorAll(".col-index").forEach(th => th.style.display = toggleIndex.checked ? "" : "none");
  document.querySelectorAll("td.col-index").forEach(td => td.style.display = toggleIndex.checked ? "" : "none");
});

document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);
document.getElementById("exportPdfBtn").addEventListener("click", exportPDF);
saveBtn.addEventListener("click", saveDose);

// ---------- Core actions ----------
function saveDose(){
  const dose = doseSel.value;
  let when = new Date();
  if (timeModeSel.value === "custom" && customDT.value){
    when = new Date(customDT.value);
  }
  const log = load();
  log.push({ dose, time: when.toISOString() });
  // Chronologisch sortieren (älteste -> neueste)
  log.sort((a,b)=> new Date(a.time) - new Date(b.time));
  save(log);
  render();
  // Reset "Jetzt" Modus
  timeModeSel.value = "now"; customDT.value = ""; customDT.style.display = "none";
}

function render(){
  const log = load();
  // Anzeige "Letzte Einnahme"
  if (log.length){
    const last = log[log.length-1];
    lastEntryEl.textContent = humanLastText(last);
  }else{
    lastEntryEl.textContent = "Noch keine Daten";
  }

  // Tabelle (neueste zuerst)
  tableBody.innerHTML = "";
  const showIndex = toggleIndex.checked;
  const rows = log.slice().reverse(); // neueste oben
  rows.forEach((e, idx) => {
    const tr = document.createElement("tr");
    const indexTd = document.createElement("td");
    indexTd.className = "col-index";
    indexTd.style.display = showIndex ? "" : "none";
    indexTd.textContent = (log.length - idx); // fortlaufend
    const dtTd = document.createElement("td");
    dtTd.textContent = new Date(e.time).toLocaleString();
    const doseTd = document.createElement("td");
    doseTd.textContent = e.dose;
    tr.append(indexTd, dtTd, doseTd);
    tableBody.appendChild(tr);
  });

  // Statistik
  entryCountEl.textContent = log.length.toString();
  avgAllEl.textContent = formatAvg(averageMg(log));

  const days = parseInt(daysInput.value || "7", 10);
  const cutoff = Date.now() - days*24*60*60*1000;
  const slice = log.filter(e => new Date(e.time).getTime() >= cutoff);
  avgWindowEl.textContent = slice.length ? formatAvg(averageMg(slice)) : "–";

  // Anzahl getrackter Tage (unique Datum)
  const uniqueDays = new Set(log.map(e => new Date(e.time).toISOString().slice(0,10)));
  trackedDaysEl.textContent = uniqueDays.size.toString();

  // Nummerierungskopf ein/aus
  document.querySelector("th.col-index").style.display = showIndex ? "" : "none";
}

function humanLastText(entry){
  const t = new Date(entry.time).getTime();
  const diffMin = Math.max(0, Math.round((Date.now()-t)/60000));
  const h = Math.floor(diffMin/60), m = diffMin%60;
  return `${entry.dose} – vor ${h} Std ${m} Min (${new Date(t).toLocaleString()})`;
}

// ---------- Helpers: stats, export ----------
function averageMg(items){
  if (!items.length) return 0;
  const sum = items.reduce((acc,e)=> acc + doseToMg(e.dose), 0);
  return sum / items.length;
}
const formatAvg = (n)=> (n ? (Math.round(n*100)/100).toString().replace(".", ",") + " mg" : "–");

// CSV
function exportCSV(){
  const log = load();
  const header = "Index;Datum;Dosis;mg\n";
  const rows = log.map((e,i)=> {
    const idx = i+1;
    const dt = new Date(e.time).toLocaleString();
    const mg = doseToMg(e.dose).toString().replace(".", ",");
    return `${idx};${dt};${e.dose};${mg}`;
  }).join("\n");
  downloadText("tavor_log.csv", header+rows);
}

function downloadText(filename, text){
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// PDF (Druckansicht)
function exportPDF(){
  // einfache Druck-Ansicht: System-Dialog → „Als PDF sichern/teilen“
  window.print();
}

// ---------- Boot ----------
render();
// bei Theme-Wechsel (iOS/Android) neu rendern
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);