import { useEffect, useState } from "react";
import { X, CreditCard } from "lucide-react";
import { getMyPayments } from "../../../services/paymentService";

function formatPKR(n) {
  if (!n) return "PKR 0";
  return `PKR ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PURPOSE_BADGE = {
  INSPECTION:    { bg: "#fff7ed", text: "#c2410c",  label: "Inspection"     },
  RE_INSPECTION: { bg: "#fef9c3", text: "#b45309",  label: "Re-Inspection"  },
  FEATURED:      { bg: "#dbeafe", text: "#1d4ed8",  label: "Featured"       },
  COMMISSION:    { bg: "#ede9fe", text: "#7c3aed",  label: "Commission"     },
};

const STATUS_BADGE = {
  COMPLETED: { bg: "#dcfce7", text: "#16a34a" },
  PENDING:   { bg: "#fef9c3", text: "#b45309" },
  FAILED:    { bg: "#fee2e2", text: "#dc2626" },
  REFUNDED:  { bg: "#d1fae5", text: "#065f46" },
};

const TABS = ["All", "Inspection", "Re-Inspection", "Featured", "Commission"];

function PaymentDetailModal({ payment, onClose }) {
  const purpose = PURPOSE_BADGE[payment.purpose] ?? { label: payment.purpose };
  const status  = STATUS_BADGE[payment.status]  ?? { bg: "#f1f5f9", text: "#64748b" };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="font-semibold text-brand-dark">Payment Details</p>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark transition"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-brand-muted">Amount</span>
            <span className={`text-base font-bold ${payment.status === "REFUNDED" ? "text-green-600" : "text-brand-dark"}`}>
              {payment.status === "REFUNDED" ? "+" : ""}{formatPKR(payment.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-brand-muted">Purpose</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ background: purpose.bg, color: purpose.text }}>
              {purpose.label}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-brand-muted">Status</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ background: status.bg, color: status.text }}>
              {payment.status}
            </span>
          </div>
          {payment.listing && (
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs text-brand-muted shrink-0">Listing</span>
              <span className="text-xs text-brand-dark text-right">
                {`${payment.listing.year ?? ""} ${payment.listing.brand?.name ?? ""} ${payment.listing.carModel?.name ?? ""}`.trim() || "—"}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs text-brand-muted">Date</span>
            <span className="text-xs text-brand-dark">{formatDate(payment.createdAt)}</span>
          </div>
          {payment.stripePaymentIntentId && (
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs text-brand-muted shrink-0">Transaction ID</span>
              <span className="text-[10px] text-brand-muted text-right font-mono break-all">{payment.stripePaymentIntentId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentRow({ payment, onClick }) {
  const purpose = PURPOSE_BADGE[payment.purpose] ?? { bg: "#f1f5f9", text: "#64748b", label: payment.purpose };
  const status  = STATUS_BADGE[payment.status]  ?? { bg: "#f1f5f9", text: "#64748b" };
  const isRefund = payment.status === "REFUNDED";

  return (
    <button onClick={() => onClick(payment)}
      className="w-full bg-white rounded-xl p-4 flex items-center gap-4 text-left hover:shadow-sm transition"
      style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: purpose.bg }}>
        <CreditCard size={15} style={{ color: purpose.text }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-dark truncate">{purpose.label}</p>
        <p className="text-xs text-brand-muted mt-0.5">{formatDate(payment.createdAt)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isRefund ? "text-green-600" : "text-brand-dark"}`}>
          {isRefund ? "+" : ""}{formatPKR(payment.amount)}
        </p>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 inline-block"
          style={{ background: status.bg, color: status.text }}>
          {payment.status}
        </span>
      </div>
    </button>
  );
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("All");
  const [detail,   setDetail]   = useState(null);

  useEffect(() => {
    getMyPayments()
      .then(d => setPayments(Array.isArray(d) ? d : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const purposeKey = {
    "Inspection":    "INSPECTION",
    "Re-Inspection": "RE_INSPECTION",
    "Featured":      "FEATURED",
    "Commission":    "COMMISSION",
  };

  const displayed = tab === "All"
    ? payments
    : payments.filter(p => p.purpose === purposeKey[tab]);

  const totalSpent = payments.filter(p => p.status === "COMPLETED").reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
        <h1 className="text-xl font-bold text-brand-dark">Payments</h1>
        <div className="text-right">
          <p className="text-xs text-brand-muted">Total spent</p>
          <p className="text-lg font-bold text-brand-dark">{formatPKR(totalSpent)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map(t => {
          const key   = purposeKey[t];
          const count = t === "All" ? payments.length : payments.filter(p => p.purpose === key).length;
          return (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              style={tab === t
                ? { background: "#ea6d00", color: "#fff" }
                : { background: "#f8f9fa", color: "#64748b" }}>
              {t} {count > 0 && <span className="ml-0.5 opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-brand-muted text-sm">No payments in this category.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(p => <PaymentRow key={p._id} payment={p} onClick={setDetail} />)}
        </div>
      )}

      {detail && <PaymentDetailModal payment={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
