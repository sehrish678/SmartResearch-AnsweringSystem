import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiSearch, FiX, FiArrowUp, FiMic } from 'react-icons/fi';
import '../styles/query-box.css';

export function QueryBox({ onSend }) {
  const [query, setQuery] = useState("");
  const [finalText, setFinalText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
  if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      let new_final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const trans = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          new_final += trans + ' ';
        } else {
          interim += trans;
        }
      }

      if (new_final) {
        setFinalText(prevFinal => {
          const updatedFinal = prevFinal + new_final;
          setQuery(updatedFinal + interim);
          return updatedFinal;
        });
      } else {
        setQuery(finalText + interim);
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.stop();
      recognitionInstance.abort();
    };
  }
}, []); 

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSend = () => {
    const text = query.trim();
    if (text && onSend) {
      onSend(text, isDeepSearch ? 'deep' : 'simple');
      setQuery('');
      setFinalText('');
      setIsDeepSearch(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setQuery('');
      setFinalText('');
      recognition.start();
      setIsListening(true);
    }
  };

  const handleMenuClick = (option) => {
    setIsMenuOpen(false);
    if (option === 'deep') {
      setIsDeepSearch(!isDeepSearch);
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

  const AudioWaveIcon = () => (
    <div className="audio-wave-container">
      <div className="audio-wave-bar"></div>
      <div className="audio-wave-bar"></div>
      <div className="audio-wave-bar"></div>
      <div className="audio-wave-bar"></div>
      <div className="audio-wave-bar"></div>
    </div>
  );

  return (
    <div ref={containerRef} className={`query-box-wrapper ${query || isDeepSearch ? 'expanded' : ''}`}>
      <div className="query-box-container">
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
            </div>
          )}
        </div>

        <div className="input-wrapper">
         {(isDeepSearch || isListening) && (
  <div className="search-options">
    {isDeepSearch && (
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
    )}

    {isListening && (
      <div className="listening-capsule">
        <div className="listening-wave">
          <div className="listening-wave-bar"></div>
          <div className="listening-wave-bar"></div>
          <div className="listening-wave-bar"></div>
          <div className="listening-wave-bar"></div>
        </div>
        <span>Listening...</span>
      </div>
    )}
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

        <button 
          className={`voice-button ${isListening ? 'listening' : ''}`}
          onClick={toggleVoiceInput}
          title={isListening ? "Stop listening" : "Voice input"}
        >
          {isListening ? <AudioWaveIcon /> : <FiMic size={18} />}
        </button>

        {(query || isDeepSearch) && (
          <button className="query-box-button" onClick={handleSend} title="Send message">
            <FiArrowUp size={18} />
          </button>
        )}
      </div>
    </div>
  );
}