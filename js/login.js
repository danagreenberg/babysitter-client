// התאמה אוטומטית לכתובת השרת (מקומי מול ענן)
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://הכתובת-שלך-בענן.com';

let authMode = 'login'; // 'login' או 'register'
let role = 'family';
let childCount = 3;

/* -- מעבר בין התחברות להרשמה -- */
function toggleAuthMode(mode) {
  authMode = mode;
  document.getElementById('tab-login-mode').classList.toggle('active', mode === 'login');
  document.getElementById('tab-register-mode').classList.toggle('active', mode === 'register');
  
  document.getElementById('loginForm').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('regForm').style.display = mode === 'register' ? 'block' : 'none';
  document.getElementById('formTitle').textContent = mode === 'login' ? 'כניסה למערכת' : 'הרשמה חדשה';
}

/* -- מעבר בין סוגי משתמשים (בהרשמה) -- */
function setRole(r) {
  role = r;
  document.getElementById('tab-family').classList.toggle('active', r === 'family');
  document.getElementById('tab-sitter').classList.toggle('active', r === 'sitter');
  document.getElementById('familyFields').style.display = r === 'family' ? 'block' : 'none';
  document.getElementById('sitterFields').style.display = r === 'sitter' ? 'contents' : 'none';
}

/* -- ניתוב משתמש לפי תפקיד -- */
function redirectUser(user) {
  if (user.role === 'family') {
    window.location.href = 'family-search.html';
  } else if (user.role === 'sitter') {
    window.location.href = 'sitter-dashboard.html';
  } else {
    window.location.href = 'index.html'; // ברירת מחדל
  }
}

/* ------------------------------------------------
   התחברות (Login)
------------------------------------------------ */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const loginErr = document.getElementById('loginErr');
  const loginBtn = document.getElementById('loginBtn');

  loginErr.style.display = 'none';

  if (!email || !password) {
    loginErr.textContent = 'אנא מלא/י אימייל וסיסמה.';
    loginErr.style.display = 'block';
    return;
  }

  loginBtn.textContent = '⏳ מתחבר...';
  loginBtn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'אימייל או סיסמה שגויים.');

    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    redirectUser(data.data.user);

  } catch (err) {
    loginBtn.textContent = 'כניסה';
    loginBtn.disabled = false;
    loginErr.textContent = err.message;
    loginErr.style.display = 'block';
  }
});

/* ------------------------------------------------
   הרשמה (Register) - כולל ולידציה
------------------------------------------------ */
function changeCount(d) {
  childCount = Math.max(1, Math.min(10, childCount + d));
  document.getElementById('childCount').textContent = childCount;
}

function fmtPhone(el) {
  let v = el.value.replace(/\D/g, '');
  if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
  if (v.length > 11) v = v.slice(0, 11);
  el.value = v;
}

function vf(id) {
  const el = document.getElementById(id);
  const err = document.getElementById(id + '-e');
  if (!el) return true;

  const val = el.value.trim();
  let ok = false;

  switch (id) {
    case 'fullName': ok = val.length >= 2; break;
    case 'phone': ok = /^05\d-?\d{7}$/.test(val.replace(/\s/g, '')); break;
    case 'email': ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val); break;
    case 'address': ok = val.length >= 3; break;
    case 'birthdate':
      if (!val) break;
      const age = Math.floor((Date.now() - new Date(val)) / (365.25 * 24 * 3600 * 1000));
      ok = age >= 16;
      break;
    case 'experience': ok = val !== ''; break;
    case 'area': ok = val !== ''; break;
    case 'rate': ok = parseInt(val) >= 30 && parseInt(val) <= 200; break;
    default: ok = true;
  }

  el.classList.toggle('err', !ok && val !== '');
  el.classList.toggle('ok', ok);
  if (err) err.classList.toggle('show', !ok && val !== '');
  return ok;
}

function validateAll() {
  const base = ['fullName', 'phone', 'email', 'address'];
  const sitter = ['birthdate', 'experience', 'area', 'rate'];
  const fields = role === 'sitter' ? [...base, ...sitter] : base;
  let ok = true;
  fields.forEach(f => { if (!vf(f)) ok = false; });
  return ok;
}

document.getElementById('regForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const regErr = document.getElementById('regErr');
  const successMsg = document.getElementById('successMsg');
  const submitBtn = document.getElementById('submitRegBtn');

  regErr.style.display = 'none';

  if (!validateAll()) {
    regErr.textContent = 'אנא מלא/י את כל השדות הנדרשים';
    regErr.style.display = 'block';
    return;
  }

  submitBtn.textContent = '⏳ שולח...';
  submitBtn.disabled = true;

  const body = {
    name: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    password: document.getElementById('phone').value.replace(/-/g, ''), // הסיסמה היא מספר הטלפון
    role,
    ...(role === 'family'
      ? { children: childCount }
      : {
          birthdate: document.getElementById('birthdate').value,
          experience: document.getElementById('experience').value,
          area: document.getElementById('area').value,
          rate: parseInt(document.getElementById('rate').value)
        }
    )
  };

  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'שגיאה בהרשמה.');

    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    submitBtn.style.display = 'none';
    successMsg.style.display = 'block';

    setTimeout(() => redirectUser(data.data.user), 1500);

  } catch (err) {
    submitBtn.textContent = 'סיום הרשמה';
    submitBtn.disabled = false;
    regErr.textContent = err.message;
    regErr.style.display = 'block';
  }
});