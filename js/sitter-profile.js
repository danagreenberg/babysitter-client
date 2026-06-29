/* ================================================
   sitter-profile.js
   טוען את נתוני הבייביסיטר, מחשב מרחק מול API חיצוני ומנהל פעולות
   ================================================ */

const API_URL = 'https://babysitter-server-dc0e.onrender.com';

document.addEventListener('DOMContentLoaded', loadProfile);

async function loadProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const sitterId = urlParams.get('id');

  if (!sitterId) {
    showToast('❌ לא נבחרה בייביסיטר, חוזר לחיפוש...');
    setTimeout(() => window.location.href = 'family-search.html', 2000);
    return;
  }

  showLoadingState(true);

  try {
    const res = await fetch(`${API_URL}/api/sitters`);
    const data = await res.json();
    
    if (!data.success) throw new Error(data.error);
    
    const sitter = data.data.find(s => s.id === sitterId || s._id === sitterId);
    
    if (!sitter) throw new Error('הבייביסיטר לא נמצאה במסד הנתונים');

    // הזרקת הנתונים הבסיסיים למסך
    document.getElementById('profName').textContent = sitter.name || 'ללא שם';
    document.getElementById('profAge').textContent = sitter.age || '--';
    document.getElementById('profRate').textContent = sitter.rate || '--';
    document.getElementById('profExp').textContent = sitter.experience || '--';
    
    if (sitter.img) {
      document.getElementById('profImg').src = sitter.img;
    }

    const verifiedBadge = document.getElementById('profVerified');
    if (sitter.verified === true) {
      verifiedBadge.style.display = 'inline-flex';
    } else {
      verifiedBadge.style.display = 'none';
    }

    // טעינת ביקורות הבייביסיטר (נתיב נפרד)
    try {
      const sid = sitter._id || sitter.id;
      const revRes = await fetch(`${API_URL}/api/reviews/sitter/${sid}`);
      const revData = await revRes.json();
      renderReviews(revData.success ? revData.data : []);
    } catch (err) {
      console.error('שגיאה בטעינת ביקורות:', err);
      renderReviews([]);
    }

    // --- קריאה ל-API חיצוני לחישוב מרחק בצורה דינמית ---
    const token = localStorage.getItem('token');
    
    if (token && sitter.lat && sitter.lng) {
      try {
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();

        if (userData.success && userData.data && userData.data.lat && userData.data.lng) {
          const familyLat = userData.data.lat;
          const familyLng = userData.data.lng;
          
          await calculateDistance(familyLat, familyLng, sitter.lat, sitter.lng);
        } else {
          // חסרים נתוני מיקום של המשפחה ב-DB
          showNoDistanceData();
        }
      } catch (err) {
        console.error('שגיאה בשליפת נתוני המשפחה:', err);
        showNoDistanceData();
      }
    } else {
      // חסר טוקן או חסרים נתוני מיקום של הבייביסיטר
      showNoDistanceData();
    }

  } catch (err) {
    console.error('שגיאה:', err);
    showToast('❌ אירעה שגיאה בטעינת הפרופיל: ' + err.message);
  } finally {
    showLoadingState(false);
  }
}

// פונקציית ה-API החיצוני (OSRM)
async function calculateDistance(fLat, fLng, sLat, sLng) {
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${fLng},${fLat};${sLng},${sLat}?overview=false`);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes.length > 0) {
      const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
      const durationMin = Math.round(data.routes[0].duration / 60);
      
      const distEl = document.getElementById('profDistance');
      if (distEl) {
        distEl.innerHTML = `📍 מרחק מהבית שלך: <strong>${distanceKm} ק"מ</strong> (כ-${durationMin} דקות נסיעה)`;
        distEl.style.display = 'block';
      }
    } else {
      showNoDistanceData();
    }
  } catch (err) {
    console.error('שגיאה בחישוב מרחק מול ה-API החיצוני:', err);
    showNoDistanceData();
  }
}

// הודעה כשהנתונים חסרים
function showNoDistanceData() {
  const distEl = document.getElementById('profDistance');
  if (distEl) {
    distEl.innerHTML = `📍 מרחק מהבית שלך: <span style="color: #777; font-weight: 500;">אין נתונים להצגה</span>`;
    distEl.style.display = 'block';
  }
}

function renderReviews(reviews) {
  const reviewsContainer = document.getElementById('profReviews');
  if (reviews && Array.isArray(reviews) && reviews.length > 0) {
    reviewsContainer.innerHTML = reviews.map((rev, index) => {
      const rating = Math.round(rev.rating || 5);
      const starsHtml = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const centerClass = index === 1 ? 'center-review' : '';

      return `
        <div class="review-box ${centerClass}">
          <div class="stars">${starsHtml}</div>
          <div class="review-text">${rev.text || ''}</div>
        </div>
      `;
    }).join('');
  } else {
    reviewsContainer.innerHTML = '<div class="reviews-loading">אין עדיין ביקורות לבייביסיטר זו.</div>';
  }
}

/* ================================================
   פונקציות כפתורים ומודאלים (ללא alert)
   ================================================ */

function bookSitter() {
  const sitterName = document.getElementById('profName').textContent;
  document.getElementById('modalSitterName').textContent = sitterName;
  
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('bookDate');
  dateInput.setAttribute('min', today);
  dateInput.value = today;

  document.getElementById('bookingModal').classList.add('show');
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('show');
}

async function submitBookingRequest() {
  const date = document.getElementById('bookDate').value;
  const startTime = document.getElementById('bookStartTime').value;
  const endTime = document.getElementById('bookEndTime').value;

  if (!date || !startTime || !endTime) {
    showToast('❌ נא למלא תאריך, שעת התחלה ושעת סיום.');
    return;
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sitterId = urlParams.get('id');
    const token = localStorage.getItem('token');

    const scheduledStart = new Date(`${date}T${startTime}:00`).toISOString();
    const scheduledEnd = new Date(`${date}T${endTime}:00`).toISOString();

    const res = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sitterId: sitterId,
        scheduledStart: scheduledStart,
        scheduledEnd: scheduledEnd,
        status: 'pending'
      })
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'שגיאה ביצירת הבקשה');

    closeBookingModal();
    showToast('✅ הבקשה נשלחה! ממתין לאישור הבייביסיטר.');

  } catch (err) {
    console.error('שגיאת שליחה:', err);
    showToast('❌ שגיאה: ' + err.message);
  }
}

function callSitter() {
  showToast('📞 מתקשר לבייביסיטר...');
}

/* ================================================
   פונקציות עזר: מצב טעינה והתראות צפות (Toast)
   ================================================ */

function showLoadingState(isLoading) {
  const loader = document.getElementById('profileLoader');
  const content = document.getElementById('profileContent'); 
  
  if (loader) loader.style.display = isLoading ? 'flex' : 'none';
  if (content) content.style.opacity = isLoading ? '0.3' : '1';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  
  t.textContent = msg;
  t.style.display = 'block';
  
  clearTimeout(window._tt);
  window._tt = setTimeout(() => {
    t.style.display = 'none';
  }, 2500);
}