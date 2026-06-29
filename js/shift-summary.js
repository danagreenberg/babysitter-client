/* ================================================
   shift-summary.js
   חישוב זמן משמרת, תשלום דינמי, ונעילת המסך ללא CSS פנימי
   ================================================ */

const API_URL = 'https://babysitter-server-dc0e.onrender.com';

document.addEventListener('DOMContentLoaded', loadSummaryData);

async function loadSummaryData() {
  // המשתנה הזה בעצם מכיל את ה-ID של ההזמנה (Booking)
  const bookingId = localStorage.getItem('currentSitterId'); 
  const startTimeIso = localStorage.getItem('actualStartTime');
  const endTimeIso = localStorage.getItem('actualEndTime');

  const summaryContent = document.getElementById('summaryContent');
  const emptySummary = document.getElementById('emptySummary');

  // אם חסר מידע למשמרת - נציג את הסטייט הריק
  if (!bookingId || !endTimeIso || !startTimeIso) {
    summaryContent.classList.add('hide-element');
    emptySummary.classList.remove('hide-element');
    return;
  }

  // הכל תקין - נציג את כרטיסיית הסיכום
  emptySummary.classList.add('hide-element');
  summaryContent.classList.remove('hide-element');

  try {
    const token = localStorage.getItem('token');
    
    // מושכים את ההזמנה הספציפית מהשרת במקום את כל הבייביסיטריות
    const res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'הזמנה לא נמצאה');

    const booking = data.data;

    const start = new Date(startTimeIso);
    const end = new Date(endTimeIso);
    
    // חישוב זמנים
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    const durationText = hours > 0 ? `${hours} שעות ו-${mins} דקות` : `${mins} דקות`;
    
    // חישוב תשלום ישירות מהתעריף ששמור בהזמנה
    const rate = Number(booking.rate) || 0;
    const totalCost = Math.round((diffMins / 60) * rate);

    // הזרקה ל-DOM
    document.getElementById('shiftDateSumm').textContent = start.toLocaleDateString('he-IL');
    document.getElementById('shiftStartSumm').textContent = start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('shiftEndSumm').textContent = end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('shiftDurationSumm').textContent = durationText;
    document.getElementById('shiftRateSumm').textContent = `₪${rate}/שעה`;
    document.getElementById('shiftTotalSumm').textContent = `₪${totalCost}`;

    // הזרקת תמונה (משתמש בתמונה מההזמנה או ברירת מחדל)
    const imgEl = document.getElementById('sitterImgSumm');
    if (imgEl) {
       imgEl.src = (booking.sitter && booking.sitter.img) ? booking.sitter.img : 'https://i.pravatar.cc/150?img=1';
    }

  } catch (err) {
    console.error('שגיאה בחישוב הסיכום:', err);
    showToast('❌ שגיאה בטעינת נתוני המשמרת');
  }
}

/* ================================================
   פעולות תשלום וסיום (זמין למשפחות בלבד בזכות ה-CSS)
   ================================================ */

function payAndFinish(method) {
  if (method === 'bit') {
    showToast('📱 מעביר לתשלום ב-Bit...');
  } else {
    showToast('💵 התשלום התקבל בהצלחה');
  }
  
  // אחרי שנייה וחצי עוברים לדירוג
  setTimeout(() => {
    goToRating();
  }, 1500);
}

function goToRating() {
  const sitterId = localStorage.getItem('currentSitterId');
  
  // מנקים את הזיכרון כדי שהמשמרת הבאה תתחיל נקייה
  localStorage.removeItem('currentSitterId');
  localStorage.removeItem('actualStartTime');
  localStorage.removeItem('actualEndTime');

  if (sitterId) {
    window.location.href = `rating.html?id=${sitterId}`;
  } else {
    window.location.href = 'upcoming-shifts.html';
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show-toast');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.classList.remove('show-toast'), 2500);
}