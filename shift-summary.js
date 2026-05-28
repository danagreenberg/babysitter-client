/* ================================================
   shift-summary.js
   טוען נתוני משמרת מ-JSON ומציג סיכום תשלום
   ================================================ */

/* -- טעינת נתוני המשמרת מ-JSON -- */
fetch('../data/shift.json')
  .then(res => res.json())
  .then(data => renderSummary(data))
  .catch(() => {
    /* fallback אם fetch לא עובד */
    renderSummary({
      sitterName: "דנה",
      sitterImg: "https://i.pravatar.cc/150?img=47",
      startTime: "9:00",
      endTime: "12:00",
      hours: 3,
      rate: 60,
      total: 180
    });
  });

/* -- רינדור הסיכום -- */
function renderSummary(data) {
  const img = document.getElementById('sitterImg');
  const name = document.getElementById('sitterName');
  const sub = document.getElementById('sitterSub');
  const start = document.getElementById('shiftStart');
  const end = document.getElementById('shiftEnd');
  const hours = document.getElementById('shiftHours');
  const rate = document.getElementById('shiftRate');
  const total = document.getElementById('shiftTotal');

  if (img)   img.src = data.sitterImg;
  if (name)  name.textContent = data.sitterName;
  if (sub)   sub.textContent  = `בייביסיטר עם ${data.sitterName}`;
  if (start) start.textContent = data.startTime;
  if (end)   end.textContent   = data.endTime;
  if (hours) hours.textContent = `${data.hours} שעות`;
  if (rate)  rate.textContent  = `₪${data.rate}/שעה`;
  if (total) total.textContent = `₪${data.total}`;
}

/* -- תשלום -- */
function pay(method) {
  showToast(`✅ מועבר לתשלום ב-${method}...`);
  console.log('תשלום:', { method });
}

function goNext() {
  showToast('⭐ מעבר לדירוג...');
}

/* -- Toast -- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}
