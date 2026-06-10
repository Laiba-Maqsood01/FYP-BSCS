import { useState } from 'react';
import Header from '../components/Header.jsx';

function AdminLoginPage({ currentPage, onNavigate, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const success = onLogin('admin', email, password);
    if (!success) {
      setError('Invalid admin credentials.');
      return;
    }

    setError('');
  };

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <Header activeNav={currentPage} onNavChange={onNavigate} />

        <div className="mt-20 rounded-[32px] border border-white/10 bg-[#121c2e] px-8 py-12 shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white">Admin Login</h1>
            <p className="mt-4 text-sm text-[#91a4c0]">
              This login page is only for admin users. Enter the admin credentials below or open this page directly by URL.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[28px] border border-white/10 bg-[#0c1726] p-8">
              <p className="text-sm text-[#8ea2c2]">Admin credentials (dummy):</p>
              <div className="mt-4 space-y-3 text-sm text-white/80">
                <p><span className="font-semibold">Email:</span> admin@autohub.com</p>
                <p><span className="font-semibold">Password:</span> admin123</p>
              </div>
            </div>

            <form className="rounded-[28px] border border-white/10 bg-[#0c1726] p-8" onSubmit={handleSubmit}>
              <label className="block text-sm text-[#9fb3d3]">
                Admin Email
                <input
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-[#101b2f] px-4 py-3 text-sm text-white outline-none"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@autohub.com"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <label className="mt-5 block text-sm text-[#9fb3d3]">
                Password
                <input
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-[#101b2f] px-4 py-3 text-sm text-white outline-none"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="admin123"
                  required
                  type="password"
                  value={password}
                />
              </label>

              {error ? (
                <p className="mt-4 text-sm text-rose-400">{error}</p>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  type="submit"
                >
                  Sign in as Admin
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:border-orange-500"
                  onClick={() => onNavigate('Home')}
                  type="button"
                >
                  Back to Home
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminLoginPage;
