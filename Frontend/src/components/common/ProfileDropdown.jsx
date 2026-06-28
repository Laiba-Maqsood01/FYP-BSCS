import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Power } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import UserAvatar from "./UserAvatar";

export default function ProfileDropdown({ user, onLogout, onLogoutAll }) {
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const menuBtn =
    "w-full flex items-center gap-2.5 text-left text-sm px-3 py-2.5 rounded-xl hover:bg-gray-50 transition font-medium";

  return (
    <div ref={ref} className="relative">
      {/* Avatar */}
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer select-none hover:opacity-85 transition"
        style={{ borderRadius: "50%", lineHeight: 0 }}
      >
        <UserAvatar user={user} size={42} />
      </button>

      {/* Dropdown panel */}
      <div
        className="absolute right-0 top-13.75 w-70 bg-white rounded-2xl shadow-2xl p-3 border border-black/6"
        style={{
          transform: open ? "scale(1)" : "scale(0.95)",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transition: "0.15s ease",
          zIndex: 9999,
        }}
      >
        {/* User info */}
        <div className="px-3 py-2 flex items-center gap-3">
          <UserAvatar user={user} size={38} />
          <div className="min-w-0">
            <div className="font-semibold text-brand-dark truncate">{user?.username}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{user?.email}</div>
            <div className="text-xs text-gray-400 mt-0.5">{user?.role?.toUpperCase()}</div>
          </div>
        </div>

        <hr className="my-2 border-gray-100" />

        <button
          onClick={() => { navigate("/dashboard"); setOpen(false); }}
          className={menuBtn + " text-brand-dark"}
        >
          <LayoutDashboard size={17} className="text-brand-muted" />
          Dashboard
        </button>

        <hr className="my-2 border-gray-100" />

        <button
          onClick={() => { onLogout(); setOpen(false); }}
          className={menuBtn + " text-red-600"}
        >
          <LogOut size={17} />
          Logout
        </button>

        <hr className="my-2 border-gray-100" />

        <button
          onClick={() => { setOpen(false); setShowLogoutAllModal(true); }}
          className={menuBtn + " text-amber-500"}
        >
          <Power size={17} />
          Logout All Devices
        </button>
      </div>

      <ConfirmModal
        show={showLogoutAllModal}
        onClose={() => setShowLogoutAllModal(false)}
        onConfirm={() => { onLogoutAll(); setShowLogoutAllModal(false); }}
        title="Logout from all devices"
        message="You will be logged out from all devices including this one. Do you want to continue?"
      />
    </div>
  );
}
