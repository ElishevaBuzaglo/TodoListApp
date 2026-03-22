import axios from 'axios';

// הכתובת של השרת ב-Render - ודאי שזה כולל את ה-/api
axios.defaults.baseURL = process.env.REACT_APP_API_URL;
// Interceptor שמוסיף את הטוקן לכל בקשה באופן אוטומטי
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const todoService = {
    login: async (email, password) => {
        // שולחים אובייקט שתואם ל-AuthDto בשרת
        const res = await axios.post('/Auth/login', { email, password });
        if (res.data.token) localStorage.setItem("token", res.data.token);
        return res.data;
    },

    register: async (email, password, fullName) => {
        // כאן אנחנו ממפים את fullName לשדה Username שהשרת מצפה לו
        return await axios.post('/Auth/register', { 
            Email: email, 
            Password: password, 
            Username: fullName 
        });
    },

    getTasks: async () => {
        const res = await axios.get('/Items');
        return res.data;
    },

    addTask: async (name) => {
        return await axios.post('/Items', { name, isComplete: false });
    },

    deleteTask: async (id) => {
        return await axios.delete(`/Items/${id}`);
    }
};

export default todoService;