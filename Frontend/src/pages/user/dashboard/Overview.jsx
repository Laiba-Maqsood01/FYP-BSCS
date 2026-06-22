import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { Car, ShieldCheck, Heart, CreditCard } from "lucide-react";
import { getMyListings } from "../../../services/listingService";
import { getMyInspections } from "../../../services/inspectionService";
import { getMyFavorites } from "../../../services/favoriteService";
import { getMyPayments } from "../../../services/paymentService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPKR(n) {
  if (!n) return "PKR 0";
  if (n >= 100000) return `PKR ${(n / 100000).toFixed(1)}L`;
  return `PKR ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-brand-muted uppercase tracking-wide">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "15" }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-brand-dark">{value}</p>
      {sub && <p className="text-xs text-brand-muted mt-1">{sub}</p>}
    </div>
  );
}

const STATUS_COLORS = {
  ACTIVE:             "#16a34a",
  PENDING:            "#d97706",
  REJECTED:           "#dc2626",
  REMOVED:            "#6b7280",
  SOLD:               "#3b82f6",
  PENDING_COMMISSION: "#8b5cf6",
};

const PURPOSE_COLORS = {
  INSPECTION:     "#ea6d00",
  RE_INSPECTION:  "#f59e0b",
  FEATURED:       "#3b82f6",
  COMMISSION:     "#8b5cf6",
};

const INSP_STATUS_COLORS = {
  PENDING_COORDINATION: "#d97706",
  SCHEDULED:            "#3b82f6",
  IN_PROGRESS:          "#ea6d00",
  COMPLETED:            "#16a34a",
  CANCELLED:            "#6b7280",
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg px-3 py-2 shadow-lg text-xs" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
      <p className="font-semibold text-brand-dark mb-0.5">{label}</p>
      <p className="text-brand-muted">{payload[0].value} listing{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg px-3 py-2 shadow-lg text-xs" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
      <p className="font-semibold text-brand-dark mb-0.5">{payload[0].name}</p>
      <p className="text-brand-muted">{formatPKR(payload[0].value)}</p>
    </div>
  );
};

// ── Activity helpers ──────────────────────────────────────────────────────────

function buildActivity(listings, inspections) {
  const events = [];

  inspections.slice(0, 5).forEach(i => {
    const car = `${i.listing?.year ?? ""} ${i.listing?.brand?.name ?? ""} ${i.listing?.carModel?.name ?? ""}`.trim();
    const labels = {
      COMPLETED:            { text: `Inspection completed for ${car}`,   dot: "#16a34a" },
      SCHEDULED:            { text: `Inspection scheduled for ${car}`,   dot: "#3b82f6" },
      IN_PROGRESS:          { text: `Inspection in progress for ${car}`, dot: "#ea6d00" },
      PENDING_COORDINATION: { text: `Inspection requested for ${car}`,   dot: "#d97706" },
    };
    const ev = labels[i.status];
    if (ev) events.push({ text: ev.text, dot: ev.dot, date: i.createdAt });
  });

  listings.slice(0, 4).forEach(l => {
    const car = `${l.year ?? ""} ${l.brand?.name ?? ""} ${l.carModel?.name ?? ""}`.trim();
    const labels = {
      ACTIVE:   { text: `Listing approved — ${car} is now active`, dot: "#16a34a" },
      PENDING:  { text: `Listing submitted — ${car} is under review`, dot: "#d97706" },
      REJECTED: { text: `Listing rejected — ${car}`, dot: "#dc2626" },
    };
    const ev = labels[l.status];
    if (ev) events.push({ text: ev.text, dot: ev.dot, date: l.createdAt });
  });

  return events
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function Overview() {
  const navigate = useNavigate();
  const [listings,    setListings]    = useState([]);
  const [inspections, setInspections] = useState([]);
  const [favorites,   setFavorites]   = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getMyListings().catch(() => []),
      getMyInspections().catch(() => []),
      getMyFavorites().catch(() => []),
      getMyPayments().catch(() => []),
    ]).then(([l, i, f, p]) => {
      setListings(Array.isArray(l) ? l : []);
      setInspections(Array.isArray(i) ? i : []);
      setFavorites(Array.isArray(f) ? f : []);
      setPayments(Array.isArray(p) ? p : []);
    }).finally(() => setLoading(false));
  }, []);

  const activeListings = listings.filter(l => l.status === "ACTIVE").length;
  const totalSpent     = payments.reduce((s, p) => s + (p.amount ?? 0), 0);

  // Bar chart — listing status breakdown
  const statusOrder = ["ACTIVE", "PENDING", "REJECTED", "REMOVED", "SOLD", "PENDING_COMMISSION"];
  const barData = statusOrder
    .map(s => ({ name: s.charAt(0) + s.slice(1).toLowerCase().replace("_", " "), value: listings.filter(l => l.status === s).length, color: STATUS_COLORS[s] }))
    .filter(d => d.value > 0);

  // Pie chart — payment breakdown by purpose
  const purposeMap = {};
  payments.forEach(p => {
    const key = p.purpose ?? "OTHER";
    purposeMap[key] = (purposeMap[key] ?? 0) + (p.amount ?? 0);
  });
  const pieData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));

  const activity = buildActivity(listings, inspections);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-7 h-7 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-brand-dark mb-6">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Listings" value={listings.length} sub={`${activeListings} active`}        icon={Car}        color="#ea6d00" />
        <StatCard label="Inspections"    value={inspections.length} sub={`${inspections.filter(i => i.status === "COMPLETED").length} completed`} icon={ShieldCheck} color="#3b82f6" />
        <StatCard label="Favorites"      value={favorites.length}  sub="saved cars"                      icon={Heart}      color="#ec4899" />
        <StatCard label="Total Spent"    value={formatPKR(totalSpent)} sub={`${payments.length} transactions`} icon={CreditCard} color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* Bar chart */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-sm font-semibold text-brand-dark mb-4">Listings by status</p>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-brand-muted">No listings yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-sm font-semibold text-brand-dark mb-4">Payment breakdown</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-brand-muted">No payments yet</div>
          ) : (
            <div className="flex items-center gap-5">
              <PieChart width={130} height={130}>
                <Pie data={pieData} cx={60} cy={60} innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={PURPOSE_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
              <div className="flex flex-col gap-2">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-brand-muted">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PURPOSE_COLORS[entry.name] ?? "#94a3b8" }} />
                    <span className="capitalize">{entry.name.replace("_", " ").toLowerCase()}</span>
                    <span className="font-medium text-brand-dark ml-1">{formatPKR(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-sm font-semibold text-brand-dark mb-4">Recent activity</p>
        {activity.length === 0 ? (
          <p className="text-sm text-brand-muted text-center py-6">No activity yet. Start by posting a listing.</p>
        ) : (
          <div className="space-y-0">
            {activity.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom: i < activity.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: ev.dot }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-dark2">{ev.text}</p>
                </div>
                <span className="text-xs text-brand-muted shrink-0">{formatDate(ev.date)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex gap-3 mt-5 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <button
            onClick={() => navigate("/post-ad")}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition"
            style={{ background: "#ea6d00", borderRadius: "0.5rem" }}
          >
            Post New Ad
          </button>
          <button
            onClick={() => navigate("/dashboard/listings")}
            className="px-4 py-2 text-sm font-semibold text-brand-dark2 bg-white rounded-lg hover:bg-gray-50 transition"
            style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "0.5rem" }}
          >
            Manage Listings
          </button>
        </div>
      </div>
    </div>
  );
}
