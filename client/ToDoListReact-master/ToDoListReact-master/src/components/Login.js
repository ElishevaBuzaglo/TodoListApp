import React, { useState } from 'react';
import axios from 'axios';
import todoService from '../service.js';
import { Box, TextField, Button, Typography, Paper, Container, Alert, Divider } from '@mui/material';

function Login({ onLogin, toggleRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            // התיקון כאן: ה-service מחזיר ישירות את הנתונים (res.data)
            const data = await todoService.login(email, password);
            
            // בודקים אם חזר טוקן בתוך האובייקט
            if (data && data.token) {
                // אין צורך ב-setItem כאן שוב כי ה-service כבר עושה זאת, 
                // אבל זה לא מזיק לביטחון:
                localStorage.setItem("token", data.token);
                onLogin();
            }
        } catch (err) {
            // אם השרת מחזיר הודעת שגיאה ספציפית (כמו "סיסמה שגויה"), נציג אותה
            setError(err.response?.data || "אימייל או סיסמה שגויים");
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #F0F4FF 0%, #FAF5FF 100%)' }}>
            <Container maxWidth="xs">
                <Paper elevation={0} sx={{ p: 4, borderRadius: '30px', textAlign: 'center', border: '1px solid #E0E7FF', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 4, color: '#6366F1' }}>התחברות</Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField 
                            fullWidth 
                            label="כתובת אימייל" 
                            placeholder="usermail@example.com" 
                            variant="outlined" 
                            margin="normal" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            InputLabelProps={{ shrink: true }} 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' }, mb: 2 }} 
                            required 
                        />
                        <TextField 
                            fullWidth 
                            label="סיסמה" 
                            placeholder="••••••••" 
                            type="password" 
                            variant="outlined" 
                            margin="normal" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            InputLabelProps={{ shrink: true }} 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' }, mb: 3 }} 
                            required 
                        />
                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
                        <Button fullWidth type="submit" variant="contained" sx={{ py: 1.5, borderRadius: '15px', fontWeight: 'bold', bgcolor: '#6366F1' }}>כניסה</Button>
                    </form>
                    <Divider sx={{ my: 3 }}>או</Divider>
                    <Typography variant="body2" sx={{ color: '#64748B', mt: 2 }}>
                        אין לך חשבון?{' '}
                        <Box
                            component="span"
                            onClick={toggleRegister}
                            sx={{
                                color: '#6366F1',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textDecoration: 'none', 
                                '&:hover': { color: '#4F46E5' }
                            }}
                        >
                            יוצרים אותו כאן
                        </Box>
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}
export default Login;