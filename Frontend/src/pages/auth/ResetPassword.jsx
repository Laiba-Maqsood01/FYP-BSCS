import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../services/authService";
import { showSuccess, showError } from "../../utils/toast";

const inputCls = "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";

function validate(form) {
  const errors = {};
  if (!form.newPassword)
    errors.newPassword = "Password is required.";
  else if (form.newPassword.length < 6)
    errors.newPassword = "Password must be at least 6 characters.";
  else if (form.newPassword.length > 100)
    errors.newPassword = "Password must be at most 100 characters.";

  if (!form.confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (form.newPassword !== form.confirmPassword)
    errors.confirmPassword = "Passwords do not match.";

  return errors;
}

export default function ResetPassword() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get("token") ?? "";

  const [form, setForm]       = useState({ newPassword: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const errors = validate(form);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { newPassword: true, confirmPassword: true };
    setTouched(allTouched);
    if (Object.keys(errors).length > 0) return;

    if (!token) {
      showError("Reset link is invalid or expired. Please request a new one.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, form.newPassword);
      showSuccess("Password reset successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      showError(err?.response?.data?.message ?? "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  // ── Missing token guard ───────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-105 bg-white rounded-2xl shadow-xl p-8 text-center">
          <h3 className="font-bold text-xl text-brand-dark mb-2">Invalid Link</h3>
          <p className="text-brand-muted text-sm mb-6">
            This reset link is missing or invalid. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="w-full inline-block bg-brand-btn text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-brand-dark2 transition"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-105 bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-center font-bold text-xl text-brand-dark mb-1">Reset Password</h3>
        <p className="text-center text-brand-muted text-sm mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                name="newPassword"
                placeholder="Enter new password"
                value={form.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {touched.newPassword && errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-btn text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-brand-dark2 transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-brand-muted">
          Remember your password?{" "}
          <Link to="/login" className="text-brand-dark font-medium underline hover:text-brand-dark2">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
