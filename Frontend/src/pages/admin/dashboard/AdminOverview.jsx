import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { getAdminDashboard } from "../../../services/adminService";
import { showError } from "../../../utils/toast";

import StatCard           from "../../../components/admin/overview/StatCard";
import RevenueLineChart   from "../../../components/admin/overview/RevenueLineChart";
import ListingStatusDonut from "../../../components/admin/overview/ListingStatusDonut";
import ListingsBarChart   from "../../../components/admin/overview/ListingsBarChart";
import InspectionFunnel   from "../../../components/admin/overview/InspectionFunnel";
import RevenueSourceDonut from "../../../components/admin/overview/RevenueSourceDonut";
import ActionItems        from "../../../components/admin/overview/ActionItems";

// ── Adapters: transform backend response → chart-ready shape ─────────────────

function toListingStatusData(listings = {}) {
  return [
    { name: "ACTIVE",   value: listings.active   ?? 0 },
    { name: "PENDING",  value: listings.pending  ?? 0 },
    { name: "SOLD",     value: listings.sold     ?? 0 },
    { name: "REMOVED",  value: listings.removed  ?? 0 },
    { name: "REJECTED", value: listings.rejected ?? 0 },
  ].filter(d => d.value > 0);
}

function toRevenueSourceData(byPurpose) {
  if (!byPurpose || typeof byPurpose !== "object" || Array.isArray(byPurpose)) return [];
  const label = {
    INSPECTION:    "Inspections",
    RE_INSPECTION: "Re-inspections",
    FEATURED:      "Featured",
    COMMISSION:    "Commissions",
  };
  return Object.entries(byPurpose)
    .map(([key, amount]) => ({ name: label[key] ?? key, value: amount ?? 0 }))
    .filter(d => d.value > 0);
}

function toInspectionCounts(inspections = {}) {
  return {
    PENDING:              inspections.pending              ?? 0,
    SCHEDULED:            inspections.scheduled            ?? 0,
    IN_PROGRESS:          inspections.inProgress           ?? 0,
    COMPLETED:            inspections.completed            ?? 0,
    CANCELLED:            inspections.cancelled            ?? 0,
  };
}

function toActionItems(data = {}) {
  return {
    pendingListings:       data.listings?.pending             ?? 0,
    unassignedInspections: data.inspections?.unassigned       ?? 0,
    pendingRefunds:        data.inspections?.pendingRefunds   ?? 0,
    pendingDeletions:      data.deletionRequests?.pending     ?? 0,
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ background: "rgba(0,0,0,0.06)" }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminOverview() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    getAdminDashboard()
      .then(res => setData(res.data.data ?? res.data))
      .catch(() => showError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const listings       = data?.listings       ?? {};
  const users          = data?.users          ?? {};
  const inspections    = data?.inspections    ?? {};
  const revenue        = data?.revenue        ?? {};
  const weeklyRevenue  = data?.weeklyRevenue  ?? [];
  const weeklyListings = data?.weeklyListings ?? [];

  return (
    <div className="p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-brand-dark">Dashboard Overview</h1>
          <p className="text-xs text-brand-muted mt-0.5">Live snapshot of platform activity</p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          title="Refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition text-brand-muted disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {(loading || !data) ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
          </div>
        </>
      ) : (
        <>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total users"
          value={users.total?.toLocaleString() ?? "—"}
        />
        <StatCard
          label="Active listings"
          value={listings.active?.toLocaleString() ?? "—"}
        />
        <StatCard
          label="Pending review"
          value={listings.pending ?? "—"}
          accent
        />
        <StatCard
          label="Total revenue (PKR)"
          value={revenue.total ? `${(revenue.total / 1000).toFixed(1)}K` : "—"}
        />
      </div>

      {/* ── ROW 1: Revenue line + Listing status donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueLineChart data={weeklyRevenue} />
        </div>
        <ListingStatusDonut data={toListingStatusData(listings)} />
      </div>

      {/* ── ROW 2: Listings bar + Inspection funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListingsBarChart data={weeklyListings} />
        <InspectionFunnel data={toInspectionCounts(inspections)} />
      </div>

      {/* ── ROW 3: Revenue source + Action items ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueSourceDonut data={toRevenueSourceData(revenue?.byPurpose)} />
        <ActionItems        data={toActionItems(data)} />
      </div>
        </>
      )}
    </div>
  );
}
