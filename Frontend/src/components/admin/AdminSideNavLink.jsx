import { NavLink } from "react-router-dom";

export default function AdminSideNavLink({ to, label, icon: Icon, collapsed, badge, onClick }) {
  return (
    <NavLink
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
      style={({ isActive }) =>
        isActive
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
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
              style={{ background: "rgba(234,109,0,0.12)", color: "#ea6d00" }}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
