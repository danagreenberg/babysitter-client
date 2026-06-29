/* ================================================
   login.js
   ניהול התחברות וולידציית אימייל בזמן אמת
   ================================================ */

const API_URL = 'https://babysitter-server-dc0e.onrender.com';

/* ── מודאל הודעות (במקום alert) ── */
function showModal(title, text) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalText').textContent = text;
  document.getElementById('msgModal').classList.add('show');
}

function closeMsgModal() {
  document.getElementById('msgModal').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('loginEmail');
  const emailError = document.getElementById('emailError');

  if (emailInput) {
    // מאזין לכל הקלדה של תו בשדה
    emailInput.addEventListener('input', () => {
      const emailValue = emailInput.value.trim();
      
      // תבנית מחמירה: רק אותיות באנגלית, מספרים, וסימנים מותרים. חובה שיהיה @ ונקודה עם לפחות 2 אותיות בסוף (כמו .com או .il)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (emailValue === '') {
        // אם השדה ריק, לא נצעק עליה
        emailInput.classList.remove('invalid');
        emailError.style.display = 'none';
      } else if (!emailRegex.test(emailValue)) {
        // אם יש אותיות בעברית, רווחים, חסר @ או סיומת לא הגיונית
        emailInput.classList.add('invalid');
        emailError.style.display = 'block';
        emailError.textContent = 'אימייל לא תקין'; // הטקסט שביקשת שיופיע
      } else {
        // האימייל מושלם
        emailInput.classList.remove('invalid');
        emailError.style.display = 'none';
      }
    });
  }
});

/* ── פונקציית ההתחברות הראשית ── */
async function login() {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPass');
  
  const email = emailInput.value.trim();
  const pass = passInput.value.trim();

  // 1. וידוא שהשדות לא ריקים
  if (!email || !pass) {
    showModal('חסרים פרטים', 'נא למלא אימייל וסיסמה');
    return;
  }

  // 2. בדיקה אחרונה שהאימייל באמת תקין לפני שפונים לשרת
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
     showModal('שגיאה', 'יש לתקן את כתובת האימייל לפני ההתחברות');
     emailInput.focus(); // מקפיץ את הסמן חזרה לשדה האימייל
     return;
  }

  try {
    // שליחת בקשת POST לשרת ה-Node.js שלך
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass })
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'אימייל או סיסמה שגויים');
    }
    
    // שמירת הטוקן בזיכרון של הדפדפן כדי שהמערכת תדע שאנחנו מחוברים
  localStorage.setItem('token', data.data.token);
    localStorage.setItem('role', data.data.user.role);   // שמירת התפקיד למניעת הבהוב בנאבבר

  const role = localStorage.getItem('role'); 

    // בדיקה לפי הערכים האמיתיים שחוזרים מהשרת
    if (role === 'family') {
      window.location.href = 'family-search.html';
    } else if (role === 'sitter') {
      window.location.href = 'my-requests.html';
    } else {
      window.location.href = 'index.html'; 
    }
  } catch (err) { 
    showModal('שגיאת התחברות', err.message);
  }
}