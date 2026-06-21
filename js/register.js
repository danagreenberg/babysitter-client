/* ================================================
   register.js
   הרשמה לשרת – שולח POST ל /api/auth/register
   ================================================ */

const API_URL = 'http://localhost:3000';

let role       = 'family';
let childCount = 3;

/* -- בחירת תפקיד -- */
function setRole(r) {
  role = r;
  document.getElementById('tab-family').classList.toggle('active', r === 'family');
  document.getElementById('tab-sitter').classList.toggle('active', r === 'sitter');
  document.getElementById('familyFields').style.display = r === 'family' ? 'block' : 'none';
  document.getElementById('sitterFields').style.display = r === 'sitter' ? 'contents' : 'none';
  document.getElementById('formTitle').textContent = r === 'family' ? 'הרשמה כמשפחה' : 'הרשמה כבייביסיטר';
}

/* -- Counter ילדים -- */
function changeCount(d) {
  childCount = Math.max(1, Math.min(10, childCount + d));
  document.getElementById('childCount').textContent = childCount;
}

/* -- פורמט טלפון -- */
function fmtPhone(el) {
  let v = el.value.replace(/\D/g, '');
  if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
  if (v.length > 11) v = v.slice(0, 11);
  el.value = v;
}

/* -- ולידציה לשדה בודד -- */
function vf(id) {
  const el  = document.getElementById(id);
  const err = document.getElementById(id + '-e');
  if (!el) return true;

  const val = el.value.trim();
  let ok = false;

  switch (id) {
    case 'fullName':   ok = val.length >= 2; break;
    case 'phone':      ok = /^05\d-?\d{7}$/.test(val.replace(/\s/g, '')); break;
    case 'email':      ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val); break;
    case 'address':    ok = val.length >= 3; break;
    case 'birthdate': {
      if (!val) break;
      const age = Math.floor((Date.now() - new Date(val)) / (365.25 * 24 * 3600 * 1000));
      ok = age >= 16;
      break;
    }
    case 'experience': ok = val !== ''; break;
    case 'area':       ok = val !== ''; break;
    case 'rate':       ok = parseInt(val) >= 30 && parseInt(val) <= 200; break;
    default: ok = true;
  }

  el.classList.toggle('err', !ok && val !== '');
  el.classList.toggle('ok',  ok);
  if (err) err.classList.toggle('show', !ok && val !== '');
  return ok;
}

/* -- ולידציה מלאה -- */
function validateAll() {
  const base   = ['fullName', 'phone', 'email', 'address'];
  const sitter = ['birthdate', 'experience', 'area', 'rate'];
  const fields = role === 'sitter' ? [...base, ...sitter] : base;
  let ok = true;
  fields.forEach(f => { if (!vf(f)) ok = false; });
  return ok;
}

/* -- שליחה לשרת -- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('regForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const globalErr  = document.getElementById('globalErr');
    const successMsg = document.getElementById('successMsg');
    const submitBtn  = document.getElementById('submitBtn');

    globalErr.style.display = 'none';

    if (!validateAll()) {
      globalErr.textContent   = 'אנא מלא/י את כל השדות הנדרשים';
      globalErr.style.display = 'block';
      setTimeout(() => globalErr.style.display = 'none', 3000);
      return;
    }

    submitBtn.textContent = '⏳ שולח...';
    submitBtn.disabled    = true;

    const body = {
      name:     document.getElementById('fullName').value.trim(),
      phone:    document.getElementById('phone').value.trim(),
      email:    document.getElementById('email').value.trim(),
      address:  document.getElementById('address').value.trim(),
      password: document.getElementById('phone').value.replace(/-/g, ''),
      role,
      ...(role === 'family'
        ? { children: childCount }
        : {
            birthdate:  document.getElementById('birthdate').value,
            experience: document.getElementById('experience').value,
            area:       document.getElementById('area').value,
            rate:       parseInt(document.getElementById('rate').value)
          }
      )
    };

    try {
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user',  JSON.stringify(data.data.user));

      submitBtn.style.display  = 'none';
      successMsg.textContent   = `🎉 נרשמת בהצלחה! ברוך הבא ${data.data.user.name}`;
      successMsg.style.display = 'block';

      setTimeout(() => { window.location.href = 'family-search.html'; }, 2000);

    } catch (err) {
      submitBtn.textContent   = 'סיום הרשמה';
      submitBtn.disabled      = false;
      globalErr.textContent   = err.message || 'שגיאה בהרשמה, נסה שוב';
      globalErr.style.display = 'block';
      setTimeout(() => globalErr.style.display = 'none', 4000);
    }
  });
});
