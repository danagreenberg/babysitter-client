/* ================================================
   family-search.js
   טוען בייביסיטרים מהשרת ומציג על מפה ורשימה
   ================================================ */

const API_URL = 'http://localhost:3000';

let selId   = null;
let map;
let markers = {};
let sitters = [];

/* -- אתחול -- */
window.addEventListener('load', async () => {
  initMap();
  await loadSitters();
});

/* -- טעינת בייביסיטרים מהשרת -- */
async function loadSitters() {
  showLoading();

  try {
    const res  = await fetch(`${API_URL}/api/sitters`);
    const data = await res.json();

    if (!data.success) throw new Error(data.error);

    sitters = data.data;
    refresh();

  } catch (err) {
    showError('שגיאה בטעינת הנתונים. ודא שהשרת פועל על פורט 3000.');
    console.error('API error:', err);
  }
}

/* -- מפת Leaflet -- */
function initMap() {
  map = L.map('map').setView([32.09, 34.84], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);
  setTimeout(() => map.invalidateSize(), 100);
}

/* -- סינון לפי חיפוש ומחיר -- */
function getFiltered() {
  const q    = document.getElementById('searchInput').value.trim();
  const maxP = document.getElementById('priceFilter').value;

  return sitters.filter(s => {
    if (maxP !== 'all' && s.rate > parseInt(maxP)) return false;
    if (q && !s.name.includes(q) && !s.neighborhood.includes(q)) return false;
    return true;
  });
}

/* -- רינדור כרטיסים (לחיצה כאן תזיז את המפה) -- */
function renderCards(arr) {
  const countEl = document.getElementById('countEl');
  const listEl  = document.getElementById('cardsList');

  if (countEl) countEl.textContent = arr.length + ' תוצאות';

  if (arr.length === 0) {
    listEl.innerHTML = '<div style="padding:24px;text-align:center;color:#bbb;font-size:14px;">לא נמצאו בייביסיטרים</div>';
    return;
  }

  listEl.innerHTML = arr.map(s => {
    const sId = s.id || s._id;
    return `
    <div class="sc ${selId === sId ? 'sel' : ''}" onclick="select('${sId}')">
      <img class="sc-img" src="${s.img}" alt="${s.name}"
           onerror="this.src='https://i.pravatar.cc/300?img=1'">
      <div class="sc-info">
        <div class="sc-name">${s.name}
          ${s.verified ? '<span style="color:#3a8a50;font-size:11px;">✓ מאומת</span>' : ''}
        </div>
        <div class="sc-meta">בת ${s.age} · ${s.experience} שנות ניסיון<br>${s.neighborhood}</div>
        <div class="sc-stars">${'★'.repeat(Math.round(s.rating))}${'☆'.repeat(5 - Math.round(s.rating))} ${s.rating}</div>
        <div class="sc-rate">₪${s.rate}/שעה</div>
      </div>
    </div>`;
  }).join('');
}

/* -- רינדור פינים על המפה (לחיצה כאן תפתח את העמוד) -- */
function renderPins(arr) {
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};

  arr.forEach(s => {
    if (!s.lat || !s.lng) return;

    const sId = s.id || s._id;
    const isSel = selId === sId;
    const icon  = L.divIcon({
      className: '',
      html: `<div class="lpin ${isSel ? 'sel' : ''}" onclick="goToProfile('${sId}')">
               <img src="${s.img}" onerror="this.src='https://i.pravatar.cc/300?img=1'">
               <span>${s.name} ₪${s.rate}</span>
             </div>`,
      iconAnchor: [0, 40],
      iconSize:   [null, null]
    });

    markers[sId] = L.marker([s.lat, s.lng], { icon }).addTo(map);
  });
}

/* -- פונקציה 1: בחירת בייביסיטר מהרשימה (ממרכז את המפה) -- */
function select(id) {
  selId = id;
  const s = sitters.find(x => (x.id === id || x._id === id));
  if (s?.lat && s?.lng) map.flyTo([s.lat, s.lng], 14, { duration: 0.7 });
  refresh();
}

/* -- פונקציה 2: בחירת בייביסיטר מהמפה (עובר עמוד) -- */
function goToProfile(id) {
  window.location.href = `sitter-profile.html?id=${id}`;
}

/* -- רענון תצוגה -- */
function refresh() {
  const arr = getFiltered();
  renderCards(arr);
  renderPins(arr);
}

/* -- Loading state -- */
function showLoading() {
  const listEl = document.getElementById('cardsList');
  if (listEl) listEl.innerHTML = `
    <div style="padding:24px;text-align:center;color:#bbb;">
      <div style="font-size:28px;margin-bottom:8px;">⏳</div>
      <div style="font-size:14px;">טוען בייביסיטרים...</div>
    </div>`;
}

/* -- Error state -- */
function showError(msg) {
  const listEl = document.getElementById('cardsList');
  if (listEl) listEl.innerHTML = `
    <div style="padding:24px;text-align:center;color:#d06060;">
      <div style="font-size:28px;margin-bottom:8px;">⚠️</div>
      <div style="font-size:14px;">${msg}</div>
    </div>`;
}

/* -- Toast -- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}