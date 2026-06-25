/* ================================================
   shift-summary.js
   חישוב זמן משמרת, תשלום דינמי, ונעילת המסך
   ================================================ */

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', loadSummaryData);

async function loadSummaryData() {
  const sitterId = localStorage.getItem('currentSitterId');
  const startTimeIso = localStorage.getItem('actualStartTime');
  const endTimeIso = localStorage.getItem('actualEndTime');

  const backBtn = document.querySelector('.back-btn');

  // אם אין משמרת לתשלום (מצב ריק)
  if (!sitterId || !endTimeIso) {
    if (backBtn) backBtn.style.display = 'inline-block'; // משאיר את הכפתור אם סתם נכנסו לעמוד
    
    document.querySelector('.card-body').innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 55px; margin-bottom: 15px;">🤷‍♀️</div>
        <h3 style="color: #c4557a; font-size: 24px; font-weight: 800; margin-bottom: 12px;">אין משמרת לסיכום</h3>
        <p style="color: #777; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
          לא נמצאו נתוני משמרת שהסתיימה כרגע.<br>
          כדי לראות סיכום ולשלם, יש קודם לסיים משמרת פעילה.
        </p>
        <button style="background: #e091b0; color: white; border: none; padding: 14px 28px; border-radius: 14px; font-size: 16px; font-weight: bold; cursor: pointer; font-family: inherit;" onclick="window.location.href='upcoming-shifts.html'">
          מעבר למשמרות שלי
        </button>
      </div>
    `;
    return; 
  }

  // התיקון: אם יש משמרת לתשלום, מעלימים את כפתור החזור/איקס כדי למנוע "בריחה"!
  if (backBtn) {
    backBtn.style.display = 'none';
  }

  try {
    const res = await fetch(`${API_URL}/api/sitters`);
    const data = await res.json();
    
    const sitter = data.data.find(s => s.id === sitterId || s._id === sitterId); 
    if (!sitter) throw new Error('הבייביסיטר לא נמצאה במסד הנתונים');

    // חישובי זמנים
    const start = new Date(startTimeIso);
    const end = new Date(endTimeIso);

    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.max(1, Math.round(diffMs / 60000)); 
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    const durationText = `${hours} שעות ו-${mins} דקות`;

    // חישוב תשלום
    const rate = sitter.rate || 0;
    const totalCost = Math.round((diffMins / 60) * rate);

    // הזרקה ל-HTML
    document.getElementById('sitterNameSumm').textContent = sitter.name;
    document.getElementById('shiftDateSumm').textContent = start.toLocaleDateString('he-IL');
    
    document.getElementById('shiftStartSumm').textContent = start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('shiftEndSumm').textContent = end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    
    document.getElementById('shiftDurationSumm').textContent = durationText;
    document.getElementById('shiftRateSumm').textContent = `₪${rate}/שעה`;
    document.getElementById('shiftTotalSumm').textContent = `₪${totalCost}`;

    if (sitter.img) {
      document.getElementById('sitterImgSumm').src = sitter.img;
    }

  } catch (err) {
    console.error('שגיאה בחישוב הסיכום:', err);
    showToast('❌ שגיאה בטעינת נתוני המשמרת');
  }
}

/* ================================================
   פעולות תשלום וסיום
   ================================================ */

function payAndFinish(method) {
  if (method === 'bit') {
    showToast('📱 מעביר לתשלום ב-Bit...');
  } else {
    showToast('💵 התשלום התקבל בהצלחה');
  }
  
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
    window.location.href = 'index.html';
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