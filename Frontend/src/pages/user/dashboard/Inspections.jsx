import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getMyInspections } from "../../../services/inspectionService";
import { ExternalLink } from "lucide-react";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_BADGE = {
  PENDING_COORDINATION: { bg: "#fef9c3", text: "#b45309",  label: "Pending" },
  SCHEDULED:            { bg: "#dbeafe", text: "#1d4ed8",  label: "Scheduled" },
  IN_PROGRESS:          { bg: "#fff7ed", text: "#c2410c",  label: "In Progress" },
  COMPLETED:            { bg: "#dcfce7", text: "#16a34a",  label: "Completed" },
  CANCELLED:            { bg: "#f1f5f9", text: "#64748b",  label: "Cancelled" },
};

function InspectionCard({ insp }) {
  const navigate = useNavigate();
  const car = `${insp.listing?.year ?? ""} ${insp.listing?.brand?.name ?? ""} ${insp.listing?.carModel?.name ?? ""}`.trim();
  const badge = STATUS_BADGE[insp.status] ?? { bg: "#f1f5f9", text: "#64748b", label: insp.status };
  const image = insp.listing?.images?.[0];

  return (
    <div className="bg-white rounded-xl overflow-hidden flex sm:flex-row flex-col" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="w-full sm:w-28 h-24 sm:h-auto bg-gray-100 shrink-0">
        {image
          ? <img src={image} alt={car} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted">No image</div>
        }
      </div>
      <div className="flex-1 px-4 py-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-brand-dark">{car || "Unknown car"}</p>
            <p className="text-xs text-brand-muted mt-0.5">{insp.city ?? "—"} · {formatDate(insp.preferredDate)}</p>
            {insp.preferredTimeSlot && (
              <p className="text-xs text-brand-muted">{insp.preferredTimeSlot}</p>
            )}
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
            style={{ background: badge.bg, color: badge.text }}>
            {badge.label}
          </span>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button onClick={() => navigate(`/browse-cars/${insp.listing?._id}`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-muted hover:bg-gray-50 transition"
            style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
            <ExternalLink size={12} /> View Listing
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Inspections() {
  const { user } = useAuth();
  const [all,     setAll]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("requested");

  useEffect(() => {
    getMyInspections()
      .then(d => setAll(Array.isArray(d) ? d : []))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const requestedByMe = all.filter(i => i.requestedBy?._id === user?._id || i.requestedBy === user?._id);
  const forMyListings = all.filter(i => i.listing?.seller?._id === user?._id || i.listing?.seller === user?._id);

  const displayed = tab === "requested" ? requestedByMe : forMyListings;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-brand-dark mb-5">Inspections</h1>

      <div className="flex gap-1.5 mb-5">
        {[
          { key: "requested", label: "Requested by me",  count: requestedByMe.length  },
          { key: "seller",    label: "For my listings",  count: forMyListings.length  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            style={tab === t.key
              ? { background: "#ea6d00", color: "#fff" }
              : { background: "#f8f9fa", color: "#64748b" }}>
            {t.label} {t.count > 0 && <span className="ml-0.5 opacity-75">({t.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-brand-muted text-sm">
            {tab === "requested" ? "You haven't requested any inspections yet." : "No inspections for your listings yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(insp => <InspectionCard key={insp._id} insp={insp} />)}
        </div>
      )}
    </div>
  );
}
