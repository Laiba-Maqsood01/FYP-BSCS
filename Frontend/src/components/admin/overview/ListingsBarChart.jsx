import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white text-xs px-3 py-2 rounded-lg"
      style={{ border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
    >
      <p className="text-brand-muted mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="font-semibold" style={{ color: p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function ListingsBarChart({ data }) {
  const isEmpty = !data || data.length === 0;

  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-sm font-semibold text-brand-dark mb-0.5">New listings this week</p>
      <p className="text-xs text-brand-muted mb-4">General vs managed split</p>
      {isEmpty ? (
        <div className="flex items-center justify-center rounded-lg" style={{ height: 180, background: "rgba(0,0,0,0.02)", border: "1px dashed rgba(0,0,0,0.1)" }}>
          <p className="text-xs text-brand-muted">No listings this week</p>
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={10}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#64748b" }}
          />
          <Bar dataKey="General"  fill="#ea6d00" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Managed"  fill="#0f172a" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
