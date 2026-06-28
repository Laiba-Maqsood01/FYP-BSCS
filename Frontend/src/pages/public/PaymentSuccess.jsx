import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const CONTENT = {
  INSPECTION: {
    title: "Inspection Requested!",
    subtitle: "Your payment was successful. Our team will now coordinate with the seller to schedule the inspection.",
    badge: "Car Inspection",
    badgeColor: "#ea6d00",
    badgeBg: "#fff7ed",
    steps: [
      "Our team contacts the seller to arrange a date",
      "Inspector visits the seller's location",
      "A detailed 200+ point report is generated",
      "Inspection report is attached to the listing",
    ],
    primary:   { label: "Browse Cars",  path: "/browse-cars" },
    secondary: { label: "My Inspections", path: "/dashboard/inspections" },
  },
  RE_INSPECTION: {
    title: "Re-Inspection Booked!",
    subtitle: "Your payment was successful and your re-inspection request has been confirmed.",
    badge: "Re-Inspection",
    badgeColor: "#ea6d00",
    badgeBg: "#fff7ed",
    steps: [
      "Our inspector will review your re-inspection request",
      "You'll be contacted to confirm the schedule",
      "Inspector re-evaluates your car",
      "Updated inspection report shared with you",
    ],
    primary:   { label: "Browse Cars",    path: "/browse-cars" },
    secondary: { label: "My Inspections", path: "/dashboard/inspections" },
  },
  FEATURED: {
    title: "Listing Featured!",
    subtitle: "Your payment was successful. Your listing is now featured and will get priority visibility.",
    badge: "Featured Listing",
    badgeColor: "#d97706",
    badgeBg: "#fffbeb",
    steps: [
      "Your listing is now marked as Featured",
      "It will appear at the top of search results",
      "Buyers will see a Featured badge on your ad",
      "Higher visibility means faster sale",
    ],
    primary:   { label: "View My Listings", path: "/dashboard/listings" },
    secondary: { label: "My Payments",      path: "/dashboard/payments" },
  },
  COMMISSION: {
    title: "Payment Successful!",
    subtitle: "Your commission payment was processed successfully. Thank you for using GearTrade.",
    badge: "Commission Payment",
    badgeColor: "#16a34a",
    badgeBg: "#f0fdf4",
    steps: [
      "Commission payment received",
      "Your transaction has been recorded",
      "A receipt will be sent to your email",
      "Your listing status will be updated shortly",
    ],
    primary: { label: "View My Listings", path: "/profile" },
    secondary: { label: "Browse Cars", path: "/browse-cars" },
  },
};

const DEFAULT_CONTENT = {
  title: "Payment Successful!",
  subtitle: "Your payment was processed successfully.",
  badge: "Payment",
  badgeColor: "#16a34a",
  badgeBg: "#f0fdf4",
  steps: [
    "Your payment has been received",
    "You'll receive a confirmation shortly",
  ],
  primary: { label: "Go Home", path: "/" },
  secondary: { label: "Browse Cars", path: "/browse-cars" },
};

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purpose = searchParams.get("purpose") || "";

  const c = CONTENT[purpose] || DEFAULT_CONTENT;

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center">
        {/* Badge */}
        <span
          className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
          style={{ background: c.badgeBg, color: c.badgeColor }}
        >
          {c.badge}
        </span>

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "#f0fdf4" }}
        >
          <CheckCircle size={44} style={{ color: "#16a34a" }} />
        </div>

        <h1 className="text-2xl font-bold text-brand-dark mb-2">{c.title}</h1>
        <p className="text-brand-muted text-sm leading-relaxed mb-8">{c.subtitle}</p>

        {/* Steps */}
        <div
          className="rounded-xl p-4 text-left mb-8 space-y-2"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-3">What Happens Next</p>
          {c.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                style={{ background: "#16a34a", color: "#fff" }}
              >
                {i + 1}
              </span>
              <p className="text-sm text-brand-dark2">{step}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(c.primary.path)}
            className="w-full py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#111827", borderRadius: "0.5rem" }}
          >
            {c.primary.label}
          </button>
          <button
            onClick={() => navigate(c.secondary.path)}
            className="w-full py-2.5 text-sm font-semibold text-brand-dark2 border border-black/10 bg-white hover:bg-gray-50 transition"
            style={{ borderRadius: "0.5rem" }}
          >
            {c.secondary.label}
          </button>
        </div>
      </div>
    </div>
  );
}
