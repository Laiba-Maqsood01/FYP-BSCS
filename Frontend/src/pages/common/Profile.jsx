import { useEffect, useState, useRef } from "react";
import { Eye, EyeOff, Mail, Phone, Lock, AlertTriangle, Check, X, Trash2, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/toast";
import api from "../../services/api";
import { deleteAccount } from "../../services/authService";
import axios from "axios";

const inputCls = "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";

function PasswordField({ label, value, onChange, placeholder, show, onToggle }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">{label}</label>
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
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, iconBg, iconColor, title, subtitle, danger, children }) {
  return (
    <div
      className="bg-white rounded-xl overflow-hidden mb-3.5"
      style={{ border: danger ? "1px solid #fecaca" : "1px solid rgba(0,0,0,0.07)" }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: danger ? "1px solid #fecaca" : "1px solid rgba(0,0,0,0.06)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: danger ? "#dc2626" : "#0f172a" }}>{title}</p>
          <p className="text-[11px] text-brand-muted mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { setUser: setAuthUser } = useAuth();
  const [user, setUser] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // Mobile number change
  const [newNumber, setNewNumber] = useState("");
  const [numberPassword, setNumberPassword] = useState("");
  const [numberCode, setNumberCode] = useState("");
  const [numberRequesting, setNumberRequesting] = useState(false);
  const [showNumberPassword, setShowNumberPassword] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get("/auth/get-me").then((res) => setUser(res.data.data));
  }, []);

  if (!user) return (
    <div className="max-w-xl px-6 py-8 animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-44 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
      </div>
      {/* Profile card skeleton */}
      <div className="bg-white rounded-xl mb-3.5 overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-4 px-5 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-48 bg-gray-100 rounded mb-2" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
              <div className="h-5 w-12 bg-gray-100 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-5">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-gray-100 rounded mb-1.5" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Section card skeletons */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl mb-3.5 overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-36 bg-gray-200 rounded mb-1.5" />
              <div className="h-3 w-52 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );

  const initials = user.username?.slice(0, 2).toUpperCase() || "??";

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const sigRes = await api.post("/upload/sign", { folder: "avatars", count: 1, resource_type: "image" });
      const sig = sigRes.data.data.signatures[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.api_key);
      formData.append("timestamp", sig.timestamp);
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      const upload = await axios.post(
        `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
        formData
      );
      const avatarUrl = upload.data.secure_url;
      await api.patch("/auth/avatar", { avatarUrl });
      setUser(prev => ({ ...prev, avatar: avatarUrl }));
      setAuthUser(prev => prev ? { ...prev, avatar: avatarUrl } : prev);
      showSuccess("Profile photo updated");
    } catch {
      showError("Failed to upload photo. Try again.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  const handleRequestEmailChange = async () => {
    try {
      setRequesting(true);
      await api.post("/auth/request-email-change", { newEmail, password });
      showSuccess("OTP sent to your new email");
      setUser((prev) => ({ ...prev, pendingEmail: newEmail }));
    } catch {
      showError("Failed to send OTP. Check your password and try again.");
    } finally {
      setRequesting(false);
    }
  };

  const handleConfirmEmail = async () => {
    try {
      const res = await api.post("/auth/confirm-email-change", { otp });
      setUser((prev) => ({ ...prev, email: res.data.data.email, pendingEmail: null }));
      showSuccess("Email updated");
      setNewEmail(""); setPassword(""); setOtp("");
    } catch {
      showError("Invalid or expired OTP.");
    }
  };

  const handleCancelEmail = async () => {
    try {
      await api.post("/auth/cancel-email-change");
      setUser((prev) => ({ ...prev, pendingEmail: null }));
      showSuccess("Email change cancelled");
    } catch {
      showError("Failed to cancel. Try again.");
    }
  };

  // ── Mobile number change (mirrors the email flow) ──────────────────────────
  const handleRequestNumberChange = async () => {
    if (!/^03\d{9}$/.test(newNumber)) {
      showError("Enter a valid 11-digit number starting with 03");
      return;
    }
    try {
      setNumberRequesting(true);
      await api.post("/auth/request-number-change", { newNumber, password: numberPassword });
      showSuccess("Verification code sent to the new number");
      setUser((prev) => ({ ...prev, pendingMobileNumber: newNumber }));
    } catch (e) {
      showError(e?.response?.data?.message ?? "Failed to send code. Check your password and try again.");
    } finally {
      setNumberRequesting(false);
    }
  };

  const handleConfirmNumber = async () => {
    try {
      const res = await api.post("/auth/confirm-number-change", { code: numberCode });
      const mobileNumber = res.data.data.mobileNumber;
      setUser((prev) => ({ ...prev, mobileNumber, pendingMobileNumber: null }));
      setAuthUser((prev) => prev ? { ...prev, mobileNumber } : prev);
      showSuccess("Mobile number updated");
      setNewNumber(""); setNumberPassword(""); setNumberCode("");
    } catch (e) {
      showError(e?.response?.data?.message ?? "Invalid or expired code.");
    }
  };

  const handleCancelNumber = async () => {
    try {
      await api.post("/auth/cancel-number-change");
      setUser((prev) => ({ ...prev, pendingMobileNumber: null }));
      showSuccess("Number change cancelled");
    } catch {
      showError("Failed to cancel. Try again.");
    }
  };

  const handleChangePassword = async () => {
    try {
      await api.post("/auth/change-password", { oldPassword, newPassword });
      showSuccess("Password updated. Please log in again.");
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      showError("Incorrect current password.");
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
      showSuccess("Account deleted");
      navigate("/login");
    } catch (e) {
      showError(e?.response?.data?.message ?? "Failed to delete account.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-xl px-6 py-8">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-dark">Account settings</h1>
        <p className="text-sm text-brand-muted mt-0.5">Manage your profile and security preferences</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl mb-3.5 overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        {/* Avatar + name row */}
        <div className="flex items-center gap-4 px-5 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                onClick={() => setShowAvatar(true)}
                title="View photo"
                className="w-14 h-14 rounded-full object-cover cursor-pointer hover:opacity-90 transition"
                style={{ border: "2px solid rgba(234,109,0,0.15)" }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: "#fff7ed", color: "#ea6d00", border: "2px solid rgba(234,109,0,0.15)" }}
              >
                {initials}
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-white transition hover:opacity-80 disabled:opacity-50"
              style={{ background: "#ea6d00" }}
              title="Change photo"
            >
              {uploadingAvatar
                ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                : <Camera size={10} />
              }
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-base font-bold text-brand-dark">{user.username}</p>
            <p className="text-xs text-brand-muted mt-0.5">{user.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {user.verified && (
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>
                  <Check size={10} /> Verified
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: "#fff7ed", color: "#ea6d00" }}>
                {user.role?.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 px-5 py-4 gap-y-4">
          {[
            { label: "Username",       value: user.username },
            { label: "Mobile number",  value: user.mobileNumber || "—" },
            { label: "Account status", value: user.accountStatus, color: "#16a34a" },
            { label: "Member since",   value: memberSince },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted mb-1">{label}</p>
              <p className="text-sm font-semibold text-brand-dark" style={color ? { color } : {}}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change Email */}
      <SectionCard
        icon={Mail}
        iconBg="#eff6ff"
        iconColor="#3b82f6"
        title="Email address"
        subtitle="Change the email linked to your account"
      >
        {user.pendingEmail ? (
          <div className="space-y-3">
            {/* Pending banner */}
            <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-3" style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
              <span className="text-[11px] mt-0.5" style={{ color: "#d97706" }}>⏳</span>
              <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                A verification code was sent to <strong>{user.pendingEmail}</strong>. Enter it below to confirm, or cancel to keep your current email.
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">Verification code</label>
              <input className={inputCls} placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirmEmail}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition"
                style={{ background: "#111827" }}>
                <Check size={13} /> Verify
              </button>
              <button
                onClick={handleCancelEmail}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
                style={{ border: "1px solid rgba(220,38,38,0.25)", color: "#dc2626" }}>
                <X size={13} /> Cancel change
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">New email address</label>
              <input className={inputCls} placeholder="newemail@example.com" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <PasswordField
              label="Confirm password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your current password"
              show={showEmailPassword}
              onToggle={() => setShowEmailPassword(!showEmailPassword)}
            />
            <div className="pt-1">
              <button
                onClick={handleRequestEmailChange}
                disabled={requesting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60"
                style={{ background: "#111827" }}>
                <Mail size={13} /> {requesting ? "Sending…" : "Request change"}
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Change Mobile Number */}
      <SectionCard
        icon={Phone}
        iconBg="#f0fdf4"
        iconColor="#16a34a"
        title="Mobile number"
        subtitle="Change the verified number linked to your account and listings"
      >
        {user.pendingMobileNumber ? (
          <div className="space-y-3">
            {/* Pending banner */}
            <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-3" style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
              <span className="text-[11px] mt-0.5" style={{ color: "#d97706" }}>⏳</span>
              <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                A verification code was sent via SMS to <strong>{user.pendingMobileNumber}</strong>. Enter it below to confirm, or cancel to keep your current number.
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">Verification code</label>
              <input className={inputCls} placeholder="Enter code" value={numberCode}
                onChange={(e) => setNumberCode(e.target.value.replace(/\D/g, ""))} maxLength={8} />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirmNumber}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition"
                style={{ background: "#111827" }}>
                <Check size={13} /> Verify
              </button>
              <button
                onClick={handleCancelNumber}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
                style={{ border: "1px solid rgba(220,38,38,0.25)", color: "#dc2626" }}>
                <X size={13} /> Cancel change
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">New mobile number</label>
              <input className={inputCls} placeholder="03XXXXXXXXX" type="tel" maxLength={11}
                value={newNumber} onChange={(e) => setNewNumber(e.target.value)} />
            </div>
            <PasswordField
              label="Confirm password"
              value={numberPassword}
              onChange={(e) => setNumberPassword(e.target.value)}
              placeholder="Your current password"
              show={showNumberPassword}
              onToggle={() => setShowNumberPassword(!showNumberPassword)}
            />
            <p className="text-[11px] text-brand-muted leading-relaxed">
              Your active listings will automatically switch to the new number once it's verified.
            </p>
            <div className="pt-1">
              <button
                onClick={handleRequestNumberChange}
                disabled={numberRequesting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60"
                style={{ background: "#111827" }}>
                <Phone size={13} /> {numberRequesting ? "Sending…" : "Request change"}
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Change Password */}
      <SectionCard
        icon={Lock}
        iconBg="#f5f3ff"
        iconColor="#8b5cf6"
        title="Password"
        subtitle="Update your account password"
      >
        <div className="space-y-3">
          <PasswordField
            label="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="••••••••"
            show={showOld}
            onToggle={() => setShowOld(!showOld)}
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <div className="pt-1">
            <button
              onClick={handleChangePassword}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition"
              style={{ background: "#111827" }}>
              <Lock size={13} /> Update password
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Danger Zone — account deletion is not available to admins */}
      {user.role !== "admin" && (
        <SectionCard
          icon={AlertTriangle}
          iconBg="#fee2e2"
          iconColor="#dc2626"
          title="Danger zone"
          subtitle="Irreversible account actions"
          danger
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-dark mb-1">Delete account</p>
              <p className="text-xs text-brand-muted leading-relaxed">
                Permanently removes your account, listings, and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition shrink-0"
              style={{ background: "#dc2626" }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </SectionCard>
      )}

      {/* Avatar full view — WhatsApp-style */}
      {showAvatar && user.avatar && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, background: "rgba(0,0,0,0.85)" }}
          onClick={() => setShowAvatar(false)}
        >
          <button
            onClick={() => setShowAvatar(false)}
            title="Close"
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg text-white bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <img
              src={user.avatar}
              alt={user.username}
              className="rounded-2xl object-contain shadow-2xl"
              style={{ maxWidth: "min(90vw, 460px)", maxHeight: "80vh" }}
            />
            <p className="text-white text-sm font-medium">{user.username}</p>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)" }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#fee2e2" }}>
                <Trash2 size={15} style={{ color: "#dc2626" }} />
              </div>
              <p className="font-semibold text-brand-dark">Delete account</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-brand-muted leading-relaxed mb-5">
                This action is <strong className="text-brand-dark">permanent</strong> and cannot be undone. All your listings, inspections, and data will be removed.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
                  style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#374151" }}>
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition disabled:opacity-60"
                  style={{ background: "#dc2626" }}>
                  <Trash2 size={13} /> {deleting ? "Deleting…" : "Delete account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
