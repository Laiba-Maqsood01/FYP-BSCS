import { useNavigate } from "react-router-dom";
import { XCircle, RefreshCw } from "lucide-react";

export default function InspectionFailed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "#fef2f2" }}
        >
          <XCircle size={44} style={{ color: "#dc2626" }} />
        </div>

        <h1 className="text-2xl font-bold text-brand-dark mb-2">Payment Failed</h1>
        <p className="text-brand-muted text-sm leading-relaxed mb-8">
          Your payment was not completed. Your inspection request has not been confirmed.
          No charges have been made to your account.
        </p>

        {/* Possible reasons */}
        <div
          className="rounded-xl p-4 text-left mb-8"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-3">Possible Reasons</p>
          <ul className="space-y-1.5">
            {[
              "Card was declined by your bank",
              "Insufficient funds",
              "Payment session expired",
              "You cancelled the payment",
            ].map(reason => (
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
            Try Again
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
