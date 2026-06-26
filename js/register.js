/* ================================================
   register.js
   לוגיקת הרשמה נקייה וללא alert
   ================================================ */

const API_URL = 'http://localhost:3000';

function showModal(title, text) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalText').textContent = text;
  document.getElementById('msgModal').classList.add('show');
}

function closeMsgModal() {
  document.getElementById('msgModal').classList.remove('show');
}

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

  // הפעלת הפונקציה בטעינה כדי שהשדות יסתדרו מיד
  toggleRoleFields();
});

let currentChildCount = 1;

function changeCount(diff) {
  currentChildCount += diff;
  if (currentChildCount < 1) currentChildCount = 1;
  if (currentChildCount > 10) currentChildCount = 10;
  document.getElementById('childCount').textContent = currentChildCount;
}

function toggleRoleFields() {
  const role = document.querySelector('input[name="userRole"]:checked').value;
  const sitterFields = document.getElementById('sitterFields');
  const familyFields = document.getElementById('familyFields');
  
  if (role === 'sitter') {
    sitterFields.classList.add('show-flex');
    familyFields.style.display = 'none';
  } else {
    sitterFields.classList.remove('show-flex');
    familyFields.style.display = 'block';
  }
}

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
      el.classList.add('invalid');
    } else {
      el.classList.remove('invalid');
    }
  });

  const fileInput = document.getElementById('registerImg');
  if (fileInput.files.length === 0) {
    missingFields.push('תמונת פרופיל');
  }

  if (missingFields.length > 0) {
    showModal('חסרים פרטים', 'לא ניתן להמשיך. חסרים השדות הבאים:\n• ' + missingFields.join('\n• '));
    return;
  }

  const emailInput = document.getElementById('registerEmail');
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(emailInput.value.trim())) {
    showModal('שגיאה', 'כתובת האימייל אינה תקינה.');
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
      // אם השרת מחזיר שגיאה (כמו אימייל קיים או חסר נתון)
      throw new Error(data.error || 'שגיאה בתהליך ההרשמה מול השרת');
    }

    showModal('הצלחה!', 'החשבון נוצר בהצלחה! מעבר לעמוד ההתחברות...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);

  } catch (err) {
    console.error('שגיאת הרשמה:', err);
    showModal('שגיאה בהרשמה', err.message);
  }
}