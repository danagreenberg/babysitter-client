/* ================================================
   shift-summary.js
   מציג סיכום משמרת ותשלום
   ================================================ */

const shiftData = {
  sitterName: 'דנה',
  sitterImg:  'https://i.pravatar.cc/150?img=47',
  startTime:  '9:00',
  endTime:    '12:00',
  hours:      3,
  rate:       60,
  total:      180
};

document.addEventListener('DOMContentLoaded', () => renderSummary(shiftData));

function renderSummary(d) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('sitterSub',  'בייביסיטר עם ' + d.sitterName);
  set('shiftStart', d.startTime);
  set('shiftEnd',   d.endTime);
  set('shiftHours', d.hours + ' שעות');
  set('shiftRate',  '₪' + d.rate + '/שעה');
  set('shiftTotal', '₪' + d.total);
}

function pay(method) { showToast('✅ מועבר לתשלום ב-' + method + '...'); }
function goNext()    { showToast('⭐ מעבר לדירוג...'); }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}
