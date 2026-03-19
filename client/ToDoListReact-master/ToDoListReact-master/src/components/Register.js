import React, { useState } from 'react';
import todoService from '../service.js';
import { Box, TextField, Button, Typography, Paper, Container, Alert, Divider } from '@mui/material';

function Register({ onBackToLogin }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            // קריאה ל-service עם הפרמטרים הנכונים
            await todoService.register(email, password, fullName);
            alert("נרשמת בהצלחה! כעת ניתן להתחבר");
            onBackToLogin();
        } catch (err) {
            // הצגת השגיאה הספציפית מהשרת אם קיימת
            setError(err.response?.data?.message || err.response?.data || "שגיאה בהרשמה. ייתכן והאימייל כבר קיים במערכת.");
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #F0F4FF 0%, #FAF5FF 100%)' }}>
            <Container maxWidth="xs">
                <Paper elevation={0} sx={{ p: 4, borderRadius: '30px', textAlign: 'center', border: '1px solid #E0E7FF', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#8B5CF6' }}>יצירת חשבון</Typography>
                    <Typography variant="body2" sx={{ mb: 4, color: '#64748B' }}>הצטרפ/י אלינו לניהול משימות חכם</Typography>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth label="שם מלא" placeholder="ישראל ישראלי"
                            variant="outlined" margin="normal"
                            value={fullName} onChange={e => setFullName(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' }, mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth label="כתובת אימייל" placeholder="usermail@example.com"
                            variant="outlined" margin="normal"
                            value={email} onChange={e => setEmail(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' }, mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth label="סיסמה" placeholder="לפחות 6 תווים"
                            type="password" variant="outlined" margin="normal"
                            value={password} onChange={e => setPassword(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '15px' }, mb: 3 }}
                            required
                        />
                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
                        <Button fullWidth type="submit" variant="contained" sx={{ py: 1.5, borderRadius: '15px', fontWeight: 'bold', background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}>
                            סיום הרשמה
                        </Button>
                    </form>
                    <Divider sx={{ my: 3 }}>או</Divider>
                    <Typography variant="body2" sx={{ color: '#64748B', mt: 2 }}>
                        כבר יש לך חשבון?{' '}
                        <Box
                            component="span"
                            onClick={onBackToLogin}
                            sx={{
                                color: '#8B5CF6',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textDecoration: 'none', 
                                '&:hover': { color: '#7C3AED' }
                            }}
                        >
                            התחבר/י כאן
                        </Box>
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}
export default Register;