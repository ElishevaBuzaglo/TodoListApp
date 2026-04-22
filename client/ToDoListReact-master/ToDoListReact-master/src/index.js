import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // הייבוא החדש

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// רישום ה-Service Worker שמאפשר לאתר להיפתח בלי אינטרנט
// כשיש עדכון חדש, הוא מפעיל את הפונקציה onUpdate שמציגה את ההודעה הכחולה ומאפשרת למשתמש לרענן את הדף כדי לקבל את העדכון החדש.
//והוספת האזנה לעדכונים בשביל ההודעה הכחולה
serviceWorkerRegistration.register({
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // 1. זה מה שמעלה את ההודעה ב-App.js
    const event = new Event('swUpdated');
    window.dispatchEvent(event);
    
    // 2. זה שומר את ה-Worker כדי שהכפתור "רענן" יעבוד באמת
    window.waitingWorker = registration.waiting;

    // 3. זה מה שאת רואה בלוג (Console)
    console.log('TaskMaster: נמצא עדכון חדש!');
  },
  onSuccess: (registration) => {
    console.log('TaskMaster: האפליקציה מוכנה לעבודה אופליין! 🎉');
  }
});
  onSuccess: (registration) => {
    console.log('TaskMaster: האפליקציה מוכנה לעבודה אופליין! 🎉');
  }
});