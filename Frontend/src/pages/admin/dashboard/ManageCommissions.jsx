import { useEffect, useState, useCallback, memo } from "react";
import { getAdminCommissions, reinitiateCommission, cancelCommission, } from "../../../services/adminService";
import { showSuccess, showError } from "../../../utils/toast";
import { RefreshCw, XCircle, Clock } from "lucide-react";

import { StatusBadge } from "../../../components/admin/ui/Badge";
import Modal from "../../../components/admin/ui/Modal";
import FilterDropdown from "../../../components/admin/ui/FilterDropdown";
import { Pagination } from "../../../components/admin/ui/Pagination";
import { SkeletonRow, SkeletonCard } from "../../../components/admin/ui/Skeleton";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: "All",       value: "" },
  { label: "Pending",   value: "PENDING" },
  { label: "Paid",      value: "PAID" },
  { label: "Expired",   value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" },
];

// ── ExpiryCountdown — memo so only this cell re-renders each second ───────────

const ExpiryCountdown = memo(function ExpiryCountdown({ expiresAt, status }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (status !== "PENDING") return;

    function tick() {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}m ${s.toString().padStart(2, "0")}s`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, status]);

  if (status !== "PENDING") return <span className="text-xs text-brand-muted">—</span>;

  const isUrgent = new Date(expiresAt) - new Date() < 5 * 60 * 1000;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isUrgent ? "text-red-600" : "text-yellow-700"}`}>
      <Clock size={11} /> {remaining}
    </span>
  );
});

// ── Cancel modal ──────────────────────────────────────────────────────────────

function CancelModal({ commission, onClose, onDone }) {
  const [reason,  setReason]  = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      showError("Reason must be at least 10 characters");
      return;
    }
    setLoading(true);
    try {
      await cancelCommission(commission._id, reason.trim());
      showSuccess("Commission cancelled — listing restored to Active");
      onDone(commission._id, reason.trim());
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to cancel commission");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Cancel Commission" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="text-xs text-brand-muted bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          Cancelling will mark the commission as cancelled and restore the listing back to <strong>Active</strong>.
        </div>
        <div>
          <label className="text-xs text-brand-muted mb-1 block">Reason for cancellation</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Minimum 10 characters…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
          <p className="text-[11px] text-brand-muted mt-1">{reason.trim().length}/10 minimum</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm rounded-lg text-white cursor-pointer disabled:opacity-60"
            style={{ background: "#dc2626" }}>
            {loading ? "Cancelling…" : "Confirm Cancel"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Reinitiate confirm modal ───────────────────────────────────────────────────

function ReinitiateModal({ commission, onClose, onDone }) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await reinitiateCommission(commission._id);
      showSuccess("Commission reinitiated — seller notified by email");
      onDone(res.data.data.commission);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to reinitiate commission");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Reinitiate Commission" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm text-brand-muted mb-1">
            Reset the payment window for <strong>{commission.seller?.username}</strong>?
          </p>
          <p className="text-sm text-brand-muted">
            Commission of <strong>PKR {commission.commissionAmount?.toLocaleString()}</strong> — seller will get a fresh 30-minute window and be notified by email.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="px-4 py-2 text-sm rounded-lg text-white cursor-pointer disabled:opacity-60 flex items-center gap-2"
            style={{ background: "#ea6d00" }}>
            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? "Processing…" : "Confirm Reinitiate"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── CommissionRow — memoized so countdown ticks don't re-render siblings ──────

const CommissionRow = memo(function CommissionRow({ c, onReinitiate, onCancel }) {
  const canAct = c.status === "PENDING" || c.status === "EXPIRED";
  return (
    <tr style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }} className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-xs font-semibold text-brand-dark">{c.seller?.username}</p>
        <p className="text-xs text-brand-muted">{c.seller?.email}</p>
      </td>
      <td className="px-4 py-3 text-xs text-brand-dark max-w-35 truncate">{c.listing?.title || "—"}</td>
      <td className="px-4 py-3 text-xs font-semibold text-brand-dark">PKR {c.salePrice?.toLocaleString()}</td>
      <td className="px-4 py-3 text-xs font-semibold text-brand-dark">PKR {c.commissionAmount?.toLocaleString()}</td>
      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
      <td className="px-4 py-3"><ExpiryCountdown expiresAt={c.expiresAt} status={c.status} /></td>
      <td className="px-4 py-3 text-xs text-brand-muted">
        {new Date(c.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
      </td>
      <td className="px-4 py-3 text-right">
        {canAct ? (
          <div className="flex gap-1.5 justify-end">
            <button onClick={() => onReinitiate(c)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer"
              style={{ background: "#ea6d00" }}>
              <RefreshCw size={11} /> Reinitiate
            </button>
            <button onClick={() => onCancel(c)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer"
              style={{ background: "#dc2626" }}>
              <XCircle size={11} /> Cancel
            </button>
          </div>
        ) : (
          <span className="text-xs text-brand-muted">—</span>
        )}
      </td>
    </tr>
  );
});

// ── CommissionCard — memoized mobile card ─────────────────────────────────────

const CommissionCard = memo(function CommissionCard({ c, onReinitiate, onCancel }) {
  const canAct = c.status === "PENDING" || c.status === "EXPIRED";
  return (
    <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand-dark">{c.seller?.username}</p>
          <p className="text-xs text-brand-muted">{c.seller?.email}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <p className="text-brand-muted mb-0.5">Sale price</p>
          <p className="font-semibold text-brand-dark">PKR {c.salePrice?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-brand-muted mb-0.5">Commission (0.9%)</p>
          <p className="font-semibold text-brand-dark">PKR {c.commissionAmount?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-brand-muted mb-0.5">Listing</p>
          <p className="font-medium text-brand-dark truncate">{c.listing?.title || "—"}</p>
        </div>
        <div>
          <p className="text-brand-muted mb-0.5">Expires</p>
          <ExpiryCountdown expiresAt={c.expiresAt} status={c.status} />
        </div>
      </div>

      {c.cancelReason && (
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-brand-muted" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <span className="font-semibold text-brand-dark">Reason: </span>{c.cancelReason}
        </div>
      )}

      {canAct && (
        <div className="flex gap-2 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <button onClick={() => onReinitiate(c)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer"
            style={{ background: "#ea6d00" }}>
            <RefreshCw size={11} /> Reinitiate
          </button>
          <button onClick={() => onCancel(c)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer"
            style={{ background: "#dc2626" }}>
            <XCircle size={11} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManageCommissions() {
  const [commissions,  setCommissions]  = useState([]);
  const [pagination,   setPagination]   = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);

  const [reinitiateTarget, setReinitiateTarget] = useState(null);
  const [cancelTarget,     setCancelTarget]     = useState(null);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const res = await getAdminCommissions(params);
      setCommissions(res.data.data.commissions ?? []);
      setPagination(res.data.data.pagination ?? { page: 1, totalPages: 1, total: 0 });
    } catch {
      showError("Failed to load commissions");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  function handleFilterChange(val) {
    setStatusFilter(val);
    setPage(1);
  }

  const handleReinitiateOpen = useCallback((c) => setReinitiateTarget(c), []);
  // Patch only status + expiresAt — preserves the populated seller/listing already in local state.
  const handleReiniateDone = useCallback(({ _id, status, expiresAt }) => {
    setReinitiateTarget(null);
    setCommissions(prev =>
      prev.map(c => c._id === _id ? { ...c, status, expiresAt } : c)
    );
  }, []);

  // Cancel is optimistic — patches just this commission in local state.
  const handleCancelOpen = useCallback((c) => setCancelTarget(c), []);
  const handleCancelDone = useCallback((id, reason) => {
    setCancelTarget(null);
    setCommissions(prev =>
      prev.map(c => c._id === id ? { ...c, status: "CANCELLED", cancelReason: reason } : c)
    );
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-semibold text-brand-dark">Manage Commissions</h1>
          <p className="text-sm text-brand-muted mt-0.5">{pagination.total} commission{pagination.total !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={fetchCommissions}
          disabled={loading}
          title="Refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition text-brand-muted disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => handleFilterChange(tab.value)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap
                ${statusFilter === tab.value
                  ? "border-brand-orange text-brand-orange bg-orange-50"
                  : "border-gray-200 text-brand-muted hover:bg-gray-50"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      {loading ? (
        <div className="hidden md:block bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <table className="w-full">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}
            </tbody>
          </table>
        </div>
      ) : commissions.length === 0 ? (
        <div className="bg-white rounded-xl py-14 text-center text-sm text-brand-muted" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          No commissions found
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  {["Seller", "Listing", "Sale Price", "Commission (0.9%)", "Status", "Time Left", "Date", "Actions"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-brand-muted ${i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <CommissionRow
                    key={c._id}
                    c={c}
                    onReinitiate={handleReinitiateOpen}
                    onCancel={handleCancelOpen}
                  />
                ))}
              </tbody>
            </table>
            <Pagination pagination={pagination} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : commissions.map(c => (
                <CommissionCard
                  key={c._id}
                  c={c}
                  onReinitiate={handleReinitiateOpen}
                  onCancel={handleCancelOpen}
                />
              ))}
            <Pagination pagination={pagination} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
          </div>
        </>
      )}

      {/* Modals */}
      {reinitiateTarget && (
        <ReinitiateModal
          commission={reinitiateTarget}
          onClose={() => setReinitiateTarget(null)}
          onDone={handleReiniateDone}
        />
      )}
      {cancelTarget && (
        <CancelModal
          commission={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onDone={handleCancelDone}
        />
      )}
    </div>
  );
}
