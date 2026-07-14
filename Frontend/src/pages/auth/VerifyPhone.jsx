import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../../utils/toast";
import * as authService from "../../services/authService";

// Step 2 of registration: the email is already verified, now the mobile
// number gets an SMS code (Twilio Verify). The account becomes ACTIVE only
// after this step succeeds.
export default function VerifyPhone() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [sentTo, setSentTo]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const [timer, setTimer]         = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Change-number UI
  const [changing, setChanging]   = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [changeBusy, setChangeBusy] = useState(false);

  // Send the code on arrival — guarded so StrictMode's double effect run
  // doesn't fire two SMS (each send costs money and counts against the limit)
  const sentRef = useRef(false);
  useEffect(() => {
    if (!email || sentRef.current) return;
    sentRef.current = true;
    authService.sendPhoneOtp(email)
      .then(res => setSentTo(res.sentTo || ""))
      .catch(err => setError(err.response?.data?.message || "Failed to send code"));
  }, [email]);

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
    if (value && index < 5) document.getElementById(`potp-${index + 1}`)?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`potp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.verifyPhone(email, otp.join(""));
      showSuccess("Mobile number verified — your account is now active!");
      navigate("/login", { state: { message: "Account verified. Please login." } });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await authService.sendPhoneOtp(email);
      setSentTo(res.sentTo || sentTo);
      setTimer(60);
      setCanResend(false);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    }
  };

  const handleChangeNumber = async () => {
    if (!/^03\d{9}$/.test(newNumber)) {
      setError("Enter a valid 11-digit number starting with 03");
      return;
    }
    setChangeBusy(true);
    setError("");
    try {
      const res = await authService.changeVerificationNumber(email, newNumber);
      setSentTo(res.sentTo || "");
      setChanging(false);
      setNewNumber("");
      setOtp(["", "", "", "", "", ""]);
      setTimer(60);
      setCanResend(false);
      showSuccess("Number updated — a new code was sent");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update number";
      setError(msg);
      showError(msg);
    } finally {
      setChangeBusy(false);
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
        <h4 className="font-bold text-xl text-brand-dark mb-2">Verify Your Mobile Number</h4>
        <p className="text-brand-muted text-sm mb-1">
          {sentTo
            ? <>Code sent via SMS to <span className="font-semibold text-brand-dark2">{sentTo}</span></>
            : "Sending verification code…"}
        </p>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* OTP boxes */}
          <div className="flex justify-center gap-2 my-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`potp-${i}`}
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
            {loading ? "Verifying..." : "Verify Number"}
          </button>
        </form>

        <div className="mt-4">
          <button
            disabled={!canResend}
            onClick={handleResend}
            className="text-sm font-medium border border-black/15 rounded-lg px-4 py-2 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {canResend ? "Resend Code" : `Resend in ${timer}s`}
          </button>
        </div>

        {/* Change number */}
        <div className="mt-5 pt-4 border-t border-black/8">
          {!changing ? (
            <button
              onClick={() => { setChanging(true); setError(""); }}
              className="text-xs text-brand-muted hover:text-brand-dark underline transition cursor-pointer"
            >
              Wrong number? Change it
            </button>
          ) : (
            <div className="text-left">
              <label className="block text-xs font-medium text-brand-dark2 mb-1">New mobile number</label>
              <input
                type="tel"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="03XXXXXXXXX"
                maxLength={11}
                className="w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleChangeNumber}
                  disabled={changeBusy}
                  className="flex-1 bg-brand-dark text-white rounded-lg py-2 text-xs font-semibold hover:bg-brand-dark2 transition disabled:opacity-60 cursor-pointer"
                >
                  {changeBusy ? "Updating…" : "Update & Send Code"}
                </button>
                <button
                  onClick={() => { setChanging(false); setNewNumber(""); setError(""); }}
                  disabled={changeBusy}
                  className="flex-1 border border-black/15 rounded-lg py-2 text-xs font-semibold text-brand-dark2 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
