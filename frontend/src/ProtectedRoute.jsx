import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  console.log('ProtectedRoute - Token exists:', !!token);
  
  if (!token) {
    console.log('No token - redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('Token found - showing dashboard');
  return children;
}