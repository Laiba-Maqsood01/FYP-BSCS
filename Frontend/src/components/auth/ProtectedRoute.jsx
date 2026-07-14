import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles, fallback }) => {
  const { user, loading } = useAuth();

  //  Wait until auth is checked — pages can pass their own skeleton as fallback
  if (loading) {
    return fallback ?? (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  //  Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  //  Role check — send each role to their own home instead of a generic /
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  //  Allowed
  return children;
};

export default ProtectedRoute;