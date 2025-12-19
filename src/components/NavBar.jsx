import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiMessageSquare, FiTrash2, FiChevronRight, FiLogOut } from 'react-icons/fi';
import { ChatContext } from './ChatContext.jsx';
import '../styles/navbar.css';  
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function NavBar() {
  const { 
    setMessages, 
    currentSessionId, 
    setCurrentSessionId,
    chatSessions,
    setChatSessions 
  } = useContext(ChatContext);
  
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

 const handleNewChat = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/chat/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Add empty body since backend expects JSON
      body: JSON.stringify({})
    });

    if (response.ok) {
      const data = await response.json();
      setCurrentSessionId(data.session_id);
      setMessages([]);
      loadChatSessions();
    }
  } catch (error) {
    console.error('Error creating new chat:', error);
  }
};

  const handleLoadSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

    const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

      if (response.ok) {
        const history = await response.json();
        const loadedMessages = history.map((msg, idx) => ({
          id: idx,
          sender: msg.sender,
          text: msg.content,
          time: msg.time
        }));
        
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    
    if (!confirm('Delete this chat?')) return;

    try {
      const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/chat/session/${sessionId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

      if (response.ok) {
        if (currentSessionId === sessionId) {
          setMessages([]);
          setCurrentSessionId(null);
        }
        loadChatSessions();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <motion.nav 
      className="navbar"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo Section */}
      <motion.div 
        className="logo-section"
        whileHover={{ scale: 1.02 }}
      >
        <div className="logo">
          <div className="logo-icon">🔬</div>
        </div>
        <h2 className="logo-text">Smart Research</h2>
        <p className="logo-subtitle">Research Based Answers</p>
      </motion.div>

      {/* Navigation Content */}
      <div className="nav-content">
        {/* New Chat Button */}
        <motion.button
          className="nav-item new-chat-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
        >
          <FiRefreshCw className="nav-icon" />
          <span>New Chat</span>
        </motion.button>

        {/* Chat History Section */}
        <div className="chat-history-section">
          <h3 className="history-title">Chat History</h3>
          
          {isLoadingSessions ? (
            <div className="loading-text">Loading...</div>
          ) : chatSessions.length === 0 ? (
            <div className="empty-state">
              <FiMessageSquare size={20} />
              <p>No chats yet</p>
            </div>
          ) : (
            <div className="history-list">
              {chatSessions.map((session) => (
                <motion.button
                  key={session.id}
                  className={`history-item ${currentSessionId === session.id ? 'active' : ''}`}
                  whileHover={{ backgroundColor: 'rgba(239, 106, 54, 0.08)' }}
                  onClick={() => handleLoadSession(session.id)}
                >
                  <div className="history-item-content">
                    <div className="history-title-text">
  {session.title || `Chat ${session.id}`}
</div>
<div className="history-preview">
  {session.last_message || 'No messages'}
</div>
                    <div className="history-date">
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                  >
                    <FiTrash2 size={12} />
                  </button>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <motion.button
          className="logout-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
        >
          <FiLogOut size={16} />
          Logout
        </motion.button>
      </div>

      {/* Footer */}
      <div className="nav-footer">
        <p>© 2025 Smart Research</p>
      </div>
    </motion.nav>
  );
}

export default NavBar;