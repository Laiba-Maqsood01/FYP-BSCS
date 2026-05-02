import { LuCarFront } from "react-icons/lu";
import { Link } from "react-router-dom";

const footerGroups = [
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/info/about-us" },
      { label: "Careers", to: "/info/careers" },
      { label: "Press", to: "/info/press" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Buy a Car", to: "/info/buy-a-car" },
      { label: "Sell Your Car", to: "/info/sell-your-car" },
      { label: "Inspection Services", to: "/info/inspection-services" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/info/help-center" },
      { label: "Safety", to: "/info/safety" },
      { label: "Terms of Service", to: "/info/terms-of-service" },
    ],
  },
];

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="logo">
            <div className="logo-mark">
              <LuCarFront className="car-icon" />
            </div>
            <h2>
              Auto<span>Hub</span>
            </h2>
          </div>

          <p>
            Pakistan&apos;s most trusted car marketplace with verified
            inspections. Buy and sell with confidence in Rahim Yar Khan and
            beyond.
          </p>
        </div>

        <div className="footer-links">
          {footerGroups.map((group) => (
            <div key={group.title} className="footer-column">
              <h4>{group.title}</h4>
              {group.links.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
