/* ================================================
   profile.js
   טעינה ועריכה של נתוני משתמש מלאים (כולל תמונה ותפקיד)
   ================================================ */

const API_URL = 'https://babysitter-server-dc0e.onrender.com';
let currentUserRole = '';
let isEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();

  // מציג תצוגה מקדימה של התמונה החדשה ברגע שבוחרים אותה
  const imgInput = document.getElementById('profImgInput');
  if (imgInput) {
    imgInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('profImgDisplay').src = e.target.result;
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
});

async function loadUserProfile() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    showToast('❌ אינך מחוברת. מעבר לעמוד התחברות...');
    setTimeout(() => window.location.href = 'login.html', 2000);
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const user = data.data;
    currentUserRole = user.role;

    // מילוי כותרות ותמונה
    document.getElementById('profileNameTitle').textContent = user.name;
    document.getElementById('profileRoleTitle').textContent = user.role === 'sitter' ? 'בייביסיטר 🍼' : 'משפחה 👨‍👩‍👧‍👦';
    
    if (user.img) {
      document.getElementById('profImgDisplay').src = user.img;
    }

    // מילוי שדות משותפים
    document.getElementById('profName').value = user.name || '';
    document.getElementById('profEmail').value = user.email || '';
    document.getElementById('profPhone').value = user.phone || '';
    document.getElementById('profAddress').value = user.address || '';

    // הצגת שדות לפי תפקיד בעזרת מחלקות CSS
    if (user.role === 'sitter') {
      const sitterDiv = document.getElementById('sitterFields');
      sitterDiv.classList.remove('hide-element');
      sitterDiv.classList.add('show-flex-col');
      
      document.getElementById('profAge').value = user.age || '';
      document.getElementById('profRate').value = user.rate || '';
      document.getElementById('profExp').value = user.experience || '';
    } else {
      const familyDiv = document.getElementById('familyFields');
      familyDiv.classList.remove('hide-element');
      familyDiv.classList.add('show-block');
      
      document.getElementById('profChildren').value = user.children || 1;
    }

  } catch (err) {
    console.error('שגיאה בטעינת פרופיל:', err);
    showToast('❌ שגיאה בטעינת הנתונים');
  }
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  
  const inputs = document.querySelectorAll('.fi');
  inputs.forEach(input => {
    // השארת האימייל נעול, כפי שנהוג במערכות
    if (input.id !== 'profEmail') {
      input.disabled = !isEditMode;
    }
  });

  const saveBtn = document.getElementById('saveBtn');
  const editBtn = document.getElementById('editBtn');
  const imgLabel = document.getElementById('profImgLabel');

  if (isEditMode) {
    saveBtn.classList.remove('hide-element');
    saveBtn.classList.add('show-block');
    imgLabel.classList.remove('hide-element'); // הצגת כפתור החלפת תמונה
    
    editBtn.textContent = '✖️ ביטול עריכה';
    editBtn.classList.add('cancel-mode');
  } else {
    saveBtn.classList.add('hide-element');
    saveBtn.classList.remove('show-block');
    imgLabel.classList.add('hide-element'); // הסתרת כפתור החלפת תמונה
    
    editBtn.textContent = '✏️ עריכה';
    editBtn.classList.remove('cancel-mode');
    
    loadUserProfile(); // טעינה מחדש מבטלת שינויים שלא נשמרו
  }
}

async function saveProfile() {
  const token = localStorage.getItem('token');
  
  // שימוש ב-FormData כי יש לנו אולי תמונה חדשה להעלות
  const formData = new FormData();
  
  formData.append('name', document.getElementById('profName').value.trim());
  formData.append('phone', document.getElementById('profPhone').value.trim());
  formData.append('address', document.getElementById('profAddress').value.trim());

  // הוספת הנתונים הייחודיים לפי התפקיד
  if (currentUserRole === 'sitter') {
    formData.append('age', document.getElementById('profAge').value.trim());
    formData.append('rate', document.getElementById('profRate').value.trim());
    formData.append('experience', document.getElementById('profExp').value.trim());
  } else {
    formData.append('children', document.getElementById('profChildren').value.trim());
  }

  // בדיקה אם המשתמש בחר תמונה חדשה
  const imgFile = document.getElementById('profImgInput').files[0];
  if (imgFile) {
    formData.append('img', imgFile);
  }

  try {
    const btn = document.getElementById('saveBtn');
    btn.textContent = 'שומר...';
    btn.disabled = true;

    // שליחה ב-PUT לשרת. אין צורך ב-Content-Type כי הדפדפן מוסיף אותו אוטומטית ל-FormData
    const res = await fetch(`${API_URL}/api/auth/updatedetails`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    showToast('✅ הפרופיל עודכן בהצלחה!');
    
    btn.textContent = '💾 שמירת שינויים';
    btn.disabled = false;
    
    toggleEditMode(); // סוגר את מצב העריכה
    document.getElementById('profileNameTitle').textContent = formData.get('name'); // עדכון הכותרת

  } catch (err) {
    console.error('שגיאה בעדכון:', err);
    showToast('❌ שגיאה בעדכון הפרופיל: ' + err.message);
    document.getElementById('saveBtn').textContent = '💾 שמירת שינויים';
    document.getElementById('saveBtn').disabled = false;
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show-toast');
  
  clearTimeout(window._tt);
  window._tt = setTimeout(() => {
    t.classList.remove('show-toast');
  }, 2500);
}