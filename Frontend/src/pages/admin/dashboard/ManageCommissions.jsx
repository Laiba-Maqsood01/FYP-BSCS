import { useEffect, useState, useCallback, memo } from "react";
import { getAdminCommissions } from "../../../services/adminService";
import { showError } from "../../../utils/toast";
import { RefreshCw, ExternalLink } from "lucide-react";

import { StatusBadge } from "../../../components/admin/ui/Badge";
import { TextPagination } from "../../../components/admin/ui/Pagination";
import { SkeletonRow, SkeletonCard } from "../../../components/admin/ui/Skeleton";

// Commissions are settlement records: the buyer pays GearTrade in full, the
// team deducts the commission and hands the seller the remaining proceeds
// (e.g. by cheque). So every new record is created already PAID — this page
// is a ledger, not a payment queue.

function listingLabel(l) {
  return `${l?.brand?.name ?? ""} ${l?.carModel?.name ?? ""}${l?.year ? ` · ${l.year}` : ""}`.trim() || "—";
}

const fmtPKR  = (n) => `PKR ${Number(n ?? 0).toLocaleString()}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

// ── Desktop row ────────────────────────────────────────────────────────────────

const CommissionRow = memo(function CommissionRow({ c }) {
  const net = (c.salePrice ?? 0) - (c.commissionAmount ?? 0);
  return (
    <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }} className="hover:bg-gray-50/60 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-brand-dark">{c.seller?.username || "—"}</p>
        <p className="text-[11px] text-brand-muted">{c.seller?.email}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-brand-dark mb-1">{listingLabel(c.listing)}</p>
        {c.listing?._id && (
          <a href={`/browse-cars/${c.listing._id}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-brand-dark">
            <ExternalLink size={10} /> View
          </a>
        )}
      </td>
      <td className="px-4 py-3 text-xs font-semibold text-brand-dark">{fmtPKR(c.salePrice)}</td>
      <td className="px-4 py-3 text-xs font-semibold text-brand-dark">{fmtPKR(c.commissionAmount)}</td>
      <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#15803d" }}>{fmtPKR(net)}</td>
      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
      <td className="px-4 py-3 text-xs text-brand-muted">{fmtDate(c.createdAt)}</td>
    </tr>
  );
});

// ── Mobile card ────────────────────────────────────────────────────────────────

const CommissionCard = memo(function CommissionCard({ c }) {
  const net = (c.salePrice ?? 0) - (c.commissionAmount ?? 0);
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-dark truncate">{listingLabel(c.listing)}</p>
          <p className="text-xs text-brand-muted mt-0.5 truncate">{c.seller?.username} · {c.seller?.email}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs mt-3">
        <div>
          <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">Sale price</p>
          <p className="font-semibold text-brand-dark">{fmtPKR(c.salePrice)}</p>
        </div>
        <div>
          <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">Commission</p>
          <p className="font-semibold text-brand-dark">{fmtPKR(c.commissionAmount)}</p>
        </div>
        <div>
          <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">Seller gets</p>
          <p className="font-semibold" style={{ color: "#15803d" }}>{fmtPKR(net)}</p>
        </div>
      </div>
      <p className="text-[11px] text-brand-muted mt-3">{fmtDate(c.createdAt)}</p>
    </div>
  );
});

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ManageCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCommissions({ page, limit: 10 });
      setCommissions(res.data.data.commissions ?? []);
      setPagination(res.data.data.pagination ?? { page: 1, totalPages: 1, total: 0 });
    } catch {
      showError("Failed to load commissions");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchCommissions(); }, [fetchCommissions]);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-semibold text-brand-dark">Manage Commissions</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {pagination.total} commission{pagination.total !== 1 ? "s" : ""} — settled from sale proceeds
          </p>
        </div>
        <button
          onClick={fetchCommissions}
          disabled={loading}
          title="Refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition text-brand-muted disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Seller", "Listing", "Sale Price", "Commission", "Seller Gets", "Status", "Date"].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-medium text-brand-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              : commissions.length === 0
              ? <tr><td colSpan={7} className="text-center py-12 text-sm text-brand-muted">No commissions found</td></tr>
              : commissions.map(c => <CommissionRow key={c._id} c={c} />)}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : commissions.length === 0
          ? <p className="text-center py-10 text-sm text-brand-muted">No commissions found</p>
          : commissions.map(c => <CommissionCard key={c._id} c={c} />)}
      </div>

      <TextPagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
    </div>
  );
}
