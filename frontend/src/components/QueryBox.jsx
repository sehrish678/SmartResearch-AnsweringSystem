import {useState, useEffect} from 'react';
import { FiSun } from 'react-icons/fi';
import { BsLightbulb } from 'react-icons/bs';
import '../styles/query-box.css'

export function QueryBox({ onSend }){
    const [query,setQuery]=useState("");
    const [isDark, setIsDark] = useState(() => {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' ? true : false;
    });

    // Keep document-level data-theme in sync so CSS can react
    useEffect(()=>{
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    },[isDark]);
    function handleQuery(){
        const text=(query||'').trim();
        if(!text) return;
        if(onSend) onSend(text);
        setQuery('');
    }
    function onKeyDown(e){
        if(e.key==='Enter'){handleQuery();}
    }
const toggleMode = () => {
    setIsDark(prev => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };
    return(
        <div>
           <div className="query-box-container"> <input placeholder='Type your query here...' className="query-box-input" type="text" value={query} onChange={(e)=>{setQuery(e.target.value)}} onKeyDown={onKeyDown} aria-label="Message Input"/>
       

        <button
          onClick={toggleMode}
          className={`switch-toggle-btn${isDark ? ' deep' : ''}`}
          aria-label="Toggle deep/simple mode"
        >
          <span className="switch-track">
            <span className="switch-knob" style={{transform: isDark ? 'translateX(22px)' : 'translateX(2px)'}}>
              {isDark ? <BsLightbulb size={18} style={{color:'#ef6a36'}} /> : <FiSun size={18} style={{color:'#ef6a36'}} />}
            </span>
          </span>
        </button>
                <button className='query-box-button' onClick={handleQuery}>Send!</button>
        </div>
        </div>
    )
}

