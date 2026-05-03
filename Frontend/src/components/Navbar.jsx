import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LuCircleUserRound,
  LuLayoutDashboard,
  LuLogIn,
  LuLogOut,
  LuMoon,
  LuSunMedium,
  LuCarFront,
} from "react-icons/lu";
import { useTheme } from "../context/ThemeContext";
import { clearCurrentUser, getCurrentUser } from "../../services/api";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const { theme, toggleTheme } = useTheme();
  const currentUser = getCurrentUser();
  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/browse-cars", label: "Browse Cars" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  if (currentUser?.role === "admin") {
    navLinks.push({ to: "/admin", label: "Admin" });
  }

  const handleLogout = () => {
    if (currentUser?.role === "admin") {
      window.alert("Admin account cannot be signed out from here.");
      return;
    }

    clearCurrentUser();
    navigate("/login");
  };

  return (
    <nav
      className={`navbar navbar-themed ${isHomePage ? "navbar-home" : "navbar-solid-home"}`}
    >
      <div className="logo">
        <div className="logo-mark">
          <LuCarFront className="car-icon" />
        </div>
        <h2>
          Auto<span>Hub</span>
        </h2>
      </div>

      <ul className="nav-links">
        {navLinks.map((link) => (
          <li key={link.to}>
            <Link
              className={location.pathname === link.to ? "active" : ""}
              to={link.to}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-actions">
        <button
          className="nav-icon-btn"
          type="button"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <LuSunMedium /> : <LuMoon />}
        </button>
        {currentUser ? (
          <>
            <Link className="nav-login" to="/dashboard">
              <LuLayoutDashboard /> {currentUser.fullName?.split(" ")[0] || "Dashboard"}
            </Link>
            <button type="button" className="nav-register" onClick={handleLogout}>
              <LuLogOut /> Logout
            </button>
          </>
        ) : (
          <>
            <Link className="nav-login" to="/login">
              <LuLogIn /> Login
            </Link>
            <Link className="nav-register" to="/register">
              <LuCircleUserRound /> Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
