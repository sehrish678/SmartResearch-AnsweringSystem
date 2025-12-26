import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { ChatContext } from './ChatContext.jsx';
import '../styles/navbar.css';
import logoIcon from '../assets/icon.png';
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
  const [tempNewChatId, setTempNewChatId] = useState(null); // Track temporary "New Chat"

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "smart_get_history_titles",
            arguments: { token }
          },
          id: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Raw sessions response:', data);
        
        let sessions = [];
        if (data?.result?.content?.[0]?.text) {
          try {
            const parsed = JSON.parse(data.result.content[0].text);
            sessions = parsed.history || [];
          } catch (e) {
            console.error('Error parsing sessions:', e);
          }
        }
        
        const formattedSessions = sessions
          .map(s => ({
            id: s.session_id,
            title: s.title || null,
            created_at: s.created_at,
            last_message: s.last_message || ''
          }))
          .filter(s => s.title && s.title.trim() !== ''); 

        setChatSessions(formattedSessions);
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
            arguments: { token }
          },
          id: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('New chat response:', data);
        
        let sessionId = null;
        if (data?.result?.content?.[0]?.text) {
          try {
            const parsed = JSON.parse(data.result.content[0].text);
            sessionId = parsed.session_id || parsed.id;
          } catch (e) {
            sessionId = data?.result?.session_id || data?.result?.id;
          }
        }
        
        if (sessionId) {
          setCurrentSessionId(sessionId);
          setMessages([]);
          setTempNewChatId(sessionId); 
          
          const tempSession = {
            id: sessionId,
            title: 'New Chat',
            created_at: new Date().toISOString(),
            last_message: '',
            isTemp: true
          };
          
          setChatSessions(prev => [tempSession, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleLoadSession = async (sessionId) => {
    console.log('Loading session:', sessionId);
    
    if (tempNewChatId && String(tempNewChatId) !== String(sessionId)) {
      setTempNewChatId(null);
      await loadChatSessions();
    }
    
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
            arguments: { token, session_id: sessionId }
          },
          id: 1
        })
      });

      if (!response.ok) throw new Error('Failed to load history');

      const data = await response.json();
      console.log('Chat history response:', data);

      let history = [];
      if (data?.result?.content?.[0]?.text) {
        try {
          const parsed = JSON.parse(data.result.content[0].text);
          history = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Error parsing chat history:', e);
        }
      }

      const loadedMessages = [];

      history.forEach((entry, idx) => {
        loadedMessages.push({
          id: Date.now() + idx * 2,
          sender: 'user',
          text: entry.question || entry.user || '',
          time: entry.time || entry.created_at || null,
        });

        let botText = entry.content || entry.answer || entry.text || '';
        let mode = entry.mode || 'simple'; 

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
                  {ref.startsWith('http') || ref.includes('doi.org') ? (
                    <a href={ref} target="_blank" rel="noopener noreferrer" className="source-text">
                      {ref}
                    </a>
                  ) : (
                    <span className="source-text">{ref}</span>
                  )}
                </div>
              ))}
            </div>
          );
        }

        let displayedAnswer = botText;
        if (mode === 'deep' && typeof botText === 'string') {
          let cleanedText = botText.replace(/References are listed below\.[\s\S]*?(?=Conclusion:|$)/i, '').trim();

          if (cleanedText.includes('Conclusion:')) {
            const parts = cleanedText.split(/Conclusion:\s*/i);
            const preConclusion = parts[0].trim();
            const conclusionText = parts.slice(1).join('').trim();

            displayedAnswer = (
              <>
                {preConclusion && preConclusion}
                {conclusionText && (
                  <div className="conclusion-highlight">
                    <strong>📌 Conclusion:</strong> {conclusionText}
                  </div>
                )}
              </>
            );
          }
        }

        let was_corrected = false;
        let original_query = entry.original_query || null;
        let corrected_query = entry.corrected_query || null;

        if (original_query && corrected_query && original_query !== corrected_query) {
          was_corrected = true;
        }

        loadedMessages.push({
          id: Date.now() + idx * 2 + 1,
          sender: 'bot',
          text: displayedAnswer,
          time: entry.time || entry.created_at || null,
          sourceContent,
          original_query,
          corrected_query,
          was_corrected,
          mode,
        });
      });

      setMessages(loadedMessages);
      setCurrentSessionId(String(sessionId));
    } catch (error) {
      console.error('Error loading session:', error);
      alert('Failed to load chat history. Please try again.');
    }
  };

  // Get display title for a session
  const getSessionTitle = (session) => {
    if (String(session.id) === String(tempNewChatId)) {
      return 'New Chat';
    }
    return session.title;
  };

  return (
    <motion.nav 
      className="navbar"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="logo-section" whileHover={{ scale: 1.02 }}>
       <motion.div
            className="logo-image-wrapper"
            whileHover={{ scale: 1.15, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <img 
              src={logoIcon} 
              alt="Smart Research Logo" 
              className="logo-image"
            />
          </motion.div>
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
                  className={`history-item ${String(currentSessionId) === String(session.id) ? 'active' : ''}`}
                  whileHover={{ backgroundColor: 'rgba(239, 106, 54, 0.08)' }}
                  onClick={() => handleLoadSession(session.id)}
                >
                  <div className="history-item-content">
                    <div className="history-title-text">
                      {getSessionTitle(session)}
                    </div>
                    <div className="history-preview">
                      {/* {session.last_message || 'No messages'} */}
                    </div>
                    <div className="history-date">
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </div>
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