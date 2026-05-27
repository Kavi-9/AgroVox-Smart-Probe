// ============================================
// AgroVox Smart Probe – Core Application Logic
// Rule-Based AI Decision Engine + MA Filter
// ============================================

// ── Moving Average Filter ──────────────────
class MovingAverageFilter {
  constructor(windowSize = 5) {
    this.windowSize = windowSize;
    this.buffers = { moisture: [], temp: [], ph: [], ec: [] };
  }

  addReading(param, value) {
    const buf = this.buffers[param];
    buf.push(value);
    if (buf.length > this.windowSize) buf.shift();
    return buf.reduce((a, b) => a + b, 0) / buf.length;
  }

  filterAll(data) {
    return {
      moisture:    this.addReading('moisture', data.moisture),
      temperature: this.addReading('temp', data.temperature),
      ph:          this.addReading('ph', data.ph),
      ec:          this.addReading('ec', data.ec)
    };
  }
}

// ── Rule-Based AI Decision Engine ─────────
function analyzeData(raw, crop = 'Generic') {
  const { moisture, temperature, ph, ec } = raw;
  const recommendations = [];
  let score = 100;

  const cropProfiles = {
    Wheat:      { moisture: [30, 65], temperature: [15, 25], ph: [6, 7.5], ec: [1, 2] },
    Rice:       { moisture: [40, 80], temperature: [20, 30], ph: [5.5, 7], ec: [1.2, 2.5] },
    Maize:      { moisture: [30, 70], temperature: [18, 28], ph: [6, 7], ec: [1, 2] },
    Vegetables: { moisture: [35, 70], temperature: [16, 28], ph: [6, 7.5], ec: [1, 2.2] },
    'Fruit Trees': { moisture: [30, 60], temperature: [18, 28], ph: [6, 7.5], ec: [0.9, 2] }
  };

  // ── Moisture Rules ──
  if (moisture < 20) {
    recommendations.push({
      icon: '🚨',
      title: 'Critical: Irrigation Required',
      desc: `Moisture at ${moisture.toFixed(1)}% is critically low. Irrigate immediately to prevent crop stress.`,
      category: 'irrigation',
      severity: 'urgent',
      param: 'moisture'
    });
    score -= 30;
  } else if (moisture < 30) {
    recommendations.push({
      icon: '💧',
      title: 'Irrigation Needed',
      desc: `Moisture at ${moisture.toFixed(1)}% is below optimal range (30–70%). Schedule irrigation soon.`,
      category: 'irrigation',
      severity: 'caution',
      param: 'moisture'
    });
    score -= 15;
  } else if (moisture > 80) {
    recommendations.push({
      icon: '🌊',
      title: 'Over-Watering Alert',
      desc: `Moisture at ${moisture.toFixed(1)}% is too high. Reduce irrigation to prevent root rot.`,
      category: 'irrigation',
      severity: 'caution',
      param: 'moisture'
    });
    score -= 15;
  } else if (moisture > 70) {
    recommendations.push({
      icon: '💧',
      title: 'Reduce Irrigation',
      desc: `Moisture at ${moisture.toFixed(1)}% is slightly elevated. Reduce watering frequency.`,
      category: 'irrigation',
      severity: 'caution',
      param: 'moisture'
    });
    score -= 8;
  } else {
    recommendations.push({
      icon: '✅',
      title: 'Moisture Optimal',
      desc: `Moisture at ${moisture.toFixed(1)}% is within optimal range (30–70%). Maintain current schedule.`,
      category: 'irrigation',
      severity: 'ok',
      param: 'moisture'
    });
  }

  // ── pH Rules ──
  if (ph < 5.5) {
    recommendations.push({
      icon: '🧪',
      title: 'Highly Acidic Soil',
      desc: `pH at ${ph.toFixed(1)} is highly acidic. Apply agricultural lime (CaCO₃) at 2–4 tonnes/hectare to raise pH.`,
      category: 'soil-treatment',
      severity: 'urgent',
      param: 'ph'
    });
    score -= 25;
  } else if (ph < 6.0) {
    recommendations.push({
      icon: '⚗️',
      title: 'Acidic Soil — Add Lime',
      desc: `pH at ${ph.toFixed(1)} is slightly acidic. Apply lime to raise pH to the 6.0–8.0 range for optimal nutrient uptake.`,
      category: 'soil-treatment',
      severity: 'caution',
      param: 'ph'
    });
    score -= 12;
  } else if (ph > 8.5) {
    recommendations.push({
      icon: '🌿',
      title: 'Highly Alkaline Soil',
      desc: `pH at ${ph.toFixed(1)} is highly alkaline. Apply sulfur or acidifying fertilizers to lower pH and unlock nutrients.`,
      category: 'soil-treatment',
      severity: 'urgent',
      param: 'ph'
    });
    score -= 25;
  } else if (ph > 8.0) {
    recommendations.push({
      icon: '⚗️',
      title: 'Alkaline Soil — Add Compost',
      desc: `pH at ${ph.toFixed(1)} is slightly alkaline. Apply organic compost to gradually lower pH.`,
      category: 'soil-treatment',
      severity: 'caution',
      param: 'ph'
    });
    score -= 10;
  } else {
    recommendations.push({
      icon: '✅',
      title: 'pH Balanced',
      desc: `pH at ${ph.toFixed(1)} is ideal (6.0–8.0). Nutrients are well-available to plant roots.`,
      category: 'soil-treatment',
      severity: 'ok',
      param: 'ph'
    });
  }

  // ── Temperature Rules ──
  if (temperature > 40) {
    recommendations.push({
      icon: '🔥',
      title: 'Critical Heat Stress',
      desc: `Soil temperature at ${temperature.toFixed(1)}°C is dangerously high. Increase watering frequency and consider mulching.`,
      category: 'temperature',
      severity: 'urgent',
      param: 'temperature'
    });
    score -= 20;
  } else if (temperature > 35) {
    recommendations.push({
      icon: '🌡️',
      title: 'High Temperature',
      desc: `Soil temperature at ${temperature.toFixed(1)}°C is elevated. Increase watering to cool soil and reduce evaporation.`,
      category: 'temperature',
      severity: 'caution',
      param: 'temperature'
    });
    score -= 10;
  } else if (temperature < 10) {
    recommendations.push({
      icon: '❄️',
      title: 'Low Soil Temperature',
      desc: `Soil temperature at ${temperature.toFixed(1)}°C may slow germination. Consider waiting for warmer conditions before sowing.`,
      category: 'temperature',
      severity: 'caution',
      param: 'temperature'
    });
    score -= 8;
  } else {
    recommendations.push({
      icon: '✅',
      title: 'Temperature Normal',
      desc: `Soil temperature at ${temperature.toFixed(1)}°C is within normal range (10–35°C). Good for plant growth.`,
      category: 'temperature',
      severity: 'ok',
      param: 'temperature'
    });
  }

  // ── EC (Nutrient) Rules ──
  if (ec < 0.5) {
    recommendations.push({
      icon: '🌱',
      title: 'Critical Nutrient Deficiency',
      desc: `EC at ${ec.toFixed(2)} dS/m is very low. Apply balanced NPK fertilizer immediately to restore nutrient levels.`,
      category: 'nutrients',
      severity: 'urgent',
      param: 'ec'
    });
    score -= 25;
  } else if (ec < 1.0) {
    recommendations.push({
      icon: '⚡',
      title: 'Low Nutrients — Fertilize',
      desc: `EC at ${ec.toFixed(2)} dS/m indicates low nutrient availability. Apply nitrogen-rich fertilizer or compost.`,
      category: 'nutrients',
      severity: 'caution',
      param: 'ec'
    });
    score -= 12;
  } else if (ec > 3.0) {
    recommendations.push({
      icon: '⚡',
      title: 'High Salinity Alert',
      desc: `EC at ${ec.toFixed(2)} dS/m is elevated, indicating high salt levels. Leach soil with excess water to reduce salinity.`,
      category: 'nutrients',
      severity: 'caution',
      param: 'ec'
    });
    score -= 15;
  } else {
    recommendations.push({
      icon: '✅',
      title: 'Nutrients Sufficient',
      desc: `EC at ${ec.toFixed(2)} dS/m shows adequate nutrient levels. No fertilization needed at this time.`,
      category: 'nutrients',
      severity: 'ok',
      param: 'ec'
    });
  }

  // ── Sowing Recommendation ──
  const goodForSowing = moisture >= 30 && moisture <= 65
    && temperature >= 15 && temperature <= 32
    && ph >= 6.0 && ph <= 7.5
    && ec >= 0.8;

  if (goodForSowing) {
    recommendations.push({
      icon: '🌾',
      title: 'Ready for Sowing',
      desc: 'All soil parameters are within optimal sowing range. Excellent time to plant seeds or transplant seedlings.',
      category: 'sowing',
      severity: 'ok',
      param: 'general'
    });
  }

  const profile = cropProfiles[crop];
  if (profile) {
    const cropAligned = moisture >= profile.moisture[0] && moisture <= profile.moisture[1]
      && temperature >= profile.temperature[0] && temperature <= profile.temperature[1]
      && ph >= profile.ph[0] && ph <= profile.ph[1]
      && ec >= profile.ec[0] && ec <= profile.ec[1];

    if (cropAligned) {
      recommendations.push({
        icon: '🌿',
        title: `${crop} conditions are aligned`,
        desc: `Current soil readings match the target range for ${crop}. Continue your current care plan.`,
        category: 'crop',
        severity: 'ok',
        param: 'crop'
      });
      score += 5;
    } else {
      recommendations.push({
        icon: '📌',
        title: `${crop}-specific guidance`,
        desc: `Soil values are not fully aligned with ${crop} targets. Review the recommendation list and adjust irrigation, pH, or fertilization accordingly.`,
        category: 'crop',
        severity: 'caution',
        param: 'crop'
      });
      score -= 5;
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    recommendations,
    score,
    scoreLabel: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
    raw,
    crop,
    timestamp: new Date().toISOString()
  };
}

// ── Soil Score per parameter ───────────────
function paramScore(param, value) {
  const ranges = {
    moisture:    { min: 30, max: 70, hard_min: 0, hard_max: 100 },
    temperature: { min: 15, max: 35, hard_min: 0, hard_max: 60 },
    ph:          { min: 6, max: 8,   hard_min: 0, hard_max: 14 },
    ec:          { min: 1, max: 3,   hard_min: 0, hard_max: 10 }
  };
  const r = ranges[param];
  if (!r) return 50;
  if (value >= r.min && value <= r.max) return 100;
  const dist = value < r.min
    ? (r.min - value) / (r.min - r.hard_min)
    : (value - r.max) / (r.hard_max - r.max);
  return Math.max(0, Math.round((1 - dist) * 100));
}

// ── Status helper ──────────────────────────
function getStatus(param, value) {
  const s = paramScore(param, value);
  if (s >= 80) return { label: 'Optimal', cls: 'status-ok' };
  if (s >= 50) return { label: 'Caution', cls: 'status-warn' };
  return { label: 'Alert',   cls: 'status-bad' };
}

// ── localStorage helpers ───────────────────
function saveSession(result) {
  const history = getHistory();
  history.push(result);
  localStorage.setItem('agrovox_history', JSON.stringify(history));
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('agrovox_history') || '[]');
  } catch { return []; }
}

function getLastResult() {
  try {
    return JSON.parse(sessionStorage.getItem('agrovox_result') || 'null');
  } catch { return null; }
}

// ── Landing page: Analyze & redirect ──────
function analyzeAndGo() {
  const moisture    = parseFloat(document.getElementById('moisture')?.value);
  const temperature = parseFloat(document.getElementById('temp')?.value);
  const ph          = parseFloat(document.getElementById('ph')?.value);
  const ec          = parseFloat(document.getElementById('ec')?.value);

  const crop = document.getElementById('crop')?.value;
  if (!crop) {
    alert('Please select a crop type before analyzing.');
    return;
  }

  if ([moisture, temperature, ph, ec].some(isNaN)) {
    alert('Please fill in all four sensor readings before analyzing.');
    return;
  }

  // Simulate MA filter (5-point — previous 4 values are defaults near reading)
  const maFilter = new MovingAverageFilter(5);
  for (let i = 0; i < 4; i++) {
    maFilter.filterAll({ moisture, temperature, ph, ec });
  }
  const filtered = maFilter.filterAll({ moisture, temperature, ph, ec });

  // Animate MA bars
  animateMABars(filtered);

  const result = analyzeData({
    moisture:    filtered.moisture,
    temperature: filtered.temperature,
    ph:          filtered.ph,
    ec:          filtered.ec
  }, crop);

  // Save to sessionStorage (for dashboard) and history
  sessionStorage.setItem('agrovox_result', JSON.stringify(result));
  saveSession(result);

  // Navigate after short delay for animation effect
  setTimeout(() => {
    window.location.href = 'pages/dashboard.html';
  }, 700);
}

function animateMABars(filtered) {
  const bars = document.querySelectorAll('.ma-bar');
  if (!bars.length) return;
  const values = [
    filtered.moisture / 100,
    filtered.temperature / 60,
    filtered.ph / 14,
    filtered.ec / 5,
    0.65
  ];
  bars.forEach((b, i) => {
    b.style.height = Math.max(10, Math.round(values[i] * 100)) + '%';
  });
}

// ── Voice Advisory ─────────────────────────
function speakRecommendations() {
  if (!('speechSynthesis' in window)) {
    alert('Voice advisory not supported in this browser. Try Chrome or Edge.');
    return;
  }

  const result = getLastResult();
  if (!result) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      'No soil data available. Please run an analysis first.'
    );
    u.volume = 1.0;
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
    return;
  }

  window.speechSynthesis.cancel();

  const btn = document.getElementById('voiceBtn');
  if (btn) btn.classList.add('speaking');

  const score = result.score;
  const r = result.raw;
  const langSelect = document.getElementById('voiceLang');
  const lang = langSelect ? langSelect.value : 'en-US';
  
  let text;
  if (lang === 'ta-IN') {
    // Tamil
    text = `அக்ரோவாக்ஸ் மண் ஆலோசனை. மொத்த மண் மதிப்பு ${score} 100க்கு சமம். `;
    result.recommendations.forEach(rec => {
      text += `${rec.title}. ${rec.desc} `;
    });
  } else if (lang === 'hi-IN') {
    // Hindi
    text = `एग्रोवॉक्स मिट्टी सलाह। कुल मिट्टी स्कोर ${score} में से 100 है। `;
    result.recommendations.forEach(rec => {
      text += `${rec.title}. ${rec.desc} `;
    });
  } else if (lang === 'ml-IN') {
    // Malayalam
    text = `എഗ്രോവോക്സ് മണ്ണ് ഉപദേശം. മൊത്തം മണ്ണ് സ്കോർ ${score} 100 ൽ നിന്ന്. `;
    result.recommendations.forEach(rec => {
      text += `${rec.title}. ${rec.desc} `;
    });
  } else if (lang === 'te-IN') {
    // Telugu
    text = `ఆగ్రోవాక్స్ నేల సలహా. మొత్తం నేల స్కోర్ ${score} 100 లో నుండి. `;
    result.recommendations.forEach(rec => {
      text += `${rec.title}. ${rec.desc} `;
    });
  } else if (lang === 'ja-JP') {
    // Japanese
    text = `AgroVox土壌アドバイス。全体的な土壌スコアは100点中${score}点です。 `;
    result.recommendations.forEach(rec => {
      text += `${rec.title}. ${rec.desc} `;
    });
  } else if (lang === 'de-DE') {
    // German
    text = `AgroVox Bodenberatung. Die Gesamtbodenpunktzahl beträgt ${score} von 100. `;
    result.recommendations.forEach(rec => {
      text += `${rec.title}. ${rec.desc} `;
    });
  } else if (lang === 'fr-FR') {
    // French
    text = `Conseil d'AgroVox sur les sols. Le score total du sol est ${score} sur 100. `;
    result.recommendations.forEach(rec => {
      text += `${rec.title}. ${rec.desc} `;
    });
  } else {
    // English (default)
    text = `AgroVox Soil Advisory. Overall soil score is ${score} out of 100. `;
    result.recommendations.forEach(rec => {
      text += `${rec.title}. ${rec.desc} `;
    });
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate  = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.lang  = lang;
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event.error);
    if (btn) btn.classList.remove('speaking');
  };
  
  utterance.onend = () => {
    if (btn) btn.classList.remove('speaking');
  };
  
  window.speechSynthesis.speak(utterance);
}

// ── PDF Export ─────────────────────────────
function generatePDF() {
  const result = getLastResult();
  if (!result) { alert('No analysis data to export.'); return; }

  const { raw, score, scoreLabel, recommendations, timestamp, crop } = result;
  const date = new Date(timestamp).toLocaleString();

  const content = `
AGROVOX SMART PROBE — SOIL ANALYSIS REPORT
==========================================
Date: ${date}
Crop: ${crop || 'Generic'}
Overall Soil Score: ${score}/100 (${scoreLabel})

SENSOR READINGS (MA-Filtered)
------------------------------
Soil Moisture:      ${raw.moisture.toFixed(2)} %
Temperature:        ${raw.temperature.toFixed(2)} °C
pH Level:           ${raw.ph.toFixed(2)}
Elec. Conductivity: ${raw.ec.toFixed(3)} dS/m

AI RECOMMENDATIONS
------------------
${recommendations.map((r, i) =>
  `${i+1}. [${r.severity.toUpperCase()}] ${r.title}\n   ${r.desc}`
).join('\n\n')}

==========================================
Generated by AgroVox Smart Probe Prototype
M. Kumarasamy College of Engineering — CSBS
AgroVox uses Moving Average Filtering + Rule-Based AI Engine
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `AgroVox_Report_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CSV Export ─────────────────────────────
function exportCSV() {
  const history = getHistory();
  if (!history.length) { alert('No history to export.'); return; }

  const headers = ['Timestamp','Moisture%','Temp°C','pH','EC_dSm','Score','ScoreLabel'];
  const rows = history.map(h => [
    h.timestamp,
    h.raw.moisture.toFixed(2),
    h.raw.temperature.toFixed(2),
    h.raw.ph.toFixed(2),
    h.raw.ec.toFixed(3),
    h.score,
    h.scoreLabel
  ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `AgroVox_History_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearHistory() {
  if (confirm('Clear all history? This cannot be undone.')) {
    localStorage.removeItem('agrovox_history');
    location.reload();
  }
}
