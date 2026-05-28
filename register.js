/* ================================================
   register.js
   ולידציה לטופס הרשמה – משפחה ובייביסיטר
   ================================================ */

let regRole = 'family';
let kids = 3;

/* -- בחירת תפקיד (משפחה / בייביסיטר) -- */
function setRole(r) {
  regRole = r;
  document.getElementById('rtab-family').classList.toggle('active', r === 'family');
  document.getElementById('rtab-sitter').classList.toggle('active', r === 'sitter');
  document.getElementById('familyBlock').style.display = r === 'family' ? 'block' : 'none';
  document.getElementById('sitterBlock').style.display = r === 'sitter' ? 'block' : 'none';
  document.getElementById('regTitle').textContent = r === 'family' ? 'הרשמה כמשפחה' : 'הרשמה כבייביסיטר';
}

/* -- Counter ילדים -- */
function chgKids(d) {
  kids = Math.max(1, Math.min(10, kids + d));
  document.getElementById('kidsNum').textContent = kids;
}

/* -- פורמט טלפון ישראלי -- */
function rfmtPhone(el) {
  let v = el.value.replace(/\D/g, '');
  if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
  if (v.length > 11) v = v.slice(0, 11);
  el.value = v;
}

/* -- ולידציה לשדה בודד -- */
function rv(id) {
  const el   = document.getElementById(id);
  const errEl = document.getElementById(id + '-e');
  if (!el) return true;

  const val = el.value.trim();
  let ok = false;

  switch (id) {
    case 'rName':  ok = val.length >= 2; break;
    case 'rPhone': ok = /^05\d-?\d{7}$/.test(val.replace(/\s/g, '')); break;
    case 'rEmail': ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val); break;
    case 'rAddr':  ok = val.length >= 3; break;
    case 'rBdate': {
      if (!val) break;
      const age = Math.floor((Date.now() - new Date(val)) / (365.25 * 24 * 3600 * 1000));
      ok = age >= 16;
      break;
    }
    case 'rRate': ok = parseInt(val) >= 30; break;
    default: ok = true;
  }

  el.classList.toggle('err', !ok && val !== '');
  el.classList.toggle('ok', ok);
  if (errEl) errEl.classList.toggle('show', !ok && val !== '');
  return ok;
}

/* -- ולידציה מלאה לפני שליחה -- */
function validateAll() {
  const fields = ['rName', 'rPhone', 'rEmail', 'rAddr'];
  if (regRole === 'sitter') fields.push('rBdate', 'rRate');

  let allOk = true;
  fields.forEach(f => { if (!rv(f)) allOk = false; });
  return allOk;
}

/* -- שליחת הטופס -- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('regForm').addEventListener('submit', e => {
    e.preventDefault();

    const err = document.getElementById('regGlobalErr');
    const succ = document.getElementById('regSuccess');
    const btn  = document.getElementById('regBtn');

    if (!validateAll()) {
      err.style.display = 'block';
      setTimeout(() => err.style.display = 'none', 3000);
      return;
    }

    btn.textContent = '⏳ שולח...';
    btn.disabled = true;

    /* שמירת הנתונים (ב-production היה נשלח לשרת) */
    const formData = {
      role:    regRole,
      name:    document.getElementById('rName').value,
      phone:   document.getElementById('rPhone').value,
      email:   document.getElementById('rEmail').value,
      address: document.getElementById('rAddr').value,
      ...(regRole === 'family'
        ? { children: kids }
        : {
            birthdate:  document.getElementById('rBdate').value,
            rate:       document.getElementById('rRate').value
          }
      )
    };
    console.log('נתוני הרשמה:', formData);

    setTimeout(() => {
      btn.style.display = 'none';
      succ.style.display = 'block';
    }, 1000);
  });
});
