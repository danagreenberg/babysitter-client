/* ================================================
   sitter-profile.js
   טוען את נתוני הבייביסיטר ומנהל את הפעולות בעמוד
   ================================================ */

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', loadProfile);

async function loadProfile() {
  // קריאת ה-ID של הבייביסיטר משורת הכתובת (URL)
  const urlParams = new URLSearchParams(window.location.search);
  const sitterId = urlParams.get('id');

  if (!sitterId) {
    alert('לא נבחרה בייביסיטר, חוזר למפה.');
    window.location.href = 'family-search.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/sitters`);
    const data = await res.json();
    
    if (!data.success) throw new Error(data.error);
    
    // מציאת הבייביסיטר הספציפית לפי ה-ID
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

    // הזרקת תג מאומת (Verified)
    const verifiedBadge = document.getElementById('profVerified');
    if (sitter.verified === true) {
      verifiedBadge.style.display = 'inline-flex';
    } else {
      verifiedBadge.style.display = 'none';
    }

    // הזרקת ביקורות דינמיות
    const reviewsContainer = document.getElementById('profReviews');
    
    if (sitter.reviews && Array.isArray(sitter.reviews) && sitter.reviews.length > 0) {
      reviewsContainer.innerHTML = sitter.reviews.map((rev, index) => {
        // חישוב הכוכבים
        const rating = Math.round(rev.rating || 5);
        const starsHtml = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        
        // קו מפריד לביקורת האמצעית (כדי לשמור על עיצוב 3 עמודות)
        const centerClass = index === 1 ? 'center-review' : '';

        return `
          <div class="review-box ${centerClass}">
            <div class="stars">${starsHtml}</div>
            <div class="review-text">${rev.text || ''}</div>
          </div>
        `;
      }).join('');
      
    } else {
      reviewsContainer.innerHTML = '<div style="width: 100%; text-align: center; color: #888; padding: 20px 0;">אין עדיין ביקורות לבייביסיטר זו.</div>';
    }

  } catch (err) {
    console.error('שגיאה:', err);
    alert('אירעה שגיאה בטעינת הפרופיל: ' + err.message);
  }
}

/* ================================================
   פונקציות כפתורים
   ================================================ */

function bookSitter() {
  // העברה למסך המשמרות העתידיות
  window.location.href = 'upcoming-shifts.html';
}

function callSitter() {
  // הפעלת ה-Toast במקום alert רגיל
  showToast('📞 מתקשר לבייביסיטר...');
}

/* ================================================
   פונקציית עזר להצגת התראות צפות (Toast)
   ================================================ */
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