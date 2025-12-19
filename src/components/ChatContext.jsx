import { createContext, useState } from 'react';
// import { API_BASE_URL } from './config';
// Create the context
const ChatContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Create the provider
export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  
  const createSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat/new`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session_id);
        return data.session_id;
      }
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const value = {
    messages,
    setMessages,
    currentSessionId,
    setCurrentSessionId,
    chatSessions,
    setChatSessions,
    createSession
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Export the context
export { ChatContext };