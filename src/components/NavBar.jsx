import React, { useState, useEffect, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiMessageSquare, FiTrash2, FiAlertCircle, FiX } from 'react-icons/fi';
import { ChatContext } from './ChatContext.jsx';
import '../styles/navbar.css';
import logoIcon from '../assets/icon.png';

const API_BASE_URL = 'https://amirhashmi017-mcp-server-and-langgraph-agent.hf.space/mcp';

function NavBar() {
  const { 
    messages,
    setMessages, 
    currentSessionId, 
    setCurrentSessionId,
    chatSessions,
    setChatSessions 
  } = useContext(ChatContext);
  
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadedSessions, setLoadedSessions] = useState(new Set());

  useEffect(() => {
    loadChatSessions();
  }, []);

  // Watch for first bot response to update placeholder title
  useEffect(() => {
    const updatePlaceholderTitle = async () => {
      // Find if current session is a placeholder
      const currentSession = chatSessions.find(s => String(s.id) === String(currentSessionId));
      if (!currentSession?.isPlaceholder) return;

      // Check if we have at least one user message (don't wait for bot response)
      const firstUserMessage = messages.find(msg => msg.sender === 'user');
      if (!firstUserMessage) return;

      const newTitle = firstUserMessage.text.slice(0, 50) + (firstUserMessage.text.length > 50 ? '...' : '');

      // Update the session title locally immediately
      setChatSessions(prev => prev.map(session => 
        String(session.id) === String(currentSessionId)
          ? { ...session, title: newTitle, isPlaceholder: false }
          : session
      ));

      // Refresh from server after a delay to get the actual saved title
      setTimeout(() => {
        loadChatSessions();
      }, 2000);
    };

    updatePlaceholderTitle();
  }, [messages, currentSessionId, chatSessions, setChatSessions]);

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
          setChatSessions(prev => [
            {
              id: sessionId,
              title: "New Chat",
              isPlaceholder: true,
              created_at: new Date().toISOString(),
              last_message: ""
            },
            ...prev
          ]);
        }
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    
    setIsDeleting(true);
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
            name: "smart_delete_chat",
            arguments: {
              token,
              session_id: parseInt(sessionToDelete)
            }
          },
          id: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Delete response:', data);
        
        // Remove from local state
        setChatSessions(prev => prev.filter(session => String(session.id) !== String(sessionToDelete)));
        
        // Remove from loaded sessions cache
        setLoadedSessions(prev => {
          const newSet = new Set(prev);
          newSet.delete(String(sessionToDelete));
          return newSet;
        });
        
        // If current session is being deleted, switch to new chat
        if (String(currentSessionId) === String(sessionToDelete)) {
          setCurrentSessionId(null);
          setMessages([]);
        }
        
        setShowDeleteConfirm(false);
        setSessionToDelete(null);
      } else {
        throw new Error('Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSessionToDelete(null);
  };

  const handleLoadSession = async (sessionId) => {
    // If already the current session, don't reload
    if (String(currentSessionId) === String(sessionId)) {
      console.log('Session already active, skipping reload');
      return;
    }

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

        let displayedAnswer = botText;
        let conclusionText = null;
        
        if (mode === 'deep' && typeof botText === 'string') {
          let cleanedText = botText.replace(/References are listed below\.[\s\S]*?(?=Conclusion:|$)/i, '').trim();

          if (cleanedText.includes('Conclusion:')) {
            const parts = cleanedText.split(/Conclusion:\s*/i);
            displayedAnswer = parts[0].trim();
            conclusionText = parts.slice(1).join('').trim();
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
          conclusionText: conclusionText,
          time: entry.time || entry.created_at || null,
          references: refs,
          original_query,
          corrected_query,
          was_corrected,
          mode,
          isNew: false // Don't animate old messages
        });
      });

      setMessages(loadedMessages);
      setCurrentSessionId(String(sessionId));
      
      // Mark this session as loaded
      setLoadedSessions(prev => new Set(prev).add(String(sessionId)));
    } catch (error) {
      console.error('Error loading session:', error);
      alert('Failed to load chat history. Please try again.');
    }
  };

  const getSessionTitle = () => {
    const session = chatSessions.find(s => String(s.id) === String(sessionToDelete));
    return session?.title || 'this chat';
  };

  // Delete Modal Component
  const DeleteModal = () => {
    if (!showDeleteConfirm) return null;

    return ReactDOM.createPortal(
      <div className="delete-modal-portal">
        <AnimatePresence mode="wait">
          {showDeleteConfirm && (
            <>
              <motion.div
                key="delete-modal-overlay"
                className="delete-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={cancelDelete}
              />
              <motion.div
                key="delete-modal-content"
                className="delete-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
              >
                <div className="delete-modal-header">
                  <FiAlertCircle className="delete-modal-icon" />
                  <button 
                    className="delete-modal-close"
                    onClick={cancelDelete}
                    disabled={isDeleting}
                  >
                    <FiX size={20} />
                  </button>
                </div>
                
                <div className="delete-modal-content">
                  <h3 className="delete-modal-title">Delete Chat?</h3>
                  <p className="delete-modal-text">
                    Are you sure you want to delete "{getSessionTitle()}"? This action cannot be undone.
                  </p>
                </div>

                <div className="delete-modal-actions">
                  <motion.button
                    className="delete-modal-btn delete-cancel-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelDelete}
                    disabled={isDeleting}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    className="delete-modal-btn delete-confirm-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <motion.div
                          className="spinner"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FiTrash2 size={16} />
                        Delete
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>,
      document.body
    );
  };

  return (
    <>
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
                      <div
                        className={`history-title-text ${
                          session.isPlaceholder ? "placeholder-title" : ""
                        }`}
                      >
                        {session.title || "New Chat"}
                      </div>
                      <div className="history-preview">
                        {/* {session.last_message || 'No messages'} */}
                      </div>
                      <div className="history-date">
                        {new Date(session.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className="delete-btn"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <FiTrash2 size={12} />
                    </span>
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

      <DeleteModal />
    </>
  );
}

export default NavBar;