import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/topnavbar.css';

function TopNavBar() {
  const [activeTab, setActiveTab] = useState('smart-research');

  const navItems = [
    { id: 'volvox', label: 'Volvox', icon: '🤖' },
    { id: 'smart-research', label: 'Smart Research', icon: '💡' },
    { id: 'innoscope', label: 'Innoscope', icon: '🔭' },
    { id: 'kickstart', label: 'KickStart', icon: '🚀' }
  ];

  return (
    <motion.nav 
      className="top-navbar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="top-navbar-content">
        {/* Logo Section */}
        <div className="top-navbar-logo">
          {/* <motion.div 
            className="logo-circle"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            
          </motion.div> */}
          <span className="logo-brand">Unified MCP</span>
        </div>

        {/* Navigation Items */}
        <div className="top-navbar-items">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`top-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="nav-item-icon">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
              {activeTab === item.id && (
                <motion.div
                  className="active-indicator"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        <div className="top-navbar-right">
          {/* <motion.button 
            className="user-profile"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="user-avatar">SE</div>
          </motion.button> */}
        </div>
      </div>
    </motion.nav>
  );
}

export default TopNavBar;