import { useEffect, useState, useCallback, memo } from "react";
import { RefreshCw } from "lucide-react";
import { getAdminRefunds, approveRefund } from "../../../services/adminService";
import { showSuccess, showError } from "../../../utils/toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { Pagination } from "../../../components/admin/ui/Pagination";
import { SkeletonRow, SkeletonCard } from "../../../components/admin/ui/Skeleton";

// ── Badge helpers (refund-specific, not in shared Badge.jsx) ──────────────────

const REFUND_STATUS_COLORS = {
  PENDING:      "bg-yellow-50 text-yellow-700 border-yellow-200",
  PROCESSED:    "bg-green-50 text-green-700 border-green-200",
  NOT_REQUIRED: "bg-gray-50 text-gray-500 border-gray-200",
};

const INSP_STATUS_COLORS = {
  PENDING:              "bg-orange-50 text-orange-700 border-orange-200",
  SCHEDULED:            "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS:          "bg-purple-50 text-purple-700 border-purple-200",
  COMPLETED:            "bg-green-50 text-green-700 border-green-200",
  CANCELLED:            "bg-red-50 text-red-700 border-red-200",
};

function RefundStatusBadge({ status }) {
  const cls = REFUND_STATUS_COLORS[status] ?? "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${cls}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function InspStatusBadge({ status }) {
  const cls = INSP_STATUS_COLORS[status] ?? "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${cls}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ── Memoized desktop row ──────────────────────────────────────────────────────

const RefundRow = memo(function RefundRow({ r, onApprove }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }} className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-xs font-semibold text-brand-dark">{r.requestedBy?.username}</p>
        <p className="text-xs text-brand-muted">{r.requestedBy?.email}</p>
      </td>
      <td className="px-4 py-3 text-xs text-brand-dark">{r.type?.replace(/_/g, " ")}</td>
      <td className="px-4 py-3"><InspStatusBadge status={r.status} /></td>
      <td className="px-4 py-3 text-xs text-brand-dark capitalize">{r.inspectionBy?.toLowerCase()}</td>
      <td className="px-4 py-3 text-xs font-semibold text-brand-dark">
        {r.payment?.amount ? `PKR ${r.payment.amount.toLocaleString()}` : "—"}
      </td>
      <td className="px-4 py-3"><RefundStatusBadge status={r.refundStatus} /></td>
      <td className="px-4 py-3 text-xs text-brand-muted">
        {new Date(r.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
      </td>
      <td className="px-4 py-3 text-right">
        {r.refundStatus === "PENDING" ? (
          <button onClick={() => onApprove(r)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer"
            style={{ background: "#16a34a" }}>
            Approve
          </button>
        ) : (
          <span className="text-xs text-brand-muted">—</span>
        )}
      </td>
    </tr>
  );
});

// ── Memoized mobile card ──────────────────────────────────────────────────────

const RefundCard = memo(function RefundCard({ r, onApprove }) {
  return (
    <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand-dark">{r.requestedBy?.username}</p>
          <p className="text-xs text-brand-muted">{r.requestedBy?.email}</p>
        </div>
        <RefundStatusBadge status={r.refundStatus} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <p className="text-brand-muted mb-0.5">Inspection status</p>
          <InspStatusBadge status={r.status} />
        </div>
        <div>
          <p className="text-brand-muted mb-0.5">Type</p>
          <p className="font-medium text-brand-dark">{r.type?.replace(/_/g, " ")}</p>
        </div>
        <div>
          <p className="text-brand-muted mb-0.5">Requested by</p>
          <p className="font-medium text-brand-dark capitalize">{r.inspectionBy?.toLowerCase()}</p>
        </div>
        <div>
          <p className="text-brand-muted mb-0.5">Amount</p>
          <p className="font-semibold text-brand-dark">
            {r.payment?.amount ? `PKR ${r.payment.amount.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {r.cancelReason && (
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-brand-muted" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <span className="font-semibold text-brand-dark">Cancel reason: </span>{r.cancelReason}
        </div>
      )}

      <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        <p className="text-[11px] text-brand-muted">
          {new Date(r.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
        </p>
        {r.refundStatus === "PENDING" && (
          <button onClick={() => onApprove(r)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white cursor-pointer"
            style={{ background: "#16a34a" }}>
            Approve Refund
          </button>
        )}
      </div>
    </div>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────

const REFUND_STATUS_TABS = [
  { label: "All",          value: "" },
  { label: "Pending",      value: "PENDING" },
  { label: "Processed",    value: "PROCESSED" },
  { label: "Not Required", value: "NOT_REQUIRED" },
];

export default function ManageRefunds() {
  const [refunds,    setRefunds]    = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [approveTarget, setApproveTarget] = useState(null);

  const [filters, setFilters] = useState({ refundStatus: "", page: 1 });

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page };
      if (filters.refundStatus) params.refundStatus = filters.refundStatus;
      const res = await getAdminRefunds(params);
      setRefunds(res.data.data.refunds ?? []);
      setPagination(res.data.data.pagination ?? { page: 1, totalPages: 1, total: 0 });
    } catch {
      showError("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  }

  // Optimistic approve — patches this refund to PROCESSED immediately.
  const handleApprove = useCallback(async () => {
    const target = approveTarget;
    setApproveTarget(null);
    setRefunds(prev => prev.map(r => r._id === target._id ? { ...r, refundStatus: "PROCESSED" } : r));
    try {
      await approveRefund(target._id);
      showSuccess("Refund approved and processed");
    } catch (err) {
      // Revert on failure.
      setRefunds(prev => prev.map(r => r._id === target._id ? { ...r, refundStatus: "PENDING" } : r));
      showError(err?.response?.data?.message || "Failed to approve refund");
    }
  }, [approveTarget]);

  const openApprove = useCallback((r) => setApproveTarget(r), []);

  return (
    <div className="p-4 sm:p-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-semibold text-brand-dark">Manage Refunds</h1>
          <p className="text-sm text-brand-muted mt-0.5">{pagination.total} refund request{pagination.total !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={fetchRefunds}
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
          {REFUND_STATUS_TABS.map(t => (
            <button key={t.value} onClick={() => setFilter("refundStatus", t.value)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap
                ${filters.refundStatus === t.value
                  ? "border-brand-orange text-brand-orange bg-orange-50"
                  : "border-gray-200 text-brand-muted hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      {loading ? (
        <div className="hidden md:block bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}</tbody></table>
        </div>
      ) : refunds.length === 0 ? (
        <div className="bg-white rounded-xl py-14 text-center text-sm text-brand-muted" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          No refund requests found
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  {["User", "Type", "Insp. Status", "Party", "Amount", "Refund Status", "Date", "Action"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-brand-muted ${i === 7 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {refunds.map(r => (
                  <RefundRow key={r._id} r={r} onApprove={openApprove} />
                ))}
              </tbody>
            </table>
            <Pagination
              pagination={pagination}
              onPrev={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              onNext={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {refunds.map(r => <RefundCard key={r._id} r={r} onApprove={openApprove} />)}
            <Pagination
              pagination={pagination}
              onPrev={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              onNext={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            />
          </div>
        </>
      )}

      {/* Mobile skeleton */}
      {loading && (
        <div className="md:hidden space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      <ConfirmModal
        show={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve refund"
        message={`Process refund of PKR ${approveTarget?.payment?.amount?.toLocaleString() ?? "—"} for ${approveTarget?.requestedBy?.username}? This will trigger a Stripe refund immediately and cannot be undone.`}
      />
    </div>
  );
}
