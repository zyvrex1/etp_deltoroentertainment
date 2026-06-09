import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuthContext();

  if (loading) return null; // wait for localStorage to load

  if (!user) {
    return <Navigate to="/login" replace />; // not logged in → go to login (no session_expired)
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" replace />; // wrong role → go to login
  }

  return children;
};

export default ProtectedRoute;