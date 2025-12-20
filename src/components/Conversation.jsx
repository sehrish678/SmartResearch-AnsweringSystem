import { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import '../styles/conversation.css';
import { QueryBox } from './QueryBox.jsx';
import { ChatContext } from './ChatContext.jsx';
import { TypewriterText } from './TypewriterText.jsx';
import { extractSourcesFromText } from '../utils/utils.js';

const API_BASE_URL = 'https://mcp-server-and-langgraph-agent-production.up.railway.app/mcp';

export function Conversation() {
  const { messages, setMessages, currentSessionId, loadChatSessions } = useContext(ChatContext);
  const [showWelcome, setShowWelcome] = useState(true);
  const chatPanelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);



async function handleSendQuery(raw, mode = 'simple') {
  const text = raw.trim();
  if (!text) return;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please set your token in localStorage');
    return;
  }

  setShowWelcome(false);
  const userMsg = { id: Date.now(), sender: 'user', text };
  setMessages(prev => [...prev, userMsg]);
  setIsLoading(true);

  try {
    // Build params depending on whether there's an active session
    const params = currentSessionId
      ? {
          name: "smart_send_message",
          arguments: {
            token,
            session_id: currentSessionId,
            message: text,
            mode
          }
        }
      : {
          name: "smart_message_query",
          arguments: {
            token,
            question: text,
            mode
          }
        };

    console.debug('Sending query with params:', params);

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params,
        id: 1
      })
    });

    if (!response.ok) {
      const textBody = await response.text().catch(() => '');
      console.error('Server responded with non-OK status:', response.status, textBody);
      throw new Error('Server error: ' + response.status);
    }

    const rawData = await response.json();
    console.debug('Raw API response data:', rawData, { status: response.status });

    // Robust MCP parsing: handle result.content[0].text (stringified JSON) or direct result
    let parsed = rawData?.result ?? null;

    if (parsed?.content?.[0]?.text) {
      try {
        parsed = JSON.parse(parsed.content[0].text);
      } catch (e) {
        parsed = parsed.content[0].text;
      }
    }

    // If parsed is an array, pick the last element (common variant)
    if (Array.isArray(parsed) && parsed.length > 0) {
      parsed = parsed[parsed.length - 1];
    }

    console.debug('Normalized parsed result:', parsed);

    // Extract answer text robustly
    const answerTextRaw =
      (parsed && (parsed.answer ?? parsed.text ?? parsed.content)) ||
      (typeof parsed === 'string' ? parsed : '') ||
      'No answer returned';

    // Find references in common keys (references, sources, refs, reference)
    let refs =
      parsed?.references ||
      parsed?.sources ||
      parsed?.refs ||
      null;

    if ((!refs || (Array.isArray(refs) && refs.length === 0)) && parsed?.reference) {
      refs = [parsed.reference];
    }

    // Fallback: extract from answer text if no structured refs found
    if ((!refs || (Array.isArray(refs) && refs.length === 0)) && typeof answerTextRaw === 'string') {
      const extracted = extractSourcesFromText(answerTextRaw);
      if (extracted.length) refs = extracted;
    }

    // Build sourceContent if refs exist (show for deep mode primarily, but also if present)
    let sourceContent = null;
    if (refs) {
      const refsArray = Array.isArray(refs) ? refs : [refs];
      if (refsArray.length > 0) {
        sourceContent = (
          <div className="references-list">
            {refsArray.map((ref, idx) => (
              <div key={idx} className="source-link">
                <span className="source-label">📚 Source {idx + 1}:</span>
                <a href={ref} target="_blank" rel="noopener noreferrer" className="source-text">
                  {ref}
                </a>
              </div>
            ))}
          </div>
        );
      }
    }

    // Highlight conclusion in deep mode if present and safe to inspect
    let displayedAnswer = answerTextRaw;
    if (mode === 'deep' && typeof answerTextRaw === 'string' && answerTextRaw.includes('Conclusion:')) {
      const parts = answerTextRaw.split(/Conclusion:\s*/i);
      displayedAnswer = (
        <>
          {parts[0]}
          <div className="conclusion-highlight">
            <strong>📌 Conclusion:</strong>
            {parts.slice(1).join('').trim()}
          </div>
        </>
      );
    }

    // Build bot message object
    const botMsg = {
      id: Date.now() + 1,
      sender: 'bot',
      text: displayedAnswer,
      original_query: parsed?.original_query ?? parsed?.query ?? null,
      corrected_query: parsed?.corrected_query ?? parsed?.corrected ?? null,
      was_corrected:
        typeof parsed?.original_query === 'string' &&
        typeof parsed?.corrected_query === 'string' &&
        parsed.original_query !== parsed.corrected_query,
      mode,
      sourceContent
    };

    setMessages(prev => [...prev, botMsg]);

    // if (parsed?.session_id) await loadChatSessions();

  } catch (error) {
    console.error('Error in handleSendQuery:', error);
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, sender: 'bot', text: 'Error! Could not connect to backend.' }
    ]);
  } finally {
    setIsLoading(false);
  }
}
  const scrollToBottom = () => {
    if (chatPanelRef.current) {
      const { scrollHeight, clientHeight } = chatPanelRef.current;
      chatPanelRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="conversation">
      <div className="chat-panel" ref={chatPanelRef}>
        {/* Welcome Animation */}
        {showWelcome && messages.length === 0 && (
          <motion.div 
            className="welcome-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div className="welcome-content">
              {/* Animated Bot Character */}
              <motion.div
                className="bot-character"
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  {/* Head */}
                  <motion.circle cx="60" cy="50" r="30" fill="#ef6a36" />
                  
                  {/* Eyes */}
                  <motion.circle 
                    cx="50" cy="45" r="5" fill="white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                  />
                  <motion.circle 
                    cx="70" cy="45" r="5" fill="white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                  />
                  
                  {/* Smile */}
                  <path d="M 50 55 Q 60 62 70 55" stroke="white" strokeWidth="2" fill="none" />
                  
                  {/* Body */}
                  <rect x="45" y="80" width="30" height="30" rx="5" fill="#ef6a36" />
                  
                  {/* Arms */}
                  <motion.rect 
                    x="25" y="85" width="20" height="8" rx="4" fill="#ef6a36"
                    animate={{ rotate: [-15, 15, -15] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ transformOrigin: "35px 89px" }}
                  />
                  <motion.rect 
                    x="75" y="85" width="20" height="8" rx="4" fill="#ef6a36"
                    animate={{ rotate: [15, -15, 15] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ transformOrigin: "85px 89px" }}
                  />
                </svg>
              </motion.div>

              {/* Welcome Text */}
              <motion.div
                className="welcome-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h2>Hello! 👋</h2>
                <p>I'm your AI research assistant.</p>
              </motion.div>

              {/* Feature Cards */}
              <motion.div
                className="feature-cards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                {[
                  { icon: "🔍", title: "Smart Search", desc: "Find research papers instantly" },
                  { icon: "🧠", title: "Deep Analysis", desc: "Understand complex topics" },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    className="feature-card"
                    whileHover={{ y: -8, boxShadow: "0 8px 16px rgba(239, 106, 54, 0.2)" }}
                  >
                    <span className="feature-icon">{feature.icon}</span>
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Start Text */}
              <motion.div
                className="start-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <p>Start typing below to begin!</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

       {/* Messages */}
        {messages.map((m, idx) => (
          <motion.div 
            key={m.id} 
            className={`message ${m.sender}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {m.was_corrected && (
              <div className="correction-box">
                <span className="did-you-mean">Did you mean: </span>
                <span className="corrected-query">"{m.corrected_query}"</span>
              </div>
            )}
            <div className="message-text">
              {m.sender === 'bot' && idx === messages.length - 1 ? (
                <TypewriterText text={typeof m.text === 'string' ? m.text : ''} />
              ) : (
                m.text
              )}
            </div>
            {m.sourceContent}
          </motion.div>
        ))}

        {isLoading && (
          <div className="message bot typing-indicator">
            <span></span><span></span><span></span>
          </div>
        )}
      </div>
      <footer className="footer">
        <QueryBox onSend={handleSendQuery} />
      </footer>
    </div>
  );
}