import axios from 'axios';
import Dexie from 'dexie';

const db = new Dexie('TodoDB');
db.version(3).stores({ // גרסה 3
    tasks: '++id, Name, IsComplete, synced, userEmail, [userEmail+synced], [userEmail+Name]', 
    users: 'email, password, token, Username'
});

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
axios.defaults.baseURL = isLocalhost ? "http://localhost:5049/api" : process.env.REACT_APP_API_URL;

let onSyncStatusChange = null;
const setSyncing = (status) => { if (onSyncStatusChange) onSyncStatusChange(status); };

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token && !token.startsWith("offline_token")) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// הגדרת השירות כאובייקט
const todoService = {
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
            await axios.post('/Auth/register', { Email: email, Password: password, Username: fullName });
            const loginRes = await axios.post('/Auth/login', { email, password });
            const token = loginRes.data.token;
            localStorage.setItem("token", token);
            localStorage.setItem("currentUserEmail", email);
            await db.users.put({ email, password, Username: fullName, token });
            return loginRes.data;
        } else {
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
                // לוגין בלבד בלי רגיסטר (מונע שגיאה 500)
                const loginRes = await axios.post('/Auth/login', { email: localUser.email, password: localUser.password });
                await db.users.update(email, { token: loginRes.data.token });
                localStorage.setItem("token", loginRes.data.token);
                return true;
            } catch (e) { return false; }
        }
        return true;
    },

    syncItems: async (email) => {
        setSyncing(true);
        try {
            const unsynced = await db.tasks.where({ userEmail: email, synced: 0 }).toArray();
            for (let task of unsynced) {
                try {
                    if (task.deleted === 1) {
                        if (!task.isNewOffline) await axios.delete(`/Items/${task.id}`);
                        await db.tasks.delete(task.id);
                    } 
                    else if (task.isNewOffline) {
                        const res = await axios.post('/Items', { 
                            Name: task.Name || task.name, 
                            IsComplete: !!(task.IsComplete || task.isComplete) 
                        });
                        const serverId = res.data.id || res.data.Id;
                        await db.tasks.delete(task.id); // מחיקת הזמני מהמחשב
                        await db.tasks.put({ ...task, id: serverId, synced: 1, isNewOffline: false });
                    }
                } catch (e) { console.error("Sync item error:", e); }
            }
        } finally { setSyncing(false); }
    },

    syncTasks: async () => {
        if (!navigator.onLine) return;
        const email = localStorage.getItem("currentUserEmail");
        if (!email) return;
        setSyncing(true);
        try {
            // קריאה לפונקציות פנימיות דרך האובייקט כדי למנוע שגיאות Scope
            const userOk = await todoService.syncUser(email);
            if (userOk) {
                await todoService.syncItems(email);
            }
        } finally { setSyncing(false); }
    },

    getTasks: async () => {
        const email = localStorage.getItem("currentUserEmail");
        if (!email) return [];
        if (navigator.onLine) {
            try {
                const res = await axios.get('/Items');
                const serverTasks = res.data.map(t => ({
                    id: t.id || t.Id,
                    Name: t.Name || t.name,
                    IsComplete: !!(t.IsComplete || t.isComplete),
                    userEmail: email, synced: 1, isNewOffline: false, deleted: 0
                }));
                
                // ניקוי כפילויות: מוחקים מהמחשב כל משימה עם שם זהה למה שהגיע מהשרת
                for (let st of serverTasks) {
                    await db.tasks.where({ userEmail: email, Name: st.Name }).delete();
                }
                
                await db.tasks.bulkPut(serverTasks);
                return serverTasks;
            } catch (e) { console.error("Fetch failed", e); }
        }
        return await db.tasks.where('userEmail').equals(email).filter(t => t.deleted !== 1).toArray();
    },

    addTask: async (name) => {
        const currentUser = localStorage.getItem("currentUserEmail");
        const newTask = { Name: name, IsComplete: false, synced: 0, deleted: 0, userEmail: currentUser, isNewOffline: true };
        const localId = await db.tasks.add(newTask);
        if (navigator.onLine) {
            try {
                const res = await axios.post('/Items', { Name: name, IsComplete: false });
                await db.tasks.delete(localId);
                const serverId = res.data.id || res.data.Id;
                const serverTask = { ...newTask, id: serverId, synced: 1, isNewOffline: false };
                await db.tasks.put(serverTask);
                return serverTask;
            } catch (e) {}
        }
        return { ...newTask, id: localId };
    },

    deleteTask: async (id) => {
        const task = await db.tasks.get(id);
        if (!task) return;
        if (navigator.onLine && !task.isNewOffline) {
            try { 
                await axios.delete(`/Items/${id}`); 
                await db.tasks.delete(id); 
            } catch (e) { await db.tasks.update(id, { deleted: 1, synced: 0 }); }
        } else {
            if (task.isNewOffline) await db.tasks.delete(id);
            else await db.tasks.update(id, { deleted: 1, synced: 0 });
        }
    },

    setCompleted: async (id, isComplete) => {
        const task = await db.tasks.get(id);
        if (!task) return;
        await db.tasks.update(id, { IsComplete: isComplete, synced: 0 });
        if (navigator.onLine && !task.isNewOffline) {
            try {
                await axios.put(`/Items/${id}`, { Name: task.Name, IsComplete: isComplete });
                await db.tasks.update(id, { synced: 1 });
            } catch (e) {}
        }
    }
};

export default todoService;