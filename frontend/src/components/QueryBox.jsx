import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiSearch, FiX, FiArrowUp } from 'react-icons/fi';
import { MdOutlineFileUpload } from 'react-icons/md';
import '../styles/query-box.css';

export function QueryBox({ onSend }) {
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const containerRef = useRef(null);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSend = () => {
    const text = query.trim();
    if (text && onSend) {
      onSend(text, isDeepSearch ? 'deep' : 'simple');
      setQuery('');
      setIsDeepSearch(false);
    }
  };

  const handleMenuClick = (option) => {
    setIsMenuOpen(false);
    if (option === 'deep') {
      setIsDeepSearch(!isDeepSearch);
    } else if (option === 'upload') {
      console.log('Upload file');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (inputRef.current && (query || isDeepSearch)) {
      inputRef.current.focus();
    }
  }, [query, isDeepSearch]);

  return (
    <div ref={containerRef} className={`query-box-wrapper ${query || isDeepSearch ? 'expanded' : ''}`}>
      <div className="query-box-container">
        {/* Plus Menu Button - Left Side */}
        <div className="menu-wrapper" ref={menuRef}>
          <button 
            className="query-box-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="More options"
          >
            <FiPlus size={20} />
          </button>
          
          {isMenuOpen && (
            <div className="dropdown-menu">
              <button 
                className={`menu-item ${isDeepSearch ? 'active' : ''}`}
                onClick={() => handleMenuClick('deep')}
              >
                <FiSearch size={18} />
                <span>Deep Search</span>
              </button>
              <button 
                className="menu-item"
                onClick={() => handleMenuClick('upload')}
              >
                <MdOutlineFileUpload size={18} />
                <span>Upload File</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-wrapper">
          {isDeepSearch && (
            <div className="search-options">
              <div className="deep-search-capsule">
                <span className="thinking-dot"></span>
                <span>Thinking harder...</span>
                <button 
                  className="capsule-close-btn"
                  onClick={() => setIsDeepSearch(false)}
                  title="Disable deep search"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
          )}
          
          <textarea
            ref={inputRef}
            placeholder="Ask anything..."
            className="query-box-input"
            value={query}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            rows={query ? Math.min(Math.ceil(query.length / 50), 5) : 1}
          />
        </div>

        {/* Send Button - Right Side */}
        {(query || isDeepSearch) && (
          <button className="query-box-button" onClick={handleSend} title="Send message">
            <FiArrowUp size={18} />
          </button>
        )}
      </div>
    </div>
  );
}