import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { authAPI } from '../api/auth';
import '../styles/auth.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }

      console.log('Logging in with:', { email });
      const data = await authAPI.login(email, password);

      console.log('Response from server:', data);

      // Check if login was successful
      if (data.token) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_email', email);
        console.log('✅ Login successful! Token saved:', data.token.substring(0, 20) + '...');
        
        // Delay slightly to ensure state updates
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else if (data.detail) {
        setError(data.detail);
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container-new">
      <motion.div 
        className="auth-card-new"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Left Side - Character */}
        <div className="character-section-new">
          <motion.div 
            className="character-wrapper-new"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <svg width="160" height="200" viewBox="0 0 160 200" fill="none">
              <circle cx="80" cy="60" r="40" fill="#ef6a36" />
              
              {showPassword ? (
                <g>
                  <path d="M 58 55 Q 65 60 72 55" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M 88 55 Q 95 60 102 55" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  <ellipse cx="65" cy="55" rx="8" ry="10" fill="white" />
                  <circle cx="65" cy="55" r="5" fill="#333" />
                  <ellipse cx="95" cy="55" rx="8" ry="10" fill="white" />
                  <circle cx="95" cy="55" r="5" fill="#333" />
                </g>
              )}
              
              <path d="M 70 75 Q 80 82 90 75" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              
              <rect x="60" y="105" width="40" height="50" rx="5" fill="#ef6a36" />
              <rect x="25" y="115" width="35" height="10" rx="5" fill="#ef6a36" />
              <rect x="100" y="115" width="35" height="10" rx="5" fill="#ef6a36" />
            </svg>
          </motion.div>
        </div>

        <motion.div 
          className="form-section-new"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="form-header">
            <h1>Sign In</h1>
            <p className="subtitle">Enter your credentials to continue</p>
          </div>

          {error && (
            <motion.div
              className="error-message-new"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <motion.form 
            className="auth-form-new"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.div 
              className="form-group-new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label>Email</label>
              <div className="input-wrapper-new">
                <FiMail />
                <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
            </motion.div>

            <motion.div 
              className="form-group-new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <label>Password</label>
              <div className="input-wrapper-new">
                <FiLock />
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                <motion.button 
                  type="button" 
                  className="eye-toggle" 
                  onClick={() => setShowPassword(!showPassword)} 
                  disabled={loading} 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.95 }}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </motion.button>
              </div>
            </motion.div>

            <motion.button type="submit" className="submit-btn-new" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </motion.form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <motion.button type="button" className="link-button" onClick={() => navigate('/register')} whileHover={{ x: 3 }}>
                Sign up
              </motion.button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}