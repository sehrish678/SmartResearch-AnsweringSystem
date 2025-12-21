import { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import '../styles/conversation.css';
import { QueryBox } from './QueryBox.jsx';
import { ChatContext } from './ChatContext.jsx';
import { TypewriterText } from './TypewriterText.jsx';
import { extractSourcesFromText } from '../utils/utils.js';

const API_BASE_URL = 'https://mcp-server-and-langgraph-agent-production.up.railway.app/mcp'; // or your local: 'http://localhost:4000/mcp'

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
        console.error('Server error:', response.status, textBody);
        throw new Error(`Server error: ${response.status}`);
      }

      const rawData = await response.json();
      console.debug('Raw API response:', rawData);

      const result = rawData?.result ?? rawData;

      let answerData = null;

      // New format: direct object with answer/references
      if (result && typeof result === 'object' && result.answer) {
        answerData = result;
      }
      // Fallback for possible old/wrapped formats
      else if (result?.content?.[0]?.text) {
        try {
          answerData = JSON.parse(result.content[0].text);
        } catch (e) {
          answerData = { answer: result.content[0].text };
        }
      }
      else if (Array.isArray(result) && result.length > 0) {
        answerData = result[result.length - 1];
      }
      else {
        answerData = { answer: 'No valid response from server' };
      }

      const answerText = answerData.answer || answerData.text || answerData.content || '';

      // References are now directly an array
      let refs = Array.isArray(answerData.references) ? answerData.references : [];

      // Build source content
      let sourceContent = null;
      if (refs.length > 0) {
        sourceContent = (
          <div className="references-list">
            {refs.map((ref, idx) => (
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

      // Highlight conclusion in deep mode
      let displayedAnswer = answerText;
      if (mode === 'deep' && typeof answerText === 'string' && answerText.includes('Conclusion:')) {
        const parts = answerText.split(/Conclusion:\s*/i);
        displayedAnswer = (
          <>
            {parts[0]}
            <div className="conclusion-highlight">
              <strong>📌 Conclusion:</strong> {parts.slice(1).join('').trim()}
            </div>
          </>
        );
      }

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: displayedAnswer,
        original_query: answerData.original_query,
        corrected_query: answerData.corrected_query,
        was_corrected:
          answerData.original_query &&
          answerData.corrected_query &&
          answerData.original_query !== answerData.corrected_query,
        mode,
        sourceContent
      };

      setMessages(prev => [...prev, botMsg]);

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
            {/* ... (your existing welcome animation code remains unchanged) */}
            <motion.div className="welcome-content">
              <motion.div className="bot-character" animate={{ y: [0, -20, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  {/* ... your SVG ... */}
                </svg>
              </motion.div>

              <motion.div className="welcome-text" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                <h2>Hello! 👋</h2>
                <p>I'm your AI research assistant.</p>
              </motion.div>

              {/* ... rest of welcome content ... */}
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