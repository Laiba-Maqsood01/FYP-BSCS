import { useMemo, useState, useCallback } from 'react';
import {
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  CarFront,
  Check,
  CircleX,
  Clock3,
  Crown,
  Eye,
  KeyRound,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  ShieldBan,
  ShieldCheck,
  ShieldX,
  UserRound,
  UserX2,
  X,
  Loader,
  AlertCircle,
} from 'lucide-react';
import Header from '../components/Header.jsx';
import { mockUsers } from '../data/mockData.js';

const approvalSeed = [
  {
    id: 'A-1',
    title: 'Honda Civic RS Turbo 2024',
    price: 'Rs 8,200,000',
    city: 'KhanPur',
    type: 'managed',
    fuel: 'Petrol',
    transmission: 'Automatic',
    body: 'Sedan',
    kms: '3,200 km',
    submitted: '2026-05-05',
    image:
      '/assets/Honda.png',
  },
  {
    id: 'A-2',
    title: 'Hyundai Tucson AWD 2023',
    price: 'Rs 8,250,000',
    city: 'Sadiqabad',
    type: 'managed',
    fuel: 'Petrol',
    transmission: 'Automatic',
    body: 'SUV',
    kms: '15,000 km',
    submitted: '2026-05-07',
    image:
      '/assets/KIA.jpg',
  },
  {
    id: 'A-3',
    title: 'Toyota Yaris ATIV X 2024',
    price: 'Rs 4,850,000',
    city: 'Rahim Yar Khan',
    type: 'generic',
    fuel: 'Petrol',
    transmission: 'Automatic',
    body: 'Sedan',
    kms: '5,600 km',
    submitted: '2026-05-07',
    image:
      '/assets/Toyota.webp',
  },
  {
    id: 'A-4',
    title: 'Suzuki Swift GL X CVT 2023',
    price: 'Rs 3,490,000',
    city: 'Liaqat Pur',
    type: 'generic',
    fuel: 'Petrol',
    transmission: 'Automatic',
    body: 'Hatchback',
    kms: '8,300 km',
    submitted: '2026-05-06',
    image:
      '/assets/Suzuki.jpg',
  },
  {
    id: 'A-5',
    title: 'KIA Sportage Alpha 2022',
    price: 'Rs 7,950,000',
    city: 'KhanPur',
    type: 'managed',
    fuel: 'Petrol',
    transmission: 'Automatic',
    body: 'SUV',
    kms: '9,500 km',
    submitted: '2026-05-06',
    image:
      '/assets/KIA.jpg',
  },
];

const usersSeed = mockUsers;

function AdminPanelPage({ currentPage, onNavigate }) {
  const [menu, setMenu] = useState('Dashboard');
  const [approvals, setApprovals] = useState(approvalSeed);
  const [users] = useState(usersSeed);
  const [userQuery, setUserQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [inspectionFilter, setInspectionFilter] = useState('All Inspections');

  // Confirmation & Action Modals
  const [confirmModal, setConfirmModal] = useState(null); // { type, itemId, itemTitle }
  const [actionInProgress, setActionInProgress] = useState(new Set());
  const [actionSuccess, setActionSuccess] = useState(null); // { type, message, itemId }
  const [userActionModal, setUserActionModal] = useState(null); // { type, userId, userName }
  const [passwordResetModal, setPasswordResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [expandPending, setExpandPending] = useState(false);

  const counters = useMemo(() => {
    const pendingListings = approvals.length;
    const totalListings = 1247;
    const totalUsers = 3856;
    const inspections = 189;
    const activeFeatured = 67;
    const monthlyRevenue = 184500;
    const verifiedUsers = users.filter((u) => u.verified).length;
    return {
      pendingListings,
      totalListings,
      totalUsers,
      inspections,
      activeFeatured,
      monthlyRevenue,
      verifiedUsers,
    };
  }, [approvals, users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const queryMatch = `${user.name} ${user.email} ${user.city}`
        .toLowerCase()
        .includes(userQuery.toLowerCase());
      const filterMatch = userFilter === 'all' ? true : user.status === userFilter;
      return queryMatch && filterMatch;
    });
  }, [userFilter, userQuery, users]);

  const userStats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.status === 'active').length,
      suspended: users.filter((user) => user.status === 'suspended').length,
      banned: users.filter((user) => user.status === 'banned').length,
    };
  }, [users]);

  const inspections = useMemo(
    () => [
      {
        id: 'insp_001',
        title: 'Suzuki Alto VXL AGS 2023',
        city: 'Rahim Yar Khan',
        address: 'House 42, Liaquat Park Road',
        date: '2026-05-12 10:00 AM',
        status: 'Scheduled',
        amount: 'Rs 3,499',
      },
      {
        id: 'insp_002',
        title: 'Toyota Corolla Altis Grande 2023',
        city: 'KhanPur',
        address: 'Main GT Road, Near City Plaza',
        date: '2026-04-25 02:00 PM',
        status: 'Completed',
        amount: 'Rs 3,499',
      },
      {
        id: 'insp_003',
        title: 'Honda Civic RS Turbo 2024',
        city: 'Rahim Yar Khan',
        address: 'Block C, Model Town',
        date: '2026-05-15 11:00 AM',
        status: 'Pending',
        amount: 'Rs 3,499',
      },
      {
        id: 'insp_004',
        title: 'Toyota Fortuner Sigma 4 2023',
        city: 'Sadiqabad',
        address: 'Satellite Town, Street 9',
        date: '2026-05-14 09:30 AM',
        status: 'Scheduled',
        amount: 'Rs 5,499',
      },
      {
        id: 'insp_005',
        title: 'KIA Sportage Alpha 2022',
        city: 'Liaqat Pur',
        address: 'Mall Road, Sector B',
        date: '2026-05-10 03:15 PM',
        status: 'Cancelled',
        amount: 'Rs 3,499',
      },
      {
        id: 'insp_006',
        title: 'Hyundai Tucson AWD 2023',
        city: 'KhanPur',
        address: 'Green Avenue, House 18',
        date: '2026-05-09 01:00 PM',
        status: 'Completed',
        amount: 'Rs 3,499',
      },
      {
        id: 'insp_007',
        title: 'Toyota Yaris ATIV X 2024',
        city: 'Rahim Yar Khan',
        address: 'Airport Road, Block D',
        date: '2026-05-18 12:00 PM',
        status: 'Pending',
        amount: 'Rs 3,499',
      },
      {
        id: 'insp_008',
        title: 'Suzuki Swift GLX CVT 2023',
        city: 'Sadiqabad',
        address: 'Canal Road, Phase 2',
        date: '2026-05-17 04:00 PM',
        status: 'Scheduled',
        amount: 'Rs 3,499',
      },
    ],
    [],
  );

  const inspectionStats = useMemo(() => {
    return {
      total: inspections.length,
      pending: inspections.filter((item) => item.status === 'Pending').length,
      scheduled: inspections.filter((item) => item.status === 'Scheduled').length,
      completed: inspections.filter((item) => item.status === 'Completed').length,
      cancelled: inspections.filter((item) => item.status === 'Cancelled').length,
      revenue: inspections
        .filter((item) => item.status === 'Completed')
        .reduce((sum, item) => sum + Number(item.amount.replace(/[^0-9]/g, '')), 0),
    };
  }, [inspections]);

  const filteredInspections = useMemo(() => {
    if (inspectionFilter === 'All Inspections') {
      return inspections;
    }

    return inspections.filter((item) => item.status === inspectionFilter);
  }, [inspectionFilter, inspections]);

  const pendingBreakdown = useMemo(
    () => ({
      managed: approvals.filter((item) => item.type === 'managed').length,
      generic: approvals.filter((item) => item.type === 'generic').length,
    }),
    [approvals],
  );

  // Handler functions
  const handleApprove = useCallback((id) => {
    setConfirmModal({ type: 'approve', itemId: id, itemTitle: approvals.find(a => a.id === id)?.title });
  }, [approvals]);

  const handleReject = useCallback((id) => {
    setConfirmModal({ type: 'reject', itemId: id, itemTitle: approvals.find(a => a.id === id)?.title });
  }, [approvals]);

  const confirmAction = useCallback(async () => {
    if (!confirmModal) return;

    const actionId = `${confirmModal.type}-${confirmModal.itemId}`;
    setActionInProgress((prev) => new Set(prev).add(actionId));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setApprovals((current) => 
      current.filter((item) => item.id !== confirmModal.itemId)
    );

    setActionInProgress((prev) => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });

    setActionSuccess({
      type: confirmModal.type,
      message: `Listing ${confirmModal.type === 'approve' ? 'approved' : 'rejected'} successfully`,
      itemId: confirmModal.itemId,
    });

    setConfirmModal(null);
    setTimeout(() => setActionSuccess(null), 2000);
  }, [confirmModal]);

  const handleUserAction = useCallback((userId, userName, actionType) => {
    setUserActionModal({ type: actionType, userId, userName });
  }, []);

  const confirmUserAction = useCallback(async () => {
    if (!userActionModal) return;

    const actionId = `user-${userActionModal.type}-${userActionModal.userId}`;
    setActionInProgress((prev) => new Set(prev).add(actionId));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setActionInProgress((prev) => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });

    setActionSuccess({
      type: userActionModal.type,
      message: `User action completed: ${userActionModal.type}`,
      itemId: userActionModal.userId,
    });

    setUserActionModal(null);
    setTimeout(() => setActionSuccess(null), 2000);
  }, [userActionModal]);

  const handlePasswordReset = useCallback(async () => {
    if (!passwordResetModal || !newPassword) return;

    const actionId = `password-${passwordResetModal.userId}`;
    setActionInProgress((prev) => new Set(prev).add(actionId));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setActionInProgress((prev) => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });

    setActionSuccess({
      type: 'password',
      message: `Password reset successfully for ${passwordResetModal.userName}`,
      itemId: passwordResetModal.userId,
    });

    setPasswordResetModal(null);
    setNewPassword('');
    setTimeout(() => setActionSuccess(null), 2000);
  }, [passwordResetModal, newPassword]);

  const handleViewDetails = useCallback((item) => {
    onNavigate('Car Details', item);
  }, [onNavigate]);

  return (
    <main className="min-h-screen bg-[#060d1e] text-white">
      <section className="mx-auto w-full max-w-[1860px] px-4 py-6 sm:px-6 lg:px-8">
        <Header activeNav={currentPage} onNavChange={onNavigate} />

        <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-[#20304d] bg-[#121d30] py-4">
            <p className="border-b border-[#20304d] px-5 pb-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8195b6]">
              ADMIN MENU
            </p>

            <div className="space-y-2 px-3 pt-4">
              <MenuButton active={menu === 'Dashboard'} count={null} icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" onClick={() => setMenu('Dashboard')} />
              <MenuButton active={menu === 'Pending Listings'} count={counters.pendingListings} icon={<Clock3 className="h-5 w-5" />} label="Pending Listings" onClick={() => setMenu('Pending Listings')} />
              <MenuButton active={menu === 'User Management'} count={null} icon={<UserRound className="h-5 w-5" />} label="User Management" onClick={() => setMenu('User Management')} />
              <MenuButton active={menu === 'Inspections'} count={3} icon={<BadgeCheck className="h-5 w-5" />} label="Inspections" onClick={() => setMenu('Inspections')} />
            </div>

            <div className="mt-3 border-t border-[#20304d] px-3 pt-3">
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-rose-500 transition hover:bg-[#1a2a43]" type="button" onClick={() => onNavigate('Home')}>
                <LogOut className="h-5 w-5" />
                <span className="text-lg font-semibold">Logout</span>
              </button>
            </div>
          </aside>

          <section>
            {menu === 'Pending Listings' ? (
              <PendingListingsSection
                list={approvals}
                managedCount={pendingBreakdown.managed}
                onApprove={handleApprove}
                onReject={handleReject}
                totalCount={counters.pendingListings}
                actionInProgress={actionInProgress}
                onViewDetails={handleViewDetails}
              />
            ) : menu === 'User Management' ? (
              <UserManagementSection
                filteredUsers={filteredUsers}
                setUserFilter={setUserFilter}
                setUserQuery={setUserQuery}
                stats={userStats}
                userFilter={userFilter}
                userQuery={userQuery}
                onUserAction={handleUserAction}
                onPasswordReset={setPasswordResetModal}
                actionInProgress={actionInProgress}
              />
            ) : menu === 'Inspections' ? (
              <InspectionsSection
                filteredInspections={filteredInspections}
                inspectionFilter={inspectionFilter}
                setInspectionFilter={setInspectionFilter}
                stats={inspectionStats}
                actionInProgress={actionInProgress}
              />
            ) : (
              <>
                <h1 className="text-3xl font-black tracking-[-0.03em]">Overview</h1>
                <p className="mt-2 text-base text-[#8ea2c2]">High-level stats and recent activity</p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                  <OverviewCard icon={<CarFront className="h-5 w-5 text-orange-400" />} title="Total Listings" value="1,247" growth="+8.2%" />
                  <OverviewCard icon={<Clock3 className="h-5 w-5 text-amber-400" />} title="Pending Approvals" value={`${counters.pendingListings}`} growth="+3" />
                  <OverviewCard icon={<UserRound className="h-5 w-5 text-emerald-400" />} title="Total Users" value="3,856" growth="+142" />
                  <OverviewCard icon={<Shield className="h-5 w-5 text-sky-400" />} title="Inspections" value={`${counters.inspections}`} growth="+12" />
                  <OverviewCard icon={<Crown className="h-5 w-5 text-violet-400" />} title="Active Featured" value={`${counters.activeFeatured}`} growth="+5" />
                  <OverviewCard icon={<IndianRupee className="h-5 w-5 text-emerald-400" />} title="Monthly Revenue" value="Rs 184,500" growth="+15.3%" />
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  <div className="overflow-hidden rounded-3xl border border-[#20304d] bg-[#121d30]">
                    <div className="flex items-center justify-between border-b border-[#20304d] px-5 py-3">
                      <h2 className="text-2xl font-bold">Pending Approval</h2>
                      <p className="text-base font-bold text-orange-400">{counters.pendingListings} new</p>
                    </div>

                    {approvals.slice(0, 4).map((item) => (
                      <div className="flex items-center justify-between border-b border-[#20304d] px-5 py-3" key={item.id}>
                        <div className="flex items-center gap-3">
                          <img alt={item.title} className="h-12 w-16 rounded-xl object-cover" src={item.image} />
                          <div>
                            <p className="text-base font-semibold">{item.title}</p>
                            <p className="mt-1 text-sm text-[#8ea2c2]">{item.price} <span className="ml-4">{item.city}</span></p>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-base font-semibold ${item.type === 'managed' ? 'text-orange-400' : 'bg-[#223554] text-[#85a0c8]'}`}>
                          {item.type}
                        </span>
                      </div>
                    ))}

                    {/* Expandable Section */}
                    {counters.pendingListings > 5 && (
                      <>
                        <button
                          onClick={() => setExpandPending(!expandPending)}
                          className="w-full px-5 py-3 text-center text-base font-bold text-orange-400 hover:bg-[#1a2a43] transition active:scale-95 border-b border-[#20304d] flex items-center justify-center gap-2"
                          type="button"
                        >
                          +{counters.pendingListings - 4} more pending
                          <span className={`transform transition-transform ${expandPending ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {/* Expanded Content */}
                        {expandPending && (
                          <div className="space-y-1 bg-[#0d1729]">
                            {approvals.slice(4).map((item) => (
                              <div className="flex items-center justify-between border-b border-[#233554] px-5 py-3 hover:bg-[#1a2a43] transition" key={item.id}>
                                <div className="flex items-center gap-3 flex-1">
                                  <img
                                    alt={item.title}
                                    className="h-10 w-14 rounded-lg object-cover flex-shrink-0"
                                    src={item.image}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                                    <p className="text-xs text-[#8ea2c2]">
                                      {item.price} • {item.city}
                                    </p>
                                  </div>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0 ${item.type === 'managed' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-500/20 text-slate-300'}`}>
                                  {item.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-[#20304d] bg-[#121d30]">
                    <div className="flex items-center justify-between border-b border-[#20304d] px-5 py-3">
                      <h2 className="text-2xl font-bold">Recent Users</h2>
                      <p className="text-base font-bold text-emerald-400">{counters.verifiedUsers} verified</p>
                    </div>

                    {users.slice(0, 4).map((user) => (
                      <div className="flex items-center justify-between border-b border-[#20304d] px-5 py-3" key={user.id}>
                        <div className="flex items-center gap-3">
                          <img
                            alt={user.name}
                            className="h-12 w-12 rounded-full object-cover"
                            src="/assets/Honda.png"
                          />
                          <div>
                            <p className="text-base font-semibold">{user.name} {user.verified ? <span className="text-emerald-400">✓</span> : null}</p>
                            <p className="mt-1 text-sm text-[#8ea2c2]">{user.city} <span className="ml-4">{user.listings} listings</span></p>
                          </div>
                        </div>
                        <span className={`text-base font-bold ${user.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>{user.status}</span>
                      </div>
                    ))}

                    {users.length > 4 ? (
                      <div className="px-5 py-3 text-center text-base font-bold text-emerald-400">+{users.length - 4} more users</div>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Confirmation Modal */}
        {confirmModal && (
          <ConfirmationModal
            title={confirmModal.type === 'approve' ? 'Approve Listing' : 'Reject Listing'}
            message={`Are you sure you want to ${confirmModal.type} this listing? "${confirmModal.itemTitle}"`}
            confirmText={confirmModal.type === 'approve' ? 'Approve' : 'Reject'}
            confirmColor={confirmModal.type === 'approve' ? 'emerald' : 'rose'}
            isLoading={actionInProgress.has(`${confirmModal.type}-${confirmModal.itemId}`)}
            onConfirm={confirmAction}
            onCancel={() => setConfirmModal(null)}
          />
        )}

        {/* User Action Modal */}
        {userActionModal && (
          <ConfirmationModal
            title={`${userActionModal.type.charAt(0).toUpperCase() + userActionModal.type.slice(1)} User`}
            message={`Are you sure you want to ${userActionModal.type} "${userActionModal.userName}"?`}
            confirmText={userActionModal.type}
            confirmColor="rose"
            isLoading={actionInProgress.has(`user-${userActionModal.type}-${userActionModal.userId}`)}
            onConfirm={confirmUserAction}
            onCancel={() => setUserActionModal(null)}
          />
        )}

        {/* Password Reset Modal */}
        {passwordResetModal && (
          <Modal title="Reset User Password" onClose={() => setPasswordResetModal(null)}>
            <div className="space-y-4">
              <p className="text-sm text-[#8ea2c2]">
                Generate a new password for <strong>{passwordResetModal.userName}</strong>
              </p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full min-h-[44px] rounded-2xl border border-[#243652] bg-[#0d1729] px-3 text-sm text-white outline-none transition focus:border-orange-500"
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePasswordReset}
                  disabled={!newPassword || actionInProgress.has(`password-${passwordResetModal.userId}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  type="button"
                >
                  {actionInProgress.has(`password-${passwordResetModal.userId}`) && <Loader className="h-3 w-3 animate-spin" />}
                  Reset Password
                </button>
                <button
                  onClick={() => setPasswordResetModal(null)}
                  className="rounded-full border border-[#2a3f61] px-5 py-2 text-xs font-semibold text-[#9fb2cf] transition hover:border-orange-500 hover:text-orange-400"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Success Notification */}
        {actionSuccess && (
          <div className="fixed bottom-6 right-6 rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 flex items-center gap-2 text-emerald-400 text-sm font-semibold z-50 animate-in fade-in slide-in-from-bottom-4">
            <Check className="h-4 w-4" />
            {actionSuccess.message}
          </div>
        )}
      </section>
    </main>
  );
}

function MenuButton({ active, icon, label, count, onClick }) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${active ? 'text-orange-500' : 'text-[#9eb0cc] hover:bg-[#1a2a43]'}`}
      onClick={onClick}
      type="button"
    >
      <span className="inline-flex items-center gap-3 text-lg font-semibold">
        {icon}
        {label}
      </span>
      {count !== null ? <span className="grid h-7 min-w-7 place-items-center rounded-full px-2 text-sm font-bold ${active ? 'bg-orange-500 text-white' : 'bg-[#223554] text-[#9fb3d3]'}">{count}</span> : null}
    </button>
  );
}

function OverviewCard({ icon, title, value, growth }) {
  return (
    <article className="rounded-2xl border border-[#20304d] bg-[#121d30] px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1b2b44]">{icon}</span>
        {growth ? <span className="text-base font-bold text-emerald-400">↑ {growth}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-[#8ea2c2]">{title}</p>
    </article>
  );
}

function PendingListingsSection({ list, totalCount, managedCount, onApprove, onReject, actionInProgress, onViewDetails }) {
  const genericCount = totalCount - managedCount;

  return (
    <>
      <h1 className="text-3xl font-black tracking-[-0.03em]">Pending Listings</h1>
      <p className="mt-2 text-base text-[#8ea2c2]">Review and approve or reject new listings</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All Pending" tone="text-white" value={totalCount} />
        <StatCard label="Managed Sale" tone="text-orange-400" value={managedCount} />
        <StatCard label="Generic" tone="text-slate-300" value={genericCount} />
        <StatCard label="Today" tone="text-amber-400" value={1} />
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-[#20304d] bg-[#121d30]">
        <div className="grid grid-cols-[2fr_1.8fr_1fr_0.8fr_1fr_0.8fr] border-b border-[#20304d] px-5 py-3 text-xs font-bold text-[#8ea2c2]">
          <p>CAR</p>
          <p>DETAILS</p>
          <p>PRICE</p>
          <p>TYPE</p>
          <p>SUBMITTED</p>
          <p className="text-right">ACTIONS</p>
        </div>

        {list.slice(0, 4).map((item) => {
          const approveInProgress = actionInProgress.has(`approve-${item.id}`);
          const rejectInProgress = actionInProgress.has(`reject-${item.id}`);

          return (
            <div
              className="grid grid-cols-[2fr_1.8fr_1fr_0.8fr_1fr_0.8fr] items-center border-b border-[#20304d] px-5 py-3"
              key={item.id}
            >
              <div className="flex items-center gap-3">
                <img alt={item.title} className="h-12 w-16 rounded-xl object-cover" src={item.image} />
                <div>
                  <p className="text-base font-semibold">{item.title}</p>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap gap-2 text-xs text-[#9db2d3]">
                  <span className="rounded-md bg-[#223554] px-2 py-0.5">{item.fuel}</span>
                  <span className="rounded-md bg-[#223554] px-2 py-0.5">{item.transmission}</span>
                  <span className="rounded-md bg-[#223554] px-2 py-0.5">{item.body}</span>
                </div>
                <p className="mt-1 text-sm text-[#8ea2c2]">{item.city}</p>
              </div>

              <div>
                <p className="text-base font-bold">{item.price}</p>
                <p className="text-xs text-[#8ea2c2]">{item.kms}</p>
              </div>

              <p className={`text-xs font-semibold ${item.type === 'managed' ? 'text-orange-400' : 'text-[#89a4ca]'}`}>
                {item.type}
              </p>
              <p className="text-xs text-[#8ea2c2]">{item.submitted}</p>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => onViewDetails(item)}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[#223554] text-[#9db2d3] hover:bg-[#2f4368] transition active:scale-95"
                  type="button"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onApprove(item.id)}
                  disabled={approveInProgress}
                  className="grid h-9 w-9 place-items-center rounded-xl text-emerald-400 hover:bg-emerald-400/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  title="Approve"
                >
                  {approveInProgress ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => onReject(item.id)}
                  disabled={rejectInProgress}
                  className="grid h-9 w-9 place-items-center rounded-xl text-rose-500 hover:bg-rose-500/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  title="Reject"
                >
                  {rejectInProgress ? <Loader className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <article className="rounded-2xl border border-[#20304d] bg-[#121d30] px-4 py-4">
      <p className={`text-3xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-sm text-[#8ea2c2]">{label}</p>
    </article>
  );
}

function UserManagementSection({
  stats,
  userQuery,
  setUserQuery,
  userFilter,
  setUserFilter,
  filteredUsers,
  onUserAction,
  onPasswordReset,
  actionInProgress,
}) {
  return (
    <>
      <h1 className="text-3xl font-black tracking-[-0.03em]">User Management</h1>
      <p className="mt-2 text-base text-[#8ea2c2]">Manage user accounts and permissions</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" tone="text-white" value={stats.total} />
        <StatCard label="Active" tone="text-emerald-400" value={stats.active} />
        <StatCard label="Suspended" tone="text-amber-400" value={stats.suspended} />
        <StatCard label="Banned" tone="text-rose-500" value={stats.banned} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <label className="flex min-w-[380px] flex-1 items-center gap-2 rounded-2xl border border-[#20304d] bg-[#121d30] px-4 py-3">
          <Search className="h-5 w-5 text-[#89a2c8]" />
          <input
            className="w-full bg-transparent text-base text-white outline-none placeholder:text-[#7f95b8]"
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder="Search users by name, email, or city..."
            value={userQuery}
          />
        </label>

        {['all', 'active', 'suspended', 'banned'].map((filter) => (
          <button
            className={`rounded-2xl border border-[#20304d] px-5 py-3 text-base font-semibold capitalize transition ${
              userFilter === filter
                ? 'bg-orange-500 text-white'
                : 'bg-[#121d30] text-[#8ea2c2] hover:text-white'
            }`}
            key={filter}
            onClick={() => setUserFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-[#20304d] bg-[#121d30]">
        <div className="grid grid-cols-[1.9fr_1.9fr_1fr_0.8fr_1fr_1fr] border-b border-[#20304d] px-5 py-3 text-sm font-bold text-[#8ea2c2]">
          <p>USER</p>
          <p>CONTACT</p>
          <p>JOINED</p>
          <p>LISTINGS</p>
          <p>STATUS</p>
          <p className="text-right">ACTIONS</p>
        </div>

        {filteredUsers.map((user) => (
          <div
            className="grid grid-cols-[1.9fr_1.9fr_1fr_0.8fr_1fr_1fr] items-center border-b border-[#20304d] px-5 py-4"
            key={user.id}
          >
            <div className="flex items-center gap-3">
              <img alt={user.name} className="h-12 w-12 rounded-full object-cover" src={user.avatar} />
              <div>
                <p className="text-base font-semibold">
                  {user.name} {user.verified ? <span className="text-emerald-400">✓</span> : null}
                </p>
                <p className="text-xs text-[#8ea2c2]">{user.city}</p>
              </div>
            </div>

            <div>
              <p className="text-base font-semibold">{user.email}</p>
              <p className="text-xs text-[#8ea2c2]">{user.phone}</p>
            </div>

            <p className="text-xs text-[#8ea2c2]">{user.joined}</p>
            <p className="text-base font-bold">{user.listings}</p>
            <span
              className={`text-base font-bold capitalize ${
                user.status === 'active'
                  ? 'text-emerald-400'
                  : user.status === 'suspended'
                    ? 'text-amber-400'
                    : 'text-rose-500'
              }`}
            >
              {user.status}
            </span>

            <div className="flex items-center justify-end gap-2">
              <button
                className="grid h-9 w-9 place-items-center rounded-xl bg-[#223554] text-[#9db2d3] hover:bg-[#2f4368] transition active:scale-95"
                type="button"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                className="grid h-9 w-9 place-items-center rounded-xl text-emerald-400 hover:bg-emerald-400/10 transition active:scale-95"
                type="button"
                title="Verify"
              >
                <ShieldCheck className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPasswordReset({ userId: user.id, userName: user.name })}
                disabled={actionInProgress.has(`password-${user.id}`)}
                className="grid h-9 w-9 place-items-center rounded-xl text-amber-400 hover:bg-amber-400/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                title="Reset Password"
              >
                {actionInProgress.has(`password-${user.id}`) ? <Loader className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              </button>
              <button
                onClick={() => onUserAction(user.id, user.name, 'suspend')}
                className="grid h-9 w-9 place-items-center rounded-xl text-rose-500 hover:bg-rose-500/10 transition active:scale-95"
                type="button"
                title="Suspend"
              >
                <ShieldBan className="h-4 w-4" />
              </button>
              <button
                onClick={() => onUserAction(user.id, user.name, 'ban')}
                className="grid h-9 w-9 place-items-center rounded-xl text-rose-500 hover:bg-rose-500/10 transition active:scale-95"
                type="button"
                title="Ban User"
              >
                <UserX2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function InspectionsSection({
  stats,
  inspectionFilter,
  setInspectionFilter,
  filteredInspections,
  actionInProgress,
}) {
  const tabs = ['All Inspections', 'Pending', 'Scheduled', 'Completed', 'Cancelled'];

  return (
    <>
      <h1 className="text-3xl font-black tracking-[-0.03em]">Inspection Overview</h1>
      <p className="mt-2 text-base text-[#8ea2c2]">Track and manage all inspection requests</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <OverviewCard icon={<ShieldCheck className="h-5 w-5 text-white" />} title="Total" value={stats.total} growth="" />
        <OverviewCard icon={<Clock3 className="h-5 w-5 text-amber-400" />} title="Pending" value={stats.pending} growth="" />
        <OverviewCard icon={<CalendarDays className="h-5 w-5 text-sky-400" />} title="Scheduled" value={stats.scheduled} growth="" />
        <OverviewCard icon={<CalendarCheck2 className="h-5 w-5 text-emerald-400" />} title="Completed" value={stats.completed} growth="" />
        <OverviewCard icon={<CircleX className="h-5 w-5 text-slate-300" />} title="Cancelled" value={stats.cancelled} growth="" />
        <OverviewCard icon={<IndianRupee className="h-5 w-5 text-emerald-400" />} title="Revenue" value={`Rs ${stats.revenue.toLocaleString()}`} growth="" />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            className={`rounded-2xl border border-[#20304d] px-5 py-3 text-base font-semibold transition ${
              inspectionFilter === tab
                ? 'bg-orange-500 text-white'
                : 'bg-[#121d30] text-[#8ea2c2] hover:text-white'
            }`}
            key={tab}
            onClick={() => setInspectionFilter(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-[#20304d] bg-[#121d30]">
        <div className="grid grid-cols-[1.8fr_1.5fr_1.2fr_0.8fr_0.8fr_0.9fr] border-b border-[#20304d] px-5 py-3 text-sm font-bold text-[#8ea2c2]">
          <p>INSPECTION</p>
          <p>LOCATION</p>
          <p>DATE</p>
          <p>STATUS</p>
          <p>AMOUNT</p>
          <p className="text-right">ACTIONS</p>
        </div>

        {filteredInspections.map((item) => (
          <div
            className="grid grid-cols-[1.8fr_1.5fr_1.2fr_0.8fr_0.8fr_0.9fr] items-center border-b border-[#20304d] px-5 py-3"
            key={item.id}
          >
            <div>
              <p className="text-base font-semibold">{item.title}</p>
              <p className="text-xs text-[#8ea2c2]">{item.id}</p>
            </div>
            <div>
              <p className="text-base font-semibold">{item.city}</p>
              <p className="text-xs text-[#8ea2c2]">{item.address}</p>
            </div>
            <p className="text-xs text-[#8ea2c2]">{item.date}</p>
            <span
              className={`text-base font-bold lowercase ${
                item.status === 'Completed'
                  ? 'text-emerald-400'
                  : item.status === 'Pending'
                    ? 'text-amber-400'
                    : item.status === 'Scheduled'
                      ? 'text-sky-400'
                      : 'text-slate-300'
              }`}
            >
              {item.status}
            </span>
            <p className="text-base font-bold">{item.amount}</p>
            <div className="flex items-center justify-end gap-2">
              {item.status === 'Completed' ? (
                <button
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[#223554] text-[#9db2d3]"
                  type="button"
                  title="View Report"
                >
                  <BadgeCheck className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    disabled={actionInProgress.has(`complete-${item.id}`)}
                    className="grid h-9 w-9 place-items-center rounded-xl text-emerald-400 hover:bg-emerald-400/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    title="Complete"
                  >
                    {actionInProgress.has(`complete-${item.id}`) ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button
                    disabled={actionInProgress.has(`cancel-${item.id}`)}
                    className="grid h-9 w-9 place-items-center rounded-xl text-rose-500 hover:bg-rose-500/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    title="Cancel"
                  >
                    {actionInProgress.has(`cancel-${item.id}`) ? <Loader className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  </button>
                </>
              )}
              {item.status === 'Pending' ? (
                <button
                  disabled={actionInProgress.has(`schedule-${item.id}`)}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[#223554] text-sky-400 hover:bg-sky-400/10 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  title="Schedule"
                >
                  {actionInProgress.has(`schedule-${item.id}`) ? <Loader className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                </button>
              ) : null}
              {item.status === 'Cancelled' ? (
                <button
                  className="grid h-9 w-9 place-items-center rounded-xl text-rose-500"
                  type="button"
                  title="Cancelled"
                  disabled
                >
                  <ShieldX className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#233554] bg-[#121f33] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#1a2a43] rounded-lg transition"
              type="button"
            >
              <X className="h-5 w-5 text-[#8ea2c2]" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

function ConfirmationModal({ title, message, confirmText, confirmColor, isLoading, onConfirm, onCancel }) {
  const colorClasses = {
    emerald: 'bg-emerald-500 hover:-translate-y-0.5',
    orange: 'bg-orange-500 hover:-translate-y-0.5',
    rose: 'bg-rose-500 hover:-translate-y-0.5',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#233554] bg-[#121f33] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="mt-2 text-sm text-[#8ea2c2]">{message}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white transition disabled:opacity-70 disabled:cursor-not-allowed ${colorClasses[confirmColor]}`}
              type="button"
            >
              {isLoading && <Loader className="h-3 w-3 animate-spin" />}
              {isLoading ? 'Processing...' : confirmText}
            </button>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-full border border-[#2a3f61] px-5 py-2 text-xs font-semibold text-[#9fb2cf] transition hover:border-orange-500 hover:text-orange-400 disabled:opacity-70 disabled:cursor-not-allowed"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminPanelPage;

