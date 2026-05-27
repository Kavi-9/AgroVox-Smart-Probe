// ============================================
// AgroVox – History JS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const history = getHistory();
  renderTable(history);
  renderStats(history);
  renderHistoryChart(history);
});

function renderTable(history) {
  const tbody = document.getElementById('historyTableBody');
  const countEl = document.getElementById('recordCount');

  if (countEl) countEl.textContent = `${history.length} record${history.length !== 1 ? 's' : ''}`;

  if (!tbody) return;

  if (!history.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="10">No history yet. <a href="../analyze.html" style="color:var(--green);">Run your first analysis →</a></td></tr>`;
    return;
  }

  tbody.innerHTML = history.map((h, i) => {
    const date = new Date(h.timestamp).toLocaleString();
    const st = h.score >= 80 ? 'status-ok' : h.score >= 60 ? 'status-warn' : 'status-bad';
    const label = h.score >= 80 ? '✅ Excellent' : h.score >= 60 ? '⚠️ Good' : '🔴 Poor';
    return `
      <tr>
        <td style="color:var(--text-muted)">${history.length - i}</td>
        <td style="color:var(--text)">${date}</td>
        <td style="color:var(--text)">${h.crop || 'Generic'}</td>
        <td>${h.raw.moisture.toFixed(1)}</td>
        <td>${h.raw.temperature.toFixed(1)}</td>
        <td>${h.raw.ph.toFixed(2)}</td>
        <td>${h.raw.ec.toFixed(3)}</td>
        <td><span style="font-family:var(--font-head);font-size:15px;color:var(--green);font-weight:700">${h.score}</span></td>
        <td><span class="metric-status ${st}">${label}</span></td>
        <td><button class="view-btn" onclick="viewSession(${i})">View</button></td>
      </tr>
    `;
  }).join('');
}

function renderStats(history) {
  if (!history.length) return;

  const avg = key => (history.reduce((s, h) => s + h.raw[key], 0) / history.length).toFixed(1);

  const avgM  = document.getElementById('avgMoisture');
  const avgT  = document.getElementById('avgTemp');
  const avgP  = document.getElementById('avgPH');
  const avgS  = document.getElementById('avgScore');

  if (avgM) avgM.textContent = avg('moisture') + '%';
  if (avgT) avgT.textContent = avg('temperature') + '°C';
  if (avgP) avgP.textContent = avg('ph');
  if (avgS) avgS.textContent = Math.round(history.reduce((s,h) => s + h.score, 0) / history.length) + '/100';
}

function renderHistoryChart(history) {
  const ctx = document.getElementById('historyChart');
  if (!ctx) return;

  let labels, moisture, temp, ph, ec;

  if (history.length >= 2) {
    const slice = history.slice(-20);
    labels   = slice.map((h, i) => `#${i+1} ${new Date(h.timestamp).toLocaleDateString()}`);
    moisture = slice.map(h => h.raw.moisture);
    temp     = slice.map(h => h.raw.temperature);
    ph       = slice.map(h => h.raw.ph * 10);
    ec       = slice.map(h => h.raw.ec * 10);
  } else {
    // Simulated demo data
    labels   = Array.from({length:12}, (_,i) => `Day ${i+1}`);
    moisture = labels.map(()=>(30+Math.random()*40).toFixed(1));
    temp     = labels.map(()=>(18+Math.random()*20).toFixed(1));
    ph       = labels.map(()=>((6+Math.random()*2)*10).toFixed(1));
    ec       = labels.map(()=>((0.8+Math.random()*2)*10).toFixed(1));
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Moisture %', data: moisture, borderColor: '#3b82f6', borderWidth: 2, tension: 0.3, fill: false, pointRadius: 3 },
        { label: 'Temp °C',    data: temp,     borderColor: '#f59e0b', borderWidth: 2, tension: 0.3, fill: false, pointRadius: 3 },
        { label: 'pH ×10',    data: ph,       borderColor: '#22c55e', borderWidth: 2, tension: 0.3, fill: false, pointRadius: 3 },
        { label: 'EC ×10',    data: ec,       borderColor: '#a855f7', borderWidth: 2, tension: 0.3, fill: false, pointRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#9dbf8a', font: { family: 'DM Mono', size: 11 }, boxWidth: 20 } }
      },
      scales: {
        x: { ticks: { color: '#5a7a50', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 12 }, grid: { color: 'rgba(74,222,128,0.05)' } },
        y: { ticks: { color: '#5a7a50', font: { family: 'DM Mono', size: 10 } }, grid: { color: 'rgba(74,222,128,0.05)' } }
      }
    }
  });
}

function viewSession(index) {
  const history = getHistory();
  const h = history[index];
  if (!h) return;
  sessionStorage.setItem('agrovox_result', JSON.stringify(h));
  window.location.href = 'dashboard.html';
}
