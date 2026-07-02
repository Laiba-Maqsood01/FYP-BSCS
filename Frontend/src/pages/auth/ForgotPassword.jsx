import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import { showError } from "../../utils/toast";
import { MailCheck } from "lucide-react";

const inputCls = "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";

export default function ForgotPassword() {
  const [email, setEmail]       = useState("");
  const [touched, setTouched]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError =
    !email.trim()
      ? "Email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Enter a valid email address."
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (emailError) return;
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      showError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-105 bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <MailCheck size={28} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-brand-dark mb-1">Check your email</h3>
            <p className="text-brand-muted text-sm">
              If an account exists for <span className="font-medium text-brand-dark2">{email}</span>,
              we've sent a password reset link. It may take a few minutes to arrive.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full bg-brand-btn text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-brand-dark2 transition text-center"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-105 bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-center font-bold text-xl text-brand-dark mb-1">Forgot Password</h3>
        <p className="text-center text-brand-muted text-sm mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => { setEmail(e.target.value); setTouched(true); }}
              onBlur={() => setTouched(true)}
              className={inputCls}
            />
            {touched && emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-btn text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-brand-dark2 transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Sending..." : "Send Reset Link"}
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
