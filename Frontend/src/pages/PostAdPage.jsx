import { useState } from 'react';
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

function PostAdPage({ currentPage, onNavigate }) {
  const [selectedOption, setSelectedOption] = useState('generic');

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <section className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <Header activeNav={currentPage} onNavChange={onNavigate} />

        <div className="mt-10">
          <div className="mx-auto max-w-[860px] text-center">
            <h1 className="text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl">
              Sell Your Car Online
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#8ea2c2] sm:text-xl">
              Choose how you want to sell your car. Post it yourself or let our
              experts handle everything.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-[1180px] grid gap-6 xl:grid-cols-2">
              {saleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedOption === option.id;

                return (
                  <button
                    key={option.id}
                    className={`relative min-h-[420px] rounded-[24px] border p-8 text-left transition ${
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

                    <span className="mb-8 flex h-11 w-11 items-center justify-center text-orange-500">
                      <Icon className="h-7 w-7" />
                    </span>

                    <p className="text-[0.85rem] font-semibold uppercase tracking-[0.08em] text-[#87a1c8]">
                      {option.eyebrow}
                    </p>
                    <h3 className="mt-2 text-[2.4rem] font-bold tracking-[-0.02em] text-white">
                      {option.title}
                    </h3>
                    <p className="mt-4 max-w-[520px] text-[1.1rem] leading-9 text-[#90a3c4]">
                      {option.description}
                    </p>

                    <div className="mt-8 space-y-3">
                      {option.points.map((point) => (
                        <div className="flex items-start gap-3 text-[1.05rem] text-white" key={point}>
                          <Check className="mt-1 h-4 w-4 shrink-0 text-orange-500" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>

                    {option.note ? (
                        <div className="mt-7 flex items-start gap-3 text-[0.98rem] leading-7 text-orange-400">
                          <CircleAlert className="mt-1 h-4 w-4 shrink-0" />
                          <span>{option.note}</span>
                        </div>
                      ) : null}
                  </button>
                );
              })}
          </div>

          <div className="mt-10 flex flex-col items-center">
            <button
              className="inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full bg-orange-500 px-9 text-xl font-semibold text-white transition hover:scale-[1.02] hover:bg-orange-600"
              onClick={() =>
                onNavigate(selectedOption === 'generic' ? 'Generic Sale Flow' : 'Managed Sale Flow')
              }
              type="button"
            >
              Continue
              <ArrowRight className="h-5 w-5" />
            </button>

            <p className="mt-3 text-base text-[#7f93b6]">You can change your selection later</p>
          </div>
        </div>
      </section>
      <Footer onNavigate={onNavigate} />
    </main>
  );
}

export default PostAdPage;
