/* ================================================
   active-shift.js
   טוען את המשמרת הפעילה מה-DB: מפה, טיימר, סוללה, סיום
   ================================================ */

const API_URL = 'http://localhost:3000';
let battery = 75;

window.addEventListener('load', init);

async function init() {
  startBattery();
  try {
    const res  = await fetch(`${API_URL}/api/bookings/current`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    setupShift(data.data);
  } catch (err) {
    console.error('shift error:', err);
    showToast('⚠️ שגיאה בטעינת המשמרת. ודא שהשרת פעיל על פורט 3000.');
    initMap(32.0853, 34.8764, null);
  }
}

function setupShift(b) {
  const s = b.sitter || {};
  initMap(s.lat || 32.0853, s.lng || 34.8764, s);
  startTimer(b.checkIn || b.scheduledStart);
}

/* -- מפה -- */
function initMap(lat, lng, sitter) {
  const map = L.map('map', { zoomControl: true }).setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }).addTo(map);

  if (sitter) {
    const pinHtml =
      '<div class="pin-wrap"><div class="pulse-ring"></div>' +
      '<div class="sitter-map-pin"><img src="' + (sitter.img || '') + '" alt="' + (sitter.name || '') + '" ' +
      'onerror="this.src=\'https://i.pravatar.cc/150?img=1\'"></div></div>';
    L.marker([lat, lng], {
      icon: L.divIcon({ className: '', html: pinHtml, iconSize: [52, 52], iconAnchor: [26, 26] })
    }).addTo(map).bindPopup('<b>' + (sitter.name || 'בייביסיטר') + '</b><br>מיקום נוכחי');
  }

  L.marker([lat + 0.002, lng + 0.003], {
    icon: L.divIcon({ className: '', html: '<div class="home-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
  }).addTo(map).bindPopup('🏠 הבית שלך');
}

/* -- טיימר (מבוסס זמן הצ'ק-אין מה-DB) -- */
function startTimer(startIso) {
  let base = new Date(startIso);
  const elapsed0 = (Date.now() - base.getTime()) / 1000;
  // fallback: אם הזמן לא תקין / עתידי / ישן מאוד — מתחילים מרגע הטעינה
  if (!isFinite(elapsed0) || elapsed0 < 0 || elapsed0 > 12 * 3600) base = new Date();

  const el = document.getElementById('timerDisplay');
  function update() {
    const e = Math.floor((Date.now() - base.getTime()) / 1000);
    const h = Math.floor(e / 3600);
    const m = Math.floor((e % 3600) / 60);
    const s = e % 60;
    if (el) el.textContent = h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  update();
  setInterval(update, 1000);
}

/* -- סוללה (סימולציה של מכשיר) -- */
function startBattery() {
  const fill  = document.getElementById('batteryFill');
  const pctEl = document.getElementById('batteryPct');
  if (fill) fill.style.width = Math.round(battery) + '%';
  setInterval(() => {
    battery = Math.max(0, battery - 0.02);
    const pct = Math.round(battery);
    if (fill) { fill.style.width = pct + '%'; fill.classList.toggle('low', pct < 20); }
    if (pctEl) pctEl.textContent = pct + '%';
  }, 3000);
}

/* -- סיום משמרת — מודאל במקום confirm() -- */
function endShift()   { document.getElementById('endModal').classList.add('show'); }
function closeModal() { document.getElementById('endModal').classList.remove('show'); }
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
