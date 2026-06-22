import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { register } from "../../services/authService";
import { showError, showSuccess } from "../../utils/toast";

function validate(form) {
  const errors = {};
  if (!form.username.trim()) {
    errors.username = "Username is required.";
  } else if (form.username.trim().length < 3) {
    errors.username = "Username must be at least 3 characters.";
  } else if (form.username.trim().length > 20) {
    errors.username = "Username must be at most 20 characters.";
  }
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.mobileNumber.trim()) {
    errors.mobileNumber = "Mobile number is required.";
  } else if (!/^03[0-9]{9}$/.test(form.mobileNumber)) {
    errors.mobileNumber = "Enter a valid Pakistani number (03XXXXXXXXX).";
  }
  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (!form.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!form.agreeToTerms) {
    errors.agreeToTerms = "You must agree to the Terms & Conditions.";
  }
  return errors;
}

const inputCls =
  "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    agreeToTerms: false,
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const errors = validate(form);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setTouched({ ...touched, [name]: true });
  };

  const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        mobileNumber: form.mobileNumber,
        agreeToTerms: form.agreeToTerms,
      });
      showSuccess("Account created! Please verify your email.");
      navigate("/verify-email", { state: { email: form.email } });
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      const msg = err.response?.data?.message || "Registration failed.";
      showError(fieldErrors?.length ? fieldErrors.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-center font-bold text-xl text-brand-dark mb-1">Create Account</h3>
        <p className="text-center text-brand-muted text-sm mb-6">
          Join the vehicle marketplace today
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your username"
              className={inputCls}
            />
            {touched.username && errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email"
              className={inputCls}
            />
            {touched.email && errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">Mobile Number</label>
            <input
              type="tel"
              name="mobileNumber"
              value={form.mobileNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="03XXXXXXXXX"
              className={inputCls}
            />
            {touched.mobileNumber && errors.mobileNumber ? (
              <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>
            ) : (
              <p className="text-brand-muted text-xs mt-1">Format: 03XXXXXXXXX</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start gap-2.5 text-sm text-brand-dark2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={form.agreeToTerms}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 accent-brand-orange flex-shrink-0 cursor-pointer"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" target="_blank" className="text-brand-dark font-medium underline hover:text-brand-dark2">
                  Terms &amp; Conditions
                </Link>
              </span>
            </label>
            {touched.agreeToTerms && errors.agreeToTerms && (
              <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-btn text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-brand-dark2 transition disabled:opacity-60 cursor-pointer"
            style={{ borderRadius: "0.5rem" }}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-brand-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-dark font-medium underline hover:text-brand-dark2">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
