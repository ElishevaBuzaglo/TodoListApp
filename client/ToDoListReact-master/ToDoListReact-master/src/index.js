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
// והוספת האזנה לעדכונים בשביל ההודעה הכחולה
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    const event = new CustomEvent('swUpdated', { detail: registration });
    window.dispatchEvent(event);
    console.log('TaskMaster: נמצא עדכון חדש!');
  },
  onSuccess: (registration) => {
    console.log('TaskMaster: האפליקציה מוכנה לעבודה אופליין! 🎉');
  }
});