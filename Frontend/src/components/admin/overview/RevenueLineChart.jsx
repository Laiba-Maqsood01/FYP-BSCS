import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white text-xs px-3 py-2 rounded-lg"
      style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
    >
      <p className="text-brand-muted mb-1">{label}</p>
      <p className="font-semibold text-brand-dark">PKR {payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function RevenueLineChart({ data }) {
  const isEmpty = !data || data.length === 0;

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-sm font-semibold text-brand-dark mb-0.5">Revenue this week</p>
      <p className="text-xs text-brand-muted mb-4">Daily totals — inspections + featured + commissions</p>
      {isEmpty ? (
        <div className="flex items-center justify-center rounded-lg" style={{ height: 180, background: "rgba(0,0,0,0.02)", border: "1px dashed rgba(0,0,0,0.1)" }}>
          <p className="text-xs text-brand-muted">No revenue this week</p>
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#ea6d00"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#ea6d00", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#ea6d00", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
