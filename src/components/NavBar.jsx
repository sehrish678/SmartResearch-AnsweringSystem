import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { ChatContext } from './ChatContext.jsx';
import '../styles/navbar.css';  
import { extractSourcesFromText } from '../utils/utils.js';
const API_BASE_URL = 'https://mcp-server-and-langgraph-agent-production.up.railway.app/mcp';

function parseMCPResult(data) {
  // Centralize parsing: the MCP tool often wraps real payload in data.result.content[0].text
  try {
    if (!data) return null;
    if (data.result?.content?.[0]?.text) {
      try {
        return JSON.parse(data.result.content[0].text);
      } catch (e) {
        // Sometimes the text is plain JSON or plain string
        console.warn('Could not JSON.parse content[0].text, returning raw text:', e);
        return data.result.content[0].text;
      }
    }
    return data.result ?? data;
  } catch (err) {
    console.error('parseMCPResult error:', err);
    return null;
  }
}

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
      if (!token) {
        console.warn('No token found in localStorage');
      }
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "smart_get_history_titles",
            arguments: {
              token: token
            }
          },
          id: 1
        })
      });

      const data = await response.json();
      console.debug('loadChatSessions raw response:', { status: response.status, ok: response.ok, data });

      const result = parseMCPResult(data);
      console.debug('loadChatSessions parsed result:', result);

      let sessions = result?.sessions || result?.history || result?.chats || [];
      if (!Array.isArray(sessions)) sessions = [];
      // Normalize session id types (string or number)
      sessions = sessions
        .filter(session => session && session.title !== null)
        .map(s => ({ ...s, session_id: String(s.session_id) }));
      console.debug('Parsed sessions:', sessions);
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    loadChatSessions();
  };

  const handleLoadSession = async (sessionId) => {
  console.log('Attempting to load session:', sessionId);
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "smart_get_chat_history",
          arguments: {
            token: token,
            session_id: sessionId
          }
        },
        id: 1
      })
    });

    const data = await response.json();
    const result = parseMCPResult(data);
    console.log('History load API response:', { status: response.status, data, result });

    // Normalize history array from multiple possible shapes
    let history = Array.isArray(result) ? result : result?.messages || result?.history || result?.chats || [];
    if (!Array.isArray(history)) history = [];

    // Map and normalize message content and extract sources heuristically
    const loadedMessages = [];
    history.forEach((entry, entryIdx) => {
      // Normalize question/user message
      loadedMessages.push({
        id: Date.now() + entryIdx * 2,
        sender: 'user',
        text: entry.question || entry.user || '',
        time: entry.time || entry.created_at || null
      });

      // Normalize bot content
      let botText = entry.content || entry.answer || entry.text || '';
      // If content is stringified JSON, try to parse and extract common fields
      if (typeof botText === 'string' && botText.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(botText);
          botText = parsed.answer || parsed.text || parsed.content || botText;
          // attach parsed references back onto entry for reference extraction below
          entry._parsed = parsed;
        } catch (e) {
          // keep original botText if parse fails
          console.error('Error parsing entry.content JSON:', e);
        }
      }

      // Build sourceContent:
      let sourceContent = null;

      // 1) Prefer structured references stored in parsed content or entry
      const refsFromParsed = entry._parsed?.references || entry._parsed?.sources || entry._parsed?.refs || null;
      const refsFromEntry = entry.references || entry.sources || entry.refs || null;

      const refs = Array.isArray(refsFromParsed) && refsFromParsed.length ? refsFromParsed
                 : Array.isArray(refsFromEntry) && refsFromEntry.length ? refsFromEntry
                 : null;

      if (refs && Array.isArray(refs) && refs.length) {
        sourceContent = (
          <div className="references-list">
            {refs.map((ref, i) => (
              <div key={i} className="source-link">
                <span className="source-label">📚 Source {i + 1}:</span>
                <a href={ref} target="_blank" rel="noopener noreferrer" className="source-text">{ref}</a>
              </div>
            ))}
          </div>
        );
      } else {
        // 2) Fallback: check for explicit "Reference: ..." block inside botText
        const refMatch = typeof botText === 'string' && botText.match(/\n\nReference[s]?:\s*(.*)/i);
        if (refMatch) {
          // remove the Reference line from botText for cleaner display
          botText = botText.replace(/\n\nReference[s]?:\s*.*/i, '').trim();
          const reference = refMatch[1].trim();
          sourceContent = (
            <div className="source-link">
              <span className="source-label">📚 Source:</span>
              <a href={reference} target="_blank" rel="noopener noreferrer" className="source-text">{reference}</a>
            </div>
          );
        } else {
          // 3) Final fallback: heuristic extraction from the visible bot text (URLs, DOIs, markdown links)
          const extracted = extractSourcesFromText(typeof botText === 'string' ? botText : '');
          if (extracted.length) {
            sourceContent = (
              <div className="references-list">
                {extracted.map((ref, i) => (
                  <div key={i} className="source-link">
                    <span className="source-label">📚 Source {i + 1}:</span>
                    <a href={ref} target="_blank" rel="noopener noreferrer" className="source-text">{ref}</a>
                  </div>
                ))}
              </div>
            );
          }
        }
      }

      loadedMessages.push({
        id: Date.now() + entryIdx * 2 + 1,
        sender: 'bot',
        text: botText,
        time: entry.time || entry.created_at || null,
        sourceContent
      });
    });

    console.log('Mapped loaded messages:', loadedMessages);

    setMessages(loadedMessages);
    setCurrentSessionId(String(sessionId));
  } catch (error) {
    console.error('Error loading session:', error);
  }
};

 const handleDeleteSession = async (sessionId, e) => {
  e.stopPropagation();
  if (!confirm('Delete this chat?')) return;

  const sid = String(sessionId);
  const token = localStorage.getItem('token');
  if (!token) {
    alert('No token found in localStorage — cannot authenticate delete request.');
    return;
  }

  try {
    // send delete request
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "smart_delete_session",
          arguments: {
            token: token,
            session_id: sessionId
          }
        },
        id: 1
      })
    });

    // capture raw text for debugging (some MCP responses are string-wrapped JSON)
    const rawText = await response.text();
    console.debug('Delete session raw response text:', rawText);

    // try parse the outer JSON
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      parsed = rawText;
    }
    console.debug('Delete session parsed outer JSON:', parsed);

    // try to extract inner MCP payload (data.result.content[0].text)
    let inner = parsed?.result?.content?.[0]?.text ?? parsed?.result ?? parsed;
    let innerParsed = inner;
    if (typeof inner === 'string') {
      try {
        innerParsed = JSON.parse(inner);
      } catch (e) {
        // not JSON, keep as string
      }
    }
    console.debug('Delete session innerParsed:', innerParsed);

    // Decide whether server confirmed deletion
    const didSucceed = response.ok && (
      innerParsed === true ||
      innerParsed?.success === true ||
      innerParsed?.deleted === true ||
      innerParsed?.status === 'ok' ||
      (typeof innerParsed === 'string' && /deleted|success|ok/i.test(innerParsed))
    );

    if (!didSucceed) {
      console.warn('Delete did not succeed according to server response. Full parsed payload logged above.');
      // reload sessions to reconcile UI with server state
      await loadChatSessions();
      alert('Could not delete session: server did not confirm deletion. Check console/network for the server response.');
      return;
    }

    // Success: update frontend state
    setChatSessions(prev => prev.filter(s => String(s.session_id) !== sid));
    if (String(currentSessionId) === sid) {
      setMessages([]);
      setCurrentSessionId(null);
    }

    // final reconciliation fetch
    await loadChatSessions();

  } catch (error) {
    console.error('Network/error deleting session:', error);
    alert('Network error while deleting session; see console for details.');
  }
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
          <div className="logo-icon">💡</div>
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

        {/* Temporary Reload Button for Testing */}
        <motion.button
          className="nav-item reload-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadChatSessions}
        >
          <FiRefreshCw className="nav-icon" />
          <span>Reload History</span>
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
                <motion.div
                  key={session.session_id}
                  className={`history-item ${String(currentSessionId) === String(session.session_id) ? 'active' : ''}`}
                  whileHover={{ backgroundColor: 'rgba(239, 106, 54, 0.08)' }}
                  onClick={() => handleLoadSession(session.session_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLoadSession(session.session_id);
                    }
                  }}
                >
                  <div className="history-item-content">
                    <div className="history-title-text">
                      {session.title || `Chat ${session.session_id}`}
                    </div>
                    <div className="history-preview">
                      {session.title || 'No messages'}
                    </div>
                    <div className="history-date">
                      {session.created_at ? new Date(session.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
                  >
                    <FiTrash2 size={12} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="nav-footer">
        <p>© 2025 Smart Research</p>
      </div>
    </motion.nav>
  );
}

export default NavBar;