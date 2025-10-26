import { useState, useEffect, useRef } from 'react'
import '../styles/conversation.css';
import { QueryBox } from './QueryBox.jsx'
import { TypewriterText } from './TypewriterText.jsx'

export function Conversation() {
  const [messages, setMessages] = useState([]);
  const chatPanelRef = useRef(null);

  function handleSendQuery(text) {
    const trimmedTxt = (text || '').trim();
    if (!trimmedTxt) return;
    
    const userMsg = { id: Date.now(), sender: "user", text: trimmedTxt };
    setMessages(prevMsgs => [...prevMsgs, userMsg]);
    
    setTimeout(() => {
      const botMsg = { 
        id: Date.now() + 1, 
        sender: "bot", 
        text: `You said: ${trimmedTxt} cant answer your query too difficult😢`
      };
      setMessages(prevMsgs => [...prevMsgs, botMsg]);
    }, 500);
  }

  const scrollToBottom = () => {
    if (chatPanelRef.current) {
      const scrollHeight = chatPanelRef.current.scrollHeight;
      const height = chatPanelRef.current.clientHeight;
      const maxScroll = scrollHeight - height;
      
      chatPanelRef.current.scrollTo({
        top: maxScroll,
        behavior: 'smooth'
      });
    }
  };

  // Scroll on new messages
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
      </div>
      <footer className="footer">
        <QueryBox onSend={handleSendQuery}/>
      </footer>
    </div>

  )
}

                            