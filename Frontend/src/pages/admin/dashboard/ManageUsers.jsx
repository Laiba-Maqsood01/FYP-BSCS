import { useEffect, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldOff, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
import { getAdminUsers, blockToggleUser, deleteAdminUser } from "../../../services/adminService";
import { showSuccess, showError } from "../../../utils/toast";
import ConfirmModal from "../../../components/common/ConfirmModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBlocked(u) {
  return u.accountStatus === "BLOCKED" && u.blockedUntil && new Date() < new Date(u.blockedUntil);
}

function patchUser(id, patch) {
  return prev => prev.map(u => u._id === id ? { ...u, ...patch } : u);
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status, isDeleted }) {
  if (isDeleted) {
    return (
      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
        style={{ background: "#f1f5f9", color: "#64748b" }}>
        Deleted
      </span>
    );
  }
  const map = {
    ACTIVE:  { bg: "#ecfdf5", color: "#065f46" },
    BLOCKED: { bg: "#fff7ed", color: "#9a3412" },
  };
  const style = map[status] ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: style.bg, color: style.color }}>
      {status}
    </span>
  );
}

function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{
        background: isAdmin ? "rgba(234,109,0,0.1)" : "#f1f5f9",
        color:      isAdmin ? "#ea6d00"              : "#475569",
      }}>
      {role}
    </span>
  );
}

function Avatar({ username }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
      style={{ background: "#0f172a" }}>
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ── Block modal ───────────────────────────────────────────────────────────────

function BlockModal({ user, onClose, onConfirm }) {
  const [days, setDays] = useState(7);
  if (!user) return null;
  return (
    <ConfirmModal
      show={true}
      onClose={onClose}
      onConfirm={() => onConfirm(days)}
      title={`Block ${user.username}`}
      message={
        <div className="flex flex-col gap-3">
          <p className="text-sm text-brand-muted">How many days should this user be blocked?</p>
          <input type="number" min={1} max={365} value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
      }
    />
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ pagination, onPrev, onNext }) {
  if (pagination.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
      <p className="text-xs text-brand-muted">Page {pagination.page} of {pagination.totalPages}</p>
      <div className="flex gap-2">
        <button onClick={onPrev} disabled={pagination.page === 1}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors">
          Previous
        </button>
        <button onClick={onNext} disabled={pagination.page === pagination.totalPages}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors">
          Next
        </button>
      </div>
    </div>
  );
}

// ── UserRow — memo: only re-renders when this user's data changes ──────────────

const UserRow = memo(function UserRow({ u, onBlock, onUnblock, onDelete }) {
  const navigate  = useNavigate();
  const blocked   = isBlocked(u);
  const showActions = u.role !== "admin" && !u.isDeleted;

  return (
    <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }} className="hover:bg-gray-50/60 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar username={u.username} />
          <div>
            <button onClick={() => navigate(`/admin/users/${u._id}`)}
              className="font-medium text-sm text-left cursor-pointer hover:text-orange-400 transition-colors"
              style={{ color: "#ea6d00" }}>
              {u.username}
            </button>
            {u.isDeleted && <p className="text-[10px] text-brand-muted">Account deleted</p>}
            {blocked && (
              <p className="text-[10px]" style={{ color: "#9a3412" }}>
                Blocked until {new Date(u.blockedUntil).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-brand-dark">{u.email}</p>
        {u.mobileNumber && <p className="text-xs text-brand-muted">{u.mobileNumber}</p>}
      </td>
      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
      <td className="px-4 py-3"><StatusBadge status={u.accountStatus} isDeleted={u.isDeleted} /></td>
      <td className="px-4 py-3 text-xs text-brand-muted">
        {new Date(u.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
      </td>
      <td className="px-4 py-3">
        {showActions && (
          <div className="flex items-center justify-end gap-2">
            {blocked ? (
              <button onClick={() => onUnblock(u)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
                style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #bbf7d0" }}>
                <ShieldCheck size={12} /> Unblock
              </button>
            ) : (
              <button onClick={() => onBlock(u)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
                style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
                <ShieldOff size={12} /> Block
              </button>
            )}
            <button onClick={() => onDelete(u)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
              style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
});

// ── UserCard — memo: mobile card, same isolation guarantee ────────────────────

const UserCard = memo(function UserCard({ u, onBlock, onUnblock, onDelete }) {
  const navigate  = useNavigate();
  const blocked   = isBlocked(u);
  const showActions = u.role !== "admin" && !u.isDeleted;

  return (
    <div className="bg-white rounded-xl p-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar username={u.username} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => navigate(`/admin/users/${u._id}`)}
              className="font-semibold text-sm truncate text-left cursor-pointer hover:text-orange-400 transition-colors"
              style={{ color: "#ea6d00" }}>
              {u.username}
            </button>
            <RoleBadge role={u.role} />
            <StatusBadge status={u.accountStatus} isDeleted={u.isDeleted} />
          </div>
          <p className="text-xs text-brand-muted mt-0.5 truncate">{u.email}</p>
          {u.mobileNumber && <p className="text-xs text-brand-muted">{u.mobileNumber}</p>}
        </div>
      </div>

      {u.isDeleted && <p className="text-xs text-brand-muted mb-2">Account deleted</p>}
      {blocked && (
        <p className="text-xs mb-2" style={{ color: "#9a3412" }}>
          Blocked until {new Date(u.blockedUntil).toLocaleDateString()}
        </p>
      )}

      <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <p className="text-[11px] text-brand-muted">
          Joined {new Date(u.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
        </p>
        {showActions && (
          <div className="flex items-center gap-2">
            {blocked ? (
              <button onClick={() => onUnblock(u)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
                style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #bbf7d0" }}>
                <ShieldCheck size={12} /> Unblock
              </button>
            ) : (
              <button onClick={() => onBlock(u)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
                style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
                <ShieldOff size={12} /> Block
              </button>
            )}
            <button onClick={() => onDelete(u)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
              style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: "All",     value: "" },
  { label: "Active",  value: "ACTIVE" },
  { label: "Blocked", value: "BLOCKED" },
  { label: "Deleted", value: "deleted" },
];

export default function ManageUsers() {
  const [users,      setUsers]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);

  const [search,       setSearch]       = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);

  const [blockTarget,   setBlockTarget]   = useState(null);
  const [unblockTarget, setUnblockTarget] = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search)                      params.search        = search;
      if (statusFilter === "deleted")  params.isDeleted     = true;
      else if (statusFilter)           params.accountStatus = statusFilter;
      const res = await getAdminUsers(params);
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch {
      showError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearch(searchInput);
  }

  // ── Targeted patches — no re-fetch, only the affected row re-renders ─────────

  const handleBlock = useCallback(async (days) => {
    const target = blockTarget;
    setBlockTarget(null);
    // Optimistic: mark as blocked immediately so the button swaps at once.
    const blockedUntil = new Date(Date.now() + days * 86400000).toISOString();
    setUsers(patchUser(target._id, { accountStatus: "BLOCKED", blockedUntil }));
    try {
      await blockToggleUser(target._id, days);
      showSuccess(`${target.username} blocked for ${days} day(s)`);
    } catch (err) {
      // Revert on failure.
      setUsers(patchUser(target._id, { accountStatus: target.accountStatus, blockedUntil: target.blockedUntil }));
      showError(err?.response?.data?.message ?? "Failed to block user");
    }
  }, [blockTarget]);

  const handleUnblock = useCallback(async () => {
    const target = unblockTarget;
    setUnblockTarget(null);
    setUsers(patchUser(target._id, { accountStatus: "ACTIVE", blockedUntil: null }));
    try {
      await blockToggleUser(target._id);
      showSuccess(`${target.username} unblocked`);
    } catch (err) {
      setUsers(patchUser(target._id, { accountStatus: target.accountStatus, blockedUntil: target.blockedUntil }));
      showError(err?.response?.data?.message ?? "Failed to unblock user");
    }
  }, [unblockTarget]);

  const handleDelete = useCallback(async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    // Patch isDeleted — UserRow/UserCard will hide action buttons automatically.
    setUsers(patchUser(target._id, { isDeleted: true, accountStatus: "DELETED" }));
    try {
      await deleteAdminUser(target._id);
      showSuccess(`${target.username} deleted`);
    } catch (err) {
      setUsers(patchUser(target._id, { isDeleted: false }));
      showError(err?.response?.data?.message ?? "Failed to delete user");
    }
  }, [deleteTarget]);

  // Stable open-handlers so memo'd rows don't re-render on unrelated state changes.
  const openBlock   = useCallback((u) => setBlockTarget(u),   []);
  const openUnblock = useCallback((u) => setUnblockTarget(u), []);
  const openDelete  = useCallback((u) => setDeleteTarget(u),  []);

  const prevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const nextPage = useCallback(() => setPage(p => Math.min(pagination.totalPages, p + 1)), [pagination.totalPages]);

  return (
    <div className="p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-brand-dark">Manage Users</h1>
          <p className="text-xs text-brand-muted mt-0.5">{pagination.total} total users</p>
        </div>
        <button onClick={fetchUsers} disabled={loading} title="Refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition text-brand-muted disabled:opacity-50 cursor-pointer shrink-0">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input type="text" placeholder="Search by name, email or phone…" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-white focus:outline-none focus:ring-2"
              style={{ border: "1px solid rgba(0,0,0,0.1)" }} />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white rounded-lg transition cursor-pointer"
            style={{ background: "#ea6d00" }}>
            Search
          </button>
        </form>

        <div className="flex gap-1 bg-white rounded-lg p-1" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer"
              style={{
                background: statusFilter === f.value ? "#0f172a" : "transparent",
                color:      statusFilter === f.value ? "#fff"    : "#64748b",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-brand-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: "rgba(0,0,0,0.06)", width: j === 0 ? "140px" : "80px" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-brand-muted">No users found</td>
                </tr>
              ) : (
                users.map(u => (
                  <UserRow key={u._id} u={u} onBlock={openBlock} onUnblock={openUnblock} onDelete={openDelete} />
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPrev={prevPage} onNext={nextPage} />
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }} />
                <div className="flex flex-col gap-2 flex-1 justify-center">
                  <div className="h-3 rounded w-1/2" style={{ background: "rgba(0,0,0,0.06)" }} />
                  <div className="h-3 rounded w-3/4" style={{ background: "rgba(0,0,0,0.06)" }} />
                </div>
              </div>
              <div className="h-8 rounded" style={{ background: "rgba(0,0,0,0.04)" }} />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl py-12 text-center text-sm text-brand-muted" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            No users found
          </div>
        ) : (
          users.map(u => (
            <UserCard key={u._id} u={u} onBlock={openBlock} onUnblock={openUnblock} onDelete={openDelete} />
          ))
        )}
        <Pagination pagination={pagination} onPrev={prevPage} onNext={nextPage} />
      </div>

      {/* Modals */}
      <BlockModal user={blockTarget} onClose={() => setBlockTarget(null)} onConfirm={handleBlock} />

      <ConfirmModal
        show={!!unblockTarget}
        onClose={() => setUnblockTarget(null)}
        onConfirm={handleUnblock}
        title={`Unblock ${unblockTarget?.username}`}
        message={`This will restore ${unblockTarget?.username}'s access immediately.`}
      />

      <ConfirmModal
        show={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.username}`}
        message={`This will permanently delete ${deleteTarget?.username}'s account and remove all their listings. This cannot be undone.`}
      />
    </div>
  );
}
