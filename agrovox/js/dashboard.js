// ============================================
// AgroVox – Dashboard JS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const result = getLastResult();

  if (!result) {
    // Show demo mode with sample data
    const demo = analyzeData({ moisture: 24, temperature: 31, ph: 5.8, ec: 0.7 });
    renderDashboard(demo, true);
  } else {
    renderDashboard(result, false);
  }

  renderTrendChart();
});

function renderDashboard(result, isDemo) {
  const { raw, score, scoreLabel, recommendations, crop } = result;

  // ── Metric Cards ──
  renderMetricCard('moisture',    raw.moisture,    '%',    0, 100,  'moisture');
  renderMetricCard('temp',        raw.temperature, '°C',   0, 60,   'temperature');
  renderMetricCard('ph',          raw.ph,          'pH',   0, 14,   'ph');
  renderMetricCard('ec',          raw.ec,          'dS/m', 0, 5,    'ec');

  // ── Recommendations ──
  const list = document.getElementById('recoList');
  if (list) {
    const html = recommendations.map((r, i) => `
      <div class="reco-item" style="animation-delay:${i * 0.08}s">
        <div class="reco-icon">${r.icon}</div>
        <div class="reco-text">
          <div class="reco-title">${r.title}</div>
          <div class="reco-desc">${r.desc}</div>
        </div>
        <span class="reco-badge ${r.severity}">${r.severity.toUpperCase()}</span>
      </div>
    `).join('');
    list.innerHTML = html;

    if (isDemo) {
      list.insertAdjacentHTML('beforebegin', `
        <div style="padding:6px 12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:8px;margin-bottom:12px;font-family:var(--font-mono);font-size:12px;color:var(--amber);">
          ⚠️ Demo mode — showing sample data. <a href="../analyze.html" style="color:var(--amber);">Run a real analysis →</a>
        </div>
      `);
    }
  }

  // ── Score Gauge ──
  renderGauge(score, scoreLabel, raw);
  const cropLabel = document.getElementById('cropLabel');
  if (cropLabel) cropLabel.textContent = crop || 'Generic';

  // ── Charts ──
  renderRadarChart(raw);
  renderFilterChart(raw);
}

function renderMetricCard(id, value, unit, min, max, param) {
  const valEl  = document.getElementById(`val-${id}`);
  const barEl  = document.getElementById(`bar-${id}`);
  const stEl   = document.getElementById(`st-${id}`);
  const card   = document.getElementById(`card-${id}`);

  if (!valEl) return;

  // Animate number
  let start = 0;
  const target = parseFloat(value);
  const duration = 800;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    valEl.textContent = (start === timestamp && progress < 1)
      ? (eased * target).toFixed(1)
      : target.toFixed(param === 'ec' ? 2 : 1);
    if (progress < 1) requestAnimationFrame(step);
    else valEl.textContent = target.toFixed(param === 'ec' ? 2 : 1);
  };
  requestAnimationFrame(step);

  // Bar fill
  const pct = ((value - min) / (max - min)) * 100;
  setTimeout(() => {
    if (barEl) barEl.style.width = `${Math.max(2, Math.min(100, pct))}%`;
  }, 200);

  // Status
  const st = getStatus(param, value);
  if (stEl) {
    stEl.textContent = st.label;
    stEl.className = `metric-status ${st.cls}`;
  }

  // Card label
  if (card) {
    const labels = { moisture: 'MOISTURE', temp: 'TEMPERATURE', ph: 'PH LEVEL', ec: 'EC' };
    card.setAttribute('data-label', labels[id] || '');
  }
}

function renderGauge(score, label, raw) {
  const fill  = document.getElementById('gaugeFill');
  const num   = document.getElementById('gaugeNum');
  const chip  = document.getElementById('scoreLabel');
  const breakdown = document.getElementById('scoreBreakdown');

  if (!fill) return;

  const circumference = 251;
  const offset = circumference - (score / 100) * circumference;

  setTimeout(() => {
    fill.style.strokeDashoffset = offset;
    fill.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)';
  }, 200);

  if (num) num.textContent = score;
  if (chip) {
    chip.textContent = label;
    chip.style.background = score >= 80 ? 'rgba(34,197,94,0.15)' : score >= 60 ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)';
    chip.style.color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)';
  }

  // Score breakdown
  if (breakdown) {
    const params = [
      { key: 'moisture',    val: raw.moisture,    label: 'Moisture' },
      { key: 'temperature', val: raw.temperature, label: 'Temp' },
      { key: 'ph',          val: raw.ph,          label: 'pH' },
      { key: 'ec',          val: raw.ec,          label: 'EC' }
    ];

    breakdown.innerHTML = params.map(p => {
      const s = paramScore(p.key, p.val);
      const color = s >= 80 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#f87171';
      return `
        <div class="score-row">
          <div class="score-row-label">${p.label}</div>
          <div class="score-mini-bar">
            <div class="score-mini-fill" style="width:0%;background:${color}" data-w="${s}"></div>
          </div>
          <div class="score-row-val">${s}</div>
        </div>
      `;
    }).join('');

    setTimeout(() => {
      breakdown.querySelectorAll('.score-mini-fill').forEach(el => {
        el.style.width = el.dataset.w + '%';
        el.style.transition = 'width 1s ease';
      });
    }, 300);
  }
}

function renderRadarChart(raw) {
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;

  const scores = [
    paramScore('moisture',    raw.moisture),
    paramScore('temperature', raw.temperature),
    paramScore('ph',          raw.ph),
    paramScore('ec',          raw.ec)
  ];

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['💧 Moisture', '🌡️ Temp', '⚗️ pH', '⚡ EC'],
      datasets: [{
        label: 'Soil Health Score',
        data: scores,
        backgroundColor: 'rgba(74,222,128,0.15)',
        borderColor: '#4ade80',
        borderWidth: 2,
        pointBackgroundColor: '#4ade80',
        pointRadius: 4,
      }]
    },
    options: {
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { color: '#5a7a50', font: { family: 'DM Mono', size: 10 }, stepSize: 25 },
          grid: { color: 'rgba(74,222,128,0.1)' },
          pointLabels: { color: '#9dbf8a', font: { family: 'Syne', size: 13, weight: '600' } },
          angleLines: { color: 'rgba(74,222,128,0.08)' }
        }
      },
      plugins: { legend: { display: false } },
      animation: { duration: 1000 }
    }
  });
}

function renderFilterChart(raw) {
  const ctx = document.getElementById('filterChart');
  if (!ctx) return;

  // Simulate raw vs filtered comparison
  const params = ['Moisture', 'Temp', 'pH×10', 'EC×10'];
  const rawVals = [
    raw.moisture * (1 + (Math.random()-0.5)*0.3),
    raw.temperature * (1 + (Math.random()-0.5)*0.25),
    raw.ph * 10 * (1 + (Math.random()-0.5)*0.2),
    raw.ec * 10 * (1 + (Math.random()-0.5)*0.35)
  ].map(v => parseFloat(v.toFixed(1)));

  const filteredVals = [
    raw.moisture,
    raw.temperature,
    raw.ph * 10,
    raw.ec * 10
  ].map(v => parseFloat(v.toFixed(1)));

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: params,
      datasets: [
        {
          label: 'Raw Signal',
          data: rawVals,
          backgroundColor: 'rgba(248,113,113,0.3)',
          borderColor: '#f87171',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'MA Filtered',
          data: filteredVals,
          backgroundColor: 'rgba(74,222,128,0.35)',
          borderColor: '#4ade80',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#9dbf8a', font: { family: 'DM Mono', size: 11 } }
        }
      },
      scales: {
        x: { ticks: { color: '#5a7a50', font: { family: 'DM Mono', size: 11 } }, grid: { color: 'rgba(74,222,128,0.06)' } },
        y: { ticks: { color: '#5a7a50', font: { family: 'DM Mono', size: 11 } }, grid: { color: 'rgba(74,222,128,0.06)' } }
      }
    }
  });
}

function renderTrendChart() {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  const history = getHistory();
  const labels  = [];
  const datasets = {
    moisture: [], temp: [], ph: [], ec: []
  };

  // Use real history or simulate 24h
  if (history.length >= 2) {
    history.slice(-12).forEach(h => {
      labels.push(new Date(h.timestamp).toLocaleTimeString());
      datasets.moisture.push(h.raw.moisture);
      datasets.temp.push(h.raw.temperature);
      datasets.ph.push(h.raw.ph * 10);
      datasets.ec.push(h.raw.ec * 10);
    });
  } else {
    // Simulate 24 hours of data
    for (let i = 23; i >= 0; i--) {
      const h = new Date(); h.setHours(h.getHours() - i);
      labels.push(h.getHours() + ':00');
      const base = history[0]?.raw || { moisture: 45, temperature: 28, ph: 6.8, ec: 1.2 };
      datasets.moisture.push(+(base.moisture + (Math.random()-0.5)*12).toFixed(1));
      datasets.temp.push(+(base.temperature + (Math.random()-0.5)*6).toFixed(1));
      datasets.ph.push(+((base.ph + (Math.random()-0.5)*0.5)*10).toFixed(1));
      datasets.ec.push(+((base.ec + (Math.random()-0.5)*0.3)*10).toFixed(1));
    }
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Moisture %', data: datasets.moisture, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.06)', borderWidth: 2, tension: 0.4, pointRadius: 2 },
        { label: 'Temp °C',    data: datasets.temp,     borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 2, tension: 0.4, pointRadius: 2 },
        { label: 'pH ×10',    data: datasets.ph,       borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.06)',  borderWidth: 2, tension: 0.4, pointRadius: 2 },
        { label: 'EC ×10',    data: datasets.ec,       borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.06)', borderWidth: 2, tension: 0.4, pointRadius: 2 }
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
