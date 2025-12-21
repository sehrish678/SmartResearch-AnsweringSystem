import { createContext, useState } from 'react';

// Create the context
const ChatContext = createContext();

const API_BASE_URL = 'https://mcp-server-and-langgraph-agent-production.up.railway.app/mcp';

// Create the provider
export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  
  const loadChatSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

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

      if (response.ok) {
        const data = await response.json();
        const result = data.result?.content?.[0]?.text ? JSON.parse(data.result.content[0].text) : data.result;
        
        const sessions = result.sessions || [];
        console.log('Parsed sessions:', sessions);
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const createSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "smart_new_chat",
            arguments: {
              token: token
            }
          },
          id: 1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.result?.content?.[0]?.text ? JSON.parse(data.result.content[0].text) : data.result;
        console.log('Current session ID updated:', result.session_id);
        setCurrentSessionId(result.session_id);
        
        // Reload sessions after creating new one
        setTimeout(() => {
          loadChatSessions();
        }, 500);
        
        return result.session_id;
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
    createSession,
    loadChatSessions  // Export this function
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Export the context
export { ChatContext };