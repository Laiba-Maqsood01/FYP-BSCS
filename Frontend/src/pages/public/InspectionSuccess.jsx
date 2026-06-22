import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function InspectionSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "#f0fdf4" }}
        >
          <CheckCircle size={44} style={{ color: "#16a34a" }} />
        </div>

        <h1 className="text-2xl font-bold text-brand-dark mb-2">Inspection Booked!</h1>
        <p className="text-brand-muted text-sm leading-relaxed mb-2">
          Your payment was successful and your inspection request has been confirmed.
        </p>
        <p className="text-brand-muted text-sm leading-relaxed mb-8">
          Our team will review your booking and contact you on your provided phone number to confirm the schedule.
        </p>

        {/* What's next */}
        <div
          className="rounded-xl p-4 text-left mb-8 space-y-2"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-3">What Happens Next</p>
          {[
            "Our inspector will review your booking",
            "You'll be contacted to confirm the exact time",
            "Inspector visits and evaluates the car",
            "Detailed report shared with you",
          ].map((step, i) => (
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
            onClick={() => navigate("/browse-cars")}
            className="w-full py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#111827", borderRadius: "0.5rem" }}
          >
            Browse More Cars
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="w-full py-2.5 text-sm font-semibold text-brand-dark2 border border-black/10 bg-white hover:bg-gray-50 transition"
            style={{ borderRadius: "0.5rem" }}
          >
            View My Profile
          </button>
        </div>
      </div>
    </div>
  );
}
