/* ================================================
   upcoming-shifts.js
   ניהול משמרות קרובות והיסטוריה (מותאם אוטומטית למשפחה/בייביסיטר)
   ================================================ */

const API_URL = 'https://babysitter-server-dc0e.onrender.com';
let currentUserRole = ''; 
let currentUserId = ''; 
let shiftToCancelId = null;

document.addEventListener('DOMContentLoaded', initShiftsPage);

function fmtDateTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL') + ' | ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

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

async function initShiftsPage() {
  const token = localStorage.getItem('token');
  
  if (!token) return; // ה-auth.js כבר יזרוק להתחברות

  try {
    // משיכת תפקיד המשתמש (כדי לדעת את מי להציג בכרטיסייה)
    const userRes = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const userData = await userRes.json();
    
    if (userData.success && userData.data) {
      currentUserRole = userData.data.role;
      currentUserId = userData.data._id || userData.data.id;
    }

    await loadAllShifts(token);

  } catch (err) {
    console.error('שגיאה באתחול:', err);
    renderErrorMsg('שגיאה בטעינת הנתונים');
  }
}

async function loadAllShifts(token) {
  try {
    const res = await fetch(`${API_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);

    const shifts = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);

    // סינון לקטגוריות
    const pendingShifts = shifts.filter(s => s.status === 'requested');
    const upcomingShifts = shifts.filter(s => s.status === 'approved' || s.status === 'confirmed');
    const completedShifts = shifts.filter(s => s.status === 'completed');

    // עדכון המונים באקורדיונים
    const pendingCount = document.getElementById('pendingCount');
    if (pendingCount) pendingCount.textContent = pendingShifts.length;
    
    document.getElementById('upcomingCount').textContent = upcomingShifts.length;
    document.getElementById('completedCount').textContent = completedShifts.length;

    renderList('pendingList', pendingShifts, 'pending');
    renderList('upcomingList', upcomingShifts, 'upcoming');
    renderList('completedList', completedShifts, 'completed');

  } catch (err) {
    console.error('שגיאה במשיכת משמרות:', err);
    renderErrorMsg('שגיאה בשליפת המשמרות');
  }
}

function renderList(containerId, shiftsArray, listType) {
  const listEl = document.getElementById(containerId);
  if (!listEl) return;
  
  if (shiftsArray.length === 0) {
    listEl.innerHTML = '<div class="empty-state">אין משמרות בקטגוריה זו.</div>';
    return;
  }

  listEl.innerHTML = shiftsArray.map(b => {
    const bookingId = b._id || b.id;
    
    // מי מופיע מולנו בכרטיסייה?
    let otherPartyName = 'משתמש לא ידוע';
    let otherPartyImg = 'images/default-avatar.png';

    if (currentUserRole === 'family' && b.sitter) {
      otherPartyName = b.sitter.name;
      otherPartyImg = b.sitter.img || otherPartyImg;
    } else if (currentUserRole === 'sitter' && b.family) {
      otherPartyName = b.family.name;
      otherPartyImg = b.family.img || otherPartyImg;
    }

    let buttonsHtml = '';
    
    // קביעת כפתורים
    if (listType === 'pending' && currentUserRole === 'family') {
      // למשפחה מותר לבטל בקשה שנשלחה
      buttonsHtml = `<button class="btn-cancel" onclick="openConfirmModal('${bookingId}')">ביטול בקשה</button>`;
    } 
    else if (listType === 'upcoming') {
      if (currentUserRole === 'family') {
        buttonsHtml = `<button class="btn-cancel" onclick="openConfirmModal('${bookingId}')">ביטול משמרת</button>`;
      } else if (currentUserRole === 'sitter') {
        // בייביסיטר מקבלת כפתור התחלת משמרת
        buttonsHtml = `
          <button class="btn-submit" onclick="tryStartShift('${bookingId}', '${b.scheduledStart}')" style="margin-bottom: 5px;">התחלי משמרת</button>
          <button class="btn-cancel" onclick="openConfirmModal('${bookingId}')">ביטול משמרת</button>
          <div id="err-${bookingId}" style="display:none; color: #d32f2f; font-size: 13px; margin-top: 5px; font-weight: bold;"></div>
        `;
      }
    }

    return `
      <div class="shift-item">
        <div class="shift-header">
          <div class="sitter-info">
            <img src="${otherPartyImg}" onerror="this.src='https://i.pravatar.cc/150?img=1'">
            <span>${otherPartyName}</span>
          </div>
          <span class="shift-rate">₪${b.rate || 0}/שעה</span>
        </div>
        
        <div class="shift-times">
          <div><strong>התחלה:</strong> ${fmtDateTime(b.scheduledStart)}</div>
          <div><strong>סיום:</strong> ${fmtDateTime(b.scheduledEnd)}</div>
        </div>
        
        <div class="shift-actions" style="${buttonsHtml ? 'margin-top: 15px;' : ''}">
          ${buttonsHtml}
        </div>
      </div>
    `;
  }).join('');
}

/* ── מודאל ביטולים מותאם (בלי confirm) ── */
function openConfirmModal(bookingId) {
  shiftToCancelId = bookingId;
  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmModal() {
  shiftToCancelId = null;
  document.getElementById('confirmModal').classList.remove('show');
}

async function executeCancel() {
  // 1. קודם שומרים את ה-ID בצד לפני שסוגרים את המודאל!
  const idToCancel = shiftToCancelId; 
  
  // 2. עכשיו אפשר לסגור את המודאל בבטחה (זה יאפס את המשתנה המקורי, אבל שלנו שמור)
  closeConfirmModal(); 
  
  // 3. בודקים את המשתנה השמור
  if (!idToCancel) return; 
  
  try {
    const token = localStorage.getItem('token');
    
  // 4. משתמשים במשתנה השמור בתוך ה-fetch
    const res = await fetch(`${API_URL}/api/bookings/${idToCancel}`, { 
      method: 'PUT', // שינינו ל-PUT
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' // הוספנו את זה כדי שהשרת ידע לקרוא את הסטטוס
      },
      body: JSON.stringify({ status: 'canceled' }) // העדכון שמשנה את הסטטוס למבוטל!
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    
    showToast('✅ המשמרת בוטלה בהצלחה');
    initShiftsPage(); // רענון הרשימה כדי להעלים את המשמרת שבוטלה
    
  } catch (err) {
    console.error('שגיאה בביטול:', err);
    showToast('❌ שגיאה בביטול: ' + err.message);
  }
}

/* ── ניסיון התחלת משמרת לבייביסיטר ── */
function tryStartShift(bookingId, scheduledStartIso) {
  const errMsgEl = document.getElementById(`err-${bookingId}`);
  if(errMsgEl) errMsgEl.style.display = 'none';

  const now = new Date();
  const scheduledTime = new Date(scheduledStartIso);

  // בודקים שאנחנו באותו היום
  const isSameDay = now.getFullYear() === scheduledTime.getFullYear() &&
                    now.getMonth() === scheduledTime.getMonth() &&
                    now.getDate() === scheduledTime.getDate();

  if (!isSameDay) {
    errMsgEl.innerHTML = '❌ לא ניתן להתחיל משמרת ביום אחר.';
    errMsgEl.style.display = 'block';
    return;
  }

  const diffMinutes = (now.getTime() - scheduledTime.getTime()) / 60000;

  if (diffMinutes < -30) {
    errMsgEl.innerHTML = '❌ מוקדם מדי! חכי לחצי שעה לפני הזמן.';
    errMsgEl.style.display = 'block';
    return;
  }

  // הכל תקין - שומרים נתונים ועוברים למסך המשמרת הפעילה
  localStorage.setItem('currentSitterId', bookingId);
  localStorage.setItem('actualStartTime', now.toISOString());
  window.location.href = 'active-shift.html';
}

/* ── פונקציות עזר ── */
function renderErrorMsg(msg) {
  const html = `<div class="empty-state" style="color: #d32f2f; font-weight: bold;">${msg}</div>`;
  const pList = document.getElementById('pendingList');
  if (pList) pList.innerHTML = html;
  document.getElementById('upcomingList').innerHTML = html;
  document.getElementById('completedList').innerHTML = html;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show-toast');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.classList.remove('show-toast'), 2500);
}