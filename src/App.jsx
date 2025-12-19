import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ChatProvider } from './components/ChatContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import './App.css';
import NavBar  from './components/NavBar.jsx';
import { Conversation } from './components/Conversation.jsx';
import { LoginPage } from './components/LoginPage.jsx';
import { RegisterPage } from './components/RegisterPage.jsx';
// Dashboard Component
function Dashboard({ isSidebarOpen, toggleSidebar, handleLogout }) {
  return (
    <div className="page">
      <button className="menu-toggle" onClick={toggleSidebar}>
        Menu
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

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('App loaded - Token:', !!token);
    setIsLoading(false);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-2xl">
        Loading...
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ChatProvider>
                  <Dashboard
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    handleLogout={handleLogout}
                  />
                </ChatProvider>
              </ProtectedRoute>
            }
          />

          {/* Redirect everything else */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

