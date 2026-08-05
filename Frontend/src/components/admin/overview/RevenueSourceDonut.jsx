import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#ea6d00", "#0f172a", "#3b82f6"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white text-xs px-3 py-2 rounded-lg"
      style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
    >
      <p className="font-semibold text-brand-dark">{payload[0].name}</p>
      <p className="text-brand-muted">PKR {payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function RevenueSourceDonut({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-sm font-semibold text-brand-dark mb-0.5">Revenue by source</p>
      <p className="text-xs text-brand-muted mb-4">Inspections vs featured vs Agreement-Break</p>

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
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-semibold text-brand-dark">
              {(total / 1000).toFixed(0)}K
            </span>
            <span className="text-[10px] text-brand-muted">PKR</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {data.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="text-brand-muted flex-1">{entry.name}</span>
              <span className="font-medium text-brand-dark">
                {(entry.value / 1000).toFixed(0)}K
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
