import { useEffect, useState } from 'react';
import { ArrowRight, Check, CircleAlert, Crown, User } from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

const saleOptions = [
  {
    id: 'generic',
    eyebrow: 'GENERIC SALE',
    title: 'Sell It Myself!',
    description:
      "Post an ad in 2 minutes and connect directly with buyers. Simple, free, and you're in control.",
    icon: User,
    points: [
      'Post an ad in 2 minutes',
      'Connect directly with buyers',
      'Set your own price',
      'Manage your listing',
    ],
  },
  {
    id: 'managed',
    eyebrow: 'MANAGED SALE',
    title: 'Sell It For Me',
    description:
      'Let our experts handle everything. Free inspection, featured ad, and a dedicated sales agent to get you the best deal.',
    icon: Crown,
    points: [
      'Free Car Inspection',
      'Featured Ad included',
      'Dedicated Sales Agent',
      'Best Price Guarantee',
    ],
    note: 'Available only in Rahim Yar Khan, KhanPur, Liaqat Pur, and Sadiqabad',
  },
];

function SellOptionsPage({ currentPage, onNavigate, initialSelection }) {
  const [selectedOption, setSelectedOption] = useState(initialSelection || 'generic');

  useEffect(() => {
    setSelectedOption(initialSelection || 'generic');
  }, [initialSelection]);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <section className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <Header activeNav={currentPage} onNavChange={onNavigate} />

        <div className="mt-14 rounded-[32px] border border-white/6 bg-[radial-gradient(circle_at_top,#1b2640_0%,#121a2a_45%,#0d1422_100%)] px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1040px]">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ff7a18]">
                Sell Your Car
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                Choose the selling plan that fits you best
              </h1>
              <p className="mx-auto mt-4 max-w-[720px] text-sm leading-7 text-[#91a1bf] sm:text-base">
                Select between selling it yourself or letting our experts handle
                the process for you.
              </p>
            </div>

            <div className="mt-12 grid gap-8 xl:grid-cols-2">
              {saleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedOption === option.id;

                return (
                  <button
                    key={option.id}
                    className={`relative rounded-[28px] border p-10 text-left transition ${
                      isSelected
                        ? 'border-orange-500 bg-[#161f2d] shadow-[0_0_0_1px_rgba(255,122,24,0.15)]'
                        : 'border-[#293852] bg-[#161f2d] hover:border-orange-500/40'
                    }`}
                    onClick={() => setSelectedOption(option.id)}
                    type="button"
                  >
                    {isSelected ? (
                      <span className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-orange-500 text-white">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}

                    <span className="mb-10 flex h-11 w-11 items-center justify-center text-orange-500">
                      <Icon className="h-7 w-7" />
                    </span>

                    <p className="text-[0.95rem] font-medium uppercase tracking-[0.09em] text-[#87a1c8]">
                      {option.eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-white md:text-[2.15rem]">
                      {option.title}
                    </h3>
                    <p className="mt-4 max-w-[520px] text-lg leading-9 text-[#90a3c4]">
                      {option.description}
                    </p>

                    <div className="mt-8 space-y-4">
                      {option.points.map((point) => (
                        <div className="flex items-start gap-3 text-lg text-white" key={point}>
                          <Check className="mt-1 h-4 w-4 shrink-0 text-orange-500" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>

                    {option.note ? (
                      <div className="mt-8 flex items-start gap-3 text-[1.05rem] leading-7 text-orange-400">
                        <CircleAlert className="mt-1 h-4 w-4 shrink-0" />
                        <span>{option.note}</span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-12 flex flex-col items-center">
              <button
                className="inline-flex min-h-[60px] items-center justify-center gap-3 rounded-full bg-orange-500 px-10 text-2xl font-semibold text-white transition hover:scale-[1.02] hover:bg-orange-600"
                onClick={() =>
                  onNavigate(
                    selectedOption === 'generic' ? 'Generic Sale Flow' : 'Managed Sale Flow',
                  )
                }
                type="button"
              >
                Continue
                <ArrowRight className="h-6 w-6" />
              </button>

              <p className="mt-4 text-lg text-[#7f93b6]">
                You can change your selection later
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </main>
  );
}

export default SellOptionsPage;
