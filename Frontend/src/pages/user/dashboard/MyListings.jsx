import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, X, Edit2, Trash2, Star, AlertCircle, Check, ExternalLink } from "lucide-react";
import { getMyListings, updateListing, deleteListing } from "../../../services/listingService";
import { getDeletionRequests, submitDeletionRequest, getCommissionDetails, initiateCommissionPayment } from "../../../services/managedSaleService";
import { requestFeatured, createFeaturedPayment } from "../../../services/featuredService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPKR(n) {
  if (!n) return "PKR 0";
  return `PKR ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_BADGE = {
  ACTIVE:             { bg: "#dcfce7", text: "#16a34a" },
  PENDING:            { bg: "#fef9c3", text: "#b45309" },
  REJECTED:           { bg: "#fee2e2", text: "#dc2626" },
  REMOVED:            { bg: "#f1f5f9", text: "#64748b" },
  SOLD:               { bg: "#dbeafe", text: "#1d4ed8" },
  PENDING_COMMISSION: { bg: "#ede9fe", text: "#7c3aed" },
};

const TABS = ["All", "Active", "Pending", "Rejected", "Sold", "Managed"];

const PLANS = [
  { key: "BASIC",   label: "Basic",   price: "PKR 500",  desc: "7-day boost, standard visibility" },
  { key: "PREMIUM", label: "Premium", price: "PKR 1,000", desc: "15-day boost, priority placement" },
  { key: "TOP",     label: "Top",     price: "PKR 2,000", desc: "30-day boost, top of search results" },
];

// ── Modal wrappers ────────────────────────────────────────────────────────────

function Modal({ onClose, children, title }) {
  return (
    <div className="fixed inset-0 z-9000 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="font-semibold text-brand-dark">{title}</p>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark transition"><X size={18} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ listing, onClose, onSaved }) {
  const [form, setForm] = useState({
    price:        listing.price ?? "",
    mileage:      listing.mileage ?? "",
    description:  listing.description ?? "",
    mobileNumber: listing.mobileNumber ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function save() {
    setSaving(true); setError("");
    try {
      await updateListing(listing._id, form);
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to save.");
    } finally { setSaving(false); }
  }

  return (
    <Modal title="Edit Listing" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-brand-muted block mb-1">Price (PKR)</label>
          <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-brand-dark outline-none"
            style={{ border: "1px solid rgba(0,0,0,0.12)" }} />
        </div>
        <div>
          <label className="text-xs font-medium text-brand-muted block mb-1">Mileage (km)</label>
          <input type="number" value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-brand-dark outline-none"
            style={{ border: "1px solid rgba(0,0,0,0.12)" }} />
        </div>
        <div>
          <label className="text-xs font-medium text-brand-muted block mb-1">Mobile Number</label>
          <input type="text" value={form.mobileNumber} onChange={e => setForm(f => ({ ...f, mobileNumber: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-brand-dark outline-none"
            style={{ border: "1px solid rgba(0,0,0,0.12)" }} />
        </div>
        <div>
          <label className="text-xs font-medium text-brand-muted block mb-1">Description</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg px-3 py-2 text-sm text-brand-dark outline-none resize-none"
            style={{ border: "1px solid rgba(0,0,0,0.12)" }} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#ea6d00" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ listing, onClose, onDeleted }) {
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true); setError("");
    try {
      await deleteListing(listing._id);
      onDeleted();
    } catch (e) {
      setError(e?.response?.data?.message ?? "Failed to delete.");
      setBusy(false);
    }
  }

  const car = `${listing.year ?? ""} ${listing.brand?.name ?? ""} ${listing.carModel?.name ?? ""}`.trim();
  return (
    <Modal title="Delete Listing" onClose={onClose}>
      <p className="text-sm text-brand-dark2 mb-1">Are you sure you want to delete <strong>{car}</strong>?</p>
      <p className="text-xs text-brand-muted mb-4">This action cannot be undone.</p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition">Cancel</button>
        <button onClick={confirm} disabled={busy}
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#dc2626" }}>
          {busy ? "Deleting…" : "Yes, Delete"}
        </button>
      </div>
    </Modal>
  );
}

// ── Featured Modal ────────────────────────────────────────────────────────────

function FeaturedModal({ listing, onClose }) {
  const [selected, setSelected] = useState("PREMIUM");
  const [step,     setStep]     = useState("select"); // select | confirm | done | error
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");

  async function pay() {
    setBusy(true); setErr("");
    try {
      const feature = await requestFeatured(listing._id, selected);
      const { url } = await createFeaturedPayment(feature._id);
      window.location.href = url;
    } catch (e) {
      setErr(e?.response?.data?.message ?? "Could not start payment.");
      setStep("error");
    } finally { setBusy(false); }
  }

  return (
    <Modal title="Feature this Listing" onClose={onClose}>
      <div className="space-y-3">
        {PLANS.map(p => (
          <label key={p.key} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition ${selected === p.key ? "ring-2" : "hover:bg-gray-50"}`}
            style={selected === p.key ? { ring: "none", border: "2px solid #ea6d00", background: "#fff7ed" } : { border: "1px solid rgba(0,0,0,0.08)" }}>
            <input type="radio" className="mt-0.5 accent-brand-orange" checked={selected === p.key} onChange={() => setSelected(p.key)} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-dark">{p.label} <span className="text-brand-orange">{p.price}</span></p>
              <p className="text-xs text-brand-muted mt-0.5">{p.desc}</p>
            </div>
            {selected === p.key && <Check size={15} style={{ color: "#ea6d00" }} className="mt-0.5 shrink-0" />}
          </label>
        ))}
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition">Cancel</button>
          <button onClick={pay} disabled={busy}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#ea6d00" }}>
            {busy ? "Redirecting…" : "Pay & Feature"}
          </button>
        </div>
      </div>
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
      await submitDeletionRequest(listing._id, reason);
      onDone();
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
        <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-semibold text-brand-muted bg-gray-50 hover:bg-gray-100 transition">Cancel</button>
        <button onClick={submit} disabled={busy}
          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#ea6d00" }}>
          {busy ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </Modal>
  );
}

// ── Listing card ──────────────────────────────────────────────────────────────

function ListingCard({ listing, onEdit, onDelete, onFeature, isManaged }) {
  const navigate = useNavigate();
  const car   = `${listing.year ?? ""} ${listing.brand?.name ?? ""} ${listing.carModel?.name ?? ""}`.trim();
  const image = listing.images?.[0];
  const badge = STATUS_BADGE[listing.status] ?? { bg: "#f1f5f9", text: "#64748b" };
  const isFeatured = !!listing.featured;

  return (
    <div className="bg-white rounded-xl overflow-hidden flex gap-0 sm:flex-row flex-col" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      {/* Image */}
      <div className="w-full sm:w-32 h-28 sm:h-auto bg-gray-100 shrink-0 relative">
        {image
          ? <img src={image} alt={car} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted">No image</div>
        }
        {isFeatured && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-semibold rounded text-white" style={{ background: "#ea6d00" }}>
            FEATURED
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-dark truncate">{car || "Unnamed listing"}</p>
            <p className="text-xs text-brand-muted mt-0.5">{listing.city?.name ?? "—"} · {formatDate(listing.createdAt)}</p>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
            style={{ background: badge.bg, color: badge.text }}>
            {listing.status?.replace("_", " ") ?? "—"}
          </span>
        </div>
        <p className="text-base font-bold text-brand-dark mt-1.5">{formatPKR(listing.price)}</p>

        {/* Actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button onClick={() => navigate(`/browse-cars/${listing._id}`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-muted hover:bg-gray-50 transition"
            style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
            <ExternalLink size={12} /> View
          </button>
          {listing.status !== "SOLD" && listing.status !== "REMOVED" && !isManaged && (
            <button onClick={() => onEdit(listing)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#3b82f6" }}>
              <Edit2 size={12} /> Edit
            </button>
          )}
          {listing.status === "ACTIVE" && !isFeatured && !isManaged && (
            <button onClick={() => onFeature(listing)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#ea6d00" }}>
              <Star size={12} /> Feature
            </button>
          )}
          {!isManaged && (
            <button onClick={() => onDelete(listing)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition"
              style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#dc2626" }}>
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Managed sub-section ───────────────────────────────────────────────────────

function ManagedSection({ listings }) {
  const managedListings = listings.filter(l => ["SOLD", "PENDING_COMMISSION"].includes(l.status));
  const [subTab, setSubTab] = useState("deletion");
  const [deletionReqs, setDeletionReqs] = useState([]);
  const [commissions,  setCommissions]  = useState([]);
  const [loading, setLoading]           = useState(true);
  const [requestTarget, setRequestTarget] = useState(null);
  const [commPaying, setCommPaying]       = useState(false);

  useEffect(() => {
    Promise.all([
      getDeletionRequests().catch(() => []),
      ...managedListings.filter(l => l.status === "PENDING_COMMISSION").map(l =>
        getCommissionDetails(l._id).catch(() => null)
      ),
    ]).then(([reqs, ...comms]) => {
      setDeletionReqs(Array.isArray(reqs) ? reqs : []);
      setCommissions(comms.filter(Boolean));
    }).finally(() => setLoading(false));
  }, []);

  async function payCommission(comm) {
    setCommPaying(true);
    try {
      const { url } = await initiateCommissionPayment(comm._id);
      window.location.href = url;
    } catch {
      alert("Failed to initiate payment.");
    } finally { setCommPaying(false); }
  }

  const DR_BADGE = {
    PENDING:  { bg: "#fef9c3", text: "#b45309" },
    APPROVED: { bg: "#dcfce7", text: "#16a34a" },
    REJECTED: { bg: "#fee2e2", text: "#dc2626" },
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4">
        {["deletion", "commission"].map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize"
            style={subTab === t
              ? { background: "#ea6d00", color: "#fff" }
              : { background: "#f8f9fa", color: "#64748b" }}>
            {t === "deletion" ? "Deletion Requests" : "Commission Due"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" /></div>
      ) : subTab === "deletion" ? (
        <div>
          {managedListings.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-brand-muted mb-2">Request deletion for a managed listing:</p>
              <div className="flex flex-wrap gap-2">
                {managedListings.filter(l => !deletionReqs.some(r => r.listing === l._id)).map(l => {
                  const car = `${l.year ?? ""} ${l.brand?.name ?? ""} ${l.carModel?.name ?? ""}`.trim();
                  return (
                    <button key={l._id} onClick={() => setRequestTarget(l)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-muted hover:bg-gray-100 transition"
                      style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                      {car}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {deletionReqs.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-8">No deletion requests yet.</p>
          ) : (
            <div className="space-y-3">
              {deletionReqs.map(req => {
                const car = `${req.listing?.year ?? ""} ${req.listing?.brand?.name ?? ""} ${req.listing?.carModel?.name ?? ""}`.trim();
                const b = DR_BADGE[req.status] ?? DR_BADGE.PENDING;
                return (
                  <div key={req._id} className="bg-white rounded-xl p-4 flex items-center justify-between gap-3"
                    style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">{car || "Unknown listing"}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{req.reason}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{formatDate(req.createdAt)}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
                      style={{ background: b.bg, color: b.text }}>
                      {req.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          {commissions.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-8">No commission payments due.</p>
          ) : (
            <div className="space-y-3">
              {commissions.map(comm => {
                const car = `${comm.listing?.year ?? ""} ${comm.listing?.brand?.name ?? ""} ${comm.listing?.carModel?.name ?? ""}`.trim();
                return (
                  <div key={comm._id} className="bg-white rounded-xl p-4 flex items-center justify-between gap-3"
                    style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">{car}</p>
                      <p className="text-xs text-brand-muted mt-0.5">Commission: <strong>{formatPKR(comm.amount)}</strong></p>
                      <p className="text-xs text-brand-muted">Due: {formatDate(comm.dueDate)}</p>
                    </div>
                    {comm.status !== "PAID" ? (
                      <button onClick={() => payCommission(comm)} disabled={commPaying}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition shrink-0"
                        style={{ background: "#8b5cf6" }}>
                        {commPaying ? "…" : "Pay Now"}
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
                        style={{ background: "#dcfce7", color: "#16a34a" }}>PAID</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {requestTarget && (
        <DeletionRequestModal
          listing={requestTarget}
          onClose={() => setRequestTarget(null)}
          onDone={() => { setRequestTarget(null); window.location.reload(); }}
        />
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("All");
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [featureTarget, setFeatureTarget] = useState(null);

  function load() {
    setLoading(true);
    getMyListings()
      .then(l => setListings(Array.isArray(l) ? l : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = tab === "All"     ? listings.filter(l => !["SOLD", "PENDING_COMMISSION"].includes(l.status) || tab !== "Managed")
    : tab === "Managed" ? listings.filter(l => ["SOLD", "PENDING_COMMISSION"].includes(l.status))
    : tab === "Active"  ? listings.filter(l => l.status === "ACTIVE")
    : tab === "Pending" ? listings.filter(l => l.status === "PENDING")
    : tab === "Rejected"? listings.filter(l => l.status === "REJECTED")
    : tab === "Sold"    ? listings.filter(l => l.status === "SOLD")
    : listings;

  const displayListings = tab === "All" ? listings : filtered;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-brand-dark mb-5">My Listings</h1>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {TABS.map(t => {
          const count = t === "All"      ? listings.length
            : t === "Active"   ? listings.filter(l => l.status === "ACTIVE").length
            : t === "Pending"  ? listings.filter(l => l.status === "PENDING").length
            : t === "Rejected" ? listings.filter(l => l.status === "REJECTED").length
            : t === "Sold"     ? listings.filter(l => l.status === "SOLD").length
            : listings.filter(l => ["SOLD", "PENDING_COMMISSION"].includes(l.status)).length;
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
      ) : tab === "Managed" ? (
        <ManagedSection listings={listings} />
      ) : displayListings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-brand-muted text-sm">No listings in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayListings.map(l => (
            <ListingCard
              key={l._id}
              listing={l}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onFeature={setFeatureTarget}
              isManaged={["SOLD", "PENDING_COMMISSION"].includes(l.status)}
            />
          ))}
        </div>
      )}

      {editTarget && (
        <EditModal listing={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { setEditTarget(null); load(); }} />
      )}
      {deleteTarget && (
        <DeleteModal listing={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => { setDeleteTarget(null); load(); }} />
      )}
      {featureTarget && (
        <FeaturedModal listing={featureTarget} onClose={() => setFeatureTarget(null)} />
      )}
    </div>
  );
}
