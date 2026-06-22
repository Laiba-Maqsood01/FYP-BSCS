import { useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";

const QUICK_LINKS = [
  { name: "Home",           href: "/",           internal: true },
  { name: "Browse Cars",    href: "/browse-cars", internal: true },
  { name: "Post an Ad",     href: "/post-ad",     internal: true },
  { name: "Car Inspection", href: "/inspection",  internal: true },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#", icon: <RiInstagramFill size={16} /> },
  { label: "YouTube",   href: "#", icon: <FaYoutube      size={16} /> },
  { label: "Facebook",  href: "#", icon: <FaFacebook     size={16} /> },
];

// .app-footer-link
const footerLink = "no-underline transition-colors duration-[0.18s]";

export default function AppFooter({
  brand = { title: "GearTrade.app", short: "GT", href: "/" },
}) {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    // .app-footer — padding: 4rem 0 0, border-top
    <footer
      style={{
        padding: "4rem 0 0",
        background: "transparent",
        borderTop: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      
      <div className="max-w-285 mx-auto px-3">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12 items-start">


          <div>
            <Link
              to={brand.href}
              className="inline-flex items-center no-underline"
              style={{ gap: "0.55rem", marginBottom: "0.85rem" }}
            >
              {/* .app-footer-logo */}
              <span
                className="inline-flex items-center justify-center shrink-0 font-bold text-white"
                style={{
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  background: "linear-gradient(135deg, #1f2937, #0f172a)",
                }}
              >
                {brand.short}
              </span>
              {/* .app-footer-title */}
              <span style={{ color: "#0f172a", fontSize: "1.05rem", fontWeight: 700 }}>
                {brand.title}
              </span>
            </Link>

            {/* .app-footer-description */}
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: 0 }}>
              Pakistan's trusted platform for buying and selling used cars.
              Every listing verified, every transaction secured.
            </p>
          </div>

         {/* Quick Links */}
          <div>
            {/* .app-footer-heading */}
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Quick Links
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {QUICK_LINKS.map(link => (
                <li key={link.name}>
                  {link.internal ? (
                    <Link
                      to={link.href}
                      className={footerLink}
                      style={{ color: "#64748b", fontSize: "0.92rem" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                    >
                      {link.name}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className={footerLink}
                      style={{ color: "#64748b", fontSize: "0.92rem" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                    >
                      {link.name}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Follow Us
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {SOCIAL_LINKS.map(item => (
                <li key={item.label}>
                  {/* .app-footer-social-row */}
                  <a
                    href={item.href}
                    aria-label={item.label}
                    className={`${footerLink} inline-flex items-center`}
                    style={{ gap: "0.6rem", color: "#64748b", fontSize: "0.92rem" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                  >
                    {/* .app-footer-social-icon */}
                    <span
                      className="inline-flex items-center justify-center shrink-0 transition-all duration-[0.18s]"
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "50%",
                        border: "1px solid rgba(15,23,42,0.1)",
                        background: "rgba(255,255,255,0.6)",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#f1f5f9";
                        e.currentTarget.style.borderColor = "rgba(15,23,42,0.18)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.6)";
                        e.currentTarget.style.borderColor = "rgba(15,23,42,0.1)";
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Stay Updated
            </h3>
            {/* .app-footer-description */}
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: 0 }}>
              Get the latest listings and market updates.
            </p>

            {/* .app-footer-newsletter — pill form, padding: 0.3rem 0.3rem 0.3rem 1rem */}
            <form
              onSubmit={handleSubscribe}
              className="flex items-center"
              style={{
                background: "#f1f5f9",
                border: "1px solid rgba(15,23,42,0.1)",
                borderRadius: "999px",
                padding: "0.3rem 0.3rem 0.3rem 1rem",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              {/* .app-footer-email-input */}
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 min-w-0 bg-transparent border-none outline-none"
                style={{ fontSize: "0.88rem", color: "#0f172a" }}
              />

              {/* .app-footer-send-btn */}
              <button
                type="submit"
                aria-label="Subscribe"
                className="flex items-center justify-center shrink-0 text-white transition-colors duration-[0.18s] hover:bg-brand-dark2"
                style={{
                  width: "2.1rem",
                  height: "2.1rem",
                  borderRadius: "50%",
                  background: "#111827",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>

        </div>

        {/* .app-footer-bottom — margin-top: 3rem, padding: 1.25rem 0, border-top */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
          style={{
            marginTop: "3rem",
            padding: "1.25rem 0",
            borderTop: "1px solid rgba(15,23,42,0.08)",
            gap: "0.5rem",
          }}
        >
          {/* .app-footer-copy */}
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.82rem" }}>
            © {new Date().getFullYear()} {brand.title}. All rights reserved.
          </p>

          {/* Bootstrap d-flex gap-3 = 0.75rem gap */}
          <div className="flex" style={{ gap: "0.75rem" }}>
            <Link
              to="/privacy-policy"
              className={footerLink}
              style={{ color: "#64748b", fontSize: "0.92rem" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
              onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className={footerLink}
              style={{ color: "#64748b", fontSize: "0.92rem" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
              onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
            >
              Terms of Service
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
