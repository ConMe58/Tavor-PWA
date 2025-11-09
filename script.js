function saveDose() {
  const dose = document.getElementById("dose").value;
  const now = new Date();
  const entry = { dose, time: now.toISOString() };

  const log = JSON.parse(localStorage.getItem("tavorLog") || "[]");
  log.push(entry);
  localStorage.setItem("tavorLog", JSON.stringify(log));

  updateLastEntry();
  updateTable();
}

function updateLastEntry() {
  const log = JSON.parse(localStorage.getItem("tavorLog") || "[]");
  if (log.length === 0) return;

  const last = log[log.length - 1];
  const diff = Math.floor((Date.now() - new Date(last.time)) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;

  document.getElementById("lastEntry").textContent =
    `${last.dose} – vor ${h} Std ${m} Min (${new Date(last.time).toLocaleString()})`;
}

function updateTable() {
  const log = JSON.parse(localStorage.getItem("tavorLog") || "[]");
  const table = document.getElementById("logTable");
  table.innerHTML = "<tr><th>Datum</th><th>Dosis</th></tr>";

  log.slice().reverse().forEach(e => {
    const row = table.insertRow();
    row.insertCell(0).textContent = new Date(e.time).toLocaleString();
    row.insertCell(1).textContent = e.dose;
  });
}

updateLastEntry();
updateTable();