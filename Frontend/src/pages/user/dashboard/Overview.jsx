import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, ShieldCheck, Heart, CreditCard, Plus, List, LayoutDashboard, Banknote } from "lucide-react";
import { getMyListings } from "../../../services/listingService";
import { getMyInspections } from "../../../services/inspectionService";
import { getMyFavorites } from "../../../services/favoriteService";
import { getMyPayments } from "../../../services/paymentService";
import { getCommissionDetails } from "../../../services/managedSaleService";
import { useAuth } from "../../../context/AuthContext";

function formatPKR(n) {
  if (!n) return "PKR 0";
  if (n >= 100000) return `PKR ${(n / 100000).toFixed(1)}L`;
  return `PKR ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_COLORS = {
  ACTIVE:             "#16a34a",
  PENDING:            "#d97706",
  REJECTED:           "#dc2626",
  REMOVED:            "#6b7280",
  SOLD:               "#3b82f6",
};

const PURPOSE_COLORS = {
  INSPECTION:    "#ea6d00",
  RE_INSPECTION: "#f59e0b",
  FEATURED:      "#3b82f6",
};

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 relative overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: color }} />
      <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
        <Icon size={15} style={{ color }} />
      </div>
      <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-3 pl-1">{label}</p>
      <p className="text-2xl font-bold text-brand-dark pl-1">{value}</p>
      {sub && <p className="text-xs text-brand-muted mt-1 pl-1">{sub}</p>}
    </div>
  );
}

function HorizontalBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-brand-muted w-20 shrink-0">{label}</p>
      <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs font-semibold text-brand-dark w-4 text-right shrink-0">{value}</p>
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <p className="text-sm text-brand-muted text-center py-4">No payments yet</p>
  );

  const r = 36;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  let offset = -circumference * 0.25;

  return (
    <div className="flex items-center gap-5">
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const gap  = circumference - dash;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={PURPOSE_COLORS[d.name] ?? "#94a3b8"}
              strokeWidth="14"
              strokeDasharray={`${dash - 2} ${gap + 2}`}
              strokeDashoffset={-offset}
              style={{ transition: "stroke-dasharray 0.4s" }}
            />
          );
          offset += dash;
          return el;
        })}
        <text x="50" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0f172a">PKR</text>
        <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#64748b">
          {total >= 100000 ? `${(total / 100000).toFixed(1)}L` : total.toLocaleString()}
        </text>
      </svg>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PURPOSE_COLORS[d.name] ?? "#94a3b8" }} />
            <span className="text-xs text-brand-muted capitalize flex-1 truncate">{d.name.replace(/_/g, " ").toLowerCase()}</span>
            <span className="text-xs font-semibold text-brand-dark shrink-0">{formatPKR(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildActivity(listings, inspections) {
  const events = [];
  inspections.slice(0, 5).forEach(i => {
    const car = `${i.listing?.year ?? ""} ${i.listing?.brand?.name ?? ""} ${i.listing?.carModel?.name ?? ""}`.trim();
    const map = {
      COMPLETED:            { text: `Inspection completed for ${car || "your listing"}`,   dot: "#16a34a" },
      SCHEDULED:            { text: `Inspection scheduled for ${car || "your listing"}`,   dot: "#3b82f6" },
      IN_PROGRESS:          { text: `Inspection in progress for ${car || "your listing"}`, dot: "#ea6d00" },
    };
    const ev = map[i.status];
    if (ev) events.push({ ...ev, date: i.createdAt });
  });
  listings.slice(0, 5).forEach(l => {
    const car = `${l.year ?? ""} ${l.brand?.name ?? ""} ${l.carModel?.name ?? ""}`.trim();
    const map = {
      ACTIVE:   { text: `Listing approved — ${car} is now active`, dot: "#16a34a" },
      PENDING:  { text: `Listing submitted — ${car} is under review`, dot: "#d97706" },
      REJECTED: { text: `Listing rejected — ${car}`, dot: "#dc2626" },
      SOLD:     { text: `${car} sold${l.saleMode === "MANAGED" ? " by GearTrade" : ""}`, dot: "#3b82f6" },
    };
    const ev = map[l.status];
    if (ev) events.push({ ...ev, date: l.createdAt });
  });
  return events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
}

export default function Overview() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listings,    setListings]    = useState([]);
  const [inspections, setInspections] = useState([]);
  const [favorites,   setFavorites]   = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getMyListings().catch(() => []),
      getMyInspections().catch(() => []),
      getMyFavorites().catch(() => []),
      getMyPayments().catch(() => []),
    ]).then(async ([l, i, f, p]) => {
      const lists = Array.isArray(l) ? l : [];
      setListings(lists);
      setInspections(Array.isArray(i) ? i : []);
      setFavorites(Array.isArray(f) ? f : []);
      setPayments(Array.isArray(p) ? p : []);

      // Sale proceeds — commissions of SOLD managed listings. GearTrade
      // deducts its commission from the sale amount and delivers the rest.
      const soldManaged = lists.filter(x => x.saleMode === "MANAGED" && x.status === "SOLD");
      const comms = await Promise.all(
        soldManaged.map(x => getCommissionDetails(x._id).catch(() => null))
      );
      setCommissions(comms.filter(Boolean));
    }).finally(() => setLoading(false));
  }, []);

  const activeListings = listings.filter(l => l.status === "ACTIVE").length;
  const successPayments = payments.filter(p => p.status === "SUCCESS");
  const totalSpent = successPayments.reduce((s, p) => s + (p.amount ?? 0), 0);

  // Money received from managed sales (sale price minus GearTrade's commission)
  const saleProceeds    = commissions.reduce((s, c) => s + ((c.salePrice ?? 0) - (c.commissionAmount ?? 0)), 0);
  const commissionTotal = commissions.reduce((s, c) => s + (c.commissionAmount ?? 0), 0);

  const statusOrder = ["ACTIVE", "PENDING", "SOLD", "REJECTED", "REMOVED"];
  const barData = statusOrder.map(s => ({
    label: s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " "),
    value: listings.filter(l => l.status === s).length,
    color: STATUS_COLORS[s],
  })).filter(d => d.value > 0);
  const barMax = Math.max(...barData.map(d => d.value), 1);

  const purposeMap = {};
  successPayments.forEach(p => {
    const key = p.purpose ?? "OTHER";
    purposeMap[key] = (purposeMap[key] ?? 0) + (p.amount ?? 0);
  });
  const pieData = Object.entries(purposeMap).map(([name, value]) => ({ name, value }));

  const activity = buildActivity(listings, inspections);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl animate-pulse">
        {/* Header */}
        <div className="mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>

        {/* Quick actions */}
        <div className="flex gap-2.5 flex-wrap mb-6">
          {[80, 120, 120].map((w, i) => (
            <div key={i} className="h-9 rounded-lg bg-gray-200" style={{ width: w }} />
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="w-8 h-8 rounded-lg bg-gray-200" />
              </div>
              <div className="h-7 w-16 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="h-3 w-16 bg-gray-100 rounded shrink-0" />
                    <div className="flex-1 h-4 bg-gray-100 rounded-full" style={{ maxWidth: `${40 + j * 15}%` }} />
                    <div className="h-3 w-6 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
          <div className="flex flex-col">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                <div className="w-2 h-2 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 h-3 bg-gray-100 rounded" style={{ maxWidth: `${55 + (i % 3) * 15}%` }} />
                <div className="h-3 w-16 bg-gray-100 rounded shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-dark">Overview</h1>
        <p className="text-sm text-brand-muted mt-0.5">
          Welcome back{user?.username ? `, ${user.username}` : ""} — here's what's happening with your account
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2.5 flex-wrap mb-6">
        <button
          onClick={() => navigate("/post-ad")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition"
          style={{ background: "#ea6d00" }}>
          <Plus size={14} /> Post new ad
        </button>
        <button
          onClick={() => navigate("/dashboard/listings")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-brand-dark hover:bg-gray-50 transition"
          style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
          <List size={14} /> Manage listings
        </button>
        <button
          onClick={() => navigate("/dashboard/inspections")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-brand-dark hover:bg-gray-50 transition"
          style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
          <ShieldCheck size={14} /> My inspections
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Listings"    value={listings.length}       sub={`${activeListings} active`}                                                           icon={Car}        color="#ea6d00" />
        <StatCard label="Inspections" value={inspections.length}    sub={`${inspections.filter(i => i.status === "COMPLETED").length} completed`}               icon={ShieldCheck} color="#3b82f6" />
        <StatCard label="Favorites"   value={favorites.length}      sub="saved cars"                                                                           icon={Heart}      color="#ec4899" />
        <StatCard label="Total spent" value={formatPKR(totalSpent)} sub={`${successPayments.length} transaction${successPayments.length !== 1 ? "s" : ""}`}    icon={CreditCard} color="#8b5cf6" />
      </div>

      {/* Sale proceeds banner — only when GearTrade has sold cars for this user */}
      {commissions.length > 0 && (
        <div className="flex items-center gap-4 rounded-xl p-4 mb-5 flex-wrap"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#dcfce7" }}>
            <Banknote size={18} style={{ color: "#15803d" }} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold" style={{ color: "#166534" }}>
              You've received {formatPKR(saleProceeds)} from {commissions.length} managed sale{commissions.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#15803d" }}>
              After GearTrade's commission of {formatPKR(commissionTotal)} — delivered by our team.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/listings")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition shrink-0 cursor-pointer"
            style={{ background: "#dcfce7", color: "#166534" }}>
            View details
          </button>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Horizontal bar chart */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-sm font-semibold text-brand-dark mb-4">Listings by status</p>
          {barData.length === 0 ? (
            <p className="text-sm text-brand-muted text-center py-6">No listings yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {barData.map((d, i) => (
                <HorizontalBar key={i} label={d.label} value={d.value} max={barMax} color={d.color} />
              ))}
            </div>
          )}
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-sm font-semibold text-brand-dark mb-4">Spending breakdown</p>
          <DonutChart data={pieData} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <p className="text-sm font-semibold text-brand-dark mb-4">Recent activity</p>
        {activity.length === 0 ? (
          <p className="text-sm text-brand-muted text-center py-6">No activity yet. Start by posting a listing.</p>
        ) : (
          <div>
            {activity.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 py-3"
                style={{ borderBottom: i < activity.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: ev.dot }} />
                <p className="text-sm text-brand-dark2 flex-1">{ev.text}</p>
                <span className="text-xs text-brand-muted shrink-0">{formatDate(ev.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
