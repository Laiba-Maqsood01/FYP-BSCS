// Shared badge components used across all admin pages.

export const STATUS_COLORS = {
  ACTIVE:             "bg-green-50 text-green-700 border-green-200",
  PENDING:            "bg-yellow-50 text-yellow-700 border-yellow-200",
  EXPIRED:            "bg-gray-50 text-gray-500 border-gray-200",
  REJECTED:           "bg-red-50 text-red-700 border-red-200",
  REMOVED:            "bg-slate-50 text-slate-500 border-slate-200",
  PAID:               "bg-green-50 text-green-700 border-green-200",
  CANCELLED:          "bg-gray-50 text-gray-500 border-gray-200",
  SOLD:               "bg-blue-50 text-blue-700 border-blue-200",
};

export const PLAN_COLORS = {
  BASIC:   "bg-sky-50 text-sky-700 border-sky-200",
  PREMIUM: "bg-purple-50 text-purple-700 border-purple-200",
  TOP:     "bg-orange-50 text-orange-700 border-orange-200",
};

export function StatusBadge({ status, removedBy }) {
  const cls = STATUS_COLORS[status] ?? "bg-gray-50 text-gray-500 border-gray-200";
  const label = status === "REMOVED" && removedBy
    ? `REMOVED BY ${removedBy}`
    : status?.replace("_", " ");
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  );
}

export function PlanBadge({ plan }) {
  const cls = PLAN_COLORS[plan] ?? "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${cls}`}>
      {plan}
    </span>
  );
}

export function SaleModeBadge({ mode }) {
  const managed = mode === "MANAGED";
  return (
    <span
      className="text-[11px] font-medium px-2 py-0.5 rounded border"
      style={{
        background: managed ? "rgba(234,109,0,0.1)" : "#f1f5f9",
        color:      managed ? "#ea6d00"              : "#475569",
        border:     managed ? "1px solid rgba(234,109,0,0.2)" : "1px solid #e2e8f0",
      }}
    >
      {mode}
    </span>
  );
}

export function ActiveBadge({ isActive }) {
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border
      ${isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
