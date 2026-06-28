import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Users, Car, ShieldCheck, Star, ReceiptText, Banknote, Trash2, Settings, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import AdminSideNavLink from "../../components/admin/AdminSideNavLink";
import UserAvatar from "../../components/common/UserAvatar";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/admin/overview", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/users",       label: "Users",        icon: Users      },
      { to: "/admin/listings",    label: "Listings",     icon: Car        },
      { to: "/admin/inspections", label: "Inspections",  icon: ShieldCheck },
      { to: "/admin/featured",    label: "Featured",     icon: Star       },
    ],
  },
  {
    label: "Financials",
    items: [
      { to: "/admin/refunds",     label: "Refunds",      icon: ReceiptText  },
      { to: "/admin/commissions", label: "Commissions",  icon: Banknote   },
    ],
  },
  {
    label: "Managed",
    items: [
      { to: "/admin/deletions", label: "Deletion Requests", icon: Trash2 },
    ],
  },
  {
    label: "Configuration",
    items: [
      { to: "/admin/settings", label: "Site Settings", icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [visible,   setVisible]   = useState(false);

  function openDrawer() {
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }

  function closeDrawer() {
    setVisible(false);
    setTimeout(() => setMounted(false), 300);
  }

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: "calc(100vh - 70px)" }}
    >
      {/* ── DESKTOP SIDEBAR (lg+) ── */}
      <aside
        className="hidden lg:flex shrink-0 flex-col bg-white"
        style={{
          width: collapsed ? "60px" : "220px",
          borderRight: "1px solid rgba(0,0,0,0.07)",
          transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center shrink-0 px-3 py-4"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", minHeight: "68px" }}
        >
          {!collapsed && (
            <div className="flex-1 min-w-0 mr-2">
              <UserAvatar user={user} size={32} className="mb-1.5" />
              <p className="font-semibold text-xs text-brand-dark truncate">
                {user?.username ?? "Admin"}
              </p>
              <p className="text-[11px] text-brand-muted truncate">
                {user?.email ?? ""}
              </p>
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

        {/* Avatar when collapsed */}
        {collapsed && (
          <div
            className="flex justify-center py-3"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
          >
            <UserAvatar user={user} size={32} />
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-col flex-1 p-2 pt-3 gap-4 overflow-y-auto">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-muted px-3 mb-1">
                  {section.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map(item => (
                  <AdminSideNavLink key={item.to} {...item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[11px] text-brand-muted">GearTrade Admin</p>
          </div>
        )}
      </aside>

      {/* ── MOBILE / TABLET ICON RAIL (<lg) ── */}
      <aside
        className="lg:hidden shrink-0 flex flex-col bg-white"
        style={{ width: "52px", borderRight: "1px solid rgba(0,0,0,0.07)" }}
      >
        <button
          onClick={openDrawer}
          className="w-full flex items-center justify-center py-4 text-brand-muted hover:text-brand-dark transition"
          title="Open menu"
        >
          <PanelLeftOpen size={18} />
        </button>
        <div style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }} />
        <nav className="flex flex-col gap-0.5 p-1.5 flex-1 pt-2 overflow-y-auto">
          {NAV_SECTIONS.flatMap(s => s.items).map(item => (
            <AdminSideNavLink key={item.to} {...item} collapsed={true} />
          ))}
        </nav>
      </aside>

      {/* Mobile full-width overlay drawer */}
      {mounted && (
        <div className="fixed inset-0 lg:hidden" style={{ zIndex: 2000 }}>
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(0,0,0,0.4)",
              opacity: visible ? 1 : 0,
              transition: "opacity 300ms ease",
            }}
            onClick={closeDrawer}
          />

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
                <UserAvatar user={user} size={32} />
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-brand-dark truncate">
                    {user?.username ?? "Admin"}
                  </p>
                  <p className="text-[11px] text-brand-muted truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-muted hover:bg-gray-100 transition shrink-0 ml-1"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex flex-col flex-1 p-2 pt-3 gap-4 overflow-y-auto">
              {NAV_SECTIONS.map(section => (
                <div key={section.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-muted px-3 mb-1">
                    {section.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {section.items.map(item => (
                      <AdminSideNavLink
                        key={item.to}
                        {...item}
                        collapsed={false}
                        onClick={closeDrawer}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-[11px] text-brand-muted">GearTrade Admin</p>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
