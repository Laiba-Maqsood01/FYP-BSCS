import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "../../utils/toast";
import api from "../../services/api";

const inputCls =
  "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";

function Section({ title, children }) {
  return (
    <div className="border border-gray-100 rounded-xl p-5 mb-5 bg-white">
      <h5 className="font-semibold text-brand-dark mb-4">{title}</h5>
      {children}
    </div>
  );
}

function PasswordField({ value, onChange, placeholder, show, onToggle }) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputCls + " pr-10"}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [requesting, setRequesting] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get("/auth/get-me").then((res) => setUser(res.data.data));
  }, []);

  if (!user) return <p className="p-4">Loading...</p>;

  const handleRequestEmailChange = async () => {
    try {
      setRequesting(true);
      await api.post("/auth/request-email-change", { newEmail, password });
      showSuccess("OTP sent to your new email");
      setUser((prev) => ({ ...prev, pendingEmail: newEmail }));
    } catch {
      showError("Error");
    } finally {
      setRequesting(false);
    }
  };

  const handleConfirmEmail = async () => {
    try {
      const res = await api.post("/auth/confirm-email-change", { otp });
      setUser((prev) => ({ ...prev, email: res.data.data.email, pendingEmail: null }));
      showSuccess("Email updated successfully");
      setNewEmail(""); setPassword(""); setOtp("");
    } catch {
      showError("Error");
    }
  };

  const handleCancelEmail = async () => {
    try {
      await api.post("/auth/cancel-email-change");
      setUser((prev) => ({ ...prev, pendingEmail: null }));
      showSuccess("Email change cancelled");
    } catch {
      showError("Error");
    }
  };

  const handleChangePassword = async () => {
    try {
      await api.post("/auth/change-password", { oldPassword, newPassword });
      showSuccess("Password changed. Please login again.");
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      showError("Error");
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeleting(true);
      await api.delete("/auth/delete-account");
      showSuccess("Account deleted successfully");
      navigate("/login");
    } catch {
      showError("Error deleting account");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const infoFields = [
    { label: "Username", value: user.username },
    { label: "Email", value: user.email },
    { label: "Mobile Number", value: user.mobileNumber || "—" },
    { label: "Role", value: user.role, capitalize: true },
    { label: "Account Status", value: user.accountStatus },
    { label: "Email Verified", value: user.verified ? "Yes" : "No" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-brand-dark">Account Settings</h3>
        <p className="text-brand-muted text-sm mt-1">Manage your account details and security</p>
      </div>

      {/* Profile Info */}
      <Section title="Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoFields.map(({ label, value, capitalize }) => (
            <div key={label}>
              <label className="text-xs text-gray-400 block mb-0.5">{label}</label>
              <p className={`font-medium text-brand-dark2 break-words${capitalize ? " capitalize" : ""}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Change Email */}
      <Section title="Change Email">
        {!user.pendingEmail ? (
          <div className="space-y-3">
            <input
              className={inputCls}
              placeholder="New Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Confirm Password"
              show={showEmailPassword}
              onToggle={() => setShowEmailPassword(!showEmailPassword)}
            />
            <button
              onClick={handleRequestEmailChange}
              disabled={requesting}
              className="bg-brand-btn text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-dark2 transition disabled:opacity-60"
            >
              {requesting ? "Sending..." : "Request Change"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              className={inputCls}
              placeholder="Enter OTP sent to new email"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirmEmail}
                className="bg-brand-btn text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-dark2 transition"
              >
                Verify
              </button>
              <button
                onClick={handleCancelEmail}
                className="border border-red-300 text-red-600 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-red-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Change Password */}
      <Section title="Password">
        <div className="space-y-3">
          <PasswordField
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Old Password"
            show={showOld}
            onToggle={() => setShowOld(!showOld)}
          />
          <PasswordField
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <button
            onClick={handleChangePassword}
            className="bg-brand-btn text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-dark2 transition"
          >
            Update Password
          </button>
        </div>
      </Section>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-xl p-5 bg-white">
        <h5 className="font-semibold text-brand-dark mb-4">Danger Zone</h5>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-red-700 transition"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h5 className="font-bold text-lg text-brand-dark mb-3">Delete Account</h5>
            <p className="text-brand-muted text-sm mb-6">
              This action is <strong>permanent</strong> and cannot be undone.
              Are you sure you want to delete your account?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold border border-black/15 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
