import { useEffect, useState, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Calendar, ShieldOff, ShieldCheck,
  Trash2, CheckCircle, XCircle, Star, ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import {
  getAdminUser, blockToggleUser, deleteAdminUser,
  getAdminListings, approveListing, rejectListing, removeListing,
} from "../../../services/adminService";
import { showSuccess, showError } from "../../../utils/toast";
import ConfirmModal from "../../../components/common/ConfirmModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function listingLabel(l) {
  return l?.title
    || [l?.year, l?.brand?.name, l?.carModel?.name].filter(Boolean).join(" ")
    || "this listing";
}

function isBlocked(u) {
  return u?.accountStatus === "BLOCKED" && u?.blockedUntil && new Date() < new Date(u.blockedUntil);
}

function patchListing(id, patch) {
  return prev => prev.map(l => l._id === id ? { ...l, ...patch } : l);
}

// ── Badges ────────────────────────────────────────────────────────────────────

const LISTING_STATUS_COLORS = {
  ACTIVE:             { bg: "#ecfdf5", color: "#065f46" },
  PENDING:            { bg: "#fff7ed", color: "#9a3412" },
  SOLD:               { bg: "#eff6ff", color: "#1e40af" },
  REJECTED:           { bg: "#fef2f2", color: "#991b1b" },
  REMOVED:            { bg: "#f1f5f9", color: "#475569" },
};

function Badge({ label, bg, color }) {
  return (
    <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
      {label}
    </span>
  );
}

function ListingStatusBadge({ status, removedBy }) {
  const s = LISTING_STATUS_COLORS[status] ?? { bg: "#f1f5f9", color: "#475569" };
  const label = status === "REMOVED" && removedBy
    ? `REMOVED BY ${removedBy}`
    : status?.replace(/_/g, " ");
  return <Badge label={label} bg={s.bg} color={s.color} />;
}

function SaleModeBadge({ mode }) {
  return (
    <Badge
      label={mode}
      bg={mode === "MANAGED" ? "rgba(234,109,0,0.1)" : "#f1f5f9"}
      color={mode === "MANAGED" ? "#ea6d00" : "#475569"}
    />
  );
}

// ── Block modal ───────────────────────────────────────────────────────────────

function BlockModal({ user, onClose, onConfirm }) {
  const [days, setDays] = useState(7);
  if (!user) return null;
  return (
    <ConfirmModal
      show={true}
      onClose={onClose}
      onConfirm={() => onConfirm(days)}
      title={`Block ${user.username}`}
      message={
        <div className="flex flex-col gap-3">
          <p className="text-sm text-brand-muted">How many days should this user be blocked?</p>
          <input type="number" min={1} max={365} value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
      }
    />
  );
}

// ── Reject listing modal ──────────────────────────────────────────────────────

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
            Reason for rejecting <strong>{listingLabel(listing)}</strong>
          </p>
          <textarea rows={3} placeholder="Reason…" value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none" />
        </div>
      }
    />
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }) {
  return <div className={`rounded-xl animate-pulse ${className}`} style={{ background: "rgba(0,0,0,0.06)" }} />;
}

// ── ListingRow — memo: only re-renders when this listing's data changes ────────

const ListingRow = memo(function ListingRow({ l, onApprove, onReject, onRemove }) {
  const canApprove = l.status === "PENDING" && l.saleMode !== "MANAGED";
  const canReject  = l.status === "PENDING";
  const canRemove  = l.status !== "REMOVED";

  return (
    <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }} className="hover:bg-gray-50/60 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-brand-dark text-sm">{l.title}</span>
          {l.isFeatured && <Star size={11} style={{ color: "#ea6d00" }} className="shrink-0" />}
        </div>
        <p className="text-xs text-brand-muted">{l.brand?.name} {l.carModel?.name} · {l.year}</p>
      </td>
      <td className="px-4 py-3 text-xs font-medium text-brand-dark">
        PKR {l.price?.toLocaleString()}
      </td>
      <td className="px-4 py-3"><SaleModeBadge mode={l.saleMode} /></td>
      <td className="px-4 py-3"><ListingStatusBadge status={l.status} removedBy={l.removedBy} /></td>
      <td className="px-4 py-3 text-xs text-brand-muted">
        {new Date(l.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <a href={`/browse-cars/${l._id}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer"
            style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" }}>
            <ExternalLink size={11} /> View
          </a>
          {canApprove && (
            <button onClick={() => onApprove(l)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer"
              style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #bbf7d0" }}>
              <CheckCircle size={11} /> Approve
            </button>
          )}
          {canReject && (
            <button onClick={() => onReject(l)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer"
              style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
              <XCircle size={11} /> Reject
            </button>
          )}
          {canRemove && (
            <button onClick={() => onRemove(l)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer"
              style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
              <Trash2 size={11} /> Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// ── ListingCard — memo: mobile card ───────────────────────────────────────────

const ListingCard = memo(function ListingCard({ l, onApprove, onReject, onRemove }) {
  const canApprove = l.status === "PENDING" && l.saleMode !== "MANAGED";
  const canReject  = l.status === "PENDING";
  const canRemove  = l.status !== "REMOVED";

  return (
    <div className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-brand-dark truncate">{l.title}</p>
            {l.isFeatured && <Star size={11} style={{ color: "#ea6d00" }} className="shrink-0" />}
          </div>
          <p className="text-xs text-brand-muted">{l.brand?.name} {l.carModel?.name} · {l.year}</p>
        </div>
        <ListingStatusBadge status={l.status} removedBy={l.removedBy} />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-medium text-brand-dark">PKR {l.price?.toLocaleString()}</span>
        <span className="text-brand-muted">·</span>
        <SaleModeBadge mode={l.saleMode} />
      </div>
      <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <p className="text-[11px] text-brand-muted">
          {new Date(l.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <a href={`/browse-cars/${l._id}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer"
            style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" }}>
            <ExternalLink size={11} /> View
          </a>
          {canApprove && (
            <button onClick={() => onApprove(l)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer"
              style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #bbf7d0" }}>
              <CheckCircle size={11} /> Approve
            </button>
          )}
          {canReject && (
            <button onClick={() => onReject(l)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer"
              style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
              <XCircle size={11} /> Reject
            </button>
          )}
          {canRemove && (
            <button onClick={() => onRemove(l)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer"
              style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
              <Trash2 size={11} /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [user,    setUser]    = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const [listings,        setListings]        = useState([]);
  const [listingPage,     setListingPage]     = useState(1);
  const [listingTotal,    setListingTotal]    = useState({ page: 1, totalPages: 1, total: 0 });
  const [listingsLoading, setListingsLoading] = useState(true);

  // User action modals
  const [blockTarget,   setBlockTarget]   = useState(null);
  const [unblockTarget, setUnblockTarget] = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  // Listing action modals
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget,  setRejectTarget]  = useState(null);
  const [removeTarget,  setRemoveTarget]  = useState(null);

  useEffect(() => {
    getAdminUser(id)
      .then(res => { setUser(res.data.data.user); setStats(res.data.data.stats); })
      .catch(() => showError("Failed to load user"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setListingsLoading(true);
    getAdminListings({ seller: id, page: listingPage, limit: 5 })
      .then(res => { setListings(res.data.data.listings); setListingTotal(res.data.data.pagination); })
      .catch(() => showError("Failed to load listings"))
      .finally(() => setListingsLoading(false));
  }, [id, listingPage]);

  // ── User actions — patch local state, no re-fetch ─────────────────────────

  const handleBlock = useCallback(async (days) => {
    const target = blockTarget;
    setBlockTarget(null);
    const blockedUntil = new Date(Date.now() + days * 86400000).toISOString();
    setUser(u => ({ ...u, accountStatus: "BLOCKED", blockedUntil }));
    try {
      await blockToggleUser(target._id, days);
      showSuccess(`${target.username} blocked for ${days} day(s)`);
    } catch (err) {
      setUser(u => ({ ...u, accountStatus: target.accountStatus, blockedUntil: target.blockedUntil }));
      showError(err?.response?.data?.message ?? "Failed to block");
    }
  }, [blockTarget]);

  const handleUnblock = useCallback(async () => {
    const target = unblockTarget;
    setUnblockTarget(null);
    setUser(u => ({ ...u, accountStatus: "ACTIVE", blockedUntil: null }));
    try {
      await blockToggleUser(target._id);
      showSuccess(`${target.username} unblocked`);
    } catch (err) {
      setUser(u => ({ ...u, accountStatus: target.accountStatus, blockedUntil: target.blockedUntil }));
      showError(err?.response?.data?.message ?? "Failed to unblock");
    }
  }, [unblockTarget]);

  async function handleDelete() {
    try {
      await deleteAdminUser(deleteTarget._id);
      showSuccess("User deleted");
      navigate("/admin/users");
    } catch (err) {
      showError(err?.response?.data?.message ?? "Failed to delete");
    }
  }

  // ── Listing actions — patch only the affected row ─────────────────────────

  const handleApprove = useCallback(async () => {
    const target = approveTarget;
    setApproveTarget(null);
    setListings(patchListing(target._id, { status: "ACTIVE" }));
    try {
      await approveListing(target._id);
      showSuccess("Listing approved");
    } catch (err) {
      setListings(patchListing(target._id, { status: target.status }));
      showError(err?.response?.data?.message ?? "Failed to approve");
    }
  }, [approveTarget]);

  const handleReject = useCallback(async (reason) => {
    const target = rejectTarget;
    setRejectTarget(null);
    setListings(patchListing(target._id, { status: "REJECTED" }));
    try {
      await rejectListing(target._id, reason);
      showSuccess("Listing rejected");
    } catch (err) {
      setListings(patchListing(target._id, { status: target.status }));
      showError(err?.response?.data?.message ?? "Failed to reject");
    }
  }, [rejectTarget]);

  const handleRemove = useCallback(async () => {
    const target = removeTarget;
    setRemoveTarget(null);
    setListings(patchListing(target._id, { status: "REMOVED", removedBy: "ADMIN" }));
    try {
      await removeListing(target._id);
      showSuccess("Listing removed");
    } catch (err) {
      setListings(patchListing(target._id, { status: target.status, removedBy: target.removedBy ?? null }));
      showError(err?.response?.data?.message ?? "Failed to remove");
    }
  }, [removeTarget]);

  // Stable open-handlers so memo'd rows don't re-render on unrelated state changes.
  const openApprove = useCallback((l) => setApproveTarget(l), []);
  const openReject  = useCallback((l) => setRejectTarget(l),  []);
  const openRemove  = useCallback((l) => setRemoveTarget(l),  []);

  // ── Loading / not-found guards ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm text-brand-muted">User not found.</p>
        <button onClick={() => navigate("/admin/users")} className="mt-3 text-sm" style={{ color: "#ea6d00" }}>
          ← Back to users
        </button>
      </div>
    );
  }

  const blocked    = isBlocked(user);
  const avatar     = user.username?.[0]?.toUpperCase() ?? "?";
  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-6 flex flex-col gap-5 max-w-5xl">

      {/* Back */}
      <button onClick={() => navigate("/admin/users")}
        className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-dark transition w-fit cursor-pointer">
        <ArrowLeft size={15} /> Back to users
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center text-white text-2xl font-bold shrink-0"
              style={{ background: user.isDeleted ? "#94a3b8" : "#0f172a", borderRadius: "50%" }}>
              {avatar}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-dark">{user.username}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  label={user.role}
                  bg={user.role === "admin" ? "rgba(234,109,0,0.1)" : "#f1f5f9"}
                  color={user.role === "admin" ? "#ea6d00" : "#475569"}
                />
                {user.isDeleted ? (
                  <Badge label="Deleted" bg="#f1f5f9" color="#64748b" />
                ) : blocked ? (
                  <Badge label="Blocked" bg="#fff7ed" color="#9a3412" />
                ) : (
                  <Badge label="Active" bg="#ecfdf5" color="#065f46" />
                )}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {user.role !== "admin" && !user.isDeleted && (
            <div className="flex items-start gap-2 flex-wrap">
              {blocked ? (
                <button onClick={() => setUnblockTarget(user)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition cursor-pointer"
                  style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #bbf7d0" }}>
                  <ShieldCheck size={14} /> Unblock
                </button>
              ) : (
                <button onClick={() => setBlockTarget(user)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition cursor-pointer"
                  style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
                  <ShieldOff size={14} /> Block
                </button>
              )}
              <button onClick={() => setDeleteTarget(user)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition cursor-pointer"
                style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
                <Trash2 size={14} /> Delete account
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-5" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}>
              <Mail size={14} className="text-brand-muted" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Email</p>
              <p className="text-sm text-brand-dark break-all">{user.email}</p>
              <p className="text-[11px] font-medium mt-1.5" style={{ color: user.verified ? "#065f46" : "#9a3412" }}>
                {user.verified ? "✓ Verified" : "✗ Not verified"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}>
              <Phone size={14} className="text-brand-muted" />
            </div>
            <div>
              <p className="text-[11px] text-brand-muted uppercase tracking-wider">Phone</p>
              <p className="text-sm text-brand-dark">{user.mobileNumber || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.07)" }}>
              <Calendar size={14} className="text-brand-muted" />
            </div>
            <div>
              <p className="text-[11px] text-brand-muted uppercase tracking-wider">Joined</p>
              <p className="text-sm text-brand-dark">{joinedDate}</p>
            </div>
          </div>
        </div>

        {blocked && (
          <div className="mt-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
            Blocked until {new Date(user.blockedUntil).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total listings",   value: stats?.listings    ?? 0 },
          { label: "Inspections",      value: stats?.inspections ?? 0 },
          { label: "Active listings",  value: listings.filter(l => l.status === "ACTIVE").length,  note: "on this page" },
          { label: "Pending listings", value: listings.filter(l => l.status === "PENDING").length, note: "on this page" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-xs text-brand-muted">{s.label}</p>
            <p className="text-2xl font-semibold text-brand-dark mt-1">{s.value}</p>
            {s.note && <p className="text-[10px] text-brand-muted mt-0.5">{s.note}</p>}
          </div>
        ))}
      </div>

      {/* Listings section */}
      <div>
        <h3 className="text-sm font-semibold text-brand-dark mb-3">Listings ({listingTotal.total})</h3>

        {/* Desktop table */}
        <div className="hidden lg:block bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">Mode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">Posted</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-brand-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listingsLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.06)", width: j === 0 ? "160px" : "70px" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-brand-muted">No listings yet</td>
                </tr>
              ) : (
                listings.map(l => (
                  <ListingRow key={l._id} l={l} onApprove={openApprove} onReject={openReject} onRemove={openRemove} />
                ))
              )}
            </tbody>
          </table>

          {listingTotal.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <p className="text-xs text-brand-muted">Page {listingTotal.page} of {listingTotal.totalPages} · {listingTotal.total} total</p>
              <div className="flex gap-1">
                <button onClick={() => setListingPage(p => Math.max(1, p - 1))} disabled={listingTotal.page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition disabled:opacity-40 cursor-pointer"
                  style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setListingPage(p => Math.min(listingTotal.totalPages, p + 1))} disabled={listingTotal.page === listingTotal.totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition disabled:opacity-40 cursor-pointer"
                  style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden flex flex-col gap-3">
          {listingsLoading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="h-4 rounded w-3/4 mb-2" style={{ background: "rgba(0,0,0,0.06)" }} />
                <div className="h-3 rounded w-1/2" style={{ background: "rgba(0,0,0,0.06)" }} />
              </div>
            ))
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl py-10 text-center text-sm text-brand-muted" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              No listings yet
            </div>
          ) : (
            listings.map(l => (
              <ListingCard key={l._id} l={l} onApprove={openApprove} onReject={openReject} onRemove={openRemove} />
            ))
          )}
          {listingTotal.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-brand-muted">Page {listingTotal.page} of {listingTotal.totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setListingPage(p => Math.max(1, p - 1))} disabled={listingTotal.page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition disabled:opacity-40 cursor-pointer"
                  style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setListingPage(p => Math.min(listingTotal.totalPages, p + 1))} disabled={listingTotal.page === listingTotal.totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition disabled:opacity-40 cursor-pointer"
                  style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BlockModal user={blockTarget} onClose={() => setBlockTarget(null)} onConfirm={handleBlock} />

      <ConfirmModal
        show={!!unblockTarget}
        onClose={() => setUnblockTarget(null)}
        onConfirm={handleUnblock}
        title={`Unblock ${unblockTarget?.username}`}
        message={`This will restore ${unblockTarget?.username}'s access immediately.`}
      />

      <ConfirmModal
        show={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.username}`}
        message={`This will permanently delete ${deleteTarget?.username}'s account and all their listings. You'll be redirected back to the users list.`}
      />

      <ConfirmModal
        show={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve listing"
        message={`Approve "${listingLabel(approveTarget)}"? It will become publicly visible.`}
      />

      <RejectModal listing={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} />

      <ConfirmModal
        show={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove listing"
        message={`Remove "${listingLabel(removeTarget)}"? This will cancel any active inspection and delete all images.`}
      />
    </div>
  );
}
