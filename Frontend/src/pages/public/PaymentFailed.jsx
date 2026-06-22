import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, RefreshCw } from "lucide-react";

const CONTENT = {
  INSPECTION: {
    title: "Payment Failed",
    subtitle: "Your inspection booking was not confirmed. No charges have been made.",
    badge: "Inspection Payment",
    retryLabel: "Try Booking Again",
  },
  RE_INSPECTION: {
    title: "Payment Failed",
    subtitle: "Your re-inspection booking was not confirmed. No charges have been made.",
    badge: "Re-Inspection Payment",
    retryLabel: "Try Booking Again",
  },
  FEATURED: {
    title: "Payment Failed",
    subtitle: "Your listing was not featured. No charges have been made.",
    badge: "Featured Listing Payment",
    retryLabel: "Try Again",
  },
  COMMISSION: {
    title: "Payment Failed",
    subtitle: "Your commission payment was not processed. Please try again.",
    badge: "Commission Payment",
    retryLabel: "Try Again",
  },
};

const DEFAULT_CONTENT = {
  title: "Payment Failed",
  subtitle: "Your payment was not completed. No charges have been made.",
  badge: "Payment",
  retryLabel: "Try Again",
};

const REASONS = [
  "Card was declined by your bank",
  "Insufficient funds",
  "Payment session expired",
  "You cancelled the payment",
];

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purpose = searchParams.get("purpose") || "";

  const c = CONTENT[purpose] || DEFAULT_CONTENT;

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center">
        {/* Badge */}
        <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6 bg-red-50 text-red-600">
          {c.badge}
        </span>

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "#fef2f2" }}
        >
          <XCircle size={44} style={{ color: "#dc2626" }} />
        </div>

        <h1 className="text-2xl font-bold text-brand-dark mb-2">{c.title}</h1>
        <p className="text-brand-muted text-sm leading-relaxed mb-8">{c.subtitle}</p>

        {/* Possible reasons */}
        <div
          className="rounded-xl p-4 text-left mb-8"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-3">Possible Reasons</p>
          <ul className="space-y-1.5">
            {REASONS.map(reason => (
              <li key={reason} className="flex items-center gap-2 text-sm text-brand-dark2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition hover:opacity-90"
            style={{ background: "#ea6d00", borderRadius: "0.5rem" }}
          >
            <RefreshCw size={15} />
            {c.retryLabel}
          </button>
          <button
            onClick={() => navigate("/browse-cars")}
            className="w-full py-2.5 text-sm font-semibold text-brand-dark2 border border-black/10 bg-white hover:bg-gray-50 transition"
            style={{ borderRadius: "0.5rem" }}
          >
            Back to Browse
          </button>
        </div>
      </div>
    </div>
  );
}
