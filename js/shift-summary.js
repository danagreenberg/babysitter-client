/* ================================================
   shift-summary.js
   טוען את המשמרת הפעילה מה-DB ומציג סיכום ותשלום
   ================================================ */

const API_URL = 'http://localhost:3000';
let currentBooking = null;

document.addEventListener('DOMContentLoaded', loadSummary);

/* -- טעינה מהשרת -- */
async function loadSummary() {
  showState('loading');
  try {
    const res  = await fetch(`${API_URL}/api/bookings/current`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    currentBooking = data.data;
    render(currentBooking);
    showState('ready');
  } catch (err) {
    console.error('summary error:', err);
    showState('error');
  }
}

/* -- רינדור -- */
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function render(b) {
  const s     = b.sitter || {};
  const hours = Math.round((new Date(b.scheduledEnd) - new Date(b.scheduledStart)) / 3600000);
  const set   = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  const img = document.getElementById('sitterImg');
  if (img && s.img) img.src = s.img;

  set('sitterName',  s.name || '—');
  set('sitterSub',   'בייביסיטר עם ' + (s.name || ''));
  set('shiftStart',  fmtTime(b.scheduledStart));
  set('shiftEnd',    fmtTime(b.scheduledEnd));
  set('shiftHours',  hours + ' שעות');
  set('shiftRate',   '₪' + b.rate + '/שעה');
  set('shiftTotal',  '₪' + b.total);
}

/* -- תשלום -- */
function pay(method) { showToast('✅ מועבר לתשלום ב-' + method + '...'); }
function goNext()    { showToast('⭐ מעבר לדירוג...'); }

/* -- מצבי תצוגה: loading / error / ready -- */
function showState(state) {
  const ids = { loading: 'loadingState', error: 'errorState', ready: 'summaryCard' };
  Object.entries(ids).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', k !== state);
  });
}

/* -- Toast -- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}
