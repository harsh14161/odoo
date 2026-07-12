import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && roles.length && !roles.includes(user.role) && user.role !== 'admin') {
    return <div className="card">You don't have permission to view this page.</div>;
  }
  return children;
}
