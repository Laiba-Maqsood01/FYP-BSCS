import { useEffect, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getMyInspections } from "../../../services/inspectionService";
import { ExternalLink, Info } from "lucide-react";
import Modal from "../../../components/ui/Modal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_BADGE = {
  SCHEDULED:            { bg: "#dbeafe", text: "#1d4ed8", label: "Scheduled" },
  IN_PROGRESS:          { bg: "#fff7ed", text: "#c2410c", label: "In Progress" },
  COMPLETED:            { bg: "#dcfce7", text: "#16a34a", label: "Completed" },
  CANCELLED:            { bg: "#f1f5f9", text: "#64748b", label: "Cancelled" },
};

// ── InspectionCard — memo so tab switch only re-renders newly visible cards ───

const InspectionCard = memo(function InspectionCard({ insp, onCancelReason }) {
  const navigate = useNavigate();
  const car   = `${insp.listing?.year ?? ""} ${insp.listing?.brand?.name ?? ""} ${insp.listing?.carModel?.name ?? ""}`.trim();
  const badge = STATUS_BADGE[insp.status] ?? { bg: "#f1f5f9", text: "#64748b", label: insp.status };
  const image = insp.listing?.images?.[0]?.url;
  const isManaged   = insp.listing?.saleMode === "MANAGED";
  const isCompleted = insp.status === "COMPLETED";
  const canView     = !isManaged || isCompleted;

  return (
    <div className="bg-white rounded-xl overflow-hidden flex sm:flex-row flex-col" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="w-full sm:w-28 h-24 sm:h-auto bg-gray-100 shrink-0">
        {image
          ? <img src={image} alt={car} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted">No image</div>}
      </div>
      <div className="flex-1 px-4 py-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-brand-dark">{car || "Unknown car"}</p>
            <p className="text-xs text-brand-muted mt-0.5">
              {insp.scheduledDate
                ? `${formatDate(insp.scheduledDate)}${insp.timeSlot ? ` · ${insp.timeSlot}` : ""}`
                : "Schedule to be coordinated"}
            </p>
            {insp.inspectionAddress && (
              <p className="text-xs text-brand-muted">{insp.inspectionAddress}</p>
            )}
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
            style={{ background: badge.bg, color: badge.text }}>
            {badge.label}
          </span>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {canView && (
            <button
              onClick={() => navigate(`/browse-cars/${insp.listing?._id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-muted hover:bg-gray-50 transition cursor-pointer"
              style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              <ExternalLink size={12} /> View Listing
            </button>
          )}
          {insp.status === "CANCELLED" && insp.cancelReason && (
            <button
              onClick={() => onCancelReason(insp)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition cursor-pointer"
              style={{ border: "1px solid rgba(220,38,38,0.35)", color: "#dc2626", background: "#fef2f2" }}>
              <Info size={12} /> Cancellation Reason
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Skeleton ──────────────────────────────────────────────────────────────────

function InspectionSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden flex flex-col sm:flex-row animate-pulse" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="w-full sm:w-28 h-24 bg-gray-200 shrink-0" />
      <div className="flex-1 px-4 py-3 flex flex-col gap-2">
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-3 w-36 bg-gray-100 rounded" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="flex gap-2 mt-1">
          <div className="h-6 w-20 bg-gray-100 rounded-full" />
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Inspections() {
  const { user } = useAuth();
  const [all,     setAll]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("requested");
  const [cancelReasonTarget, setCancelReasonTarget] = useState(null);

  useEffect(() => {
    getMyInspections()
      .then(d => setAll(Array.isArray(d) ? d : []))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const myId = user?._id;

  const requestedByMe = all.filter(i => {
    const reqId = i.requestedBy?._id ?? i.requestedBy;
    return reqId?.toString() === myId?.toString();
  });

  const forMyListings = all.filter(i => {
    const sellerId = i.listing?.seller?.toString?.() ?? i.listing?.seller;
    const reqId    = i.requestedBy?._id?.toString?.() ?? i.requestedBy?.toString?.();
    return sellerId?.toString() === myId?.toString() && reqId !== myId?.toString();
  });

  const displayed = tab === "requested" ? requestedByMe : forMyListings;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-brand-dark mb-5">Inspections</h1>

      <div className="flex gap-1.5 mb-5">
        {[
          { key: "requested", label: "Requested by me", count: requestedByMe.length },
          { key: "seller",    label: "For my listings", count: forMyListings.length },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
            style={tab === t.key
              ? { background: "#ea6d00", color: "#fff" }
              : { background: "#f8f9fa", color: "#64748b" }}>
            {t.label} {t.count > 0 && <span className="ml-0.5 opacity-75">({t.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <InspectionSkeleton key={i} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-brand-muted text-sm">
            {tab === "requested" ? "You haven't requested any inspections yet." : "No inspections for your listings yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(insp => <InspectionCard key={insp._id} insp={insp} onCancelReason={setCancelReasonTarget} />)}
        </div>
      )}

      {cancelReasonTarget && (
        <Modal title="Why was this inspection cancelled?" onClose={() => setCancelReasonTarget(null)}>
          <div className="rounded-lg px-4 py-3 mb-4" style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,0.2)" }}>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{cancelReasonTarget.cancelReason}</p>
          </div>
          <p className="text-xs text-brand-muted">
            If you have any questions about this cancellation, please contact our support team.
          </p>
        </Modal>
      )}
    </div>
  );
}
