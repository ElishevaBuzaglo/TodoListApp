import axios from 'axios';
import Dexie from 'dexie';

const db = new Dexie('TodoDB');
// עדכון גרסה ל-2 בגלל שינוי ה-Schema
db.version(2).stores({
    tasks: '++id, Name, IsComplete, synced, userEmail, isNewOffline, deleted', 
    users: 'email, password, token, Username'
});

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
axios.defaults.baseURL = isLocalhost ? "http://localhost:5049/api" : process.env.REACT_APP_API_URL;

// --- ניהול סטטוס סנכרון עבור האייקון ב-App.js ---
let onSyncStatusChange = null;
const setSyncing = (status) => { if (onSyncStatusChange) onSyncStatusChange(status); };

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    // תיקון: לא שולחים טוקן "אופליין" לשרת כי הוא יחזיר 401
    if (token && !token.startsWith("offline_token")) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const todoService = {
    // מאפשר ל-App.js להירשם לעדכוני סנכרון
    subscribeToSync: (callback) => { onSyncStatusChange = callback; },

    login: async (email, password) => {
        if (navigator.onLine) {
            try {
                const res = await axios.post('/Auth/login', { email, password });
                if (res.data.token) {
                    localStorage.setItem("token", res.data.token);
                    localStorage.setItem("currentUserEmail", email);
                    await db.users.put({ email, password, token: res.data.token });
                    return res.data;
                }
            } catch (error) { throw error; }
        }
        const localUser = await db.users.get(email);
        if (localUser && localUser.password === password) {
            const token = localUser.token || "offline_token_" + Date.now();
            localStorage.setItem("token", token);
            localStorage.setItem("currentUserEmail", email);
            return { token, isOffline: true };
        }
        throw new Error("משתמש לא נמצא או סיסמה שגויה");
    },

    register: async (email, password, fullName) => {
        if (navigator.onLine) {
            // אם המשתמש קיים, השרת יזרוק שגיאה ו-Register.js יטפל בזה
            await axios.post('/Auth/register', { Email: email, Password: password, Username: fullName });
            const loginRes = await axios.post('/Auth/login', { email, password });
            const token = loginRes.data.token;
            localStorage.setItem("token", token);
            localStorage.setItem("currentUserEmail", email);
            await db.users.put({ email, password, Username: fullName, token });
            return loginRes.data;
        } else {
            // רישום אופליין - יוצרים טוקן זמני כדי לאפשר כניסה מיידית
            const offlineToken = "offline_token_" + Date.now();
            await db.users.put({ email, password, Username: fullName });
            localStorage.setItem("token", offlineToken);
            localStorage.setItem("currentUserEmail", email);
            return { token: offlineToken, isOffline: true };
        }
    },

    syncUser: async (email) => {
        const localUser = await db.users.get(email);
        if (localUser && (!localUser.token || localUser.token.startsWith("offline_token"))) {
            try {
                await axios.post('/Auth/register', { Email: localUser.email, Password: localUser.password, Username: localUser.Username });
                const loginRes = await axios.post('/Auth/login', { email: localUser.email, password: localUser.password });
                await db.users.update(email, { token: loginRes.data.token });
                localStorage.setItem("token", loginRes.data.token);
                return true;
            } catch (e) { return false; }
        }
        return true;
    },

    syncItems: async (email) => {
        const unsynced = await db.tasks.where({ userEmail: email, synced: 0 }).toArray();
        for (let task of unsynced) {
            try {
                if (task.deleted === 1) {
                    if (!task.isNewOffline) await axios.delete(`/Items/${task.id}`);
                    await db.tasks.delete(task.id);
                } else if (task.isNewOffline) {
                    const res = await axios.post('/Items', { Name: task.Name || task.name, IsComplete: !!(task.IsComplete || task.isComplete) });
                    await db.tasks.delete(task.id);
                    await db.tasks.add({ ...task, id: res.data.id || res.data.Id, synced: 1, isNewOffline: false });
                } else {
                    await axios.put(`/Items/${task.id}`, { Name: task.Name || task.name, IsComplete: !!(task.IsComplete || task.isComplete) });
                    await db.tasks.update(task.id, { synced: 1 });
                }
            } catch (e) { console.error("Sync item failed", e); }
        }
    },

    syncTasks: async () => {
        if (!navigator.onLine) return;
        const email = localStorage.getItem("currentUserEmail");
        if (!email) return;
        
        setSyncing(true); // מפעיל את האייקון המסתובב
        try {
            if (await todoService.syncUser(email)) {
                await todoService.syncItems(email);
            }
        } finally { 
            setSyncing(false); // מכבה את האייקון
        }
    },

    getTasks: async () => {
        const currentUser = localStorage.getItem("currentUserEmail");
        if (!currentUser) return [];
        if (navigator.onLine) {
            try {
                const res = await axios.get('/Items');
                const offlineDeletedIds = (await db.tasks.where('deleted').equals(1).toArray()).map(t => t.id);
                await db.transaction('rw', db.tasks, async () => {
                    await db.tasks.where('userEmail').equals(currentUser).and(t => t.synced === 1).delete();
                    const tasksFromServer = res.data.filter(t => !offlineDeletedIds.includes(t.id || t.Id)).map(t => ({
                        id: t.id || t.Id, Name: t.Name || t.name, IsComplete: !!(t.IsComplete || t.isComplete),
                        synced: 1, deleted: 0, userEmail: currentUser, isNewOffline: false
                    }));
                    await db.tasks.bulkPut(tasksFromServer);
                });
            } catch (e) { console.error("Fetch tasks failed", e); }
        }
        return await db.tasks.where('userEmail').equals(currentUser).and(t => t.deleted !== 1).toArray();
    },

    addTask: async (name) => {
        const currentUser = localStorage.getItem("currentUserEmail");
        const newTask = { Name: name, IsComplete: false, synced: 0, deleted: 0, userEmail: currentUser, isNewOffline: true };
        const localId = await db.tasks.add(newTask);
        
        const token = localStorage.getItem("token");
        if (navigator.onLine && token && !token.startsWith("offline_token")) {
            try {
                const res = await axios.post('/Items', { Name: name, IsComplete: false });
                await db.tasks.delete(localId);
                const serverTask = { ...newTask, id: res.data.id || res.data.Id, synced: 1, isNewOffline: false };
                await db.tasks.add(serverTask);
                return serverTask;
            } catch (e) { }
        }
        return { ...newTask, id: localId };
    },

    deleteTask: async (id) => {
        const task = await db.tasks.get(id);
        if (!task) return;
        const token = localStorage.getItem("token");
        if (navigator.onLine && !task.isNewOffline && token && !token.startsWith("offline_token")) {
            try { await axios.delete(`/Items/${id}`); await db.tasks.delete(id); }
            catch (e) { await db.tasks.update(id, { deleted: 1, synced: 0 }); }
        } else {
            if (task.isNewOffline) await db.tasks.delete(id);
            else await db.tasks.update(id, { deleted: 1, synced: 0 });
        }
    },

    setCompleted: async (id, isComplete) => {
        const task = await db.tasks.get(id);
        if (!task) return;
        await db.tasks.update(id, { IsComplete: isComplete, synced: 0 });
        const token = localStorage.getItem("token");
        if (navigator.onLine && !task.isNewOffline && token && !token.startsWith("offline_token")) {
            try {
                await axios.put(`/Items/${id}`, { Name: task.Name || task.name, IsComplete: isComplete });
                await db.tasks.update(id, { synced: 1 });
            } catch (e) { }
        }
    }
};

window.addEventListener('online', todoService.syncTasks);
export default todoService;