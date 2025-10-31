import { motion } from 'framer-motion';
import '../styles/navbar.css';
// import TextType from './TextType';

export function NavBar() {
  return (
    <motion.nav className="navbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="logo"><img src="icon.png" alt="icon" />
      <h3>Smart Research & Answering System</h3></div>
      <ul className="nav-list">
        <motion.li whileHover={{ scale: 1.1 }} onClick={()=>window.location.reload()}>New Chat</motion.li>
        {/* <motion.li whileHover={{ scale: 1.1 }}>About</motion.li>
        <motion.li whileHover={{ scale: 1.1 }}>Help</motion.li> */}
      </ul>
      {/* <footer className="nav-footer" >
        <p>© 2025 Smart Research & Answering System</p>
      </footer> */}
    </motion.nav>
  );
}