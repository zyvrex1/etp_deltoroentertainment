import { Navigate } from "react-router-dom";
import { useAuthContext } from "../admincomponents/hooks/useAuthContext";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuthContext();

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Logged in but not authorized
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;