import { useEffect, useState, useCallback, memo } from "react";
import { getAdminDeletions, approveDeletion, rejectDeletion } from "../../../services/adminService";
import { showSuccess, showError } from "../../../utils/toast";
import { Trash2, CheckCircle, XCircle, User, FileText, Eye, RefreshCw } from "lucide-react";
import Modal from "../../../components/admin/ui/Modal";
import { TextPagination } from "../../../components/admin/ui/Pagination";
import { SkeletonRow, SkeletonCard } from "../../../components/admin/ui/Skeleton";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function carLabel(listing) {
  return [listing?.year, listing?.brand?.name, listing?.carModel?.name].filter(Boolean).join(" ") || "Unknown listing";
}

const STATUS_COLORS = {
  PENDING:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const LISTING_STATUS_COLORS = {
  ACTIVE:             "bg-green-50 text-green-700 border-green-200",
  PENDING:            "bg-yellow-50 text-yellow-700 border-yellow-200",
  REMOVED:            "bg-gray-100 text-gray-500 border-gray-200",
  SOLD:               "bg-blue-50 text-blue-700 border-blue-200",
};

const TABS = ["All", "Pending", "Approved", "Rejected"];

// ── Details modal ─────────────────────────────────────────────────────────────

function DetailsModal({ request, onClose }) {
  const statusCls = STATUS_COLORS[request.status] ?? "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-brand-muted" />
            <div>
              <p className="font-semibold text-brand-dark text-sm">{carLabel(request.listing)}</p>
              <p className="text-[11px] text-brand-muted mt-0.5">{request.requestedBy?.username} · {request.requestedBy?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${statusCls}`}>{request.status}</span>
            <button onClick={onClose} className="text-brand-muted hover:text-brand-dark transition ml-1">
              <XCircle size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted mb-2">Seller's reason</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <p className="text-sm text-amber-900 leading-relaxed">"{request.reason}"</p>
            </div>
          </div>

          {request.adminNote ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500 mb-2">Admin note</p>
              <div className="rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
                <p className="text-sm text-red-800 leading-relaxed">"{request.adminNote}"</p>
              </div>
            </div>
          ) : request.status === "REJECTED" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500 mb-2">Admin note</p>
              <div className="rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
                <p className="text-sm text-red-400 italic">No note provided.</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <button onClick={onClose}
            className="w-full py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approve confirm modal ─────────────────────────────────────────────────────

function ApproveModal({ request, loading, onClose, onConfirm }) {
  return (
    <Modal title="Approve Deletion Request" onClose={onClose}>
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-sm font-semibold text-red-800">{carLabel(request.listing)}</p>
          <p className="text-xs text-red-600 mt-1">This listing will be permanently <strong>REMOVED</strong>. This cannot be undone.</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[11px] font-medium text-brand-muted uppercase tracking-wide mb-1">Seller's reason</p>
          <p className="text-sm text-brand-dark">"{request.reason}"</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ background: "#16a34a" }}>
            {loading ? "Approving…" : "Yes, Approve & Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({ request, onClose, onDone }) {
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (note.trim().length < 5) return;
    setLoading(true);
    try {
      await rejectDeletion(request._id, note.trim());
      showSuccess("Deletion request rejected");
      onDone(request._id, note.trim());
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to reject request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Reject Deletion Request" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-brand-muted mb-0.5">Listing</p>
          <p className="text-sm font-semibold text-brand-dark">{carLabel(request.listing)}</p>
          <p className="text-xs text-brand-muted mt-1">Requested by <strong>{request.requestedBy?.username}</strong></p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-medium text-amber-700 mb-1">Seller's reason</p>
          <p className="text-sm text-amber-900">"{request.reason}"</p>
        </div>
        <div>
          <label className="text-xs font-medium text-brand-muted block mb-1">Admin note <span className="text-red-500">*</span></label>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Explain why the request is being rejected…"
            className="w-full rounded-lg px-3 py-2 text-sm text-brand-dark outline-none resize-none"
            style={{ border: "1px solid rgba(0,0,0,0.12)" }} />
          {note.trim().length > 0 && note.trim().length < 5 && (
            <p className="text-xs text-red-500 mt-1">Note must be at least 5 characters</p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={loading || note.trim().length < 5}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ background: "#dc2626" }}>
            {loading ? "Rejecting…" : "Reject Request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Memoized desktop row ──────────────────────────────────────────────────────

const DeletionRow = memo(function DeletionRow({ req, onApprove, onReject, onViewDetails }) {
  const isPending   = req.status === "PENDING";
  const statusCls   = STATUS_COLORS[req.status]           ?? "bg-gray-50 text-gray-500 border-gray-200";
  const listingCls  = LISTING_STATUS_COLORS[req.listing?.status] ?? "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <tr className="hover:bg-gray-50/50 transition" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <td className="px-4 py-3">
        <p className="font-semibold text-brand-dark text-xs">{carLabel(req.listing)}</p>
        <p className="text-[11px] text-brand-muted mt-0.5">MANAGED</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-medium text-brand-dark">{req.requestedBy?.username || "—"}</p>
        <p className="text-[11px] text-brand-muted mt-0.5">{req.requestedBy?.email || "—"}</p>
      </td>
      <td className="px-4 py-3">
        <button onClick={() => onViewDetails(req)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition hover:opacity-80 cursor-pointer"
          style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#64748b" }}>
          <Eye size={11} /> View
        </button>
      </td>
      <td className="px-4 py-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${listingCls}`}>
          {req.listing?.status?.replace(/_/g, " ") || "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-brand-muted whitespace-nowrap">{formatDate(req.createdAt)}</td>
      <td className="px-4 py-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${statusCls}`}>{req.status}</span>
      </td>
      <td className="px-4 py-3">
        {isPending ? (
          <div className="flex gap-1.5">
            <button onClick={() => onApprove(req)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 transition cursor-pointer"
              style={{ background: "#16a34a" }}>
              <CheckCircle size={11} /> Approve
            </button>
            <button onClick={() => onReject(req)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 transition cursor-pointer"
              style={{ background: "#dc2626" }}>
              <XCircle size={11} /> Reject
            </button>
          </div>
        ) : (
          <span className="text-xs text-brand-muted">—</span>
        )}
      </td>
    </tr>
  );
});

// ── Memoized mobile card ──────────────────────────────────────────────────────

const RequestCard = memo(function RequestCard({ request, onApprove, onReject, onViewDetails }) {
  const isPending  = request.status === "PENDING";
  const statusCls  = STATUS_COLORS[request.status]                    ?? "bg-gray-50 text-gray-500 border-gray-200";
  const listingCls = LISTING_STATUS_COLORS[request.listing?.status]   ?? "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <div className="bg-white rounded-xl p-4 space-y-3" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-brand-dark">{carLabel(request.listing)}</p>
          <p className="text-xs text-brand-muted mt-0.5">{formatDate(request.createdAt)}</p>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 ${statusCls}`}>
          {request.status}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-brand-muted">
          <User size={11} /> {request.requestedBy?.username || "—"}
        </span>
        <span className="text-brand-muted">·</span>
        <span className="text-xs text-brand-muted">{request.requestedBy?.email || "—"}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-brand-muted">Listing status:</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${listingCls}`}>
          {request.listing?.status?.replace(/_/g, " ") || "—"}
        </span>
      </div>

      <button onClick={() => onViewDetails(request)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80 w-fit cursor-pointer"
        style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#64748b" }}>
        <Eye size={12} /> View Reason & Notes
      </button>

      {isPending && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onApprove(request)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition hover:opacity-90 cursor-pointer"
            style={{ background: "#16a34a" }}>
            <CheckCircle size={13} /> Approve
          </button>
          <button onClick={() => onReject(request)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition hover:opacity-90 cursor-pointer"
            style={{ background: "#dc2626" }}>
            <XCircle size={13} /> Reject
          </button>
        </div>
      )}
    </div>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManageDeletions() {
  const [requests,  setRequests]  = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("All");
  const [page,      setPage]      = useState(1);

  const [approveTarget,  setApproveTarget]  = useState(null);
  const [rejectTarget,   setRejectTarget]   = useState(null);
  const [detailTarget,   setDetailTarget]   = useState(null);
  const [actionLoading,  setActionLoading]  = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (tab !== "All") params.status = tab.toUpperCase();
    getAdminDeletions(params)
      .then(res => {
        setRequests(res.data.data.requests || []);
        setPagination(res.data.data.pagination || null);
      })
      .catch(() => showError("Failed to load deletion requests"))
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [tab]);

  async function handleApprove() {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await approveDeletion(approveTarget._id);
      showSuccess("Listing deleted — deletion request approved");
      setApproveTarget(null);
      // Patch only this row — status → APPROVED, nested listing.status → REMOVED.
      setRequests(prev => prev.map(r =>
        r._id === approveTarget._id
          ? { ...r, status: "APPROVED", listing: { ...r.listing, status: "REMOVED" } }
          : r
      ));
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  }

  // Reject is optimistic — patches status and adminNote locally.
  const handleRejectDone = useCallback((id, note) => {
    setRejectTarget(null);
    setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "REJECTED", adminNote: note } : r));
  }, []);

  const openApprove     = useCallback((r) => setApproveTarget(r),  []);
  const openReject      = useCallback((r) => setRejectTarget(r),   []);
  const openViewDetails = useCallback((r) => setDetailTarget(r),   []);

  return (
    <div className="p-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fee2e2" }}>
            <Trash2 size={18} style={{ color: "#dc2626" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Deletion Requests</h1>
            <p className="text-xs text-brand-muted mt-0.5">Managed listing removal requests from sellers</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          title="Refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition text-brand-muted disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            style={tab === t
              ? { background: "#ea6d00", color: "#fff",     border: "1.5px solid #ea6d00" }
              : { background: "#fff",    color: "#64748b",  border: "1.5px solid #e2e8f0" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      {loading ? (
        <>
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}</tbody></table>
          </div>
          <div className="md:hidden space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-brand-muted text-sm">No deletion requests found.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#f8fafc" }}>
                  {["Listing", "Seller", "Details", "Listing Status", "Requested", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-brand-muted px-4 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <DeletionRow
                    key={req._id}
                    req={req}
                    onApprove={openApprove}
                    onReject={openReject}
                    onViewDetails={openViewDetails}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {requests.map(req => (
              <RequestCard
                key={req._id}
                request={req}
                onApprove={openApprove}
                onReject={openReject}
                onViewDetails={openViewDetails}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-5">
              <TextPagination
                page={page}
                totalPages={pagination.totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          request={approveTarget}
          loading={actionLoading}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
        />
      )}

      {detailTarget && (
        <DetailsModal request={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={handleRejectDone}
        />
      )}
    </div>
  );
}
