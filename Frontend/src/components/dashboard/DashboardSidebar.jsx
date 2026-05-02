import {
  LuCarFront,
  LuFileText,
  LuLogOut,
  LuUserRound,
} from "react-icons/lu";

const menuItems = [
  {
    id: "listings",
    label: "My Listings",
    icon: LuCarFront,
  },
  {
    id: "reports",
    label: "Inspection Reports",
    icon: LuFileText,
  },
  {
    id: "profile",
    label: "Profile Settings",
    icon: LuUserRound,
  },
];

function DashboardSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-user">
        <div className="dashboard-avatar">U</div>
        <div>
          <h3>User Name</h3>
          <p>Seller Account</p>
        </div>
      </div>

      <div className="dashboard-sidebar-divider" />

      <div className="dashboard-menu">
        {menuItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`dashboard-menu-item ${
              activeSection === id ? "active" : ""
            }`}
            onClick={() => onSectionChange(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}

        <button
          type="button"
          className="dashboard-menu-item logout"
          onClick={onSectionChange.bind(null, "logout")}
        >
          <LuLogOut />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
