import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const ITEMS = [
  { label: "Listings pending approval", key: "pendingListings",   to: "/admin/listings",    urgent: true  },
  { label: "Inspections unassigned",    key: "unassignedInspections", to: "/admin/inspections", urgent: true  },
  { label: "Refunds pending",           key: "pendingRefunds",    to: "/admin/refunds",     urgent: true  },
  { label: "Deletion requests",         key: "pendingDeletions",  to: "/admin/deletions",   urgent: false },
];

export default function ActionItems({ data }) {
  const navigate = useNavigate();
  const hasAny   = ITEMS.some(item => (data[item.key] ?? 0) > 0);

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-2 mb-0.5">
        <p className="text-sm font-semibold text-brand-dark">Items needing action</p>
        {hasAny && <AlertCircle size={14} style={{ color: "#ea6d00" }} />}
      </div>
      <p className="text-xs text-brand-muted mb-4">Click any row to go to that section</p>

      <div className="flex flex-col divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
        {ITEMS.map(item => {
          const count = data[item.key] ?? 0;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.to)}
              className="flex items-center justify-between py-2.5 text-left hover:bg-gray-50 transition-colors rounded px-1 -mx-1"
            >
              <span className="text-xs text-brand-dark">{item.label}</span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full ml-3"
                style={{
                  background: count > 0
                    ? item.urgent ? "rgba(234,109,0,0.1)" : "rgba(100,116,139,0.1)"
                    : "rgba(0,0,0,0.04)",
                  color: count > 0
                    ? item.urgent ? "#ea6d00" : "#64748b"
                    : "#94a3b8",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
