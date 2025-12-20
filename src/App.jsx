import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from './components/ChatContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import './App.css';
import NavBar  from './components/NavBar.jsx';
import { Conversation } from './components/Conversation.jsx';

// Dashboard Component
function Dashboard({ isSidebarOpen, toggleSidebar }) {
  return (
    <div className="page">
      <button className="menu-toggle" onClick={toggleSidebar}>
        Menu
      </button>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <NavBar />
      </aside>
      <div className="main-wrapper">
        <Conversation />
      </div>
    </div>
  );
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <ErrorBoundary>
      <Router>
        <ChatProvider>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  isSidebarOpen={isSidebarOpen}
                  toggleSidebar={toggleSidebar}
                />
              }
            />
            {/* Redirect everything else to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ChatProvider>
      </Router>
    </ErrorBoundary>
  );
}