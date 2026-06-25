/* ================================================
   register.js
   לוגיקת הרשמה: ולידציות, בחירת תפקיד, מונה ילדים ושליחה
   ================================================ */

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('registerEmail');
  const emailError = document.getElementById('emailError');
  const fileInput = document.getElementById('registerImg');
  const fileNameDisplay = document.getElementById('fileNameDisplay');

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      const emailValue = emailInput.value.trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (emailValue === '') {
        emailInput.classList.remove('invalid');
        emailError.style.display = 'none';
      } else if (!emailRegex.test(emailValue)) {
        emailInput.classList.add('invalid');
        emailError.style.display = 'block';
        emailError.textContent = 'אימייל לא תקין';
      } else {
        emailInput.classList.remove('invalid');
        emailError.style.display = 'none';
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = `📁 קובץ נבחר: ${fileInput.files[0].name}`;
        fileNameDisplay.style.color = '#c4557a';
      } else {
        fileNameDisplay.textContent = 'לא נבחרה תמונה';
        fileNameDisplay.style.color = '#888';
      }
    });
  }
});

/* ── פונקציה להוספה/הורדה של מספר הילדים ── */
let currentChildCount = 1; // התיקון: מתחיל מ-1

function changeCount(diff) {
  currentChildCount += diff;
  if (currentChildCount < 1) currentChildCount = 1; // מינימום ילד אחד
  if (currentChildCount > 10) currentChildCount = 10; // מקסימום הגיוני
  document.getElementById('childCount').textContent = currentChildCount;
}

/* ── פונקציה שמציגה/מסתירה את השדות בהתאם לתפקיד שנבחר ── */
function toggleRoleFields() {
  const role = document.querySelector('input[name="userRole"]:checked').value;
  const sitterFields = document.getElementById('sitterFields');
  const familyFields = document.getElementById('familyFields');
  
  if (role === 'sitter') {
    sitterFields.style.display = 'flex';
    familyFields.style.display = 'none';
  } else {
    sitterFields.style.display = 'none';
    familyFields.style.display = 'block';
  }
}

/* ── פונקציית ההרשמה הראשית ── */
async function register() {
  const selectedRole = document.querySelector('input[name="userRole"]:checked').value;

  let requiredFields = [
    { id: 'registerName', name: 'שם מלא' },
    { id: 'registerEmail', name: 'אימייל' },
    { id: 'registerPass', name: 'סיסמה' },
    { id: 'registerPhone', name: 'טלפון' },
    { id: 'registerAddress', name: 'כתובת מגורים' }
  ];

  if (selectedRole === 'sitter') {
    requiredFields.push(
      { id: 'registerAge', name: 'גיל' },
      { id: 'registerRate', name: 'תעריף' },
      { id: 'registerExp', name: 'שנות ניסיון' }
    );
  }

  let missingFields = [];

  requiredFields.forEach(field => {
    const el = document.getElementById(field.id);
    if (!el.value.trim()) {
      missingFields.push(field.name);
      el.style.borderColor = '#d32f2f'; 
      el.style.backgroundColor = '#fff0f0';
    } else {
      el.style.borderColor = ''; 
      el.style.backgroundColor = '';
    }
  });

  const fileInput = document.getElementById('registerImg');
  if (fileInput.files.length === 0) {
    missingFields.push('תמונת פרופיל');
  }

  if (missingFields.length > 0) {
    alert('לא ניתן להמשיך. חסרים השדות הבאים:\n• ' + missingFields.join('\n• '));
    return;
  }

  const emailInput = document.getElementById('registerEmail');
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(emailInput.value.trim())) {
    alert('כתובת האימייל אינה תקינה.');
    emailInput.focus();
    return;
  }

  try {
    const formData = new FormData();
    formData.append('role', selectedRole); 
    formData.append('name', document.getElementById('registerName').value.trim());
    formData.append('email', emailInput.value.trim());
    formData.append('password', document.getElementById('registerPass').value.trim());
    formData.append('phone', document.getElementById('registerPhone').value.trim());
    formData.append('address', document.getElementById('registerAddress').value.trim());
    
    if (selectedRole === 'family') {
      formData.append('children', document.getElementById('childCount').textContent);
    } else if (selectedRole === 'sitter') {
      formData.append('age', document.getElementById('registerAge').value.trim());
      formData.append('rate', document.getElementById('registerRate').value.trim());
      formData.append('experience', document.getElementById('registerExp').value.trim());
    }
    
    formData.append('img', fileInput.files[0]); 

    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      body: formData 
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'שגיאה בתהליך ההרשמה');
    }

    alert('החשבון נוצר בהצלחה! מעבר לעמוד ההתחברות...');
    window.location.href = 'login.html';

  } catch (err) {
    console.error('שגיאת הרשמה:', err);
    alert(err.message);
  }
}