/* ================================================
   active-shift.js
   טיימר חי, מפה עם מיקום הבייביסיטר, סוללה
   ================================================ */

const shiftStart = new Date(Date.now() - (2 * 3600 + 15 * 60 + 29) * 1000);
let battery = 75;
let shiftMap;

/* -- אתחול -- */
window.addEventListener('load', () => {
  initShiftMap();
  startTimer();
  startBattery();
});

/* -- מפה -- */
function initShiftMap() {
  shiftMap = L.map('map', { zoomControl: true }).setView([32.0853, 34.8764], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }).addTo(shiftMap);

  /* Pin הבייביסיטר עם אנימציית pulse */
  const pinHtml = `
    <div style="position:relative;width:52px;height:52px;">
      <div class="pulse-ring"></div>
      <div class="sitter-map-pin">
        <img src="https://i.pravatar.cc/150?img=47" alt="דנה">
      </div>
    </div>`;

  L.marker([32.0853, 34.8764], {
    icon: L.divIcon({ className:'', html: pinHtml, iconSize:[52,52], iconAnchor:[26,26] })
  }).addTo(shiftMap).bindPopup('<b>דנה</b><br>מיקום נוכחי');

  /* נקודת הבית */
  L.marker([32.083, 34.872], {
    icon: L.divIcon({
      className: '',
      html: '<div style="background:#c4557a;border-radius:50%;width:14px;height:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);"></div>',
      iconSize: [14,14], iconAnchor: [7,7]
    })
  }).addTo(shiftMap).bindPopup('🏠 הבית שלך');
}

/* -- טיימר -- */
function startTimer() {
  function update() {
    const elapsed = Math.floor((Date.now() - shiftStart) / 1000);
    const h   = Math.floor(elapsed / 3600);
    const m   = Math.floor((elapsed % 3600) / 60);
    const sec = elapsed % 60;
    const el = document.getElementById('timerEl');
    if (el) el.textContent = `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }
  update();
  setInterval(update, 1000);
}

/* -- סוללה -- */
function startBattery() {
  setInterval(() => {
    battery = Math.max(0, battery - 0.02);
    const pct  = Math.round(battery);
    const fill = document.getElementById('batFill');
    const pctEl = document.getElementById('batPct');
    if (fill) {
      fill.style.width = pct + '%';
      fill.style.background = pct < 20
        ? 'linear-gradient(90deg,#ffb300,#f44336)'
        : 'linear-gradient(90deg,#e8a0bc,#c4557a)';
    }
    if (pctEl) pctEl.textContent = pct + '%';
  }, 3000);
}

/* -- סיום משמרת -- */
function endShift() {
  if (confirm('לסיים את המשמרת?')) {
    showToast('✅ המשמרת הסתיימה!');
    setTimeout(() => { window.location.href = 'shift-summary.html'; }, 1500);
  }
}

/* -- Toast -- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}
