import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = {
  ACTIVE:   "#ea6d00",
  PENDING:  "#f59e0b",
  SOLD:     "#3b82f6",
  REMOVED:  "#94a3b8",
  REJECTED: "#ef4444",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white text-xs px-3 py-2 rounded-lg"
      style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
    >
      <p className="font-semibold text-brand-dark">{payload[0].name}</p>
      <p className="text-brand-muted">{payload[0].value} listings</p>
    </div>
  );
};

export default function ListingStatusDonut({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-sm font-semibold text-brand-dark mb-0.5">Listing status</p>
      <p className="text-xs text-brand-muted mb-4">Current distribution</p>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={54}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map(entry => (
                  <Cell key={entry.name} fill={COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-semibold text-brand-dark">{total}</span>
            <span className="text-[10px] text-brand-muted">total</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {data.map(entry => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: COLORS[entry.name] ?? "#94a3b8" }}
              />
              <span className="text-brand-muted flex-1">{entry.name}</span>
              <span className="font-medium text-brand-dark">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
