import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { showSuccess, showError } from "../../utils/toast";
import api from "../../services/api";

export default function VerifyEmail() {
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const email = location.state?.email;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // No OTP send on mount — every path into this page has already sent one
  // (registration sends it server-side; unverified login resends before
  // navigating here). The Resend button covers expired codes.

  useEffect(() => {
    let interval;
    if (!canResend) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [canResend]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const code = otp.join("");
      const res = await api.post("/auth/verify-email", { email, otp: code });
      const user = res.data.data;
      setUser(user);
      showSuccess("Email verified!");
      // Step 2: the mobile number must be verified before the account activates
      if (!user.phoneVerified) {
        navigate("/verify-phone", { state: { email } });
      } else {
        navigate("/login", { state: { message: "Account verified. Please login." } });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
      showError("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/auth/resend-otp", { email });
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  if (!email) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <h4 className="text-brand-dark text-xl font-semibold">Invalid Access</h4>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-105 bg-white rounded-2xl shadow-xl p-8 text-center">
        <h4 className="font-bold text-xl text-brand-dark mb-2">Verify Your Email</h4>
        <p className="text-brand-muted text-sm mb-1">
          OTP sent to <span className="font-semibold text-brand-dark2">{email}</span>
        </p>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* OTP boxes */}
          <div className="flex justify-center gap-2 my-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                maxLength={1}
                className="w-11 h-12 text-center text-xl font-bold bg-brand-surface border border-black/10 rounded-lg outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10 transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-btn text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-brand-dark2 transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="mt-4">
          <button
            disabled={!canResend}
            onClick={handleResend}
            className="text-sm font-medium border border-black/15 rounded-lg px-4 py-2 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {canResend ? "Resend OTP" : `Resend in ${timer}s`}
          </button>
        </div>
      </div>
    </div>
  );
}
