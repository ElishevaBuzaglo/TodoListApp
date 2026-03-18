import React, { useEffect, useState, useCallback } from 'react';
import { Container, Paper, List, ListItem, ListItemText, IconButton, Checkbox, Typography, Box, Button, InputBase, Avatar } from '@mui/material';
import { DeleteOutline, Logout, Add as AddIcon, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { jwtDecode } from 'jwt-decode';
import md5 from 'md5';
import service from './service.js';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState({ name: "", email: "" });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  const getTodos = useCallback(async () => {
    if (token) {
      try {
        const data = await service.getTasks();
        setTodos(data);
      } catch (error) { console.error(error); }
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "משתמש/ת";
        const email = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || "";
        setUser({ name, email });
        getTodos();
      } catch (error) { handleLogout(); }
    }
  }, [token, getTodos]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const handleAddTodo = async (e) => {
    if (e) e.preventDefault();
    if (newTodo.trim()) {
      await service.addTask(newTodo);
      setNewTodo("");
      getTodos();
    }
  };

  if (!token) {
    return isRegisterMode ? <Register onBackToLogin={() => setIsRegisterMode(false)} /> : <Login onLogin={() => setToken(localStorage.getItem("token"))} toggleRegister={() => setIsRegisterMode(true)} />;
  }

  const hash = md5(user.email.trim().toLowerCase());
  const photoUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=150`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFF', direction: 'rtl' }}>
      {/* Header */}
      <Box sx={{ p: 2, px: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white', borderBottom: '1px solid #EEE' }}>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#6366F1' }}>TaskMaster</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{user.name}</Typography>
            <Typography variant="caption" color="textSecondary">{user.email}</Typography>
          </Box>
          <Avatar src={photoUrl} sx={{ width: 42, height: 42, border: '2px solid #6366F1' }}>{user.name.charAt(0)}</Avatar>
          <IconButton onClick={handleLogout} color="error"><Logout /></IconButton>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Typography variant="h4" align="center" sx={{ fontWeight: 900, mb: 4 }}>
          שלום {user.name.split(' ')[0]} 👋✨
        </Typography>

        <Paper
          component="form"
          onSubmit={handleAddTodo}
          sx={{ p: 1, display: 'flex', borderRadius: '15px', mb: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          <InputBase
            sx={{ mr: 2, flex: 1, p: 1, textAlign: 'right' }}
            placeholder="הוסיפי משימה חדשה..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <Button type="submit" sx={{ bgcolor: '#6366F1', color: 'white', borderRadius: '12px', '&:hover': { bgcolor: '#4F46E5' } }}>
            <AddIcon />
          </Button>
        </Paper>

        <List sx={{ p: 0 }}>
          {todos.map((t) => (
            <Paper key={t.id} sx={{ mb: 2, borderRadius: '12px', overflow: 'hidden' }} elevation={0}>
              <ListItem
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between', // זה דוחף את הפח שמאלה ואת השאר ימינה
                  alignItems: 'center',
                  px: 2,
                  py: 1
                }}
              >
                {/* צד ימין: צ'קבוקס וטקסט */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <Checkbox
                    checked={t.isComplete}
                    onChange={async (e) => { await service.setCompleted(t.id, e.target.checked); getTodos(); }}
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle sx={{ color: '#10B981' }} />} // V ירוק
                    sx={{ ml: 1 }}
                  />
                  <ListItemText
                    primary={t.name}
                    sx={{
                      textAlign: 'right',
                      '& .MuiListItemText-primary': {
                        textDecoration: t.isComplete ? 'line-through' : 'none',
                        color: t.isComplete ? '#94A3B8' : '#312E81',
                        fontWeight: 500
                      }
                    }}
                  />
                </Box>

                {/* צד שמאל: פח מחיקה */}
                <IconButton onClick={async () => { await service.deleteTask(t.id); getTodos(); }}>
                  <DeleteOutline sx={{ color: '#FCA5A5', '&:hover': { color: '#EF4444' } }} />
                </IconButton>
              </ListItem>
            </Paper>
          ))}
        </List>
      </Container>
    </Box>
  );
}
export default App;