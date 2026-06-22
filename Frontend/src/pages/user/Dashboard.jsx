import { useState, useEffect } from "react";
import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Car, ShieldCheck, Heart, CreditCard, User,
  PanelLeftClose, PanelLeftOpen, Menu, X,
} from "lucide-react";

const NAV = [
  { to: "overview",    label: "Overview",     icon: LayoutDashboard },
  { to: "listings",    label: "My Listings",  icon: Car             },
  { to: "inspections", label: "Inspections",  icon: ShieldCheck     },
  { to: "favorites",   label: "Favorites",    icon: Heart           },
  { to: "payments",    label: "Payments",     icon: CreditCard      },
  { to: "profile",     label: "Profile",      icon: User            },
];

// ── Nav link — shared by desktop and mobile overlay ──────────────────────────

function SideNavLink({ to, label, icon: Icon, collapsed, onClick }) {
  return (
    <NavLink
      key={to}
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          collapsed ? "justify-center px-2" : "px-3"
        } ${
          isActive
            ? "text-brand-orange font-semibold"
            : "text-brand-muted hover:bg-black/4 hover:text-brand-dark"
        }`
      }
      style={({ isActive }) => isActive
        ? {
            background: "rgba(234,109,0,0.08)",
            borderLeft: collapsed ? "none" : "3px solid #ea6d00",
            paddingLeft: collapsed ? undefined : "calc(0.75rem - 3px)",
          }
        : {
            borderLeft: collapsed ? "none" : "3px solid transparent",
            paddingLeft: collapsed ? undefined : "calc(0.75rem - 3px)",
          }
      }
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && label}
    </NavLink>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const avatar        = user?.username?.[0]?.toUpperCase() ?? "U";

  // Desktop: collapsed = icons-only sidebar
  const [collapsed,  setCollapsed]  = useState(false);
  // Mobile / tablet: overlay drawer — mounted keeps DOM alive, visible drives the CSS transform
  const [mounted,    setMounted]    = useState(false);
  const [visible,    setVisible]    = useState(false);

  function openDrawer() {
    setMounted(true);
    // One tick delay so the element is in the DOM before we trigger the transition
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }

  function closeDrawer() {
    setVisible(false);
    // Wait for the 300ms slide-out to finish before unmounting
    setTimeout(() => setMounted(false), 300);
  }

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: "calc(100vh - 70px)" }}
    >
      {/* ════════════════════════════════════════════
          DESKTOP SIDEBAR  (lg+)
      ════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex shrink-0 flex-col overflow-y-auto bg-white"
        style={{
          width: collapsed ? "60px" : "224px",
          borderRight: "1px solid rgba(0,0,0,0.07)",
          transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header row: avatar / title + collapse toggle */}
        <div
          className="flex items-center shrink-0 px-3 py-4"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", minHeight: "68px" }}
        >
          {!collapsed && (
            <div className="flex-1 min-w-0 mr-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mb-1.5"
                style={{ background: "#ea6d00" }}
              >
                {avatar}
              </div>
              <p className="font-semibold text-xs text-brand-dark truncate">{user?.username ?? "User"}</p>
              <p className="text-[11px] text-brand-muted truncate">{user?.email ?? ""}</p>
            </div>
          )}

          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-muted hover:bg-gray-100 transition shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* When collapsed: show avatar as icon */}
        {collapsed && (
          <div className="flex justify-center py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "#ea6d00" }}
            >
              {avatar}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 p-2 flex-1 pt-3">
          {NAV.map(item => (
            <SideNavLink key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {!collapsed && (
          <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[11px] text-brand-muted">GearTrade Dashboard</p>
          </div>
        )}
      </aside>

      {/* ════════════════════════════════════════════
          MOBILE / TABLET  (<lg)
      ════════════════════════════════════════════ */}

      {/* Icon-only rail */}
      <aside
        className="lg:hidden shrink-0 flex flex-col bg-white overflow-y-auto"
        style={{ width: "52px", borderRight: "1px solid rgba(0,0,0,0.07)" }}
      >
        {/* Hamburger to open full overlay */}
        <button
          onClick={openDrawer}
          className="w-full flex items-center justify-center py-4 text-brand-muted hover:text-brand-dark transition"
          title="Open menu"
        >
          <PanelLeftOpen size={18} />
        </button>

        <div style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }} />

        {/* Icons only */}
        <nav className="flex flex-col gap-0.5 p-1.5 flex-1 pt-2">
          {NAV.map(item => (
            <SideNavLink key={item.to} {...item} collapsed={true} />
          ))}
        </nav>
      </aside>

      {/* Mobile full-width overlay drawer — always mounted while open/closing so transition plays */}
      {mounted && (
        <div className="fixed inset-0 lg:hidden" style={{ zIndex: 2000 }}>
          {/* Backdrop fades in/out */}
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(0,0,0,0.4)",
              opacity: visible ? 1 : 0,
              transition: "opacity 300ms ease",
            }}
            onClick={closeDrawer}
          />

          {/* Drawer slides in from left */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-white flex flex-col"
            style={{
              width: "240px",
              boxShadow: "4px 0 20px rgba(0,0,0,0.12)",
              transform: visible ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-4 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: "#ea6d00" }}
                >
                  {avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-brand-dark truncate">{user?.username ?? "User"}</p>
                  <p className="text-[11px] text-brand-muted truncate">{user?.email ?? ""}</p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-muted hover:bg-gray-100 transition shrink-0 ml-1"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-0.5 p-2 flex-1 pt-3 overflow-y-auto">
              {NAV.map(item => (
                <SideNavLink
                  key={item.to}
                  {...item}
                  collapsed={false}
                  onClick={closeDrawer}
                />
              ))}
            </nav>

            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[11px] text-brand-muted">GearTrade Dashboard</p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
