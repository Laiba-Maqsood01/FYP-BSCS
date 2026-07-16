import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { MANAGED_CITY_NAMES } from "../../utils/managedCities";
import api from "../../services/api";

const glassCard = {
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(15,23,42,0.06)",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

export default function StatsCTASection() {
  return (
    <section className="bg-transparent py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* External inspection — inspect any car, even unlisted ones */}
        <ExternalInspectionCTA />

      </div>
    </section>
  );
}

// ── External inspection CTA ──────────────────────────────────────────────────

const TICKS = [
  "200+ checkpoints — body frame, engine, suspension, road test",
  "Digital, tamper-proof report with photos — verifiable by QR code",
  `Available in ${MANAGED_CITY_NAMES.join(", ")}`,
];

function ExternalInspectionCTA() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [fees, setFees] = useState(null);

  useEffect(() => {
    api.get("/settings")
      .then(r => setFees(r.data.data?.inspectionFees ?? null))
      .catch(() => setFees(null));
  }, []);

  const handleCta = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    navigate("/inspection/external");
  };

  const feeRows = fees ? [
    { label: "Cars up to 1000cc",             amount: fees.standard },
    { label: "Cars above 1000cc",             amount: fees.managed },
    { label: "SUV / 4x4 / Luxury / Electric", amount: fees.premium },
  ] : [];

  return (
    <div className="rounded-2xl p-8 sm:p-11 mt-6 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-9 items-center" style={glassCard}>
      <div>
        <div className="mb-3">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em]" style={{ color: "#0284c7" }}>
            Inspection · Any Car
          </span>
        </div>

        <h2
          className="font-[650] text-brand-btn tracking-tight mb-2"
          style={{ fontSize: "clamp(1.7rem, 2.2vw, 2.1rem)", letterSpacing: "-0.02em" }}
        >
          Found a car that's not listed on GearTrade? We'll still inspect it for you.
        </h2>
        <p className="text-sm text-brand-muted mb-5 max-w-130">
          Buying from a friend, a neighbour, or another marketplace? Book our certified team
          for the same 200+ point inspection — no listing required.
        </p>

        <div className="flex flex-col gap-2 mb-6">
          {TICKS.map(t => (
            <div key={t} className="flex items-start gap-2.5 text-sm text-brand-dark2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: "#16a34a" }} />
              {t}
            </div>
          ))}
        </div>

        <button
          onClick={handleCta}
          className="bg-brand-btn text-white font-semibold px-7 py-3 rounded text-base hover:bg-brand-dark2 transition inline-flex items-center gap-2 cursor-pointer"
          style={{ borderRadius: "0.375rem" }}
        >
          Book an Inspection <ArrowRight size={16} />
        </button>
      </div>

      {/* Fee card — live values from Site Settings */}
      <div className="rounded-xl p-6" style={glassCard}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-3">
          Inspection fee by vehicle
        </p>
        {fees ? (
          <>
            {feeRows.map(row => (
              <div
                key={row.label}
                className="flex justify-between items-baseline py-2 text-[13px] text-brand-dark2"
                style={{ borderBottom: "1px dashed rgba(15,23,42,0.12)" }}
              >
                {row.label}
                <b className="text-sm text-brand-dark" style={{ fontVariantNumeric: "tabular-nums" }}>
                  PKR {Number(row.amount ?? 0).toLocaleString()}
                </b>
              </div>
            ))}
            <p className="text-[11px] text-brand-muted mt-3">
              Fee is calculated automatically from the vehicle details you enter.
              Paid online — non-refundable.
            </p>
          </>
        ) : (
          <div className="space-y-3 animate-pulse py-1">
            {[0, 1, 2].map(i => <div key={i} className="h-4 rounded bg-black/5" />)}
          </div>
        )}
      </div>
    </div>
  );
}
