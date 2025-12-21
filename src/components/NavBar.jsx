import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiMessageSquare, FiTrash2, FiChevronRight, FiLogOut } from 'react-icons/fi';
import { ChatContext } from './ChatContext.jsx';
import '../styles/navbar.css';

const API_BASE_URL = 'https://mcp-server-and-langgraph-agent-production.up.railway.app/mcp';

function NavBar() {
  const { 
    setMessages, 
    currentSessionId, 
    setCurrentSessionId,
    chatSessions,
    setChatSessions 
  } = useContext(ChatContext);
  
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Assuming backend now provides a tool for this
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "smart_get_history_titles",
            arguments: { token },
            id: 1
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const result = data?.result ?? data;
        setChatSessions(Array.isArray(result) ? result : result?.sessions || []);
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

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "smart_new_chat",
            arguments: { token },
            id: 1
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const result = data?.result ?? data;
        setCurrentSessionId(result.session_id || result.id);
        setMessages([]);
        loadChatSessions();
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleLoadSession = async (sessionId) => {
    console.log('Loading session:', sessionId);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "smart_get_chat_history",
            arguments: { token, session_id: sessionId },
            id: 1
          }
        })
      });

      if (!response.ok) throw new Error('Failed to load history');

      const data = await response.json();
      const result = data?.result ?? data;

      let history = Array.isArray(result) ? result : [];

      const loadedMessages = [];

      history.forEach((entry, idx) => {
        // User message
        loadedMessages.push({
          id: Date.now() + idx * 2,
          sender: 'user',
          text: entry.question || entry.user || '',
          time: entry.time || entry.created_at || null,
        });

        // Bot message
        const botText = entry.content || entry.answer || entry.text || '';

        // References: can be array or stringified JSON
        let refs = entry.references || [];
        if (typeof refs === 'string') {
          try {
            refs = JSON.parse(refs);
          } catch (e) {
            refs = [];
          }
        }
        if (!Array.isArray(refs)) refs = [];

        let sourceContent = null;
        if (refs.length > 0) {
          sourceContent = (
            <div className="references-list">
              {refs.map((ref, i) => (
                <div key={i} className="source-link">
                  <span className="source-label">📚 Source {i + 1}:</span>
                  <a href={ref} target="_blank" rel="noopener noreferrer" className="source-text">
                    {ref}
                  </a>
                </div>
              ))}
            </div>
          );
        }

        loadedMessages.push({
          id: Date.now() + idx * 2 + 1,
          sender: 'bot',
          text: botText,
          time: entry.time || entry.created_at || null,
          sourceContent,
        });
      });

      setMessages(loadedMessages);
      setCurrentSessionId(String(sessionId));
    } catch (error) {
      console.error('Error loading session:', error);
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
      <motion.div className="logo-section" whileHover={{ scale: 1.02 }}>
        <div className="logo">
          <div className="logo-icon">💡</div>
        </div>
        <h2 className="logo-text">Smart Research</h2>
        <p className="logo-subtitle">Research Based Answers</p>
      </motion.div>

      <div className="nav-content">
        <motion.button
          className="nav-item new-chat-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
        >
          <FiRefreshCw className="nav-icon" />
          <span>New Chat</span>
        </motion.button>

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
                    onClick={(e) => {
                      e.stopPropagation();
                      // Implement delete if backend supports it
                    }}
                  >
                    <FiTrash2 size={12} />
                  </button>
                </motion.button>
              ))}
            </div>
          )}
        </div>

       
      </div>

      <div className="nav-footer">
        <p>© 2025 Smart Research</p>
      </div>
    </motion.nav>
  );
}

export default NavBar;