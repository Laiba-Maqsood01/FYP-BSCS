import { useEffect, useState, useCallback, memo } from "react";
import { getAdminFeatured, getAdminFeaturedPlans, createFeaturedPlan, updateFeaturedPlan, } from "../../../services/adminService";
import { showSuccess, showError } from "../../../utils/toast";
import { Plus, Pencil, ExternalLink, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { PlanBadge, StatusBadge, ActiveBadge } from "../../../components/admin/ui/Badge";
import Modal from "../../../components/admin/ui/Modal";
import FilterDropdown from "../../../components/admin/ui/FilterDropdown";
import { TextPagination } from "../../../components/admin/ui/Pagination";
import { SkeletonRow, SkeletonCard } from "../../../components/admin/ui/Skeleton";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: "All",      value: "" },
  { label: "Pending",  value: "PENDING" },
  { label: "Active",   value: "ACTIVE" },
  { label: "Expired",  value: "EXPIRED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Removed",  value: "REMOVED" },
];

// ── Plan form modal ───────────────────────────────────────────────────────────

function PlanModal({ plan, onClose, onDone }) {
  const isEdit = !!plan;
  const [form, setForm] = useState({
    name:         plan?.name         ?? "",
    label:        plan?.label        ?? "",
    amount:       plan?.amount       ?? "",
    durationDays: plan?.durationDays ?? "",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name:         form.name.toUpperCase().trim(),
      label:        form.label.trim(),
      amount:       Number(form.amount),
      durationDays: Number(form.durationDays),
    };
    if (!payload.name || !payload.label || !payload.amount || !payload.durationDays) return;
    setLoading(true);
    try {
      if (isEdit) {
        const patch = {
          label:        payload.label,
          amount:       payload.amount,
          durationDays: payload.durationDays,
        };
        await updateFeaturedPlan(plan._id, patch);
        showSuccess("Plan updated");
        onDone({ ...plan, ...patch }, true);
      } else {
        const res = await createFeaturedPlan(payload);
        showSuccess("Plan created");
        onDone(res.data.data, false);
      }
    } catch (err) {
      showError(err?.response?.data?.message ?? "Failed to save plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit Plan — ${plan.name}` : "Add New Plan"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEdit && (
          <div>
            <label className="text-xs text-brand-muted mb-1 block">Plan name (key)</label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. ELITE"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 uppercase" />
            <p className="text-[11px] text-brand-muted mt-1">Uppercase identifier. Cannot be changed after creation.</p>
          </div>
        )}
        <div>
          <label className="text-xs text-brand-muted mb-1 block">Display label</label>
          <input name="label" value={form.label} onChange={handleChange}
            placeholder="e.g. Elite"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-brand-muted mb-1 block">Amount (PKR)</label>
            <input name="amount" type="number" min="1" value={form.amount} onChange={handleChange}
              placeholder="e.g. 2500"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
          </div>
          <div>
            <label className="text-xs text-brand-muted mb-1 block">Duration (days)</label>
            <input name="durationDays" type="number" min="1" value={form.durationDays} onChange={handleChange}
              placeholder="e.g. 30"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm rounded-lg text-white cursor-pointer disabled:opacity-60"
            style={{ background: "#ea6d00" }}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Plan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── PlanRow / PlanCard — memoized so only the changed plan re-renders ─────────

const PlanRow = memo(function PlanRow({ plan, onEdit, onToggle, toggling }) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><PlanBadge plan={plan.name} /></td>
      <td className="px-4 py-3 text-sm text-brand-dark font-medium">{plan.label}</td>
      <td className="px-4 py-3 text-sm text-brand-dark">PKR {plan.amount.toLocaleString()}</td>
      <td className="px-4 py-3 text-sm text-brand-dark">{plan.durationDays} days</td>
      <td className="px-4 py-3"><ActiveBadge isActive={plan.isActive} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(plan)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-brand-dark"
          >
            <Pencil size={11} /> Edit
          </button>
          <button
            onClick={() => onToggle(plan)}
            disabled={toggling}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 border rounded-lg cursor-pointer transition-colors disabled:opacity-50
              ${plan.isActive
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-700 hover:bg-green-50"}`}
          >
            {plan.isActive ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
            {plan.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </td>
    </tr>
  );
});

const PlanCard = memo(function PlanCard({ plan, onEdit, onToggle, toggling }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PlanBadge plan={plan.name} />
          <span className="text-sm font-medium text-brand-dark">{plan.label}</span>
        </div>
        <ActiveBadge isActive={plan.isActive} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">Amount</p>
          <p className="text-brand-dark font-medium">PKR {plan.amount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">Duration</p>
          <p className="text-brand-dark font-medium">{plan.durationDays} days</p>
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onEdit(plan)}
          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer text-brand-dark"
        >
          <Pencil size={11} /> Edit
        </button>
        <button
          onClick={() => onToggle(plan)}
          disabled={toggling}
          className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border rounded-lg cursor-pointer disabled:opacity-50
            ${plan.isActive
              ? "border-red-200 text-red-600 hover:bg-red-50"
              : "border-green-200 text-green-700 hover:bg-green-50"}`}
        >
          {plan.isActive ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
          {plan.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
});

// ── Plans tab ─────────────────────────────────────────────────────────────────

function PlansTab() {
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPlan, setModalPlan] = useState(undefined);
  // Track which plan ID is currently being toggled to disable its button.
  const [togglingId, setTogglingId] = useState(null);

  async function fetchPlans() {
    setLoading(true);
    try {
      const res = await getAdminFeaturedPlans();
      setPlans(res.data.data);
    } catch {
      showError("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPlans(); }, []);

  // Optimistic toggle — flips the plan locally, then confirms with the API.
  // Only this plan's row re-renders because PlanRow/PlanCard are memoized.
  const handleToggle = useCallback(async (plan) => {
    setTogglingId(plan._id);
    // Flip immediately in local state.
    setPlans(prev => prev.map(p => p._id === plan._id ? { ...p, isActive: !p.isActive } : p));
    try {
      await updateFeaturedPlan(plan._id, { isActive: !plan.isActive });
      showSuccess(`Plan ${plan.isActive ? "deactivated" : "activated"}`);
    } catch {
      // Revert on failure.
      setPlans(prev => prev.map(p => p._id === plan._id ? { ...p, isActive: plan.isActive } : p));
      showError("Failed to update plan");
    } finally {
      setTogglingId(null);
    }
  }, []);

  const handleEdit = useCallback((plan) => setModalPlan(plan), []);

  // Targeted update — no full re-fetch needed.
  // Re-sorting by amount is cheap: React reconciles by key={p._id} so memo
  // bails out for every untouched row; only the new/edited row re-renders.
  const handlePlanDone = useCallback((savedPlan, isEdit) => {
    setModalPlan(undefined);
    if (isEdit) {
      setPlans(prev =>
        prev.map(p => p._id === savedPlan._id ? savedPlan : p)
            .sort((a, b) => a.amount - b.amount)
      );
    } else {
      setPlans(prev => [...prev, savedPlan].sort((a, b) => a.amount - b.amount));
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-brand-muted">{plans.length} plan{plans.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPlans}
            disabled={loading}
            title="Refresh"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition text-brand-muted disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={() => setModalPlan(null)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-white cursor-pointer"
            style={{ background: "#ea6d00" }}
          >
            <Plus size={13} /> Add Plan
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Name", "Label", "Amount", "Duration", "Status", ""].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-medium text-brand-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : plans.map(p => (
                <PlanRow
                  key={p._id}
                  plan={p}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  toggling={togglingId === p._id}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden flex flex-col gap-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : plans.map(p => (
            <PlanCard
              key={p._id}
              plan={p}
              onEdit={handleEdit}
              onToggle={handleToggle}
              toggling={togglingId === p._id}
            />
          ))}
      </div>

      {modalPlan !== undefined && (
        <PlanModal
          plan={modalPlan}
          onClose={() => setModalPlan(undefined)}
          onDone={handlePlanDone}
        />
      )}
    </div>
  );
}

// ── Featured listings tab ─────────────────────────────────────────────────────

function FeaturedListingsTab() {
  const [featured,    setFeatured]    = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter,  setPlanFilter]  = useState("");
  const [page,        setPage]        = useState(1);
  const [planOptions, setPlanOptions] = useState([{ label: "All Plans", value: "" }]);

  useEffect(() => {
    getAdminFeaturedPlans()
      .then(res => {
        setPlanOptions([
          { label: "All Plans", value: "" },
          ...res.data.data.map(p => ({ label: p.label, value: p.name })),
        ]);
      })
      .catch(() => {});
  }, []);

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (planFilter)   params.plan   = planFilter;
      const res = await getAdminFeatured(params);
      setFeatured(res.data.data.featured);
      setPagination(res.data.data.pagination);
    } catch {
      showError("Failed to load featured listings");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, planFilter]);

  useEffect(() => { fetchFeatured(); }, [fetchFeatured]);

  function handleFilter(setter) {
    return val => { setter(val); setPage(1); };
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => handleFilter(setStatusFilter)(tab.value)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap
                ${statusFilter === tab.value
                  ? "border-brand-orange text-brand-orange bg-orange-50"
                  : "border-gray-200 text-brand-muted hover:bg-gray-50"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="shrink-0">
          <FilterDropdown value={planFilter} onChange={handleFilter(setPlanFilter)} options={planOptions} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-brand-muted">{pagination.total} record{pagination.total !== 1 ? "s" : ""}</p>
        <button
          onClick={fetchFeatured}
          disabled={loading}
          title="Refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition text-brand-muted disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Listing", "Seller", "Plan", "Status", "Amount", "Start", "End", ""].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-medium text-brand-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
              : featured.length === 0
              ? <tr><td colSpan={8} className="text-center py-12 text-sm text-brand-muted">No featured records found</td></tr>
              : featured.map(f => (
                <tr key={f._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-dark text-sm truncate max-w-40">{f.listing?.title || "—"}</p>
                    {f.listing?.saleMode === "MANAGED" && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "rgba(234,109,0,0.1)", color: "#ea6d00" }}>Managed</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-brand-dark">{f.seller?.username || "—"}</p>
                    <p className="text-[11px] text-brand-muted">{f.seller?.email}</p>
                  </td>
                  <td className="px-4 py-3"><PlanBadge plan={f.plan} /></td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 text-sm text-brand-dark font-medium">PKR {f.amount?.toLocaleString?.() ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-brand-muted">
                    {f.startDate ? new Date(f.startDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-muted">
                    {f.endDate ? new Date(f.endDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {f.status === "ACTIVE" && (
                      <a href={`/browse-cars/${f.listing?._id}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-brand-dark">
                        <ExternalLink size={11} /> View
                      </a>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : featured.length === 0
          ? <p className="text-center py-10 text-sm text-brand-muted">No featured records found</p>
          : featured.map(f => (
            <div key={f._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-medium text-brand-dark text-sm truncate">{f.listing?.title || "—"}</p>
                  <p className="text-xs text-brand-muted mt-0.5">{f.seller?.username} · {f.seller?.email}</p>
                </div>
                <StatusBadge status={f.status} />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <PlanBadge plan={f.plan} />
                <span className="text-xs font-medium text-brand-dark">PKR {f.amount?.toLocaleString?.() ?? "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">Start</p>
                  <p className="text-brand-dark">{f.startDate ? new Date(f.startDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "—"}</p>
                </div>
                <div>
                  <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">End</p>
                  <p className="text-brand-dark">{f.endDate ? new Date(f.endDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "—"}</p>
                </div>
              </div>
              {f.status === "ACTIVE" && (
                <a href={`/browse-cars/${f.listing?._id}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-brand-dark">
                  <ExternalLink size={11} /> View Listing
                </a>
              )}
            </div>
          ))}
      </div>

      <TextPagination page={page} totalPages={pagination.totalPages} onChange={setPage} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ManageFeatured() {
  const [activeTab, setActiveTab] = useState("listings");

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-brand-dark">Manage Featured</h1>
        <p className="text-sm text-brand-muted mt-0.5">Monitor featured listings and manage available plans</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {[
          { key: "listings", label: "Featured Listings" },
          { key: "plans",    label: "Plans" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 cursor-pointer transition-colors -mb-px
              ${activeTab === tab.key
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-brand-muted hover:text-brand-dark"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "listings" ? <FeaturedListingsTab /> : <PlansTab />}
    </div>
  );
}
