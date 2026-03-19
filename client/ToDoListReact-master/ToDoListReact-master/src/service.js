import axios from 'axios';

// כתובת ה-API שלך
axios.defaults.baseURL = "https://todolist-server-xxf4.onrender.com/api";

// Interceptor: מוסיף את הטוקן לכל בקשה באופן אוטומטי
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Interceptor: מטפל במקרה שהטוקן פג תוקף (401)
axios.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.reload(); // מחזיר ללוגין
        }
        return Promise.reject(err);
    }
);

const todoService = {
    login: async (email, password) => {
        const res = await axios.post('/auth/login', { email, password });
        if (res.data.token) localStorage.setItem("token", res.data.token);
        return res.data;
    },
    register: async (email, password, username) => {
        return await axios.post('/auth/register', { email, password, username });
    },
    getTasks: async () => (await axios.get('/items')).data,
    addTask: async (name) => await axios.post('/items', { name, isComplete: false }),
    deleteTask: async (id) => await axios.delete(`/items/${id}`),
    setCompleted: async (id, isComplete) => await axios.put(`/items/${id}`, { id, isComplete })
};

export default todoService;