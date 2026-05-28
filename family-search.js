/* ================================================
   family-search.js
   טוען בייביסיטרים מ-JSON ומציג אותם על מפה ורשימה
   תומך בסינון לפי מחיר ושם
   ================================================ */

let selId = null;
let map;
let markers = {};
let sitters = [];

/* -- טעינת נתוני הבייביסיטרים מ-JSON -- */
fetch('../data/sitters.json')
  .then(res => res.json())
  .then(data => {
    sitters = data;
    initMap();
    refresh();
  })
  .catch(() => {
    /* fallback אם fetch לא עובד מקובץ מקומי */
    sitters = [
      { id:1, name:"דנה",   age:24, rate:60, exp:5,   rating:4.9, hood:"רמת הדר",   lat:32.076, lng:34.798, img:"https://i.pravatar.cc/300?img=47" },
      { id:2, name:"אור",   age:21, rate:70, exp:4,   rating:4.0, hood:"הוד השרון", lat:32.151, lng:34.896, img:"https://i.pravatar.cc/300?img=45" },
      { id:3, name:"דניאל", age:23, rate:50, exp:2.5, rating:3.8, hood:"רמת מנחם", lat:32.089, lng:34.851, img:"https://i.pravatar.cc/300?img=48" },
      { id:4, name:"מוטי",  age:19, rate:65, exp:3,   rating:3.2, hood:"יד אליהו",  lat:32.058, lng:34.812, img:"https://i.pravatar.cc/300?img=12" },
      { id:5, name:"מיכל",  age:26, rate:55, exp:6,   rating:4.5, hood:"גבעתיים",  lat:32.068, lng:34.808, img:"https://i.pravatar.cc/300?img=49" }
    ];
    initMap();
    refresh();
  });

/* -- אתחול מפת Leaflet -- */
function initMap() {
  map = L.map('map').setView([32.09, 34.84], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);
  setTimeout(() => map.invalidateSize(), 100);
}

/* -- סינון הבייביסיטרים לפי חיפוש ומחיר -- */
function getFiltered() {
  const q    = document.getElementById('searchInput').value.trim();
  const maxP = document.getElementById('priceFilter').value;
  return sitters.filter(s => {
    if (maxP !== 'all' && s.rate > parseInt(maxP)) return false;
    if (q && !s.name.includes(q) && !s.hood.includes(q)) return false;
    return true;
  });
}

/* -- רינדור כרטיסי בייביסיטרים -- */
function renderCards(arr) {
  document.getElementById('countEl').textContent = arr.length + ' תוצאות';
  document.getElementById('cardsList').innerHTML = arr.map(s => `
    <div class="sc ${selId === s.id ? 'sel' : ''}" onclick="select(${s.id})">
      <img class="sc-img" src="${s.img}" alt="${s.name}"
           onerror="this.src='https://i.pravatar.cc/300?img=${s.id}'">
      <div class="sc-info">
        <div class="sc-name">${s.name}</div>
        <div class="sc-meta">בת ${s.age} · ${s.exp} שנות ניסיון<br>${s.hood}</div>
        <div class="sc-stars">${'★'.repeat(Math.round(s.rating))}${'☆'.repeat(5 - Math.round(s.rating))} ${s.rating}</div>
        <div class="sc-rate">₪${s.rate}/שעה</div>
      </div>
    </div>`).join('');
}

/* -- רינדור pins על המפה -- */
function renderPins(arr) {
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};
  arr.forEach(s => {
    const isSel = selId === s.id;
    const icon = L.divIcon({
      className: '',
      html: `<div class="lpin ${isSel ? 'sel' : ''}" onclick="select(${s.id})">
               <img src="${s.img}" onerror="this.src='https://i.pravatar.cc/300?img=${s.id}'">
               <span>${s.name} ₪${s.rate}</span>
             </div>`,
      iconAnchor: [0, 40],
      iconSize: [null, null]
    });
    markers[s.id] = L.marker([s.lat, s.lng], { icon }).addTo(map);
  });
}

/* -- בחירת בייביסיטר -- */
function select(id) {
  selId = id;
  const s = sitters.find(x => x.id === id);
  map.flyTo([s.lat, s.lng], 14, { duration: 0.7 });
  refresh();
}

/* -- רענון כל התצוגה -- */
function refresh() {
  const arr = getFiltered();
  renderCards(arr);
  renderPins(arr);
}

/* -- Toast -- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}
