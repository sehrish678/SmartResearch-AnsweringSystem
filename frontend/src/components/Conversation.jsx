import { useState, useEffect, useRef,useContext } from 'react';
import { motion } from 'framer-motion';
import '../styles/conversation.css';
import { QueryBox } from './QueryBox.jsx';
import { ChatContext } from './ChatContext.jsx';

export function Conversation() {
  const { messages, setMessages } = useContext(ChatContext);
  const [showWelcome, setShowWelcome] = useState(true);
  const chatPanelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendQuery(raw, mode = 'simple') {
    const text = raw.trim();
    if (!text) return;

    setShowWelcome(false);
    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Error! No token found. Please login again.'
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/answer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: text, mode: mode })
      });

      const data = await response.json();

      // Handle both simple (reference) and deep (references) modes
      let sourceContent;
      if (mode === 'deep' && data.references && Array.isArray(data.references)) {
        // Deep mode: show all references like simple mode (blue, small font)
        sourceContent = (
          <div className="references-list">
            {data.references.map((ref, idx) => (
              <div key={idx} className="source-link">
                <span>Source {idx + 1}:</span>
                <a href="#" className="source-text">{ref}</a>
              </div>
            ))}
          </div>
        );
      } else {
        // Simple mode: show single reference
        sourceContent = data.reference ? (
          <div className="source-link">
            <span>Source:</span>
            <a href="#" className="source-text">{data.reference}</a>
          </div>
        ) : null;
      }

      // Highlight conclusion in deep mode
      let answerText = data.answer;
      if (mode === 'deep' && data.answer.includes('Conclusion:')) {
        const parts = data.answer.split('Conclusion:');
        answerText = (
          <>
            {parts[0]}
            <div className="conclusion-highlight">
              <strong>📌 Conclusion:</strong>
              {parts[1]}
            </div>
          </>
        );
      }

      const botMsg = { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: answerText,
        original_query: data.original_query,
        corrected_query: data.corrected_query,
        was_corrected: data.original_query !== data.corrected_query,
        mode: mode,
        sourceContent: sourceContent
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Error! Is backend running?'
      };
      setMessages(prev => [...prev, botMsg]);
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
        {messages.map(m => (
          <motion.div 
            key={m.id} 
            className={`message ${m.sender}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {m.was_corrected && (
              <div className="correction-box">
                <span className="did-you-mean">Did you mean?</span>
                <div className="corrected-query">"{m.corrected_query}"</div>
              </div>
            )}
            {m.text}
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