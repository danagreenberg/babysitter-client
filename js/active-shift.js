/* ================================================
   active-shift.js
   טיימר חי, מפה עם מיקום הבייביסיטר, סוללה, סיום משמרת
   ================================================ */

const shiftData = {
  sitterName: 'דנה',
  sitterImg:  'https://i.pravatar.cc/150?img=47',
  startTime:  new Date(Date.now() - (2 * 3600 + 15 * 60 + 29) * 1000),
  lat: 32.0853,
  lng: 34.8764,
  battery: 75
};

let battery = shiftData.battery;

window.addEventListener('load', () => {
  initMap();
  startTimer();
  startBattery();
});

/* -- מפה -- */
function initMap() {
  const map = L.map('map', { zoomControl: true }).setView([shiftData.lat, shiftData.lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }).addTo(map);

  const pinHtml =
    '<div class="pin-wrap"><div class="pulse-ring"></div>' +
    '<div class="sitter-map-pin"><img src="' + shiftData.sitterImg + '" alt="' + shiftData.sitterName + '" ' +
    'onerror="this.src=\'https://i.pravatar.cc/150?img=1\'"></div></div>';

  L.marker([shiftData.lat, shiftData.lng], {
    icon: L.divIcon({ className: '', html: pinHtml, iconSize: [52, 52], iconAnchor: [26, 26] })
  }).addTo(map).bindPopup('<b>' + shiftData.sitterName + '</b><br>מיקום נוכחי');

  L.marker([32.083, 34.872], {
    icon: L.divIcon({ className: '', html: '<div class="home-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
  }).addTo(map).bindPopup('🏠 הבית שלך');
}

/* -- טיימר -- */
function startTimer() {
  const el = document.getElementById('timerDisplay');
  function update() {
    const elapsed = Math.floor((Date.now() - shiftData.startTime) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (el) el.textContent = h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  update();
  setInterval(update, 1000);
}

/* -- סוללה -- */
function startBattery() {
  const fill  = document.getElementById('batteryFill');
  const pctEl = document.getElementById('batteryPct');
  if (fill) fill.style.width = Math.round(battery) + '%';

  setInterval(() => {
    battery = Math.max(0, battery - 0.02);
    const pct = Math.round(battery);
    if (fill) {
      fill.style.width = pct + '%';
      fill.classList.toggle('low', pct < 20);
    }
    if (pctEl) pctEl.textContent = pct + '%';
  }, 3000);
}

/* -- סיום משמרת — מודאל במקום confirm() -- */
function endShift()    { document.getElementById('endModal').classList.add('show'); }
function closeModal()  { document.getElementById('endModal').classList.remove('show'); }
function confirmEnd() {
  closeModal();
  showToast('✅ המשמרת הסתיימה! מעבר לסיכום...');
  setTimeout(() => { window.location.href = 'shift-summary.html'; }, 1600);
}

/* -- Toast -- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}
