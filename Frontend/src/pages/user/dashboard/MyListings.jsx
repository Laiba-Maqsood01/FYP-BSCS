import { useEffect, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Star, Check, ExternalLink, Info, ShieldCheck, Clock, Calendar, CheckCircle2, Download, FileText,
} from "lucide-react";
import { getMyListings, updateListing, deleteListing, markMyListingSold } from "../../../services/listingService";
import { getDeletionRequests, submitDeletionRequest, getCommissionDetails } from "../../../services/managedSaleService";
import { requestFeatured, createFeaturedPayment, getFeaturedByListing, getActiveFeaturedPlans } from "../../../services/featuredService";
import { getListingInspectionStatus } from "../../../services/inspectionService";
import Modal from "../../../components/ui/Modal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPKR(n) {
  if (!n) return "PKR 0";
  return `PKR ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function carLabel(l) {
  return `${l?.year ?? ""} ${l?.brand?.name ?? ""} ${l?.carModel?.name ?? ""}`.trim() || "Unnamed listing";
}

const STATUS_BADGE = {
  ACTIVE:             { bg: "#dcfce7", text: "#16a34a" },
  PENDING:            { bg: "#fef9c3", text: "#b45309" },
  REJECTED:           { bg: "#fee2e2", text: "#dc2626" },
  REMOVED:            { bg: "#f1f5f9", text: "#64748b" },
  SOLD:               { bg: "#dbeafe", text: "#1d4ed8" },
};

const TABS = ["All", "Active", "Pending", "Rejected", "Sold", "Removed", "Managed"];

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditModal({ listing, onClose, onSaved }) {
  const [form, setForm] = useState({
    price:        listing.price        ?? "",
    mileage:      listing.mileage      ?? "",
    description:  listing.description  ?? "",
    mobileNumber: listing.mobileNumber ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function save() {
    setSaving(true); setError("");
    try {
      await updateListing(listing._id, form);
      onSaved(listing._id, form);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to save.");
    } finally { setSaving(false); }
  }

  const field = (label, name, type = "text", extra = {}) => (
    <div>
      <label className="text-xs font-medium text-brand-muted block mb-1">{label}</label>
      <input type={type} value={form[name]} {...extra}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className="w-full rounded-lg px-3 py-2 text-sm text-brand-dark outline-none"
        style={{ border: "1px solid rgba(0,0,0,0.12)" }} />
    </div>
  );

  return (
    <Modal title="Edit Listing" onClose={onClose}>
      <div className="space-y-3">
        {field("Price (PKR)",    "price",        "number")}
        {field("Mileage (km)",   "mileage",      "number")}
        {field("Mobile Number",  "mobileNumber")}
        <div>
          <label className="text-xs font-medium text-brand-muted block mb-1">Description</label>
          <textarea rows={3} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-brand-dark outline-none resize-none"
            style={{ border: "1px solid rgba(0,0,0,0.12)" }} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition cursor-pointer">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ background: "#ea6d00" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete modal ──────────────────────────────────────────────────────────────

function DeleteModal({ listing, onClose, onDeleted }) {
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true); setError("");
    try {
      await deleteListing(listing._id);
      onDeleted(listing._id);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to delete.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Delete Listing" onClose={onClose}>
      <p className="text-sm text-brand-dark mb-1">Are you sure you want to delete <strong>{carLabel(listing)}</strong>?</p>
      <p className="text-xs text-brand-muted mb-4">This action cannot be undone.</p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition cursor-pointer">Cancel</button>
        <button onClick={confirm} disabled={busy}
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          style={{ background: "#dc2626" }}>
          {busy ? "Deleting…" : "Yes, Delete"}
        </button>
      </div>
    </Modal>
  );
}

// ── Mark as Sold modal ────────────────────────────────────────────────────────

function MarkSoldModal({ listing, onClose, onDone }) {
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true); setError("");
    try {
      await markMyListingSold(listing._id);
      onDone(listing._id);
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to mark as sold.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Mark as Sold" onClose={onClose}>
      <p className="text-sm text-brand-muted mb-4">
        Are you sure you want to mark <strong>{carLabel(listing)}</strong> as sold? This cannot be undone.
      </p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition cursor-pointer">Cancel</button>
        <button onClick={confirm} disabled={busy}
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          style={{ background: "#1d4ed8" }}>
          {busy ? "Updating…" : "Yes, Mark as Sold"}
        </button>
      </div>
    </Modal>
  );
}

// ── Featured plan picker modal ────────────────────────────────────────────────

function FeaturedModal({ listing, onClose }) {
  const [plans,    setPlans]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");

  useEffect(() => {
    getActiveFeaturedPlans()
      .then(data => { setPlans(data); if (data.length > 0) setSelected(data[0].name); })
      .catch(() => setErr("Failed to load plans."))
      .finally(() => setLoading(false));
  }, []);

  async function pay() {
    if (!selected) return;
    setBusy(true); setErr("");
    try {
      const feature = await requestFeatured(listing._id, selected);
      const { url } = await createFeaturedPayment(feature._id);
      if (!url) throw new Error("No payment URL returned.");
      window.location.href = url;
    } catch (e) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Could not start payment.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Feature this Listing" onClose={onClose}>
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse bg-gray-100" />)}
          </div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-brand-muted text-center py-4">No featured plans available right now.</p>
        ) : plans.map(p => (
          <label key={p.name}
            className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition"
            style={selected === p.name
              ? { border: "2px solid #ea6d00", background: "#fff7ed" }
              : { border: "1px solid rgba(0,0,0,0.08)" }}>
            <input type="radio" className="mt-0.5 accent-brand-orange"
              checked={selected === p.name} onChange={() => setSelected(p.name)} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-dark">
                {p.label || p.name}{" "}
                <span className="text-brand-orange">PKR {p.amount.toLocaleString()}</span>
              </p>
              <p className="text-xs text-brand-muted mt-0.5">{p.durationDays}-day boost</p>
            </div>
            {selected === p.name && <Check size={15} style={{ color: "#ea6d00" }} className="mt-0.5 shrink-0" />}
          </label>
        ))}
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition cursor-pointer">Cancel</button>
          <button onClick={pay} disabled={busy || loading || !selected}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ background: "#ea6d00" }}>
            {busy ? "Redirecting…" : "Pay & Feature"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Featured detail modal ─────────────────────────────────────────────────────

const PLAN_COLORS = {
  BASIC:   { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  PREMIUM: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  TOP:     { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff" },
};

const FEAT_STATUS_COLORS = {
  ACTIVE:   { bg: "#dcfce7", text: "#16a34a" },
  PENDING:  { bg: "#fef9c3", text: "#b45309" },
  EXPIRED:  { bg: "#f1f5f9", text: "#64748b" },
  REJECTED: { bg: "#fee2e2", text: "#dc2626" },
  REMOVED:  { bg: "#f1f5f9", text: "#64748b" },
};

function FeaturedDetailModal({ listingId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  useEffect(() => {
    getFeaturedByListing(listingId)
      .then(setData)
      .catch(e => setErr(e?.response?.data?.message ?? "Failed to load featured details."))
      .finally(() => setLoading(false));
  }, [listingId]);

  const planColor   = data ? (PLAN_COLORS[data.plan]          ?? PLAN_COLORS.BASIC)              : null;
  const statusColor = data ? (FEAT_STATUS_COLORS[data.status] ?? { bg: "#f1f5f9", text: "#64748b" }) : null;

  return (
    <Modal title="Featured Listing Details" onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" />
        </div>
      ) : err ? (
        <p className="text-sm text-red-600 text-center py-4">{err}</p>
      ) : data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: planColor.bg, border: `1px solid ${planColor.border}` }}>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: planColor.text }}>Plan</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: planColor.text }}>{data.plan}</p>
            </div>
            <Star size={22} style={{ color: planColor.text }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-brand-muted uppercase tracking-wide mb-1">Status</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: statusColor.bg, color: statusColor.text }}>{data.status}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-brand-muted uppercase tracking-wide mb-1">Duration</p>
              <p className="text-sm font-semibold text-brand-dark">{data.durationDays} days</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-brand-muted uppercase tracking-wide mb-1">Amount Paid</p>
              <p className="text-sm font-semibold text-brand-dark">{formatPKR(data.amount)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-brand-muted uppercase tracking-wide mb-1">Start Date</p>
              <p className="text-sm font-semibold text-brand-dark">{formatDate(data.startDate)}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[11px] text-brand-muted uppercase tracking-wide mb-1">End Date</p>
            <p className="text-sm font-semibold text-brand-dark">{formatDate(data.endDate)}</p>
            {data.endDate && data.status === "ACTIVE" && (() => {
              const daysLeft = Math.ceil((new Date(data.endDate) - new Date()) / 86400000);
              return daysLeft > 0
                ? <p className="text-xs mt-1" style={{ color: daysLeft <= 3 ? "#dc2626" : "#16a34a" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</p>
                : <p className="text-xs mt-1 text-red-600">Expired</p>;
            })()}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Deletion request modal ────────────────────────────────────────────────────

function DeletionRequestModal({ listing, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState("");

  async function submit() {
    if (!reason.trim()) { setErr("Please provide a reason."); return; }
    setBusy(true); setErr("");
    try {
      const res = await submitDeletionRequest(listing._id, reason);
      onDone(res);
    } catch (e) {
      setErr(e?.response?.data?.message ?? "Failed to submit.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Request Listing Deletion" onClose={onClose}>
      <p className="text-xs text-brand-muted mb-3">A managed listing can only be deleted by admin. Provide a reason and we'll process your request.</p>
      <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)}
        placeholder="Why do you want to delete this listing?"
        className="w-full rounded-lg px-3 py-2 text-sm text-brand-dark outline-none resize-none mb-3"
        style={{ border: "1px solid rgba(0,0,0,0.12)" }} />
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition cursor-pointer">Cancel</button>
        <button onClick={submit} disabled={busy}
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
          style={{ background: "#ea6d00" }}>
          {busy ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </Modal>
  );
}

// ── Deletion detail modal ─────────────────────────────────────────────────────

const DR_STATUS_STYLE = {
  PENDING:  { bg: "#fef9c3", text: "#b45309" },
  APPROVED: { bg: "#dcfce7", text: "#16a34a" },
  REJECTED: { bg: "#fee2e2", text: "#dc2626" },
};

function DeletionDetailModal({ request, onClose }) {
  const style = DR_STATUS_STYLE[request.status] ?? DR_STATUS_STYLE.PENDING;
  return (
    <div className="fixed inset-0 z-9000 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <FileText size={16} className="text-brand-muted" />
            <p className="font-semibold text-brand-dark">Deletion Request</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ background: style.bg, color: style.text }}>{request.status}</span>
            <button onClick={onClose} className="text-brand-muted hover:text-brand-dark transition ml-1 cursor-pointer">
              <FileText size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted mb-2">Your reason for deletion</p>
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-sm text-brand-dark leading-relaxed">{request.reason}</p>
            </div>
          </div>
          {request.status === "REJECTED" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500 mb-2">Admin note</p>
              <div className="rounded-xl p-3.5" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
                {request.adminNote
                  ? <p className="text-sm text-red-800 leading-relaxed">{request.adminNote}</p>
                  : <p className="text-sm text-red-400 italic">No note provided.</p>}
              </div>
            </div>
          )}
          {request.status === "APPROVED" && (
            <div className="rounded-xl p-3.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <p className="text-sm text-green-700">Your deletion request was approved. The listing has been removed.</p>
            </div>
          )}
          {request.status === "PENDING" && (
            <div className="rounded-xl p-3.5" style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
              <p className="text-sm text-yellow-700">Your request is under review. The admin will process it shortly.</p>
            </div>
          )}
        </div>
        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <button onClick={onClose} className="w-full py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
}


// ── InspectionStrip — memo so fetch + render is isolated to each card ─────────

const INSP_STATUS_MAP = {
  PENDING:              { bg: "#fef9c3", text: "#b45309", icon: Clock,        label: "Inspection Requested" },
  SCHEDULED:            { bg: "#dbeafe", text: "#1d4ed8", icon: Calendar,     label: "Inspection Scheduled" },
  IN_PROGRESS:          { bg: "#fef9c3", text: "#b45309", icon: ShieldCheck,  label: "Inspection In Progress" },
  COMPLETED:            { bg: "#dcfce7", text: "#16a34a", icon: CheckCircle2, label: "Inspection Completed" },
};

const InspectionStrip = memo(function InspectionStrip({ listingId, isActive }) {
  const navigate = useNavigate();
  const [insp,    setInsp]    = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isActive) { setLoading(false); return; }
    getListingInspectionStatus(listingId)
      // A cancelled inspection is not an active one — the seller can simply
      // request a new inspection, so treat it like "none".
      .then(d => setInsp(d && d.status !== "CANCELLED" ? d : null))
      .catch(() => setInsp(null))
      .finally(() => setLoading(false));
  }, [listingId, isActive]);

  if (!isActive) return null;
  if (loading) return (
    <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-muted">
      <div className="w-3 h-3 border border-brand-muted/30 border-t-brand-muted rounded-full animate-spin" />
      Loading inspection…
    </div>
  );
  if (!insp) return (
    <div className="mt-2">
      <button onClick={() => navigate(`/inspection/book/${listingId}?mode=seller`)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 transition cursor-pointer"
        style={{ background: "#16a34a" }}>
        <ShieldCheck size={12} /> Request Inspection
      </button>
    </div>
  );

  const cfg  = INSP_STATUS_MAP[insp.status] ?? { bg: "#f1f5f9", text: "#64748b", icon: ShieldCheck, label: insp.status };
  const Icon = cfg.icon;
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: cfg.bg, color: cfg.text }}>
        <Icon size={11} /> {cfg.label}
      </span>
      {insp.status === "COMPLETED" && insp.reportToken && (
        <a href={`/reports/${insp.reportToken}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition"
          style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#16a34a" }}>
          <Download size={11} /> Report
        </a>
      )}
    </div>
  );
});

// ── ListingCard — memo so only the changed listing re-renders ─────────────────

const ListingCard = memo(function ListingCard({ listing, onEdit, onDelete, onFeature, onFeaturedDetail, onMarkSold, onRejectionReason, isManaged }) {
  const navigate   = useNavigate();
  const image      = listing.images?.[0]?.url;
  const badge      = STATUS_BADGE[listing.status] ?? { bg: "#f1f5f9", text: "#64748b" };
  const isFeatured = !!listing.isFeatured;
  const isActive   = listing.status === "ACTIVE";

  return (
    <div className="bg-white rounded-xl overflow-hidden flex flex-col sm:flex-row" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      {/* Thumbnail */}
      <div className="w-full sm:w-44 h-32 sm:h-auto bg-gray-100 shrink-0 relative">
        {image
          ? <img src={image} alt={carLabel(listing)} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted">No image</div>}
        {isFeatured && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded text-white" style={{ background: "#ea6d00" }}>FEATURED</span>
        )}
        {isManaged && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded text-white" style={{ background: "#7c3aed" }}>MANAGED</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-dark truncate">{carLabel(listing)}</p>
            <p className="text-xs text-brand-muted mt-0.5">{listing.city?.name ?? "—"} · {formatDate(listing.createdAt)}</p>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0" style={{ background: badge.bg, color: badge.text }}>
            {listing.status === "REMOVED"
              ? (listing.removedBy === "ADMIN" ? "Removed by Admin" : listing.removedBy === "OWNER" ? "Removed by You" : "REMOVED")
              : (listing.status?.replace("_", " ") ?? "—")}
          </span>
        </div>

        <p className="text-base font-bold text-brand-dark mt-1.5">{formatPKR(listing.price)}</p>

        <InspectionStrip listingId={listing._id} isActive={isActive} />

        {/* Action buttons */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {isActive && (
            <button onClick={() => navigate(`/browse-cars/${listing._id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-muted hover:bg-gray-50 transition cursor-pointer"
              style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              <ExternalLink size={12} /> View
            </button>
          )}
          {/* Editable in every state except SOLD/REMOVED — managed included */}
          {listing.status !== "SOLD" && listing.status !== "REMOVED" && (
            <button onClick={() => navigate(`/edit-listing/${listing._id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition cursor-pointer"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#3b82f6" }}>
              <Edit2 size={12} /> Edit
            </button>
          )}
          {isActive && !isFeatured && (
            <button onClick={() => onFeature(listing)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition cursor-pointer"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#ea6d00" }}>
              <Star size={12} /> Feature
            </button>
          )}
          {listing.status === "REJECTED" && listing.rejectionReason && (
            <button onClick={() => onRejectionReason(listing)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition cursor-pointer"
              style={{ border: "1px solid rgba(220,38,38,0.35)", color: "#dc2626", background: "#fef2f2" }}>
              <Info size={12} /> Rejection Reason
            </button>
          )}
          {isFeatured && (
            <button onClick={() => onFeaturedDetail(listing._id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition cursor-pointer"
              style={{ border: "1px solid rgba(234,109,0,0.4)", color: "#ea6d00", background: "#fff7ed" }}>
              <Info size={12} /> Featured Details
            </button>
          )}
          {isActive && !isManaged && (
            <button onClick={() => onMarkSold(listing)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition cursor-pointer"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#1d4ed8" }}>
              <Check size={12} /> Mark as Sold
            </button>
          )}
          {/* A rejected managed listing was never accepted by the team, so the
              owner may delete it directly — no deletion request needed.
              Already-removed listings have nothing left to delete. */}
          {listing.status !== "REMOVED" && (!isManaged || listing.status === "REJECTED") && (
            <button onClick={() => onDelete(listing)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition cursor-pointer"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#dc2626" }}>
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ── ManagedSection — scoped state for deletion reqs + commissions ──────────────

const DR_BADGE = {
  PENDING:  { bg: "#fef9c3", text: "#b45309" },
  APPROVED: { bg: "#dcfce7", text: "#16a34a" },
  REJECTED: { bg: "#fee2e2", text: "#dc2626" },
};

function ManagedSection({ listings }) {
  const managedListings = listings.filter(l => l.saleMode === "MANAGED");
  // Deletion requests only make sense while the listing is still on the market —
  // PENDING included, so the owner can back out before it goes ACTIVE.
  const deletableListings = managedListings.filter(l => ["PENDING", "ACTIVE"].includes(l.status));
  const [subTab,       setSubTab]       = useState("deletion");
  const [deletionReqs, setDeletionReqs] = useState([]);
  const [commissions,  setCommissions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [requestTarget, setRequestTarget] = useState(null);
  const [detailTarget,  setDetailTarget]  = useState(null);

  useEffect(() => {
    // Commission records exist for SOLD managed listings — the GearTrade team
    // deducts the commission from the sale proceeds, so these are display-only.
    Promise.all([
      getDeletionRequests().catch(() => []),
      ...managedListings
        .filter(l => l.status === "SOLD")
        .map(l => getCommissionDetails(l._id).catch(() => null)),
    ]).then(([reqs, ...comms]) => {
      setDeletionReqs(Array.isArray(reqs) ? reqs : []);
      setCommissions(comms.filter(Boolean));
    }).finally(() => setLoading(false));
  }, []);

  // After a deletion request is submitted, add it to local state — no page reload.
  function handleDeletionSubmitted(newRequest) {
    setRequestTarget(null);
    if (newRequest) setDeletionReqs(prev => [...prev, newRequest]);
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4">
        {[
          { key: "deletion",    label: "Deletion Requests" },
          { key: "commission",  label: "Commission Details" },
        ].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            style={subTab === t.key
              ? { background: "#ea6d00", color: "#fff" }
              : { background: "#f8f9fa", color: "#64748b" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="w-16 h-12 rounded-lg bg-gray-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-40 bg-gray-200 rounded mb-1.5" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
              <div className="h-8 w-24 bg-gray-100 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      ) : subTab === "deletion" ? (
        <div className="space-y-3">
          {deletableListings.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-8">No pending or active managed listings.</p>
          ) : deletableListings.map(l => {
            const image = l.images?.[0]?.url;
            const existingReq = deletionReqs.find(r => (r.listing?._id ?? r.listing) === l._id);
            const drBadge = existingReq ? (DR_BADGE[existingReq.status] ?? DR_BADGE.PENDING) : null;
            const statusBadge = STATUS_BADGE[l.status] ?? { bg: "#f1f5f9", text: "#64748b" };
            return (
              <div key={l._id} className="bg-white rounded-xl overflow-hidden flex flex-col sm:flex-row" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="w-full sm:w-44 h-32 sm:h-auto bg-gray-100 shrink-0">
                  {image
                    ? <img src={image} alt={carLabel(l)} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted">No image</div>}
                </div>
                <div className="flex-1 px-4 py-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-dark truncate">{carLabel(l)}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{l.city?.name ?? "—"} · Updated {formatDate(l.updatedAt ?? l.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: statusBadge.bg, color: statusBadge.text }}>{l.status}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-white" style={{ background: "#7c3aed" }}>MANAGED</span>
                    </div>
                  </div>
                  <p className="text-base font-bold text-brand-dark mt-1.5">{formatPKR(l.price)}</p>
                  <div className="mt-3">
                    {existingReq ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: drBadge.bg, color: drBadge.text }}>
                          Deletion Request: {existingReq.status}
                        </span>
                        <button onClick={() => setDetailTarget(existingReq)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition hover:opacity-80 cursor-pointer"
                          style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#64748b" }}>
                          <FileText size={11} /> View Details
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setRequestTarget(l)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition cursor-pointer"
                        style={{ background: "#dc2626" }}>
                        <Trash2 size={12} /> Request Deletion
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {commissions.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-8">No sold managed listings yet.</p>
          ) : commissions.map(comm => {
            const image   = comm.listing?.images?.[0]?.url;
            const ratePct = comm.commissionRate ? `${+(comm.commissionRate * 100).toFixed(2)}%` : null;
            const net     = (comm.salePrice ?? 0) - (comm.commissionAmount ?? 0);

            return (
              <div key={comm._id} className="bg-white rounded-xl p-4 flex items-center gap-4 flex-wrap"
                style={{ border: "1px solid rgba(0,0,0,0.07)", borderLeft: "3px solid #16a34a" }}>

                {/* Car thumbnail */}
                <div className="w-22 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                  {image
                    ? <img src={image} alt={carLabel(comm.listing)} className="w-full h-full object-cover" />
                    : <ShieldCheck size={22} className="text-gray-300" />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-brand-dark">{carLabel(comm.listing)}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#ede9fe", color: "#7c3aed" }}>Managed</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>
                      <Check size={10} /> Sold by GearTrade
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted mb-2">
                    GearTrade deducted its commission from the sale amount — our team will deliver your remaining proceeds.
                  </p>
                  <div className="flex gap-5 flex-wrap">
                    {comm.salePrice != null && (
                      <div>
                        <p className="text-[11px] text-brand-muted leading-tight">Sale price</p>
                        <p className="text-[13px] font-semibold text-brand-dark">{formatPKR(comm.salePrice)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] text-brand-muted leading-tight">Commission{ratePct ? ` (${ratePct})` : ""}</p>
                      <p className="text-[13px] font-semibold text-brand-dark">− {formatPKR(comm.commissionAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-brand-muted leading-tight">You receive</p>
                      <p className="text-[13px] font-bold" style={{ color: "#15803d" }}>{formatPKR(net)}</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <CheckCircle2 size={13} /> Commission settled
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {requestTarget && (
        <DeletionRequestModal
          listing={requestTarget}
          onClose={() => setRequestTarget(null)}
          onDone={handleDeletionSubmitted}
        />
      )}
      {detailTarget && (
        <DeletionDetailModal request={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ListingSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden flex flex-col sm:flex-row animate-pulse" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="w-full sm:w-44 h-32 bg-gray-200 shrink-0" />
      <div className="flex-1 px-4 py-3 flex flex-col gap-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-5 w-16 bg-gray-100 rounded-full shrink-0" />
        </div>
        <div className="h-3 w-32 bg-gray-100 rounded" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="flex gap-2 mt-auto pt-2">
          <div className="h-7 w-16 bg-gray-100 rounded-lg" />
          <div className="h-7 w-16 bg-gray-100 rounded-lg" />
          <div className="h-7 w-20 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyListings() {
  const [listings,        setListings]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [tab,             setTab]             = useState("All");
  const [editTarget,      setEditTarget]      = useState(null);
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [featureTarget,   setFeatureTarget]   = useState(null);
  const [featuredDetailId, setFeaturedDetailId] = useState(null);
  const [markSoldTarget,  setMarkSoldTarget]  = useState(null);
  const [rejectionTarget, setRejectionTarget] = useState(null);

  function load() {
    setLoading(true);
    getMyListings()
      .then(l => setListings(Array.isArray(l) ? l : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  // ── Targeted state updates ─────────────────────────────────────────────────

  const handleEditSaved = useCallback((id, patch) => {
    setEditTarget(null);
    setListings(prev => prev.map(l => l._id === id ? { ...l, ...patch } : l));
  }, []);

  // Deletion is a soft delete — the listing moves to the Removed tab
  const handleDeleted = useCallback((id) => {
    setDeleteTarget(null);
    setListings(prev => prev.map(l =>
      l._id === id ? { ...l, status: "REMOVED", removedBy: "OWNER", isFeatured: false } : l
    ));
  }, []);

  const handleMarkedSold = useCallback((id) => {
    setMarkSoldTarget(null);
    setListings(prev => prev.map(l => l._id === id ? { ...l, status: "SOLD" } : l));
  }, []);

  // Stable callbacks — useState setters are stable, but wrapping keeps intent clear.
  const openEdit         = useCallback((l) => setEditTarget(l),         []);
  const openDelete       = useCallback((l) => setDeleteTarget(l),       []);
  const openFeature      = useCallback((l) => setFeatureTarget(l),      []);
  const openFeaturedDetail = useCallback((id) => setFeaturedDetailId(id), []);
  const openMarkSold     = useCallback((l) => setMarkSoldTarget(l),     []);
  const openRejection    = useCallback((l) => setRejectionTarget(l),    []);

  // ── Tab filter ─────────────────────────────────────────────────────────────

  const filtered = tab === "All"      ? listings
    : tab === "Managed"  ? listings.filter(l => l.saleMode === "MANAGED")
    : tab === "Active"   ? listings.filter(l => l.status === "ACTIVE")
    : tab === "Pending"  ? listings.filter(l => l.status === "PENDING")
    : tab === "Rejected" ? listings.filter(l => l.status === "REJECTED")
    : tab === "Sold"     ? listings.filter(l => l.status === "SOLD")
    : tab === "Removed"  ? listings.filter(l => l.status === "REMOVED")
    : listings;

  const tabCount = (t) =>
    t === "All"      ? listings.length
    : t === "Active"   ? listings.filter(l => l.status === "ACTIVE").length
    : t === "Pending"  ? listings.filter(l => l.status === "PENDING").length
    : t === "Rejected" ? listings.filter(l => l.status === "REJECTED").length
    : t === "Sold"     ? listings.filter(l => l.status === "SOLD").length
    : t === "Removed"  ? listings.filter(l => l.status === "REMOVED").length
    : listings.filter(l => l.saleMode === "MANAGED").length;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-brand-dark mb-5">My Listings</h1>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map(t => {
          const count = tabCount(t);
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

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <ListingSkeleton key={i} />)}
        </div>
      ) : tab === "Managed" ? (
        <ManagedSection listings={listings} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-brand-muted text-sm">No listings in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => (
            <ListingCard
              key={l._id}
              listing={l}
              onEdit={openEdit}
              onDelete={openDelete}
              onFeature={openFeature}
              onFeaturedDetail={openFeaturedDetail}
              onMarkSold={openMarkSold}
              onRejectionReason={openRejection}
              isManaged={l.saleMode === "MANAGED"}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {editTarget && (
        <EditModal listing={editTarget} onClose={() => setEditTarget(null)} onSaved={handleEditSaved} />
      )}
      {deleteTarget && (
        <DeleteModal listing={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      )}
      {featureTarget && (
        <FeaturedModal listing={featureTarget} onClose={() => setFeatureTarget(null)} />
      )}
      {featuredDetailId && (
        <FeaturedDetailModal listingId={featuredDetailId} onClose={() => setFeaturedDetailId(null)} />
      )}
      {markSoldTarget && (
        <MarkSoldModal listing={markSoldTarget} onClose={() => setMarkSoldTarget(null)} onDone={handleMarkedSold} />
      )}
      {rejectionTarget && (
        <Modal title="Why was this listing rejected?" onClose={() => setRejectionTarget(null)}>
          <div className="rounded-lg px-4 py-3 mb-4" style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)" }}>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{rejectionTarget.rejectionReason}</p>
          </div>
          <p className="text-xs text-brand-muted">
            Fix the issue above and edit the listing to resubmit it for review.
            {rejectionTarget.saleMode === "MANAGED" && " Your onboarding inspection fee carries over — no new payment is needed."}
          </p>
        </Modal>
      )}
    </div>
  );
}
