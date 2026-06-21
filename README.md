# Babysitter 🍼

פלטפורמה שמחברת בין משפחות לבייביסיטרים: חיפוש לפי מיקום ומחיר על מפה, מעקב משמרת בזמן אמת, וסיכום תשלום.

## טכנולוגיות

- **צד לקוח:** HTML, CSS, JavaScript (Vanilla), Leaflet (מפות)
- **צד שרת:** Node.js + Express, RESTful API, אחסון בקבצי JSON
- **API חיצוני:** Nominatim / OpenStreetMap (Geocoding)
- **אימות:** JWT + bcrypt

## מבנה הפרויקט

```
WEB-HW/
├── index.html              # דף הבית
├── register.html           # הרשמה (משפחה / בייביסיטר)
├── family-search.html      # חיפוש בייביסיטרים על מפה
├── active-shift.html       # משמרת פעילה (טיימר + מפה)
├── shift-summary.html      # סיכום משמרת ותשלום
├── js/                     # קוד JavaScript של הלקוח
├── style/                  # קובצי CSS
├── images/                 # נכסים גרפיים (favicon וכו')
├── Babysitter.postman_collection.json
├── פרטי-בדיקה.md
└── server/                 # צד שרת
    ├── index.js / app.js
    ├── routes/             # הגדרת ה-endpoints
    ├── controllers/        # הלוגיקה
    ├── middleware/         # auth, errorHandler
    ├── config/db.js        # קריאה/כתיבה ל-JSON
    └── data/               # users, sitters, families, bookings, reviews
```

## הרצה

```bash
cd server
npm install
npm start
```

האתר זמין ב-`http://localhost:3000` (דרך השרת, לא דרך file://).

## עיקרי ה-API

| Method | Endpoint | תיאור |
|--------|----------|-------|
| POST | `/api/auth/register` | הרשמה (משפחה/בייביסיטר) |
| POST | `/api/auth/login` | התחברות |
| GET | `/api/auth/me` | המשתמש המחובר (מוגן) |
| GET | `/api/sitters` | חיפוש + סינון בייביסיטרים |
| GET | `/api/sitters/:id/stats` | סטטיסטיקה מצטברת |
| GET/POST/PUT/DELETE | `/api/sitters` | CRUD מלא |
| GET/POST/PUT/DELETE | `/api/families` | CRUD מלא |
| GET/POST/PUT/DELETE | `/api/bookings` | CRUD מלא + סינון |
| GET/POST | `/api/reviews` | ביקורות |
| GET | `/api/geo/geocode` | API חיצוני – Geocoding |

פירוט מלא עם דוגמאות נמצא ב-`Babysitter.postman_collection.json`.
