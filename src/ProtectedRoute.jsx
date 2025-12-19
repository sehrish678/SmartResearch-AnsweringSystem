
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const [isValid, setIsValid] = useState(null); // null = checking, false = invalid

  useEffect(() => {
    if (!token) {
      setIsValid(false);
      return;
    }

    // Try to decode the token (JWT) to check if it's expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // exp is in seconds
      const now = Date.now();

      if (now > exp) {
        console.log('Token expired, clearing...');
        localStorage.removeItem('token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_name');
        setIsValid(false);
      } else {
        setIsValid(true);
      }
    } catch (e) {
      // Invalid token format
      console.log('Invalid token, clearing...');
      localStorage.clear();
      setIsValid(false);
    }
  }, [token]);

  // Still checking
  if (isValid === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        Checking login...
      </div>
    );
  }

  // Invalid or expired → force login
  if (!isValid) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Valid token → show app
  return children;
}