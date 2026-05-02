import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuCarFront,
  LuBadgeCheck,
  LuEye,
  LuEyeOff,
  LuLock,
  LuMail,
  LuPhone,
  LuUserRound,
} from "react-icons/lu";
import car from "../assets/car1.jpg";
import { registerUser } from "../../services/api";

const benefits = [
  "Access verified inspection reports",
  "Save your favorite cars",
  "Get instant notifications",
  "List your cars for free",
];

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState("buyer");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "John Doe",
    email: "you@example.com",
    phone: "+92 300 1234567",
    password: "password",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await registerUser({
        ...formData,
        accountType,
        location: "Pakistan",
      });
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="register-page">
      <section
        className="register-visual"
        style={{
          backgroundImage: `linear-gradient(rgba(31, 60, 120, 0.76), rgba(31, 60, 120, 0.76)), url(${car})`,
        }}
      >
        <div className="register-visual-copy">
          <h2>Join AutoHub Today</h2>

          <div className="register-benefits">
            {benefits.map((benefit) => (
              <div key={benefit} className="register-benefit">
                <LuBadgeCheck />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="register-panel">
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
          <h1>Create an account</h1>
          <p>Join Pakistan&apos;s most trusted car marketplace</p>
        </div>

        <div className="account-type-block">
          <span className="account-type-label">I want to:</span>

          <div className="account-type-grid">
            <button
              type="button"
              className={`account-type-card ${
                accountType === "buyer" ? "active" : ""
              }`}
              onClick={() => setAccountType("buyer")}
            >
              <strong>Buy a Car</strong>
              <small>Browse listings</small>
            </button>

            <button
              type="button"
              className={`account-type-card ${
                accountType === "seller" ? "active" : ""
              }`}
              onClick={() => setAccountType("seller")}
            >
              <strong>Sell a Car</strong>
              <small>List your car</small>
            </button>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Full Name</span>
            <div className="login-input-wrap">
              <LuUserRound />
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </label>

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
            <span>Phone Number</span>
            <div className="login-input-wrap">
              <LuPhone />
              <input
                name="phone"
                value={formData.phone}
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

          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="login-footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
