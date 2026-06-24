/* ================================================
   upcoming-shifts.js
   חיבור לדאטה-בייס (MongoDB דרך Node.js)
   ================================================ */

// מקבעים את הכתובת לשרת המקומי שלך (פורט 3000)
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', loadUpcomingShifts);

// פונקציית עזר לסידור התאריך והשעה
function fmtDateTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL') + ' | ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

/* ================================================
   1. משיכת נתונים מהדאטה-בייס
   ================================================ */
async function loadUpcomingShifts() {
  const listEl = document.getElementById('shiftsList');
  
  try {
    // משיכת הטוקן כדי שהשרת ידע מי המשפחה המחוברת
    const token = localStorage.getItem('token');
    if (!token) {
      listEl.innerHTML = '<div class="empty-state" style="color: #d32f2f;">אינך מחוברת. אנא התחברי למערכת.</div>';
      return;
    }

    console.log('מתחבר לשרת בכתובת:', `${API_URL}/api/bookings`); // הדפסה לבדיקה
    
    // קריאה לנתיב ההזמנות בשרת (שימי לב שזה תואם ל-Route שיצרת ב-Node)
    const res = await fetch(`${API_URL}/api/bookings`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await res.json();
    
    // מדפיס את מה שחזר מהדאטה-בייס לקונסול כדי שתוכלי לראות (F12)
    console.log('נתונים שהתקבלו מה-DB:', data); 
    
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'השרת החזיר שגיאה בטעינת הנתונים');
    }

    // מוודא שהנתונים הם מערך כדי שנוכל לצייר אותם
    let shifts = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);

    if (shifts.length === 0) {
      listEl.innerHTML = '<div class="empty-state">אין לך משמרות מתוכננות כרגע.</div>';
      return;
    }

    // ציור הנתונים למסך
    listEl.innerHTML = shifts.map(b => {
      const s = b.sitter || {};
      // תמיכה ב-MongoDB שמשתמש ב-_id במקום id
      const bookingId = b._id || b.id; 
      
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
          
          <button class="btn-submit" onclick="tryStartShift('${bookingId}', '${b.scheduledStart}')">
            התחל משמרת
          </button>
          
          <button class="btn-cancel" onclick="cancelShift('${bookingId}')">
            ביטול משמרת
          </button>
          
          <div id="err-${bookingId}" class="time-error"></div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('שגיאת צד לקוח:', err);
    listEl.innerHTML = `<div class="empty-state" style="color: #d32f2f;">
      <b>שגיאה בחיבור לדאטה-בייס:</b><br>${err.message}
    </div>`;
  }
}

/* ================================================
   2. התחלת משמרת (ולידציית זמנים)
   ================================================ */
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

  if (diffMinutes > 180) {
     errMsgEl.innerHTML = '❌ עבר זמן רב משעת ההתחלה. אימות נדרש.';
     errMsgEl.style.display = 'block';
     return;
  }

  // שמירת שעת ההתחלה ומעבר לדף המשמרת הפעילה
  localStorage.setItem('actualStartTime', now.toISOString());
  window.location.href = 'active-shift.html';
}

/* ================================================
   3. ביטול משמרת (מחיקה מה-DB)
   ================================================ */
async function cancelShift(bookingId) {
  if (!confirm('האם את בטוחה שברצונך לבטל את המשמרת? פעולה זו אינה הפיכה.')) return;
  
  try {
    const token = localStorage.getItem('token');
    
    // קריאה לנתיב המחיקה בשרת
    const res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'שגיאה במחיקת הנתונים');
    
    // מרענן את הרשימה אחרי מחיקה מוצלחת
    loadUpcomingShifts();
    
  } catch (err) {
    alert('שגיאה בביטול: ' + err.message);
  }
}