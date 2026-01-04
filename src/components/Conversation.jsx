import { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import '../styles/conversation.css';
import { QueryBox } from './QueryBox.jsx';
import { ChatContext } from './ChatContext.jsx';
import { TypewriterText } from './TypewriterText.jsx';
import { jsPDF } from "jspdf";
import { Clipboard, Volume2, Square, Download } from "lucide-react";

const API_BASE_URL = 'https://mcp-server-and-langgraph-agent-production.up.railway.app/messages';

export function Conversation() {
  const { messages, setMessages, currentSessionId } = useContext(ChatContext);
  const [showWelcome, setShowWelcome] = useState(true);
  const chatPanelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1200);
  };

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
            name: "smart_send_message",
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

      let answerData = null;
      
      if (rawData?.result?.content?.[0]?.text) {
        try {
          answerData = JSON.parse(rawData.result.content[0].text);
        } catch (e) {
          console.error('Error parsing response:', e);
          answerData = { answer: rawData.result.content[0].text };
        }
      } else {
        answerData = { answer: 'No valid response from server' };
      }

      console.log('Parsed answer data:', answerData);

      const answerText = answerData.answer || answerData.content || answerData.text || '';

      let refs = Array.isArray(answerData.references) ? answerData.references : [];

      let sourceContent = null;
      if (refs.length > 0) {
        sourceContent = (
          <div className="references-list">
            {refs.map((ref, idx) => (
              <div key={idx} className="source-link">
                <span className="source-label">📚 Source {idx + 1}:</span>
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

      let displayedAnswer = answerText;
      let conclusionText = null;
      
      if (mode === 'deep' && typeof answerText === 'string') {
        let cleanedText = answerText.replace(/References are listed below\.[\s\S]*$/i, '').trim();
        cleanedText = cleanedText.replace(/References are listed below\.[\s\S]*?(?=\n\n|Conclusion:|$)/i, '').trim();

        const conclusionMatch = cleanedText.match(/Conclusion\s*:\s*/i);
        if (conclusionMatch) {
          const splitIndex = conclusionMatch.index + conclusionMatch[0].length;
          displayedAnswer = cleanedText.substring(0, conclusionMatch.index).trim();
          conclusionText = cleanedText.substring(splitIndex).trim();
        } else {
          displayedAnswer = cleanedText;
        }
      }

      let conclusionContent = null;
      if (conclusionText) {
        conclusionContent = (
          <div className="conclusion-highlight">
            <strong>📌 Conclusion:</strong> {conclusionText}
          </div>
        );
      }

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: displayedAnswer,
        conclusionText: conclusionText,
        conclusionContent: conclusionContent,
        original_query: answerData.original_query,
        corrected_query: answerData.corrected_query,
        was_corrected:
          answerData.original_query &&
          answerData.corrected_query &&
          answerData.original_query !== answerData.corrected_query,
        mode,
        sourceContent,
        isNew: true 
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

  const handleDownloadPdf = (text, conclusionText, index) => {
    if (!text) return;

    const doc = new jsPDF();

    let content = typeof text === "string" ? text : (text.props?.children || "Chat response");
    
    if (conclusionText) {
      content += "\n\nConclusion: " + conclusionText;
    }

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 15, 20);

    doc.save(`chat-response-${index + 1}.pdf`);
  };

  const handleCopy = (text, conclusionText) => {
    if (!text) return;
    let content = typeof text === "string" ? text : (text.props?.children || "");
    
    if (conclusionText) {
      content += "\n\nConclusion: " + conclusionText;
    }
    
    navigator.clipboard.writeText(content);
    showToast("Copied!");
  };

  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = (text, conclusionText) => {
    if (!text) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    
    let content = typeof text === "string" ? text : (text.props?.children || "");
    
    if (conclusionText) {
      content += ". Conclusion: " + conclusionText;
    }
    
    const utter = new SpeechSynthesisUtterance(content);
    utter.rate = 1;
    utter.pitch = 1;
    utter.lang = "en-US";

    utter.onend = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

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
              <motion.div
                className="bot-character"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <motion.circle cx="60" cy="50" r="30" fill="#ef6a36" />
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
                  <path d="M 50 55 Q 60 62 70 55" stroke="white" strokeWidth="2" fill="none" />
                  <rect x="45" y="80" width="30" height="30" rx="5" fill="#ef6a36" />
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

              <motion.div
                className="welcome-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h2>Hello! 👋</h2>
                <p>I'm your AI research assistant.</p>
              </motion.div>

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

              <motion.div
                className="start-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
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
            {/* Show correction either as pre-built JSX or with TypewriterText for new messages */}
            {m.correctionContent ? (
              m.correctionContent
            ) : (
              m.was_corrected && (
                <div className="correction-box">
                  <span className="did-you-mean">Did you mean: </span>
                  {m.sender === 'bot' && m.isNew !== false ? (
                    <TypewriterText text={`"${m.corrected_query}"`} /> 
                  ) : (
                    <span>"{m.corrected_query}"</span>
                  )}
                </div>
              )
            )}
            
            <div className="message-text">
              {/* Animate only the last bot message that's new */}
              {m.sender === 'bot' && idx === messages.length - 1 && !isLoading && m.isNew !== false ? (
                <>
                  <TypewriterText text={typeof m.text === 'string' ? m.text : ''} />
                  {m.conclusionText && (
                    <div className="conclusion-highlight">
                      <strong>📌 Conclusion:</strong>{' '}
                      <TypewriterText text={m.conclusionText} delay={typeof m.text === 'string' ? m.text.length * 20 : 0} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {m.text}
                  {m.conclusionContent}
                </>
              )}
            </div>

            {/* action buttons */}
            {m.sender === "bot" && (
              <div className="message-actions">
                <button className="icon-btn" onClick={() => handleCopy(m.text, m.conclusionText)}>
                  <Clipboard size={16} />
                </button>

                <button className="icon-btn" onClick={() => handleSpeak(m.text, m.conclusionText)}>
                  {isSpeaking ? <Square size={16} /> : <Volume2 size={16} />}
                </button>
                
                <button
                  className="icon-btn"
                  onClick={() => handleDownloadPdf(m.text, m.conclusionText, idx)}
                >
                  <Download size={16} />
                </button>
              </div>
            )}

            {/* Sources appear AFTER the message */}
            {m.sourceContent}
          </motion.div>
        ))}

        {isLoading && (
          <div className="message bot typing-indicator">
            <span></span><span></span><span></span>
          </div>
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>
      
      <footer className="footer">
        <QueryBox onSend={handleSendQuery} />
      </footer>
    </div>
  );
}