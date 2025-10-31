import { useState, useEffect, useRef } from 'react';
import '../styles/conversation.css';
import { QueryBox } from './QueryBox.jsx';
import { TypewriterText } from './TypewriterText.jsx';

export function Conversation() {
  const [messages, setMessages] = useState([]);
  const chatPanelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendQuery(raw) {
    const text = raw.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });

      const data = await response.json();

      const botMsg = { id: Date.now() + 1, sender: 'bot', text: data.answer };
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
      <TypewriterText text="Welcome to Chat!" color="#ef6a36" />
      <div className="chat-panel" ref={chatPanelRef}>
        {messages.map(m => (
          <div key={m.id} className={`message ${m.sender}`}>
            {m.text}
          </div>
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