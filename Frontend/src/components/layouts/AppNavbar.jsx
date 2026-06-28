import { useAuth } from "../../context/AuthContext";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { showSuccess } from "../../utils/toast";
import ProfileDropdown from "../common/ProfileDropdown";

const DEFAULT_MENU = [
  { title: "Home",        url: "/",            roles: ["guest", "user", "admin"] },
  { title: "Browse Cars", url: "/browse-cars", roles: ["guest", "user", "admin"] },
  { title: "Post an Ad",  url: "/post-ad",     roles: ["guest", "user", "admin"] },
];

// Match Bootstrap btn-sm outline-dark / btn-sm dark exactly
const btnOutlineDark =
  "inline-flex items-center py-[0.25rem] px-[0.5rem] text-[0.875rem] font-normal rounded-[0.2rem] border border-[#212529] text-[#212529] bg-transparent hover:bg-[#212529] hover:text-white transition-colors no-underline";
const btnDark =
  "inline-flex items-center py-[0.25rem] px-[0.5rem] text-[0.875rem] font-normal rounded-[0.2rem] bg-[#212529] border border-[#212529] text-white hover:bg-[#1c1f23] transition-colors no-underline";

export default function AppNavbar({
  brand = { title: "GearTrade.app", short: "GT", url: "/" },
  menu  = DEFAULT_MENU,
  auth  = {
    login:  { text: "Log in",  url: "/login"    },
    signup: { text: "Sign up", url: "/register" },
  },
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, logoutAll, loading, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    showSuccess("Logged out successfully!");
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    showSuccess("Logged out from all devices!");
    navigate("/login");
  };

  const role      = user?.role || "guest";
  const isAllowed = (roles) => !roles || roles.length === 0 || roles.includes(role);

  const filteredMenu = useMemo(() =>
    menu.filter(item => isAllowed(item.roles))
        .map(item => ({ ...item, items: item.items?.filter(sub => isAllowed(sub.roles)) })),
    [menu, user]
  );

  const Logo = () => (
    <Link to={brand.url} className="inline-flex items-center gap-2 no-underline">
      {/* 2rem × 2rem dark-gradient square logo — matches .app-navbar-logo */}
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-white shrink-0"
        style={{ background: "linear-gradient(135deg, #1f2937, #0f172a)" }}
      >
        {brand.short}
      </span>
      {/* .app-navbar-title */}
      <span style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.01em", color: "#0f172a" }}>
        {brand.title}
      </span>
    </Link>
  );

  return (
    <>
      {/* ── Fixed navbar — matches .app-navbar ── */}
      <header
        className="fixed top-0 left-0 right-0 flex items-center py-3"
        style={{
          minHeight: "70px",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(16,24,40,0.08)",
          zIndex: 1200,
        }}
      >
        <div className="w-full max-w-285 mx-auto px-3 flex items-center">
          <Logo />

          {/* Desktop nav — ms-4 gap-lg-1 → ml-6 gap-1 */}
          <nav className="hidden lg:flex items-center gap-1 ml-6 mr-auto">
            {filteredMenu.map(item => (
              <Link
                key={item.title}
                to={item.url}
                className="no-underline px-4 py-2 hover:text-brand-btn transition-colors"
                style={{ fontWeight: 500, color: "#334155", fontSize: "1rem" }}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Desktop auth / profile */}
          <div className="hidden lg:flex items-center gap-2">
            {loading ? null : !isAuthenticated ? (
              <>
                <Link to={auth.login.url}  className={btnOutlineDark}>{auth.login.text}</Link>
                <Link to={auth.signup.url} className={btnDark}>{auth.signup.text}</Link>
              </>
            ) : (
              <ProfileDropdown user={user} onLogout={handleLogout} onLogoutAll={handleLogoutAll} />
            )}
          </div>

          {/* Mobile: profile avatar + hamburger toggle */}
          <div className="flex lg:hidden items-center gap-2 ml-auto">
            {isAuthenticated && (
              <ProfileDropdown user={user} onLogout={handleLogout} onLogoutAll={handleLogoutAll} />
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded text-brand-dark hover:bg-gray-100 transition border border-transparent"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile offcanvas — replicates Bootstrap Navbar.Offcanvas placement="end" ── */}
      {mobileOpen && (
        <div className="fixed inset-0 lg:hidden" style={{ zIndex: 1300 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel — slides in from right, matches Bootstrap offcanvas-end */}
          <div
            className="absolute right-0 top-0 bottom-0 bg-white flex flex-col"
            style={{ width: "400px", maxWidth: "100vw", boxShadow: "0 0 30px rgba(0,0,0,0.15)" }}
          >
            {/* Offcanvas header */}
            <div
              className="flex items-center justify-between px-4 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.175)" }}
            >
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full text-[#212529] hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Offcanvas body — flex-column */}
            <div className="flex-1 flex flex-col overflow-y-auto px-4 pt-2 pb-4">
              {/* Nav links — matches Accordion flush with border-bottom py-2 */}
              <div className="flex-1 mb-4">
                {filteredMenu.map(item => (
                  <div key={item.title} className="py-2" style={{ borderBottom: "1px solid #dee2e6" }}>
                    <Link
                      to={item.url}
                      onClick={() => setMobileOpen(false)}
                      className="block font-semibold no-underline hover:text-black transition-colors"
                      style={{ color: "#0f172a" }}
                    >
                      {item.title}
                    </Link>
                  </div>
                ))}
              </div>

              {/* Auth buttons at bottom — d-grid gap-2 */}
              {!loading && !isAuthenticated && (
                <div className="flex flex-col gap-2">
                  <Link
                    to={auth.login.url}
                    onClick={() => setMobileOpen(false)}
                    className="block text-center py-1.5 px-3 text-base font-normal rounded-md border border-[#212529] text-[#212529] bg-transparent hover:bg-[#212529] hover:text-white transition-colors no-underline"
                  >
                    {auth.login.text}
                  </Link>
                  <Link
                    to={auth.signup.url}
                    onClick={() => setMobileOpen(false)}
                    className="block text-center py-1.5 px-3 text-base font-normal rounded-md bg-[#212529] border border-[#212529] text-white hover:bg-[#1c1f23] transition-colors no-underline"
                  >
                    {auth.signup.text}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
