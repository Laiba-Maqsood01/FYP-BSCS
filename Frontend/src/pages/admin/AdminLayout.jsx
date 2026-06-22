import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Users, BookOpen, BarChart3, LayoutDashboard, PanelLeftOpen, PanelRightOpen } from "lucide-react";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(prev => !prev);
  };
  return (
  <div className={`admin-layout ${collapsed ? "collapsed" : ""}`}>

    {/* SIDEBAR */}
    <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>

      <div className="admin-header">
        {!collapsed && <h4 className="admin-logo">Admin Panel</h4>}

        <div className="admin-toggle" onClick={toggleSidebar}>
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelRightOpen size={20} />
          )}
        </div>
      </div>

      <nav className="admin-nav">

        <NavLink to="/admin" end>
          <Users size={18} />
          {!collapsed && "Manage Users"}
        </NavLink>

        <NavLink to="/admin/manageCourses">
          <BookOpen size={18} />
          {!collapsed && "Manage Courses"}
        </NavLink>

        <NavLink to="/admin/analytics">
          <BarChart3 size={18} />
          {!collapsed && "Analytics"}
        </NavLink>

        <NavLink to="/profile">
          <Users size={18} />
          {!collapsed && "Profile"}
        </NavLink>

      </nav>

    </aside>

    {/* MAIN */}
    <main className={`admin-main ${collapsed ? "collapsed" : ""}`}>
      <Outlet />
    </main>

  </div>
);
}