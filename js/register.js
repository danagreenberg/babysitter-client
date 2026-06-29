/* ================================================
   register.js
   לוגיקת הרשמה נקייה וללא alert
   ================================================ */

const API_URL = 'https://babysitter-server-dc0e.onrender.com';

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

/* ── הקטנת תמונה לפני העלאה (שומר על מסד קל ומהיר) ── */
function resizeImage(file, maxSize) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = Math.round(height * (maxSize / width));
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round(width * (maxSize / height));
        height = maxSize;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('שגיאה בעיבוד התמונה')),
        'image/jpeg',
        0.8
      );
    };
    img.onerror = () => reject(new Error('קובץ התמונה אינו תקין'));
    img.src = URL.createObjectURL(file);
  });
}

async function getCoordsFromAddress(address) {
  // מוסיפים 'Israel' כדי לעזור ל-API להתמקד במיקום הנכון
  const query = `${address}, Israel`; 
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  // בדיקה אם הגיעו תוצאות
  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    };
  } else {
    // אם לא מצא, ננסה להחזיר ערך ברירת מחדל או לזרוק שגיאה ברורה
    console.error("לא נמצאו קואורדינטות לכתובת:", address);
    throw new Error('לא נמצאה הכתובת במפות, נסי להוסיף עיר או מיקוד.');
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
    const address = document.getElementById('registerAddress').value.trim();
    
    // 1. נסיון לקבל קואורדינטות מהכתובת לפני שממשיכים
    const coords = await getCoordsFromAddress(address);

    const formData = new FormData();
    formData.append('role', selectedRole); 
    formData.append('name', document.getElementById('registerName').value.trim());
    formData.append('email', emailInput.value.trim());
    formData.append('password', document.getElementById('registerPass').value.trim());
    formData.append('phone', document.getElementById('registerPhone').value.trim());
    formData.append('address', address);
    
    // 2. הוספת הקואורדינטות שהתקבלו מה-API לטופס
    formData.append('lat', coords.lat);
    formData.append('lng', coords.lng);
    
    if (selectedRole === 'family') {
      formData.append('children', document.getElementById('childCount').textContent);
    } else if (selectedRole === 'sitter') {
      formData.append('age', document.getElementById('registerAge').value.trim());
      formData.append('rate', document.getElementById('registerRate').value.trim());
      formData.append('experience', document.getElementById('registerExp').value.trim());
    }
    
    // מקטינים את התמונה לפני השליחה כדי לשמור על מסד קל ומהיר
    const resizedImg = await resizeImage(fileInput.files[0], 300);
    formData.append('img', resizedImg, 'profile.jpg');

    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      body: formData 
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
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
