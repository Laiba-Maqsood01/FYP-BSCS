const STAGES = [
  { key: "PENDING",              label: "Pending",             color: "#0f172a" },
  { key: "PENDING_COORDINATION", label: "Pending coordination",color: "#185FA5" },
  { key: "SCHEDULED",            label: "Scheduled",           color: "#1D9E75" },
  { key: "IN_PROGRESS",          label: "In progress",         color: "#854F0B" },
  { key: "COMPLETED",            label: "Completed",           color: "#3B6D11" },
  { key: "CANCELLED",            label: "Cancelled",           color: "#A32D2D" },
];

export default function InspectionFunnel({ data }) {
  const max = Math.max(...STAGES.map(s => data[s.key] ?? 0), 1);

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-sm font-semibold text-brand-dark mb-0.5">Inspection pipeline</p>
      <p className="text-xs text-brand-muted mb-4">Count at each stage right now</p>

      <div className="flex flex-col gap-2.5">
        {STAGES.map(({ key, label, color }) => {
          const count = data[key] ?? 0;
          const pct   = Math.round((count / max) * 100);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-brand-muted w-36 shrink-0 text-right">{label}</span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.05)", height: 20 }}>
                <div
                  className="h-full rounded-full flex items-center px-2.5 transition-all duration-500"
                  style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%`, background: color }}
                >
                  {count > 0 && (
                    <span className="text-[11px] font-semibold text-white">{count}</span>
                  )}
                </div>
              </div>
              {count === 0 && <span className="text-xs text-brand-muted w-4">0</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
