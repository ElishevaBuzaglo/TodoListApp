import React, { useEffect, useState, useCallback } from 'react';
import { Container, Paper, List, ListItem, ListItemText, IconButton, Checkbox, Typography, Box, Button, InputBase, Avatar, Fade } from '@mui/material';
import { DeleteOutline, Logout, Add as AddIcon, CheckCircle, RadioButtonUnchecked, WifiOff, Wifi, Sync as SyncIcon } from '@mui/icons-material'; // הוספתי SyncIcon
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
  
  const [isSyncing, setIsSyncing] = useState(false); // סטייט חדש לאייקון
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    // חיבור ה-App לסרוויס כדי לדעת מתי יש סנכרון
    service.subscribeToSync(setIsSyncing);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineMessage(true);
      service.syncTasks().then(() => getTodos()); // סנכרון כשחוזר האינטרנט
      setTimeout(() => setShowOnlineMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineMessage(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTodos = useCallback(async () => {
    if (token) {
      try {
        const data = await service.getTasks();
        setTodos(data);
        setIsOnline(true);
      } catch (error) { 
        console.error("Error fetching todos:", error);
      }
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      if (token.startsWith("offline_token")) {
        // טיפול בכניסה אופליין
        setUser({ name: "משתמש (אופליין)", email: localStorage.getItem("currentUserEmail") || "" });
        getTodos();
      } else {
        try {
          const decoded = jwtDecode(token);
          const name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "משתמש/ת";
          const email = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || "";
          setUser({ name, email });
          getTodos();
        } catch (error) { 
          handleLogout(); 
        }
      }
    }
  }, [token, getTodos]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUserEmail"); // ניקוי אימייל בלוגאוט
    setToken(null);
  };

  const updateToken = () => setToken(localStorage.getItem("token"));

  const handleAddTodo = async (e) => {
    if (e) e.preventDefault();
    if (!newTodo.trim()) return;

    const taskName = newTodo;
    setNewTodo(""); 

    try {
      const addedTask = await service.addTask(taskName);
      setTodos(prev => [...prev, addedTask]);
    } catch (error) {
      console.error("Add failed:", error);
      getTodos(); 
    }
  };

  const handleToggle = async (id, currentStatus) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, IsComplete: !currentStatus } : t));
    try {
      await service.setCompleted(id, !currentStatus);
    } catch (error) {
      console.error("Toggle failed:", error);
      getTodos(); 
    }
  };

  const handleDelete = async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    try {
      await service.deleteTask(id);
    } catch (error) {
      console.error("Delete failed:", error);
      getTodos(); 
    }
  };
  
  if (!token) {
    return isRegisterMode ? 
      <Register onBackToLogin={() => setIsRegisterMode(false)} onRegister={updateToken} /> : 
      <Login onLogin={updateToken} toggleRegister={() => setIsRegisterMode(true)} />;
  }

  const hash = md5(user.email.trim().toLowerCase());
  const photoUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon&s=150`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFF', direction: 'rtl' }}>
      
      {!isOnline && (
        <Box sx={{ bgcolor: '#FFFBEB', color: '#B45309', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, borderBottom: '1px solid #FEF3C7', position: 'sticky', top: 0, zIndex: 1100 }}>
          <WifiOff fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>מצב אופליין פעיל - המשימות יסונכרנו כשתתחבר/י</Typography>
        </Box>
      )}

      <Fade in={showOnlineMessage}>
        <Box sx={{ bgcolor: '#ECFDF5', color: '#059669', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, borderBottom: '1px solid #A7F3D0', position: 'sticky', top: 0, zIndex: 1100 }}>
          <Wifi fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>החיבור חזר! המשימות מסונכרנות כעת ✨</Typography>
        </Box>
      </Fade>

      <Box sx={{ p: 2, px: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white', borderBottom: '1px solid #EEE' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#6366F1' }}>TaskMaster</Typography>
            {/* אייקון סנכרון שמופיע רק כשמסתנכרן */}
            {isSyncing && (
                <SyncIcon sx={{ 
                    fontSize: 18, 
                    color: '#6366F1',
                    animation: 'spin 2s linear infinite',
                    '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                }} />
            )}
        </Box>
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

        <Paper component="form" onSubmit={handleAddTodo} sx={{ p: 1, display: 'flex', borderRadius: '15px', mb: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <InputBase sx={{ mr: 2, flex: 1, p: 1, textAlign: 'right' }} placeholder="הוסיפי משימה חדשה..." value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
          <Button type="submit" sx={{ bgcolor: '#6366F1', color: 'white', borderRadius: '12px', '&:hover': { bgcolor: '#4F46E5' } }}>
            <AddIcon />
          </Button>
        </Paper>

        <List sx={{ p: 0 }}>
          {todos.map((t) => (
            <Paper key={t.id} sx={{ mb: 2, borderRadius: '12px', overflow: 'hidden' }} elevation={0}>
              <ListItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <Checkbox
                    checked={!!(t.IsComplete || t.isComplete)}
                    onChange={() => handleToggle(t.id, !!(t.IsComplete || t.isComplete))}
                    icon={<RadioButtonUnchecked />}
                    checkedIcon={<CheckCircle sx={{ color: '#10B981' }} />}
                    sx={{ ml: 1 }}
                  />
                  <ListItemText
                    primary={t.Name || t.name}
                    sx={{
                      textAlign: 'right',
                      '& .MuiListItemText-primary': {
                        textDecoration: (t.IsComplete || t.isComplete) ? 'line-through' : 'none',
                        color: (t.IsComplete || t.isComplete) ? '#94A3B8' : '#312E81',
                        fontWeight: 500
                      }
                    }}
                  />
                </Box>
                <IconButton onClick={() => handleDelete(t.id)}>
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