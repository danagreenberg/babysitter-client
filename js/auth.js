/* ================================================
   auth.js
   מערכת הרשאות מרכזית - נטענת בכל עמוד באתר
   ================================================ */

const BASE_API_URL = 'http://localhost:3000';

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

    try {
        // משיכת פרטי המשתמש מהשרת
        const res = await fetch(`${BASE_API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!data.success) throw new Error('Token invalid');
        
        const userRole = data.data.role; // 'family' או 'sitter'
        
        // 1. הזרקת התפקיד ל-Body כדי שה-CSS יעשה את הקסם ויסתיר/יציג אלמנטים
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