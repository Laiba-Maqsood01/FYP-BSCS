import { useEffect, useState, useCallback, memo } from "react";
import { Search, Star, ExternalLink, CheckCircle, XCircle, Trash2, BadgeDollarSign, X, RefreshCw } from "lucide-react";
import { getAdminListings, approveListing,  rejectListing, removeListing, markListingSold, getSiteSettings } from "../../../services/adminService";
import { showSuccess, showError } from "../../../utils/toast";
import ConfirmModal from "../../../components/common/ConfirmModal";
import { StatusBadge, SaleModeBadge } from "../../../components/admin/ui/Badge";
import { Pagination } from "../../../components/admin/ui/Pagination";
import { SkeletonTableRow } from "../../../components/admin/ui/Skeleton";
import Modal from "../../../components/admin/ui/Modal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function carLabel(l) {
  return [l?.year, l?.brand?.name, l?.carModel?.name].filter(Boolean).join(" ") || "this listing";
}

const STATUS_FILTERS = [
  { label: "All",      value: "" },
  { label: "Pending",  value: "PENDING" },
  { label: "Active",   value: "ACTIVE" },
  { label: "Sold",     value: "SOLD" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Removed",  value: "REMOVED" },
];

// ── Action buttons — shown per listing based on its status ────────────────────

const ListingActions = memo(function ListingActions({ listing, onApprove, onReject, onRemove, onMarkSold }) {
  const { status, saleMode, inspectionStatus } = listing;
  // Once the inspector is on site or done, rejection is no longer allowed —
  // only Remove (backend enforces this too).
  const inspectionStarted = ["IN_PROGRESS", "COMPLETED"].includes(inspectionStatus);
  // Statuses set only after the inspection fee is paid (webhook-driven).
  const inspectionPaid = ["SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(inspectionStatus);
  // Managed listings can't be rejected or removed before the seller pays the
  // inspection fee — there'd be nothing to refund (backend enforces this too).
  const canReject = status === "PENDING" && !inspectionStarted &&
    (saleMode !== "MANAGED" || inspectionPaid);
  const canRemove = status !== "REMOVED" &&
    (saleMode !== "MANAGED" || status !== "PENDING" || inspectionPaid);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <a href={`/browse-cars/${listing._id}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition"
        style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" }}>
        <ExternalLink size={12} /> View
      </a>
      {status === "PENDING" && saleMode !== "MANAGED" && (
        <button onClick={() => onApprove(listing)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition"
          style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #bbf7d0" }}>
          <CheckCircle size={12} /> Approve
        </button>
      )}
      {canReject && (
        <button onClick={() => onReject(listing)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition"
          style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
          <XCircle size={12} /> Reject
        </button>
      )}
      {status === "ACTIVE" && saleMode === "MANAGED" && (
        <button onClick={() => onMarkSold(listing)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition"
          style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
          <BadgeDollarSign size={12} /> Mark Sold
        </button>
      )}
      {canRemove && (
        <button onClick={() => onRemove(listing)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition"
          style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
          <Trash2 size={12} /> Remove
        </button>
      )}
    </div>
  );
});

// ── Memoized row — only re-renders when this listing's data changes ────────────

const ListingRow = memo(function ListingRow({ listing, onApprove, onReject, onRemove, onMarkSold }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }} className="hover:bg-gray-50/60 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-brand-dark text-sm leading-tight">{listing.title}</p>
            <p className="text-xs text-brand-muted">{listing.brand?.name} {listing.carModel?.name} · {listing.year}</p>
          </div>
          {listing.isFeatured && <Star size={12} className="shrink-0" style={{ color: "#ea6d00" }} />}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-brand-dark">{listing.seller?.username}</p>
        <p className="text-xs text-brand-muted">{listing.seller?.email}</p>
      </td>
      <td className="px-4 py-3 text-xs font-medium text-brand-dark">PKR {listing.price?.toLocaleString()}</td>
      <td className="px-4 py-3"><SaleModeBadge mode={listing.saleMode} /></td>
      <td className="px-4 py-3"><StatusBadge status={listing.status} removedBy={listing.removedBy} /></td>
      <td className="px-4 py-3 text-xs text-brand-muted">
        {new Date(listing.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <ListingActions listing={listing} onApprove={onApprove} onReject={onReject} onRemove={onRemove} onMarkSold={onMarkSold} />
        </div>
      </td>
    </tr>
  );
});

// ── Memoized card (mobile) ────────────────────────────────────────────────────

const ListingCard = memo(function ListingCard({ listing, onApprove, onReject, onRemove, onMarkSold }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-brand-dark truncate">{listing.title}</p>
            {listing.isFeatured && <Star size={12} style={{ color: "#ea6d00" }} className="shrink-0" />}
          </div>
          <p className="text-xs text-brand-muted mt-0.5">{listing.brand?.name} {listing.carModel?.name} · {listing.year}</p>
        </div>
        <StatusBadge status={listing.status} removedBy={listing.removedBy} />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-medium text-brand-dark">PKR {listing.price?.toLocaleString()}</span>
        <span className="text-brand-muted">·</span>
        <SaleModeBadge mode={listing.saleMode} />
        <span className="text-brand-muted">·</span>
        <span className="text-xs text-brand-muted">{listing.seller?.username}</span>
      </div>
      <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <p className="text-[11px] text-brand-muted">
          {new Date(listing.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
        </p>
        <ListingActions listing={listing} onApprove={onApprove} onReject={onReject} onRemove={onRemove} onMarkSold={onMarkSold} />
      </div>
    </div>
  );
});

// ── Reject modal (reason textarea) ───────────────────────────────────────────

function RejectModal({ listing, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  if (!listing) return null;
  return (
    <ConfirmModal
      show={true}
      onClose={onClose}
      onConfirm={() => onConfirm(reason)}
      title="Reject listing"
      message={
        <div className="flex flex-col gap-3">
          <p className="text-sm text-brand-muted">
            Provide a reason for rejecting <strong>{carLabel(listing)}</strong>.
          </p>
          <textarea rows={3} placeholder="Reason for rejection…" value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none" />
        </div>
      }
    />
  );
}

// ── Mark as Sold modal ────────────────────────────────────────────────────────

function MarkSoldModal({ listing, onClose, onDone }) {
  const [salePrice,           setSalePrice]           = useState("");
  const [loading,             setLoading]             = useState(false);
  const [commissionPct,       setCommissionPct]       = useState(null);

  useEffect(() => {
    getSiteSettings().then(s => setCommissionPct(s.commissionPercentage ?? 0.9)).catch(() => setCommissionPct(0.9));
  }, []);

  const commissionAmount = commissionPct !== null && salePrice > 0
    ? Math.round(Number(salePrice) * commissionPct / 100)
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    const price = Number(salePrice);
    if (!price || price <= 0) return;
    setLoading(true);
    try {
      await markListingSold(listing._id, price);
      showSuccess("Listing marked as sold — commission recorded, seller notified");
      onDone(listing._id);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to mark as sold");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Mark Listing as Sold" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="text-xs bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-3 py-2">
          This will mark the listing as <strong>SOLD</strong> and record the {commissionPct ?? "…"}% commission as settled — GearTrade deducts it from the sale amount and delivers the remaining proceeds to the seller. The seller is notified by email; no payment is required from them.
        </div>
        <div>
          <p className="text-xs text-brand-muted mb-1">Listing</p>
          <p className="text-sm font-semibold text-brand-dark">{carLabel(listing)}</p>
        </div>
        <div>
          <label className="text-xs text-brand-muted mb-1 block">Actual sale price (PKR)</label>
          <input type="number" min="1" placeholder="e.g. 3500000" value={salePrice}
            onChange={e => setSalePrice(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
            required />
          {commissionAmount !== null && (
            <p className="text-xs text-brand-muted mt-1">
              Commission ({commissionPct}%): <strong className="text-brand-dark">PKR {commissionAmount.toLocaleString()}</strong>
              {" · "}Seller receives: <strong style={{ color: "#15803d" }}>PKR {(Number(salePrice) - commissionAmount).toLocaleString()}</strong>
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button type="submit" disabled={loading || !salePrice}
            className="px-4 py-2 text-sm rounded-lg text-white cursor-pointer disabled:opacity-60 flex items-center gap-2"
            style={{ background: "#16a34a" }}>
            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? "Processing…" : "Confirm Sale"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ManageListings() {
  const [listings,   setListings]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);

  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);

  const [approveTarget,  setApproveTarget]  = useState(null);
  const [rejectTarget,   setRejectTarget]   = useState(null);
  const [removeTarget,   setRemoveTarget]   = useState(null);
  const [markSoldTarget, setMarkSoldTarget] = useState(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await getAdminListings(params);
      setListings(res.data.data.listings);
      setPagination(res.data.data.pagination);
    } catch {
      showError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // ── Targeted state update helpers ─────────────────────────────────────────
  // Instead of re-fetching the whole list, we patch just the affected listing
  // in local state so only that row re-renders.

  function patchListing(id, patch) {
    setListings(prev => prev.map(l => l._id === id ? { ...l, ...patch } : l));
  }

  function removeListing_(id) {
    setListings(prev => prev.filter(l => l._id !== id));
    setPagination(prev => ({ ...prev, total: prev.total - 1 }));
  }

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleApprove = useCallback(async () => {
    const target = approveTarget;
    setApproveTarget(null);
    patchListing(target._id, { status: "ACTIVE" });
    try {
      await approveListing(target._id);
      showSuccess("Listing approved");
    } catch (err) {
      patchListing(target._id, { status: target.status });
      showError(err?.response?.data?.message ?? "Failed to approve");
    }
  }, [approveTarget]);

  const handleReject = useCallback(async (reason) => {
    const target = rejectTarget;
    setRejectTarget(null);
    patchListing(target._id, { status: "REJECTED" });
    try {
      await rejectListing(target._id, reason);
      showSuccess("Listing rejected");
    } catch (err) {
      patchListing(target._id, { status: target.status });
      showError(err?.response?.data?.message ?? "Failed to reject");
    }
  }, [rejectTarget]);

  const handleRemove = useCallback(async () => {
    const target = removeTarget;
    setRemoveTarget(null);
    patchListing(target._id, { status: "REMOVED", removedBy: "ADMIN" });
    try {
      await removeListing(target._id);
      showSuccess("Listing removed");
    } catch (err) {
      patchListing(target._id, { status: target.status, removedBy: target.removedBy ?? null });
      showError(err?.response?.data?.message ?? "Failed to remove");
    }
  }, [removeTarget]);

  const handleMarkSoldDone = useCallback((id) => {
    setMarkSoldTarget(null);
    patchListing(id, { status: "SOLD" });
  }, []);

  const prevPage = () => setPage(p => Math.max(1, p - 1));
  const nextPage = () => setPage(p => Math.min(pagination.totalPages, p + 1));

  // Stable callbacks so memoized rows don't re-render on every keystroke.
  const openApprove  = useCallback((l) => setApproveTarget(l),  []);
  const openReject   = useCallback((l) => setRejectTarget(l),   []);
  const openRemove   = useCallback((l) => setRemoveTarget(l),   []);
  const openMarkSold = useCallback((l) => setMarkSoldTarget(l), []);

  return (
    <div className="p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-brand-dark">Manage Listings</h1>
          <p className="text-xs text-brand-muted mt-0.5">{pagination.total} total listings</p>
        </div>
        <button
          onClick={fetchListings}
          disabled={loading}
          title="Refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition text-brand-muted disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); }} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input type="text" placeholder="Search by title…" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-white focus:outline-none"
              style={{ border: "1px solid rgba(0,0,0,0.1)" }} />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white rounded-lg transition"
            style={{ background: "#ea6d00" }}>
            Search
          </button>
        </form>

        <div className="flex gap-1 bg-white rounded-lg p-1 flex-wrap" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition"
              style={{
                background: statusFilter === f.value ? "#0f172a" : "transparent",
                color:      statusFilter === f.value ? "#fff"    : "#64748b",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                {["Listing", "Seller", "Price", "Mode", "Status", "Posted", "Actions"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-brand-muted ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)
                : listings.length === 0
                ? <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-brand-muted">No listings found</td></tr>
                : listings.map(l => (
                  <ListingRow
                    key={l._id}
                    listing={l}
                    onApprove={openApprove}
                    onReject={openReject}
                    onRemove={openRemove}
                    onMarkSold={openMarkSold}
                  />
                ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPrev={prevPage} onNext={nextPage} />
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex flex-col gap-2 mb-3">
                <div className="h-4 rounded w-3/4 bg-gray-100" />
                <div className="h-3 rounded w-1/2 bg-gray-100" />
              </div>
              <div className="h-8 rounded bg-gray-50" />
            </div>
          ))
          : listings.length === 0
          ? <div className="bg-white rounded-xl py-12 text-center text-sm text-brand-muted" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>No listings found</div>
          : listings.map(l => (
            <ListingCard
              key={l._id}
              listing={l}
              onApprove={openApprove}
              onReject={openReject}
              onRemove={openRemove}
              onMarkSold={openMarkSold}
            />
          ))}
        <Pagination pagination={pagination} onPrev={prevPage} onNext={nextPage} />
      </div>

      {/* Modals */}
      <ConfirmModal
        show={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve listing"
        message={`Approve "${carLabel(approveTarget)}"? It will become publicly visible.`}
      />
      <RejectModal
        listing={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
      <ConfirmModal
        show={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove listing"
        message={`Remove "${carLabel(removeTarget)}"? This will cancel any active inspection and delete all images.`}
      />
      {markSoldTarget && (
        <MarkSoldModal
          listing={markSoldTarget}
          onClose={() => setMarkSoldTarget(null)}
          onDone={handleMarkSoldDone}
        />
      )}
    </div>
  );
}
