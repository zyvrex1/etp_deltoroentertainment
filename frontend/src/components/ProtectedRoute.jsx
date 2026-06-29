import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

// Full-screen loader shown while the session-restore async call is in flight.
// Returning null here would cause React Router to redirect to "/" before we
// know whether the user is actually authenticated.
const AuthLoader = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(5, 36, 107, 0.11)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: 'white',
    flexDirection: 'column',
    gap: '24px',
    zIndex: 9999
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'pulse 2s infinite ease-in-out'
    }}>
      <img
        src="/logo/Logo1.png"
        alt="Logo"
        style={{ width: '300px', height: 'auto', marginBottom: '16px' }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} style={{
            width: '8px', height: '8px',
            background: '#ef4444',
            borderRadius: '50%',
            animation: `bounce 1.4s infinite ease-in-out both ${delay}s`
          }} />
        ))}
      </div>
    </div>
    <style>{`
      @keyframes pulse {
        0%   { transform: scale(1);    opacity: 0.8; }
        50%  { transform: scale(1.05); opacity: 1;   }
        100% { transform: scale(1);    opacity: 0.8; }
      }
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40%           { transform: scale(1); }
      }
    `}</style>
  </div>
);

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuthContext();

  // ⚠️ Do NOT redirect while the session restore is still in flight.
  // Returning null here would let React Router fall through to "/" (landing page).
  if (loading) return <AuthLoader />;

  if (!user) {
    return <Navigate to="/" replace />; // not logged in → go to landing page
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />; // wrong role → go to landing page
  }

  return children;
};

export default ProtectedRoute;