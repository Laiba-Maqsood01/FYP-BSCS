import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuArrowRight,
  LuEye,
  LuEyeOff,
  LuLock,
  LuMail,
  LuCarFront,
} from "react-icons/lu";
import car from "../assets/car.jpg";
import { getAdminOverview, loginUser } from "../../services/api";

const loginPresets = {
  user: {
    email: "",
    password: "123456",
  },
  admin: {
    email: "admin@autohub.com",
    password: "123456",
  },
};

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: loginPresets.user.password,
    remember: false,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await loginUser({
        email: formData.email,
        password: formData.password,
      });
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePresetLogin = async (role) => {
    const preset = loginPresets[role];

    if (role === "user") {
      const data = await getAdminOverview();
      const registeredUser = data.users.find((user) => user.role !== "admin");

      if (!registeredUser) {
        alert("Pehle user register karein, phir login hoga.");
        navigate("/register");
        return;
      }

      setFormData((currentData) => ({
        ...currentData,
        email: registeredUser.email,
        password: "123456",
      }));

      try {
        setSubmitting(true);
        await loginUser({
          email: registeredUser.email,
          password: "123456",
        });
        navigate("/dashboard");
      } catch (error) {
        alert(error.message);
      } finally {
        setSubmitting(false);
      }

      return;
    }

    setFormData((currentData) => ({
      ...currentData,
      email: preset.email,
      password: preset.password,
    }));

    try {
      setSubmitting(true);
      await loginUser(preset);
      navigate(role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="logo">
            <div className="logo-mark">
              <LuCarFront className="car-icon" />
            </div>
            <h2>
              Auto<span>Hub</span>
            </h2>
          </div>
        </div>

        <div className="login-copy">
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <div className="account-type-block">
          <span className="account-type-label">Quick login</span>

          <div className="account-type-grid">
            <button
              type="button"
              className="account-type-card active"
              onClick={() => handlePresetLogin("user")}
              disabled={submitting}
            >
              <strong>Login as User</strong>
              <small>{loginPresets.user.email}</small>
            </button>

            <button
              type="button"
              className="account-type-card"
              onClick={() => handlePresetLogin("admin")}
              disabled={submitting}
            >
              <strong>Login as Admin</strong>
              <small>{loginPresets.admin.email}</small>
            </button>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Email</span>
            <div className="login-input-wrap">
              <LuMail />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="login-input-wrap">
              <LuLock />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <LuEyeOff /> : <LuEye />}
              </button>
            </div>
          </label>

          <div className="login-options">
            <label className="remember-me">
              <input
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
              />
              <span>Remember me</span>
            </label>

            <button type="button" className="forgot-password">
              Forgot password?
            </button>
          </div>

          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? "Signing In..." : <>Sign In <LuArrowRight /></>}
          </button>
        </form>

        <p className="login-footer-text">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </section>

      <section
        className="login-visual"
        style={{
          backgroundImage: `linear-gradient(rgba(17, 39, 83, 0.84), rgba(17, 39, 83, 0.84)), url(${car})`,
        }}
      >
        <div className="login-visual-copy">
          <h2>Find Your Perfect Car</h2>
          <p>
            Join thousands of buyers and sellers on Pakistan&apos;s most trusted
            car marketplace.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
