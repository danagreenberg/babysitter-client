/* ================================================
   rating.js
   טיפול בדירוג, כוכבים אינטראקטיביים ושליחה לשרת
   ================================================ */

const API_URL = 'https://babysitter-server-dc0e.onrender.com';
let currentRating = 0;
let sitterId = null;

document.addEventListener('DOMContentLoaded', initRatingPage);

async function initRatingPage() {
  // קריאת ה-ID של הבייביסיטר משורת הכתובת
  const urlParams = new URLSearchParams(window.location.search);
  sitterId = urlParams.get('id');

  if (!sitterId) {
    showToast('❌ לא נבחרה בייביסיטר לדירוג');
    setTimeout(() => { window.location.href = 'family-search.html'; }, 1800);
    return;
  }

  // משיכת שם הבייביסיטר כדי להציג אותו בכותרת
  try {
    const res = await fetch(`${API_URL}/api/sitters`);
    const data = await res.json();
    const sitter = data.data.find(s => s.id === sitterId || s._id === sitterId);
    
    if (sitter) {
      document.getElementById('sitterNameTitle').textContent = sitter.name;
    }
  } catch (err) {
    console.error('לא ניתן למשוך את שם הבייביסיטר:', err);
  }

  setupStars();
}

/* ── הפעלת מערכת הכוכבים ── */
function setupStars() {
  const stars = document.querySelectorAll('.star');
  const indicator = document.getElementById('ratingText');
  
  const texts = ["מצוין!", "טוב מאוד", "בסדר","טעון שיפור","גרוע"];

  stars.forEach(star => {
    star.addEventListener('click', () => {
      // הסרת המחלקה active מכל הכוכבים
      stars.forEach(s => s.classList.remove('active'));
      
      // הוספת המחלקה active לכוכב שנלחץ (ה-CSS יצבע אותו ואת אלו שלפניו)
      star.classList.add('active');
      currentRating = parseInt(star.getAttribute('data-value'));
      
      // עדכון טקסט האינדיקציה
      indicator.textContent = texts[currentRating - 1];
      indicator.style.color = '#ffb300';
    });
  });
}

/* ── שליחת הביקורת ל-DB ── */
async function submitReview() {
  if (currentRating === 0) {
    showToast('❌ אנא בחרי דירוג (1-5 כוכבים)');
    return;
  }

  const reviewText = document.getElementById('reviewText').value.trim();
  const token = localStorage.getItem('token'); // טוקן המשפחה

  try {
    const btn = document.getElementById('submitReviewBtn');
    btn.disabled = true;
    btn.textContent = 'שולח...';

    // קריאת POST לשרת (תוודאי שיש לך נתיב כזה ב-Node.js!)
    const res = await fetch(`${API_URL}/api/sitters/${sitterId}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating: currentRating,
        text: reviewText
      })
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'שגיאה בשמירת הביקורת');
    }

    showToast('✅ הביקורת נשמרה בהצלחה!');
    
    // מעבר אוטומטי לפרופיל הבייביסיטר כדי לראות את הביקורת החדשה
    setTimeout(() => {
      window.location.href = `sitter-profile.html?id=${sitterId}`;
    }, 2000);

  } catch (err) {
    console.error(err);
    showToast('❌ ' + err.message);
    document.getElementById('submitReviewBtn').disabled = false;
    document.getElementById('submitReviewBtn').textContent = 'שלח ביקורת';
  }
}

function goBack() {
  window.location.href = 'family-search.html';
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