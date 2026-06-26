import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuthContext();

  if (loading) return null; // wait for localStorage to load

  if (!user) {
    return <Navigate to="/" replace />; // not logged in → go to landing page
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />; // wrong role → go to landing page
  }

  return children;
};

export default ProtectedRoute;