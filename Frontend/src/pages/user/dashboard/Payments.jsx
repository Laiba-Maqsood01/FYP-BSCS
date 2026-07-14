import { useEffect, useState, memo, useCallback } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { getMyPayments, retryInspectionPayment, retryFeaturedPayment } from "../../../services/paymentService";
import Modal from "../../../components/ui/Modal";

function formatPKR(n) {
  if (!n) return "PKR 0";
  return `PKR ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PURPOSE_BADGE = {
  INSPECTION:    { bg: "#fff7ed", text: "#c2410c", label: "Inspection"    },
  RE_INSPECTION: { bg: "#fef9c3", text: "#b45309", label: "Re-Inspection" },
  FEATURED:      { bg: "#dbeafe", text: "#1d4ed8", label: "Featured"      },
};

const STATUS_BADGE = {
  SUCCESS:  { bg: "#dcfce7", text: "#16a34a", label: "Success"  },
  PENDING:  { bg: "#fef9c3", text: "#b45309", label: "Pending"  },
  FAILED:   { bg: "#fee2e2", text: "#dc2626", label: "Failed"   },
  REFUNDED: { bg: "#d1fae5", text: "#065f46", label: "Refunded" },
};

const RETRYABLE = ["INSPECTION", "RE_INSPECTION", "FEATURED"];
const TABS = ["All", "Inspection", "Re-Inspection", "Featured"];

const PURPOSE_KEY = {
  "Inspection":    "INSPECTION",
  "Re-Inspection": "RE_INSPECTION",
  "Featured":      "FEATURED",
};

// ── Retry helper ──────────────────────────────────────────────────────────────

async function initiateRetry(payment) {
  const refId = payment.referenceId;
  if (!refId) throw new Error("No reference ID found for this payment.");
  if (payment.purpose === "INSPECTION" || payment.purpose === "RE_INSPECTION") {
    return retryInspectionPayment(refId);
  }
  if (payment.purpose === "FEATURED") {
    return retryFeaturedPayment(refId);
  }
  throw new Error("Retry not supported for this payment type.");
}

// ── PaymentDetailModal ────────────────────────────────────────────────────────

function PaymentDetailModal({ payment, onClose }) {
  const purpose    = PURPOSE_BADGE[payment.purpose] ?? { label: payment.purpose, bg: "#f1f5f9", text: "#64748b" };
  const statusInfo = STATUS_BADGE[payment.status]   ?? { bg: "#f1f5f9", text: "#64748b", label: payment.status };
  const [retrying, setRetrying] = useState(false);
  const [retryErr, setRetryErr] = useState("");

  const canRetry = payment.status === "PENDING" && RETRYABLE.includes(payment.purpose) && payment.referenceId;

  async function handleRetry() {
    setRetrying(true); setRetryErr("");
    try {
      const { url } = await initiateRetry(payment);
      window.location.href = url;
    } catch (e) {
      setRetryErr(e?.response?.data?.message ?? e?.message ?? "Failed to initiate payment.");
      setRetrying(false);
    }
  }

  return (
    <Modal title="Payment Details" onClose={onClose} maxWidth="max-w-sm">
      <div className="space-y-3">

        {payment.listing && (() => {
          const l = payment.listing;
          const car = `${l.year ?? ""} ${l.brand?.name ?? ""} ${l.carModel?.name ?? ""}`.trim();
          const img = l.images?.[0]?.url;
          const purposeVerb = {
            INSPECTION:    "Inspection for",
            RE_INSPECTION: "Re-inspection for",
            FEATURED:      "Featured listing for",
          }[payment.purpose] ?? "Payment for";
          return (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                {img
                  ? <img src={img} alt={car} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[10px] text-brand-muted">No img</div>}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-brand-muted">{purposeVerb}</p>
                <p className="text-sm font-semibold text-brand-dark truncate">{car || "Unknown car"}</p>
              </div>
            </div>
          );
        })()}

        <div className="flex justify-between items-center">
          <span className="text-xs text-brand-muted">Amount</span>
          <span className={`text-base font-bold ${payment.status === "REFUNDED" ? "text-green-600" : "text-brand-dark"}`}>
            {payment.status === "REFUNDED" ? "+" : ""}{formatPKR(payment.amount)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-brand-muted">Purpose</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: purpose.bg, color: purpose.text }}>
            {purpose.label}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-brand-muted">Status</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: statusInfo.bg, color: statusInfo.text }}>
            {statusInfo.label}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-brand-muted">Date</span>
          <span className="text-xs text-brand-dark">{formatDate(payment.createdAt)}</span>
        </div>
        {payment.transactionId && (
          <div className="flex justify-between items-start gap-2">
            <span className="text-xs text-brand-muted shrink-0">Transaction ID</span>
            <span className="text-[10px] text-brand-muted text-right font-mono break-all">{payment.transactionId}</span>
          </div>
        )}

        {canRetry && (
          <div className="pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-xs text-brand-muted mb-2">
              This payment is pending. Complete it now to activate your {purpose.label.toLowerCase()}.
            </p>
            {retryErr && <p className="text-xs text-red-600 mb-2">{retryErr}</p>}
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
              style={{ background: "#ea6d00" }}>
              <RefreshCw size={14} className={retrying ? "animate-spin" : ""} />
              {retrying ? "Redirecting to payment…" : "Complete Payment"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── PaymentRow — memo so opening detail modal doesn't re-render all rows ──────

const PaymentRow = memo(function PaymentRow({ payment, onClick }) {
  const purpose    = PURPOSE_BADGE[payment.purpose] ?? { bg: "#f1f5f9", text: "#64748b", label: payment.purpose };
  const statusInfo = STATUS_BADGE[payment.status]   ?? { bg: "#f1f5f9", text: "#64748b", label: payment.status };
  const isRefund  = payment.status === "REFUNDED";
  const isPending = payment.status === "PENDING";

  return (
    <button
      onClick={() => onClick(payment)}
      className="w-full bg-white rounded-xl p-4 flex items-center gap-4 text-left hover:shadow-sm transition cursor-pointer"
      style={{ border: `1px solid ${isPending ? "rgba(234,109,0,0.25)" : "rgba(0,0,0,0.07)"}` }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: purpose.bg }}>
        <CreditCard size={15} style={{ color: purpose.text }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-dark truncate">{purpose.label}</p>
        <p className="text-xs text-brand-muted mt-0.5">{formatDate(payment.createdAt)}</p>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <p className={`text-sm font-bold ${isRefund ? "text-green-600" : "text-brand-dark"}`}>
          {isRefund ? "+" : ""}{formatPKR(payment.amount)}
        </p>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: statusInfo.bg, color: statusInfo.text }}>
          {statusInfo.label}
        </span>
        {isPending && RETRYABLE.includes(payment.purpose) && payment.referenceId && (
          <span className="text-[10px] font-semibold text-brand-orange flex items-center gap-0.5">
            <RefreshCw size={10} /> Tap to retry
          </span>
        )}
      </div>
    </button>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const openDetail  = useCallback((p) => setDetail(p), []);
  const closeDetail = useCallback(() => setDetail(null), []);

  const displayed = tab === "All"
    ? payments
    : payments.filter(p => p.purpose === PURPOSE_KEY[tab]);

  const totalSpent   = payments.filter(p => p.status === "SUCCESS").reduce((s, p) => s + (p.amount ?? 0), 0);
  const pendingCount = payments.filter(p => p.status === "PENDING").length;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">Payments</h1>
          {pendingCount > 0 && (
            <p className="text-xs text-amber-600 mt-0.5">{pendingCount} pending payment{pendingCount > 1 ? "s" : ""} — tap to complete</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-brand-muted">Total spent</p>
          <p className="text-lg font-bold text-brand-dark">{formatPKR(totalSpent)}</p>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map(t => {
          const key   = PURPOSE_KEY[t];
          const count = t === "All" ? payments.length : payments.filter(p => p.purpose === key).length;
          return (
            <button key={t} onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              style={tab === t
                ? { background: "#ea6d00", color: "#fff" }
                : { background: "#f8f9fa", color: "#64748b" }}>
              {t} {count > 0 && <span className="ml-0.5 opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-36 bg-gray-200 rounded mb-1.5" />
                <div className="h-3 w-52 bg-gray-100 rounded" />
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-brand-muted text-sm">No payments in this category.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(p => <PaymentRow key={p._id} payment={p} onClick={openDetail} />)}
        </div>
      )}

      {detail && <PaymentDetailModal payment={detail} onClose={closeDetail} />}
    </div>
  );
}
