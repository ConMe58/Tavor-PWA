const KEY = "tavorLog";
const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
const save = arr => localStorage.setItem(KEY, JSON.stringify(arr));

function doseToMg(txt) {
  const n = txt.split(" ")[0].replace(",", ".");
  const v = parseFloat(n);
  return isNaN(v) ? 0 : v;
}

const doseSel = document.getElementById("dose");
const timeModeSel = document.getElementById("timeMode");
const customDT = document.getElementById("customDateTime");
const saveBtn = document.getElementById("saveBtn");
const lastEntryEl = document.getElementById("lastEntry");
const tableBody = document.getElementById("logBody");

timeModeSel.addEventListener("change", () => {
  customDT.style.display = timeModeSel.value === "custom" ? "inline-block" : "none";
});

document.getElementById("addDoseBtn").addEventListener("click", () => {
  const val = document.getElementById("newDose").value.trim();
  if (!val) return;
  const opt = document.createElement("option");
  opt.textContent = val;
  doseSel.appendChild(opt);
  opt.selected = true;
  document.getElementById("newDose").value = "";
});

saveBtn.addEventListener("click", saveDose);

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

  const log = load();
  selected.forEach(dose => log.push({ dose, time: when.toISOString() }));

  log.sort((a, b) => new Date(a.time) - new Date(b.time));
  save(log);
  render();

  doseSel.selectedIndex = -1;
  timeModeSel.value = "now";
  customDT.value = "";
  customDT.style.display = "none";
}

function render() {
  const log = load();
  if (log.length) {
    const last = log[log.length - 1];
    lastEntryEl.textContent = humanText(last);
  } else {
    lastEntryEl.textContent = "Noch keine Daten";
  }

  tableBody.innerHTML = "";
  log.forEach((e, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
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

render();