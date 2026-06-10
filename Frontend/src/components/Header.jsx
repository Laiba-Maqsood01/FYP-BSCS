import { useContext, useEffect, useRef, useState } from 'react';
import {
  ChevronUp,
  CirclePlus,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext.jsx';

const navItems = ['Home', 'Browse Cars', 'Post an Ad'];

function Header({ activeNav, onNavChange }) {
  const { auth, onLogin, onLogout } = useContext(AuthContext);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileRef.current) {
        return;
      }

      if (!profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = auth.role === 'user'
    ? [
        { label: 'Dashboard', icon: LayoutDashboard, action: () => onNavChange('Dashboard') },
      ]
    : auth.role === 'admin'
      ? [
          { label: 'Admin Panel', icon: ShieldCheck, action: () => onNavChange('Admin Panel') },
        ]
      : [];

  const handleLoginSubmit = (event) => {
    event.preventDefault();

    const success = onLogin('user', loginEmail, loginPassword);
    if (!success) {
      setLoginError('Invalid email or password.');
      return;
    }

    setLoginError('');
    setIsProfileOpen(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  return (
    <header
      className={`sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 transition-all ${
        isScrolled
          ? 'border-b border-white/5 bg-[linear-gradient(180deg,rgba(22,33,52,0.95)_0%,rgba(18,30,49,0.92)_100%)] px-5 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.28)] backdrop-blur-md'
          : 'px-0 py-0'
      }`}
    >
        <button
          className="inline-flex items-center gap-3"
          onClick={() => onNavChange('Home')}
          type="button"
        >
          <span className="relative h-7 w-7 rounded-[10px] bg-[linear-gradient(135deg,#f5f7fb_0%,#ff7a18_100%)] shadow-[0_10px_30px_rgba(255,122,24,0.25)] [transform:skew(-12deg)]">
            <span className="absolute inset-[5px] rounded-[7px] bg-[rgba(11,18,32,0.55)]" />
          </span>
          <span className="text-[1.9rem] font-extrabold tracking-[-0.05em]">AutoHub</span>
        </button>

        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center justify-center gap-6 text-base font-semibold text-slate-100 sm:gap-10"
        >
          {navItems.map((item) => {
            const isActive = activeNav === item;

            return (
              <button
                key={item}
                className={`group relative pb-1.5 transition ${
                  isActive
                    ? 'text-orange-400'
                    : 'text-slate-300 hover:text-orange-400'
                }`}
                onClick={() => onNavChange(item)}
                type="button"
              >
                {item}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] rounded-full bg-orange-500 transition-all duration-200 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        <div className="relative" ref={profileRef}>
          <button
            className="inline-flex items-center gap-3 rounded-full border border-[#223251] bg-[#111b2c] px-2 py-2 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-[#2d4268]"
            onClick={() => setIsProfileOpen((current) => !current)}
            type="button"
          >
            <img
              alt={auth.role === 'guest' ? 'Sign In' : auth.name}
              className="h-9 w-9 rounded-full object-cover"
              src="/assets/profile.avif"
            />
            <span className="text-lg font-semibold">
              {auth.role === 'guest' ? 'Sign In' : auth.name}
            </span>
            <ChevronUp
              className={`h-4 w-4 text-slate-400 transition ${isProfileOpen ? '' : 'rotate-180'}`}
            />
          </button>

        {isProfileOpen ? (
            <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[320px] overflow-hidden rounded-3xl border border-[#233554] bg-[#131f31] shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
              {auth.role === 'guest' ? (
                <div className="px-6 py-5">
                    <p className="mb-4 text-sm text-[#8ea2c2]">
                    Use user@autohub.com / user123 to sign in.
                  </p>

                  <form className="space-y-3" onSubmit={handleLoginSubmit}>
                    <label className="block text-sm text-[#9fb3d3]">
                      Email
                      <input
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b162b] px-3 py-2 text-sm text-white outline-none"
                        onChange={(event) => setLoginEmail(event.target.value)}
                        placeholder="Email"
                        required
                        type="email"
                        value={loginEmail}
                      />
                    </label>
                    <label className="block text-sm text-[#9fb3d3]">
                      Password
                      <input
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b162b] px-3 py-2 text-sm text-white outline-none"
                        onChange={(event) => setLoginPassword(event.target.value)}
                        placeholder="Password"
                        required
                        type="password"
                        value={loginPassword}
                      />
                    </label>

                    {loginError ? (
                      <p className="text-sm text-rose-400">{loginError}</p>
                    ) : null}

                    <button
                      className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                      type="submit"
                    >
                      Sign in
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="border-b border-[#233554] px-6 py-5">
                    <p className="text-2xl font-bold leading-none tracking-[-0.02em] text-white">
                      {auth.name}
                    </p>
                    <p className="mt-2 text-sm text-[#8ea2c2]">{auth.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#6b82a1]">
                      Signed in as {auth.role}
                    </p>
                  </div>

                  <div className="px-4 py-3">
                    {menuItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left text-[#d4deee] transition hover:bg-[#1b2b44]"
                          key={item.label}
                          onClick={() => {
                            item.action();
                            setIsProfileOpen(false);
                          }}
                          type="button"
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-base font-medium">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-[#233554] px-4 py-3">
                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left text-red-500 transition hover:bg-[#1b2b44]"
                      onClick={() => {
                        onLogout();
                        setIsProfileOpen(false);
                      }}
                      type="button"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="text-base font-medium">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
        ) : null}
      </div>
    </header>
  );
}

export default Header;

