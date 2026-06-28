import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  //  Wait until auth is checked
  if (loading) {
    return <div>Loading...</div>;
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