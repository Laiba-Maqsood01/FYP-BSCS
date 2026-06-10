import { useMemo, useState, useCallback } from 'react';
import {
  Bell,
  CalendarClock,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CircleX,
  CirclePlus,
  Eye,
  Gauge,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  ShieldCheck as ShieldCheckIcon,
  ShieldCheck,
  Trash2,
  UserRound,
  Check,
  X,
  Loader,
} from 'lucide-react';
import Header from '../components/Header.jsx';
import { mockUsers } from '../data/mockData.js';

const tabs = ['All Listings', 'Pending Review', 'Active', 'Rejected', 'Removed'];

const initialListings = [
  {
    id: 'corolla-grande',
    title: 'Toyota Corolla Altis Grande',
    year: 2023,
    fuel: 'Petrol',
    transmission: 'Automatic',
    city: 'Rahim Yar Khan',
    views: 342,
    leads: 12,
    price: 'PKR 67.5 Lac',
    postedAt: '20 Apr 2026',
    status: 'Active',
    featured: true,
    featuredUntil: '15 May 2026',
    image:
      '/assets/Toyota.webp',
  },
  {
    id: 'civic-urbo',
    title: 'Honda Civic Oriel',
    year: 2022,
    fuel: 'Petrol',
    transmission: 'Automatic',
    city: 'Lahore',
    views: 188,
    leads: 7,
    price: 'PKR 59.0 Lac',
    postedAt: '16 Apr 2026',
    status: 'Pending Review',
    featured: false,
    image:
      '/assets/Honda.png',
  },
  {
    id: 'sportage-fwd',
    title: 'KIA Sportage FWD',
    year: 2021,
    fuel: 'Petrol',
    transmission: 'Automatic',
    city: 'Islamabad',
    views: 95,
    leads: 3,
    price: 'PKR 84.0 Lac',
    postedAt: '10 Apr 2026',
    status: 'Pending Review',
    featured: false,
    image:
      '/assets/KIA.jpg',
  },
  {
    id: 'yaris-ativ',
    title: 'Toyota Yaris ATIV X',
    year: 2021,
    fuel: 'Petrol',
    transmission: 'Automatic',
    city: 'Karachi',
    views: 221,
    leads: 8,
    price: 'PKR 43.5 Lac',
    postedAt: '5 Apr 2026',
    status: 'Rejected',
    featured: false,
    image:
      '/assets/Toyota.webp',
  },
  {
    id: 'elantra-gls',
    title: 'Hyundai Elantra GLS',
    year: 2022,
    fuel: 'Petrol',
    transmission: 'Automatic',
    city: 'Multan',
    views: 129,
    leads: 5,
    price: 'PKR 66.0 Lac',
    postedAt: '1 Apr 2026',
    status: 'Active',
    featured: false,
    image:
      '/assets/Honda.png',
  },
  {
    id: 'city-manual',
    title: 'Honda City 1.3',
    year: 2019,
    fuel: 'Petrol',
    transmission: 'Manual',
    city: 'Bahawalpur',
    views: 54,
    leads: 1,
    price: 'PKR 34.0 Lac',
    postedAt: '28 Mar 2026',
    status: 'Removed',
    featured: false,
    image:
      '/assets/Suzuki.jpg',
  },
];

const statusColor = {
  Active: 'text-emerald-400 border-emerald-500/60',
  'Pending Review': 'text-amber-400 border-amber-500/60',
  Rejected: 'text-red-500 border-red-500/60',
  Removed: 'text-slate-300 border-slate-500/60',
};

function DashboardPage({ currentPage, onNavigate }) {
  const primaryUser = mockUsers[0];
  const [listings, setListings] = useState(initialListings);
  const [activeTab, setActiveTab] = useState('All Listings');
  const [activeSection, setActiveSection] = useState('My Listings');

  // Profile Settings State
  const [profileData, setProfileData] = useState({
    name: primaryUser?.name || 'Muhammad Ali',
    email: primaryUser?.email || 'ali.ahmed@email.com',
    phone: primaryUser?.phone || '0300-1234567',
    city: primaryUser?.city || 'Rahim Yar Khan',
    address: 'House 42, Liaquat Park Road',
  });

  const [initialProfileData] = useState(profileData);
  const [profileSaveState, setProfileSaveState] = useState(null); // 'saving', 'success', 'error', null
  const [notifications, setNotifications] = useState({
    listingUpdates: true,
    inspectionReminders: true,
    promotionalOffers: false,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaveState, setPasswordSaveState] = useState(null);

  const counts = useMemo(() => {
    const base = {
      'All Listings': listings.length,
      'Pending Review': 0,
      Active: 0,
      Rejected: 0,
      Removed: 0,
    };

    listings.forEach((listing) => {
      if (base[listing.status] !== undefined) {
        base[listing.status] += 1;
      }
    });

    return base;
  }, [listings]);

  const filteredListings = useMemo(() => {
    if (activeTab === 'All Listings') {
      return listings;
    }

    return listings.filter((listing) => listing.status === activeTab);
  }, [activeTab, listings]);

  const stats = useMemo(() => {
    const totalViews = listings.reduce((sum, item) => sum + item.views, 0);
    const totalLeads = listings.reduce((sum, item) => sum + item.leads, 0);
    const featured = listings.filter((item) => item.featured).length;

    return [
      { label: 'Total Views', value: totalViews },
      { label: 'Total Leads', value: totalLeads },
      { label: 'Active Listings', value: counts.Active, accent: 'text-emerald-400' },
      { label: 'Featured', value: featured, accent: 'text-orange-500' },
    ];
  }, [counts.Active, listings]);

  const sidebarMenu = [
    { label: 'My Listings', icon: CarFront, count: counts['All Listings'] },
    { label: 'Inspections', icon: ShieldCheck, count: 3 },
    { label: 'Profile Settings', icon: UserRound },
  ];

  const summaryCards = [
    { label: 'All Listings', color: 'text-white' },
    { label: 'Pending Review', color: 'text-amber-400' },
    { label: 'Active', color: 'text-emerald-400' },
    { label: 'Rejected', color: 'text-red-500' },
    { label: 'Removed', color: 'text-slate-300' },
  ];

  const handleRemove = (id) => {
    setListings((current) =>
      current.map((item) => (item.id === id ? { ...item, status: 'Removed', featured: false } : item)),
    );
    setActiveTab('Removed');
  };

  // Profile Settings Handlers
  const handleProfileChange = useCallback((field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleProfileSave = useCallback(async () => {
    setProfileSaveState('saving');
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setProfileSaveState('success');
    setTimeout(() => setProfileSaveState(null), 2000);
  }, []);

  const handleProfileReset = useCallback(() => {
    setProfileData(initialProfileData);
  }, [initialProfileData]);

  const handlePasswordChange = useCallback((field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  }, [passwordErrors]);

  const validatePassword = () => {
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handlePasswordSave = useCallback(async () => {
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordSaveState('saving');
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setPasswordSaveState('success');
    setTimeout(() => {
      setPasswordSaveState(null);
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 2000);
  }, []);

  const handleTwoFactorEnable = useCallback(async () => {
    setPasswordSaveState('saving');
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setTwoFactorEnabled(!twoFactorEnabled);
    setPasswordSaveState('success');
    setTimeout(() => {
      setPasswordSaveState(null);
      setShowTwoFactorModal(false);
    }, 1500);
  }, [twoFactorEnabled]);

  const handleNotificationToggle = useCallback((field) => {
    setNotifications((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  const renderSectionBody = () => {
    if (activeSection === 'Inspections') {
      const userInspections = [
        {
          id: 'insp_001',
          car: 'Suzuki Alto VXL AGS 2023',
          city: 'Rahim Yar Khan',
          address: 'House 42, Liaquat Park Road',
          slot: '12 May 2026, 10:00 am',
          status: 'Scheduled',
          amount: 'Rs 3,499',
          action: 'Reschedule',
        },
        {
          id: 'insp_002',
          car: 'Toyota Corolla Altis Grande 2023',
          city: 'KhanPur',
          address: 'Main GT Road, Near City Plaza',
          slot: '25 Apr 2026, 02:00 pm',
          status: 'Completed',
          amount: 'Rs 3,499',
          action: 'View Report',
        },
        {
          id: 'insp_003',
          car: 'Honda Civic RS Turbo 2024',
          city: 'Rahim Yar Khan',
          address: 'Block C, Model Town',
          slot: '15 May 2026, 11:00 am',
          status: 'Pending',
          amount: 'Rs 3,499',
          action: 'Cancel',
        },
      ];

      const inspectionStats = {
        total: userInspections.length,
        pending: userInspections.filter((item) => item.status === 'Pending').length,
        scheduled: userInspections.filter((item) => item.status === 'Scheduled').length,
        completed: userInspections.filter((item) => item.status === 'Completed').length,
      };

      return (
        <>
          {/* <div className="mt-6">
            <h2 className="text-4xl font-bold tracking-[-0.03em]">Manage Inspections</h2>
            <p className="mt-2 text-lg text-[#8ea2c2]">Track and manage your inspection requests</p>
          </div> */}

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InspectionStatCard label="Total Requests" tone="text-white" value={inspectionStats.total} />
            <InspectionStatCard label="Pending" tone="text-amber-400" value={inspectionStats.pending} />
            <InspectionStatCard label="Scheduled" tone="text-orange-400" value={inspectionStats.scheduled} />
            <InspectionStatCard label="Completed" tone="text-emerald-400" value={inspectionStats.completed} />
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-[#233554] bg-[#121f33]">
            <div className="grid grid-cols-[2fr_1.7fr_1.7fr_1fr_0.9fr_1.1fr] border-b border-[#233554] px-4 py-4 text-base font-semibold text-[#8ea2c2]">
              <p>CAR DETAILS</p>
              <p>LOCATION</p>
              <p>SLOT DATE</p>
              <p>STATUS</p>
              <p>AMOUNT</p>
              <p className="text-right">ACTIONS</p>
            </div>

            {userInspections.map((item) => (
              <div
                className="grid grid-cols-[2fr_1.7fr_1.7fr_1fr_0.9fr_1.1fr] items-center border-b border-[#233554] px-5 py-4"
                key={item.id}
              >
                <div>
                  <p className="text-base font-semibold">{item.car}</p>
                  <p className="text-sm text-[#8ea2c2]">ID: {item.id}</p>
                </div>

                <div>
                  <p className="text-base font-semibold">{item.city}</p>
                  <p className="text-sm text-[#8ea2c2]">{item.address}</p>
                </div>

                <p className="text-base font-semibold">{item.slot}</p>

                <StatusPill status={item.status} />

                <p className="text-base font-bold">{item.amount}</p>

                <div className="flex justify-end">
                  <button
                    className={`inline-flex items-center gap-2 text-xs font-semibold ${
                      item.action === 'Cancel' ? 'text-red-500' : 'text-orange-400'
                    }`}
                    type="button"
                  >
                    {item.action === 'Reschedule' ? <CalendarDays className="h-4 w-4" /> : null}
                    {item.action === 'View Report' ? <Eye className="h-4 w-4" /> : null}
                    {item.action === 'Cancel' ? <CircleX className="h-4 w-4" /> : null}
                    {item.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

  if (activeSection === 'Profile Settings') {
      return (
        <>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <section className="rounded-3xl border border-[#233554] bg-[#121f33] p-5">
              <h3 className="text-lg font-bold text-white">Personal Information</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ProfileInput
                  label="Full Name"
                  value={profileData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                />
                <ProfileInput
                  label="Email Address"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  type="email"
                />
                <ProfileInput
                  label="Phone Number"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  type="tel"
                />
                <ProfileInput
                  label="City"
                  value={profileData.city}
                  onChange={(e) => handleProfileChange('city', e.target.value)}
                />
              </div>
              <div className="mt-4">
                <ProfileInput
                  full
                  label="Address"
                  value={profileData.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                />
              </div>

              {profileSaveState === 'success' && (
                <div className="mt-4 rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <Check className="h-4 w-4" />
                  Changes saved successfully!
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaveState === 'saving'}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-[0_14px_34px_rgba(255,122,24,0.24)] transition hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  type="button"
                >
                  {profileSaveState === 'saving' && <Loader className="h-3 w-3 animate-spin" />}
                  {profileSaveState === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleProfileReset}
                  disabled={profileSaveState === 'saving'}
                  className="rounded-full border border-[#2a3f61] px-5 py-2 text-xs font-semibold text-[#9fb2cf] transition hover:border-orange-500 hover:text-orange-400 disabled:opacity-70 disabled:cursor-not-allowed"
                  type="button"
                >
                  Reset
                </button>
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-3xl border border-[#233554] bg-[#121f33] p-5">
                <h3 className="text-lg font-bold text-white">Security</h3>
                <div className="mt-4 space-y-3">
                  <SettingRow
                    actionLabel="Change Password"
                    description="Last updated 12 days ago"
                    icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />}
                    title="Password"
                    onAction={() => setShowPasswordModal(true)}
                  />
                  <SettingRow
                    actionLabel={twoFactorEnabled ? 'Disable' : 'Enable'}
                    description={twoFactorEnabled ? 'Two-factor authentication is active' : 'Add extra security to your account'}
                    icon={<CheckCircle2 className={`h-5 w-5 ${twoFactorEnabled ? 'text-emerald-400' : 'text-sky-400'}`} />}
                    title="Two-Factor Authentication"
                    onAction={() => setShowTwoFactorModal(true)}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-[#233554] bg-[#121f33] p-5">
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                <div className="mt-4 space-y-3">
                  <ToggleRow
                    checked={notifications.listingUpdates}
                    label="Listing updates"
                    onChange={() => handleNotificationToggle('listingUpdates')}
                  />
                  <ToggleRow
                    checked={notifications.inspectionReminders}
                    label="Inspection reminders"
                    onChange={() => handleNotificationToggle('inspectionReminders')}
                  />
                  <ToggleRow
                    checked={notifications.promotionalOffers}
                    label="Promotional offers"
                    onChange={() => handleNotificationToggle('promotionalOffers')}
                  />
                </div>

                <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2a3f61] px-4 py-1.5 text-xs font-semibold text-[#9fb2cf] transition hover:border-orange-500 hover:text-orange-400" type="button">
                  <Bell className="h-4 w-4" />
                  Manage Preferences
                </button>
              </div>
            </section>
          </div>

          {/* Password Change Modal */}
          {showPasswordModal && (
            <Modal title="Change Password" onClose={() => setShowPasswordModal(false)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.07em] text-[#8ea2c2] mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={`w-full min-h-[44px] rounded-2xl border bg-[#0d1729] px-3 text-sm text-white outline-none transition focus:border-orange-500 ${
                      passwordErrors.currentPassword ? 'border-red-500' : 'border-[#243652]'
                    }`}
                    placeholder="Enter your current password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.07em] text-[#8ea2c2] mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`w-full min-h-[44px] rounded-2xl border bg-[#0d1729] px-3 text-sm text-white outline-none transition focus:border-orange-500 ${
                      passwordErrors.newPassword ? 'border-red-500' : 'border-[#243652]'
                    }`}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-[0.07em] text-[#8ea2c2] mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`w-full min-h-[44px] rounded-2xl border bg-[#0d1729] px-3 text-sm text-white outline-none transition focus:border-orange-500 ${
                      passwordErrors.confirmPassword ? 'border-red-500' : 'border-[#243652]'
                    }`}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                {passwordSaveState === 'success' && (
                  <div className="rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <Check className="h-4 w-4" />
                    Password changed successfully!
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handlePasswordSave}
                    disabled={passwordSaveState === 'saving'}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {passwordSaveState === 'saving' && <Loader className="h-3 w-3 animate-spin" />}
                    {passwordSaveState === 'saving' ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    disabled={passwordSaveState === 'saving'}
                    className="rounded-full border border-[#2a3f61] px-5 py-2 text-xs font-semibold text-[#9fb2cf] transition hover:border-orange-500 hover:text-orange-400 disabled:opacity-70 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Two-Factor Authentication Modal */}
          {showTwoFactorModal && (
            <Modal
              title={twoFactorEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
              onClose={() => setShowTwoFactorModal(false)}
            >
              <div className="space-y-4">
                <p className="text-sm text-[#8ea2c2]">
                  {twoFactorEnabled
                    ? 'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
                    : 'Two-factor authentication adds an extra layer of security to your account. You will need to provide a code from your authenticator app when logging in.'}
                </p>

                <div className="rounded-2xl border border-[#233554] bg-[#0d1729] p-4">
                  <p className="text-xs font-semibold text-[#8ea2c2] mb-2">Steps to set up:</p>
                  <ol className="text-xs text-[#8ea2c2] space-y-1 list-decimal list-inside">
                    <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan the QR code with your app</li>
                    <li>Enter the 6-digit code from your app</li>
                    <li>Save backup codes in a safe place</li>
                  </ol>
                </div>

                {passwordSaveState === 'success' && (
                  <div className="rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-3 flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                    <Check className="h-4 w-4" />
                    {twoFactorEnabled ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled'}!
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleTwoFactorEnable}
                    disabled={passwordSaveState === 'saving'}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {passwordSaveState === 'saving' && <Loader className="h-3 w-3 animate-spin" />}
                    {passwordSaveState === 'saving' ? 'Processing...' : twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                  <button
                    onClick={() => setShowTwoFactorModal(false)}
                    disabled={passwordSaveState === 'saving'}
                    className="rounded-full border border-[#2a3f61] px-5 py-2 text-xs font-semibold text-[#9fb2cf] transition hover:border-orange-500 hover:text-orange-400 disabled:opacity-70 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </>
      );
    }

    return (
      <>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const isActive = activeTab === card.label;

            return (
              <button
                className={`rounded-2xl border bg-[#0c1629] px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-orange-500 shadow-[0_0_0_1px_rgba(255,122,24,0.12)]'
                    : 'border-[#233554] hover:border-[#2f4368]'
                }`}
                key={card.label}
                onClick={() => setActiveTab(card.label)}
                type="button"
              >
                <p className={`text-3xl font-black ${card.color}`}>{counts[card.label]}</p>
                <p className="mt-1.5 text-sm text-[#8ea2c2]">{card.label}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 overflow-x-auto rounded-full border border-[#233554] bg-[#121f33] p-1">
          <div className="flex min-w-max items-center gap-2">
            {tabs.map((tab) => (
              <button
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-orange-500 text-white' : 'text-[#92a6c5] hover:text-white'}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {filteredListings.length === 0 ? (
            <div className="rounded-2xl border border-[#233554] bg-[#121f33] p-5 text-center text-base text-[#8ea2c2]">
              No listings in {activeTab}.
            </div>
          ) : null}

          {filteredListings.map((listing) => (
            <article className="rounded-3xl border border-[#233554] bg-[#121f33] p-4" key={listing.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-3 md:flex-row">
                  <img
                    alt={listing.title}
                    className="h-28 w-full max-w-[220px] rounded-xl object-cover"
                    src={listing.image}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold tracking-[-0.02em]">{listing.title}</h2>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColor[listing.status]}`}>
                        {listing.status}
                      </span>
                      {listing.featured ? (
                        <span className="rounded-full border border-orange-500/60 px-2 py-0.5 text-xs font-semibold text-orange-400">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-[#91a3bf]">
                      {listing.year} &nbsp; {listing.fuel} &nbsp; {listing.transmission} &nbsp; {listing.city}
                    </p>
                    <p className="mt-0.5 text-xs text-[#91a3bf]">
                      {listing.views} views &nbsp; • &nbsp; {listing.leads} leads
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-base font-semibold">
                      {listing.featured && listing.featuredUntil ? (
                        <button className="inline-flex items-center gap-2 text-[#9db0cc]" type="button">
                          <Gauge className="h-4 w-4" /> Featured until {listing.featuredUntil}
                        </button>
                      ) : null}
                      <button
                        className="inline-flex items-center gap-2 text-[#9db0cc]"
                        onClick={() => onNavigate('Car Details')}
                        type="button"
                      >
                        <Eye className="h-4 w-4" /> View
                      </button>
                      <button
                        className="inline-flex items-center gap-2 text-[#9db0cc]"
                        onClick={() => onNavigate('Post an Ad')}
                        type="button"
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-2 text-red-500"
                        onClick={() => handleRemove(listing.id)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-black text-orange-500">{listing.price}</p>
                  <p className="mt-1.5 text-base text-[#8ea2c2]">Posted {listing.postedAt}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  };

  return (
    <main className="min-h-screen bg-[#060d1e] text-white">
      <section className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8">
        <Header activeNav={currentPage} onNavChange={onNavigate} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-[24px] border border-[#233554] bg-[#121f33] p-5">
              <div className="flex items-center gap-4">
                <img
                  alt={primaryUser?.name || 'Muhammad Ali'}
                  className="h-16 w-16 rounded-2xl object-cover"
                  src={primaryUser?.avatar || '/assets/Honda.png'}
                />
                <div>
                  <p className="text-xl font-bold">{primaryUser?.name || 'Muhammad Ali'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#8ea2c2]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {primaryUser?.city || 'Rahim Yar Khan'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {primaryUser?.email || 'ali.ahmed@email.com'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#233554] bg-[#121f33] py-4">
              <p className="border-b border-[#233554] px-5 pb-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8195b6]">
                Dashboard Menu
              </p>
              <div className="space-y-1 px-3 pt-3">
                {sidebarMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.label;

                  return (
                    <button
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${isActive ? 'text-orange-500' : 'text-[#9eb0cc] hover:bg-[#1a2a43]'}`}
                      key={item.label}
                      onClick={() => setActiveSection(item.label)}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-3 text-lg font-semibold">
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </span>
                      {item.count ? (
                        <span
                          className={`grid h-7 min-w-7 place-items-center rounded-full px-2 text-sm font-bold ${isActive ? 'bg-orange-500 text-white' : 'bg-[#223554] text-[#9fb3d3]'}`}
                        >
                          {item.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 border-t border-[#233554] px-3 pt-3">
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-lg font-semibold text-red-500 transition hover:bg-[#1a2a43]"
                  onClick={() => onNavigate('Home')}
                  type="button"
                >
                  <LogOut className="h-5 w-5" /> Logout
                </button>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#233554] bg-[#121f33] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#8195b6]">Quick Stats</p>
              <div className="mt-4 space-y-3">
                {stats.map((item) => (
                  <div className="flex items-center justify-between text-xl" key={item.label}>
                    <span className="text-[#92a6c5]">{item.label}</span>
                    <span className={`font-bold ${item.accent || 'text-white'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-[-0.03em]">{activeSection}</h1>
                <p className="mt-2 text-base text-[#8ea2c2]">
                  {activeSection === 'My Listings'
                    ? 'View, edit, and manage all your car listings'
                    : 'Manage and monitor your dashboard activity'}
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(255,122,24,0.24)] transition hover:-translate-y-0.5"
                onClick={() => onNavigate('Post an Ad')}
                type="button"
              >
                <CirclePlus className="h-5 w-5" /> Post New Ad
              </button>
            </div>

            {renderSectionBody()}
          </section>
        </div>
      </section>
    </main>
  );
}

function InspectionStatCard({ label, value, tone }) {
  return (
    <article className="rounded-2xl border border-[#233554] bg-[#121f33] px-4 py-3">
      <p className={`text-3xl font-black ${tone}`}>{value}</p>
      <p className="mt-1.5 text-sm text-[#8ea2c2]">{label}</p>
    </article>
  );
}

function StatusPill({ status }) {
  if (status === 'Completed') {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/70 px-3 py-1.5 text-xs font-semibold text-emerald-400">
        <ShieldCheckIcon className="h-3 w-3" />
        Completed
      </span>
    );
  }

  if (status === 'Scheduled') {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-orange-500/70 px-3 py-1.5 text-xs font-semibold text-orange-400">
        <CalendarClock className="h-3 w-3" />
        Scheduled
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-500/70 px-3 py-1.5 text-xs font-semibold text-amber-400">
      <CalendarClock className="h-3 w-3" />
      Pending
    </span>
  );
}

function ProfileInput({ label, value, full, onChange, type = 'text' }) {
  return (
    <label className={`grid gap-2 ${full ? 'w-full' : ''}`}>
      <span className="text-xs font-bold uppercase tracking-[0.07em] text-[#8ea2c2]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="min-h-[44px] rounded-2xl border border-[#243652] bg-[#0d1729] px-3 text-sm text-white outline-none transition focus:border-orange-500"
      />
    </label>
  );
}

function SettingRow({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#243652] bg-[#0d1729] px-4 py-2.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{icon}</span>
        <div>
          <p className="text-xs font-semibold text-white">{title}</p>
          <p className="text-xs text-[#8ea2c2]">{description}</p>
        </div>
      </div>
      <button
        onClick={onAction}
        className="rounded-full border border-[#2a3f61] px-3 py-1.5 text-xs font-semibold text-[#9fb2cf] transition hover:border-orange-500 hover:text-orange-400 active:scale-95"
        type="button"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#243652] bg-[#0d1729] px-4 py-2.5">
      <p className="text-xs font-semibold text-white">{label}</p>
      <button
        onClick={onChange}
        className={`inline-flex h-5 w-10 items-center rounded-full p-0.5 transition cursor-pointer ${checked ? 'bg-orange-500' : 'bg-[#2a3f61]'}`}
        type="button"
      >
        <span className={`h-3 w-3 rounded-full bg-white transition ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
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

export default DashboardPage;
