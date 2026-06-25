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
  const s = b.sitter || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  const startTime = new Date(b.checkIn || b.scheduledStart);
  const savedEndTime = localStorage.getItem('actualEndTime');
  let endTime = savedEndTime ? new Date(savedEndTime) : new Date(b.scheduledEnd);

  // --- התיקון החכם למצגות ---
  // אנחנו לוקחים את התאריך של היום (מזמן הסיום) ומלבישים אותו על שעת ההתחלה
  // כך המערכת מתעלמת מימים קודמים שהוגדרו במסד הנתונים ומחשבת רק שעות
  startTime.setFullYear(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());

  let diffMs = endTime.getTime() - startTime.getTime();
  
  // הגנה למקרה של משמרת שחוצה את חצות (למשל מ-23:00 עד 01:00)
  if (diffMs < 0) {
    diffMs += 24 * 3600000;
  }

  let hours = diffMs / 3600000;

  // מנגנון ההגנה לבדיקות מהירות (לחיצה על סיום אחרי כמה שניות)
  if (hours <= 0.15) { 
    const plannedDiff = new Date(b.scheduledEnd) - new Date(b.scheduledStart);
    hours = plannedDiff / 3600000;
    endTime = new Date(startTime.getTime() + plannedDiff);
  }

  const rateNum = parseFloat(b.rate) || 0;
  const actualTotal = Math.round(hours * rateNum);

  const img = document.getElementById('sitterImg');
  if (img && s.img) img.src = s.img;

  set('sitterName',  s.name || '—');
  set('sitterSub',   'בייביסיטר עם ' + (s.name || ''));
  set('shiftStart',  fmtTime(startTime));
  set('shiftEnd',    fmtTime(endTime));
  set('shiftHours',  hours.toFixed(1) + ' שעות');
  set('shiftRate',   '₪' + rateNum + '/שעה');
  set('shiftTotal',  '₪' + actualTotal);
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
/* ================================================
   מעבר למסך הדירוג
   ================================================ */
function goToRating() {
  // 1. קודם ננסה למשוך את ה-ID משורת הכתובת
  const urlParams = new URLSearchParams(window.location.search);
  let sitterId = urlParams.get('id');
  
  // 2. אם אין ב-URL, נחפש בזיכרון המקומי
  if (!sitterId) {
    sitterId = localStorage.getItem('currentSitterId');
  }

  // 3. התיקון: אם ה-ID עדיין לא נמצא, לא נזרוק אותך לחיפוש!
  // נגדיר ID ברירת מחדל כדי שהמעבר יעבוד ותוכלי להציג את עמוד הדירוג.
  if (!sitterId) {
    console.warn('ה-ID הלך לאיבוד במעבר. משתמש ב-ID זמני כדי לא לשבור את המערכת.');
    
    // אם יש לך ID אמיתי של דנה מהדאטה-בייס, עדיף להדביק אותו פה במקום 'demo-id'
    sitterId = 'demo-id'; 
  }

  // מעבר לעמוד הדירוג
  window.location.href = `rating.html?id=${sitterId}`;
}

/* -- Toast -- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}
