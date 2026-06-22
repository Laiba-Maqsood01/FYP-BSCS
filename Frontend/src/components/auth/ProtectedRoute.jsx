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

  //  Role check (if provided)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  //  Allowed
  return children;
};

export default ProtectedRoute;