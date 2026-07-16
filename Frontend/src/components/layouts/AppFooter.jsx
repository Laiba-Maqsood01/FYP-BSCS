import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";
import api from "../../services/api";
import { MANAGED_CITY_NAMES } from "../../utils/managedCities";

const QUICK_LINKS = [
  { name: "Home",           href: "/",           internal: true },
  { name: "Browse Cars",    href: "/browse-cars", internal: true },
  { name: "Post an Ad",     href: "/post-ad",     internal: true },
];

// Paste the real page URLs here once the accounts are created ("#" = not yet).
const SOCIAL_LINKS = [
  { label: "Instagram", href: "#", icon: <RiInstagramFill size={16} /> },
  { label: "YouTube",   href: "#", icon: <FaYoutube      size={16} /> },
  { label: "Facebook",  href: "#", icon: <FaFacebook     size={16} /> },
];

const SUPPORT_EMAIL = "support@geartrade.app";

// .app-footer-link
const footerLink = "no-underline transition-colors duration-[0.18s]";

export default function AppFooter({
  brand = { title: "GearTrade", short: "GT", href: "/" },
}) {
  // Live company phone from Site Settings — same number the managed flow shows
  const [companyPhone, setCompanyPhone] = useState(null);

  useEffect(() => {
    api.get("/settings")
      .then(r => setCompanyPhone(r.data.data?.companyPhone ?? null))
      .catch(() => setCompanyPhone(null));
  }, []);


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
              style={{ gap: "0.25rem", marginBottom: "0.85rem" }}
            >
              {/* .app-footer-logo */}
              <img src="/logo2.svg" alt={brand.title} className="h-10 w-auto shrink-0" />
              <span style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.01em", color: "#0f172a" }}>
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
                    target={item.href !== "#" ? "_blank" : undefined}
                    rel={item.href !== "#" ? "noopener noreferrer" : undefined}
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

          {/* Contact Us — live company phone from Site Settings */}
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Contact Us
            </h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
              {companyPhone && (
                <li className="flex items-center" style={{ gap: "0.6rem" }}>
                  <Phone size={15} style={{ color: "#64748b", flexShrink: 0 }} />
                  <a
                    href={`tel:${companyPhone}`}
                    className={footerLink}
                    style={{ color: "#64748b", fontSize: "0.92rem" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                  >
                    {companyPhone}
                  </a>
                </li>
              )}
              <li className="flex items-center" style={{ gap: "0.6rem" }}>
                <Mail size={15} style={{ color: "#64748b", flexShrink: 0 }} />
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className={footerLink}
                  style={{ color: "#64748b", fontSize: "0.92rem" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-start" style={{ gap: "0.6rem" }}>
                <MapPin size={15} style={{ color: "#64748b", flexShrink: 0, marginTop: "2px" }} />
                <span style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  Service cities: {MANAGED_CITY_NAMES.join(", ")}
                </span>
              </li>
            </ul>
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
