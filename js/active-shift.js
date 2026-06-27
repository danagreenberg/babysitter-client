/* ================================================
   active-shift.js
   טוען את המשמרת הפעילה מה-DB: מפה, טיימר, סוללה, סיום
   ================================================ */

const API_URL = 'https://babysitter-server-dc0e.onrender.com';
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
  startTimer();
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

/* -- טיימר חכם -- */
/* -- טיימר חכם (מעודכן: רץ *רק* אם נלחץ כפתור ההתחלה) -- */
function startTimer() {
  // מושך את שעת ההתחלה האמיתית מהזיכרון (שנשמרה בעמוד 'המשמרות שלי')
  const savedStartTime = localStorage.getItem('actualStartTime');
  const el = document.getElementById('timerDisplay');

  // אם אין שעת התחלה בזיכרון, סימן שלא לחצו "התחל משמרת"
  if (!savedStartTime) {
    if (el) el.textContent = '00:00:00';
    return; // עוצר את הפונקציה כאן - השעון לא יתחיל לרוץ!
  }

  const base = new Date(savedStartTime);
  
  function update() {
    const diffSeconds = Math.floor((Date.now() - base.getTime()) / 1000);
    if (diffSeconds < 0) return;
    
    const h = Math.floor(diffSeconds / 3600);
    const m = Math.floor((diffSeconds % 3600) / 60);
    const s = diffSeconds % 60;
    
    if (el) {
      el.textContent = h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
  }
  
  update();
  setInterval(update, 1000);
}

/* -- סיום משמרת ומעבר לסיכום (מעודכן: מאפס את הזיכרון) -- */
function confirmEnd() {
  closeModal();
  
  // 1. שומרים את שעת הסיום לטובת מסך הסיכום
  const exactEndTime = new Date().toISOString();
  localStorage.setItem('actualEndTime', exactEndTime);

  // 2. התיקון הקריטי: מוחקים את שעת ההתחלה!
  // ככה בפעם הבאה שייכנסו לעמוד הזה, השעון יחכה על 00:00:00
  localStorage.removeItem('actualStartTime');

  showToast('✅ המשמרת הסתיימה! מעבר לסיכום...');
  
  setTimeout(() => { 
    window.location.href = 'shift-summary.html'; 
  }, 1600);
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
  
  // 1. לוקחים את התאריך והשעה המדויקים של הרגע שבו לחצת על סיום
  const exactEndTime = new Date().toISOString();
  
  // 2. שומרים בזיכרון של הדפדפן כדי שדף הסיכום יוכל למשוך את זה
  localStorage.setItem('actualEndTime', exactEndTime);

  // 3. מציגים את ההתראה היפה (Toast)
  showToast('✅ המשמרת הסתיימה! מעבר לסיכום...');
  
  // 4. ממתינים שנייה וחצי כדי שההודעה תספיק להופיע, ואז עוברים עמוד
  setTimeout(() => { 
    window.location.href = 'shift-summary.html'; 
  }, 1600);
}

/* -- Toast -- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}
