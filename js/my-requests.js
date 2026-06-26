/* ================================================
   my-requests.js
   טעינת בקשות ממתינות לבייביסיטר ואישור/דחייה
   ================================================ */

const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', loadRequests);

function fmtDateTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL') + ' | ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

async function loadRequests() {
  const token = localStorage.getItem('token');
  const listEl = document.getElementById('requestsList');

  try {
    const res = await fetch(`${API_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);

    const shifts = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
    
    // סינון: רק בקשות שממתינות לאישור
    const pendingRequests = shifts.filter(s => s.status === 'pending');

    if (pendingRequests.length === 0) {
      listEl.innerHTML = '<div class="empty-state">אין לך כרגע בקשות חדשות שממתינות לאישור.</div>';
      return;
    }

    listEl.innerHTML = pendingRequests.map(b => {
      const bookingId = b._id || b.id;
      // הבייביסיטר רואה את פרטי המשפחה שהזמינה אותה
      const familyName = b.family ? b.family.name : 'משפחה לא ידועה';
      const familyImg = (b.family && b.family.img) ? b.family.img : 'images/default-avatar.png';

      return `
        <div class="shift-item">
          <div class="shift-header">
            <div class="sitter-info">
              <img src="${familyImg}" onerror="this.src='https://i.pravatar.cc/150?img=1'">
              <span>${familyName}</span>
            </div>
            <span class="shift-rate">₪${b.rate || 0}/שעה</span>
          </div>
          
          <div class="shift-times">
            <div><strong>התחלה מתוכננת:</strong> ${fmtDateTime(b.scheduledStart)}</div>
            <div><strong>סיום משוער:</strong> ${fmtDateTime(b.scheduledEnd)}</div>
          </div>
          
          <div style="margin-top: 15px;">
            <button class="btn-submit" onclick="updateStatus('${bookingId}', 'approved')">✅ אישור משמרת</button>
            <button class="btn-cancel" onclick="updateStatus('${bookingId}', 'rejected')">❌ דחיית בקשה</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('שגיאה:', err);
    listEl.innerHTML = `<div class="empty-state" style="color: #d32f2f;">שגיאה בטעינת הבקשות</div>`;
  }
}

async function updateStatus(bookingId, newStatus) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    
    showToast(newStatus === 'approved' ? '✅ המשמרת אושרה בהצלחה! היא נוספה למשמרות שלך.' : '❌ הבקשה נדחתה.');
    
    // רענון הרשימה כדי להעלים את הבקשה שטופלה
    loadRequests(); 
    
  } catch (err) {
    showToast('שגיאה בעדכון הסטטוס: ' + err.message);
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show-toast');
  clearTimeout(window._tt);
  window._tt = setTimeout(() => t.classList.remove('show-toast'), 2500);
}