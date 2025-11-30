import { motion } from 'framer-motion';
import { FiRefreshCw } from 'react-icons/fi';
import '../styles/navbar.css';
import { ChatContext } from './ChatContext.jsx';
import { useContext } from 'react';

export function NavBar() {   
   const { setMessages } = useContext(ChatContext);

  const handleNewChat = () => {
    setMessages([]);
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
          <img src="icon.png" alt="Smart Research Icon" />
        </div>
        <h2 className="logo-text">Smart Research</h2>
        <p className="logo-subtitle">Research Based Answers</p>
      </motion.div>

      {/* Navigation Items */}
      <motion.div className="nav-content">
        <ul className="nav-list">
          <motion.li 
            className="nav-item"
            whileHover={{ scale: 1.05, x: 8 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewChat}
          >
            <FiRefreshCw size={18} className="nav-icon" />
            <span>New Chat</span>
          </motion.li>
        </ul>
      </motion.div>

      {/* Footer */}
      <motion.div className="nav-footer">
        <p>© 2025 Smart Research</p>
      </motion.div>
    </motion.nav>
  );
}