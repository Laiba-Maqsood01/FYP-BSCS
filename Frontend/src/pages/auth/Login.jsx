import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { showSuccess, showError } from "../../utils/toast";

function validate(form) {
  const errors = {};
  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.password) {
    errors.password = "Password is required.";
  }
  return errors;
}

const inputCls = "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
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
      const result = await login(form, navigate);
      if (!result.success) { showError(result.message || "Invalid credentials"); return; }
      showSuccess("You are logged in!");
    } catch {
      showError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-105 bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-center font-bold text-xl text-brand-dark mb-1">Welcome Back</h3>
        <p className="text-center text-brand-muted text-sm mb-6">Login to your account</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputCls}
            />
            {touched.email && errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-brand-dark2 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
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

          {/* Remember me + forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 text-sm text-brand-dark2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 accent-brand-orange shrink-0 cursor-pointer"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-brand-muted underline hover:text-brand-dark transition">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-btn text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-brand-dark2 transition disabled:opacity-60 cursor-pointer"
            style={{ borderRadius: "0.5rem" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-brand-muted">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-dark font-medium underline hover:text-brand-dark2">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
