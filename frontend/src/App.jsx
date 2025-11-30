import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import './App.css';
import { NavBar } from './components/NavBar.jsx';
import { Conversation } from './components/Conversation.jsx';
import { LoginPage } from './components/LoginPage.jsx';
import { RegisterPage } from './components/RegisterPage.jsx';
import { ChatContext } from './components/ChatContext.jsx';

localStorage.clear(); // Add this temporarily in App.jsx

// Dashboard Component
function Dashboard({ isSidebarOpen, toggleSidebar, handleLogout }) {
  
  return (
    <div className="page">
      <button className="menu-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <NavBar onLogout={handleLogout} />
      </aside>
      <div className="main-wrapper">
        <Conversation />
      </div>
    </div>
  );
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  // Check if user is logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('App loaded - Token exists:', !!token);
    setIsLoading(false);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
  };

  // Show loading screen while checking token
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
        <ChatContext.Provider value={{ messages, setMessages }}>

    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Register Route */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard 
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                handleLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
        </ChatContext.Provider>
  );
}

export default App;