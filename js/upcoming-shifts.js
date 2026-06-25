/* ================================================
   upcoming-shifts.js
   ניהול אקורדיון למשמרות (בקשות, קרובות, היסטוריה)
   ================================================ */

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', loadAllShifts);

function fmtDateTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL') + ' | ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

/* ── פתיחה/סגירה של האקורדיון ── */
function toggleAcc(contentId, btnElement) {
  const content = document.getElementById(contentId);
  const icon = btnElement.querySelector('.acc-icon');
  
  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    btnElement.classList.add('active');
    icon.textContent = '▲';
  } else {
    content.style.display = 'none';
    btnElement.classList.remove('active');
    icon.textContent = '▼';
  }
}

/* ── משיכת נתונים מהשרת וחלוקה לקטגוריות ── */
async function loadAllShifts() {
  const pendingEl = document.getElementById('pendingList');
  const upcomingEl = document.getElementById('upcomingList');
  const completedEl = document.getElementById('completedList');

  const token = localStorage.getItem('token');
  
  // טיפול במקרה של משתמש לא מחובר - הצגת שגיאה בכל התיקיות
  if (!token) {
    const loginMsg = '<div class="empty-state" style="color: #d32f2f; font-weight: bold;">אינך מחוברת. אנא התחברי כדי לראות את המשמרות.</div>';
    pendingEl.innerHTML = loginMsg;
    upcomingEl.innerHTML = loginMsg;
    completedEl.innerHTML = loginMsg;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'השרת החזיר שגיאה');

    const shifts = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);

    // פיצול המערך ל-3 קטגוריות לפי סטטוס
    const pendingShifts = shifts.filter(s => s.status === 'pending');
    const upcomingShifts = shifts.filter(s => s.status === 'approved' || s.status === 'confirmed' || !s.status);
    const completedShifts = shifts.filter(s => s.status === 'completed');

    // עדכון המספרים בכותרות האקורדיון
    document.getElementById('pendingCount').textContent = pendingShifts.length;
    document.getElementById('upcomingCount').textContent = upcomingShifts.length;
    document.getElementById('completedCount').textContent = completedShifts.length;

    // רינדור כל רשימה בנפרד
    renderList('pendingList', pendingShifts, 'pending');
    renderList('upcomingList', upcomingShifts, 'upcoming');
    renderList('completedList', completedShifts, 'completed');

  } catch (err) {
    console.error('שגיאה:', err);
    const errMsg = `<div class="empty-state" style="color: #d32f2f;">שגיאה: ${err.message}</div>`;
    pendingEl.innerHTML = errMsg;
    upcomingEl.innerHTML = errMsg;
    completedEl.innerHTML = errMsg;
  }
}

/* ── ציור הכרטיסיות (משתנה לפי סוג הקטגוריה) ── */
function renderList(containerId, shiftsArray, listType) {
  const listEl = document.getElementById(containerId);
  
  if (shiftsArray.length === 0) {
    listEl.innerHTML = '<div class="empty-state">אין משמרות בקטגוריה זו.</div>';
    return;
  }

  listEl.innerHTML = shiftsArray.map(b => {
    const s = b.sitter || {};
    const bookingId = b._id || b.id;
    
    // קביעת איזה כפתורים להציג לפי סוג הקטגוריה
    let buttonsHtml = '';
    
    if (listType === 'pending') {
      buttonsHtml = `
        <button class="btn-cancel" onclick="cancelShift('${bookingId}')">ביטול בקשה</button>
      `;
    } else if (listType === 'upcoming') {
      buttonsHtml = `
        <button class="btn-submit" onclick="tryStartShift('${bookingId}', '${b.scheduledStart}')">התחל משמרת</button>
        <button class="btn-cancel" onclick="cancelShift('${bookingId}')">ביטול משמרת</button>
        <div id="err-${bookingId}" class="time-error"></div>
      `;
    } else if (listType === 'completed') {
      // הסרנו את כפתור הדירוג מכאן, מציג רק מידע
      buttonsHtml = ''; 
    }

    return `
      <div class="shift-item">
        <div class="shift-header">
          <div class="sitter-info">
            <img src="${s.img || 'images/default-avatar.png'}" onerror="this.src='https://i.pravatar.cc/150?img=1'">
            <span>${s.name || 'בייביסיטר'}</span>
          </div>
          <span class="shift-rate">₪${b.rate || 0}/שעה</span>
        </div>
        
        <div class="shift-times">
          <div><strong>התחלה מתוכננת:</strong> ${fmtDateTime(b.scheduledStart)}</div>
          <div><strong>סיום משוער:</strong> ${fmtDateTime(b.scheduledEnd)}</div>
        </div>
        
        ${buttonsHtml}
      </div>
    `;
  }).join('');
}

/* ── פונקציות הכפתורים ── */

function tryStartShift(bookingId, scheduledStartIso) {
  const errMsgEl = document.getElementById(`err-${bookingId}`);
  if(errMsgEl) errMsgEl.style.display = 'none';

  const now = new Date();
  const scheduledTime = new Date(scheduledStartIso);

  const isSameDay = now.getFullYear() === scheduledTime.getFullYear() &&
                    now.getMonth() === scheduledTime.getMonth() &&
                    now.getDate() === scheduledTime.getDate();

  if (!isSameDay) {
    errMsgEl.innerHTML = '❌ לא ניתן להתחיל את המשמרת ביום אחר.';
    errMsgEl.style.display = 'block';
    return;
  }

  const diffMinutes = (now.getTime() - scheduledTime.getTime()) / 60000;

  if (diffMinutes < -30) {
    errMsgEl.innerHTML = '❌ מוקדם מדי! ניתן להתחיל רק כחצי שעה לפני הזמן.';
    errMsgEl.style.display = 'block';
    return;
  }

  localStorage.setItem('currentSitterId', bookingId);
  localStorage.setItem('actualStartTime', now.toISOString());
  window.location.href = 'active-shift.html';
}

async function cancelShift(bookingId) {
  if (!confirm('האם את בטוחה שברצונך לבטל? פעולה זו אינה הפיכה.')) return;
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    
    showToast('✅ הפעולה בוצעה בהצלחה');
    loadAllShifts(); // מרענן את המסך כולו
    
  } catch (err) {
    alert('שגיאה בביטול: ' + err.message);
  }
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.style.display = 'none', 2500);
}