import { useState } from 'react';
import './App.css'
import {NavBar} from './components/NavBar.jsx';
import { Conversation } from './components/Conversation.jsx';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="page">
      <button className="menu-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <NavBar/>
      </aside>
      <div className="main-wrapper">
        <Conversation />
      </div>
    </div>
  )
}

export default App;
                            