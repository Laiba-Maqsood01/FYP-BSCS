import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ label, value, delta, deltaLabel, accent = false }) {
  const positive = delta >= 0;

  return (
    <div className="bg-white rounded-xl p-4 flex flex-col gap-2" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-xs text-brand-muted">{label}</p>
      <p
        className="text-2xl font-semibold"
        style={{ color: accent ? "#ea6d00" : "#0f172a" }}
      >
        {value}
      </p>
      {delta !== undefined && (
        <div className="flex items-center gap-1 text-[11px]">
          {positive
            ? <TrendingUp size={12} style={{ color: "#1D9E75" }} />
            : <TrendingDown size={12} style={{ color: "#A32D2D" }} />
          }
          <span style={{ color: positive ? "#1D9E75" : "#A32D2D" }}>
            {positive ? "+" : ""}{delta}
          </span>
          {deltaLabel && <span className="text-brand-muted">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
