import React, { useEffect, useState, useCallback } from 'react';
import { Container, Paper, List, ListItem, ListItemText, IconButton, Checkbox, Typography, Box, Button, InputBase, Avatar, Fade } from '@mui/material';
import { DeleteOutline, Logout, Add as AddIcon, CheckCircle, RadioButtonUnchecked, WifiOff, Wifi, Sync as SyncIcon } from '@mui/icons-material';
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
  
  const [isSyncing, setIsSyncing] = useState(false); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  // --- תוספת עבור הודעת עדכון גרסה ---
  const [showUpdateBar, setShowUpdateBar] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShowUpdateBar(true);
    window.addEventListener('swUpdated', handleUpdate);
    return () => window.removeEventListener('swUpdated', handleUpdate);
  }, []);
  // ----------------------------------

  // פונקציה לטעינת המשימות מה-Service (מקומי + שרת)
  const getTodos = useCallback(async () => {
    if (token) {
      try {
        const data = await service.getTasks();
        setTodos(data);
        setIsOnline(navigator.onLine);
      } catch (error) { 
        console.error("Error fetching todos:", error);
      }
    }
  }, [token]);

  useEffect(() => {
    // הרשמה לעדכוני סטטוס סנכרון (בשביל האייקון המסתובב)
    service.subscribeToSync(setIsSyncing);

    const handleOnline = async () => {
      setIsOnline(true);
      setShowOnlineMessage(true);
      
      // שלב קריטי: מחכים לסיום הסנכרון (שכולל לוגין אוטומטי אם צריך)
      await service.syncTasks(); 
      // רק אחרי שהסנכרון הסתיים והטוקן עודכן, טוענים משימות
      await getTodos(); 
      
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
  }, [getTodos]);

  useEffect(() => {
    if (token) {
      if (token.startsWith("offline_token")) {
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
    localStorage.removeItem("currentUserEmail");
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
      // הוספה מיידית ל-State כדי שהממשק יגיב מהר
      setTodos(prev => [...prev, addedTask]);
    } catch (error) {
      getTodos(); 
    }
  };

 const handleToggle = async (id, currentStatus) => {
    if (!id) return;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, IsComplete: !currentStatus } : t));
    try {
      await service.setCompleted(id, !currentStatus);
    } catch (error) {
      getTodos(); 
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    setTodos(prev => prev.filter(t => t.id !== id));
    try {
      await service.deleteTask(id);
    } catch (error) {
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
      
      {/* תוספת: הודעת עדכון גרסה כחולה */}
      {showUpdateBar && (
        <Box sx={{ bgcolor: '#6366F1', color: 'white', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, position: 'sticky', top: 0, zIndex: 2000 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>גרסה חדשה זמינה! עדכנו כדי לקבל את השינויים האחרונים.</Typography>
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => {
              if (window.waitingWorker) {
                window.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
              }
              window.location.reload();
            }} 
            sx={{ bgcolor: 'white', color: '#6366F1', '&:hover': { bgcolor: '#F0F0F0' } }}
          >
            רענן עכשיו
          </Button>
        </Box>
      )}

      {!isOnline && (
        <Box sx={{ bgcolor: '#FFFBEB', color: '#B45309', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, borderBottom: '1px solid #FEF3C7', position: 'sticky', top: showUpdateBar ? 56 : 0, zIndex: 1100 }}>
          <WifiOff fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>מצב אופליין פעיל - המשימות יסונכרנו כשתתחבר/י</Typography>
        </Box>
      )}

      <Fade in={showOnlineMessage}>
        <Box sx={{ bgcolor: '#ECFDF5', color: '#059669', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, borderBottom: '1px solid #A7F3D0', position: 'sticky', top: showUpdateBar ? 56 : 0, zIndex: 1100 }}>
          <Wifi fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>החיבור חזר! המשימות מסונכרנות כעת ✨</Typography>
        </Box>
      </Fade>

      <Box sx={{ p: 2, px: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'white', borderBottom: '1px solid #EEE' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#6366F1' }}>TaskMaster</Typography>
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
          {todos.map((t) => {
            const isComp = !!(t.IsComplete || t.isComplete);
            const taskId = t.id || t.Id;
            const taskName = t.Name || t.name;

            return (
              <Paper key={taskId} sx={{ mb: 2, borderRadius: '12px', overflow: 'hidden' }} elevation={0}>
                <ListItem sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <Checkbox
                      checked={isComp}
                      onChange={() => handleToggle(taskId, isComp)}
                      icon={<RadioButtonUnchecked />}
                      checkedIcon={<CheckCircle sx={{ color: '#10B981' }} />}
                      sx={{ ml: 1 }}
                    />
                    <ListItemText
                      primary={taskName}
                      sx={{
                        textAlign: 'right',
                        '& .MuiListItemText-primary': {
                          textDecoration: isComp ? 'line-through' : 'none',
                          color: isComp ? '#94A3B8' : '#312E81',
                          fontWeight: 500
                        }
                      }}
                    />
                  </Box>
                  <IconButton onClick={() => handleDelete(taskId)}>
                    <DeleteOutline sx={{ color: '#FCA5A5', '&:hover': { color: '#EF4444' } }} />
                  </IconButton>
                </ListItem>
              </Paper>
            );
          })}
        </List>
      </Container>
    </Box>
  );
}

export default App;