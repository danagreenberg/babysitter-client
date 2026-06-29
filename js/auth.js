/* ================================================
   auth.js
   מערכת הרשאות מרכזית - נטענת בכל עמוד באתר
   ================================================ */

const BASE_API_URL = 'https://babysitter-server-dc0e.onrender.com';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;

    // עמודים פתוחים שלא דורשים בדיקת הרשאות
    if (currentPath.includes('login.html') || currentPath.includes('register.html') || currentPath === '/' || currentPath.includes('index.html')) {
        return;
    }

    // אם אין טוקן ומנסים לגשת לעמוד פנימי - נעביר להתחברות
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // החלת התפקיד מיידית מ-localStorage (מונע "קפיצה" של הקישורים עד שהשרת עונה)
    const cachedRole = localStorage.getItem('role');
    if (cachedRole) {
        document.body.classList.add(`role-${cachedRole}`);
    }

    try {
        // משיכת פרטי המשתמש מהשרת
        const res = await fetch(`${BASE_API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!data.success) throw new Error('Token invalid');
        
        const userRole = data.data.role; // 'family' או 'sitter'
        localStorage.setItem('role', userRole); // ריענון התפקיד השמור

        // 1. הזרקת התפקיד ל-Body כדי שה-CSS יעשה את הקסם ויסתיר/יציג אלמנטים
        document.body.classList.remove('role-family', 'role-sitter');
        document.body.classList.add(`role-${userRole}`);

        // 2. אבטחת עמודים (Routing Guard)
        // אם בייביסיטר מנסה לגשת לחיפוש משפחות (מה שאסור לה)
        if (userRole === 'sitter' && (currentPath.includes('family-search.html') || currentPath.includes('sitter-profile.html'))) {
            window.location.href = 'upcoming-shifts.html'; // נזרוק אותה למשמרות שלה
        }

    } catch (err) {
        console.error('Authentication failed:', err);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
});

/* ── התנתקות ── */
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'login.html';
}