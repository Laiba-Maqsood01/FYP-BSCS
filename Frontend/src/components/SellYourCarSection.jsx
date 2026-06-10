// src/components/SellYourCarSection.jsx

import { User, Crown } from 'lucide-react';

export default function SellYourCarSection({ onGenericSale, onManagedSale }) {
  return (
    <section className="bg-[#020817] px-6 py-20 md:px-10">
      <div className="mx-auto w-full max-w-[1700px]">
        <div className="relative overflow-hidden rounded-[32px] border border-[#1c2940] bg-[radial-gradient(circle_at_center,#1a2336_0%,#0a1120_70%)] px-8 py-14 md:px-14">
          <div className="absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="mb-5 text-4xl font-bold leading-tight text-white md:text-5xl">
                Want to Sell Your Car?
              </h2>

              <p className="mb-8 text-lg leading-8 text-gray-400">
                Choose how you want to sell. List it yourself with Generic Sale,
                or let our experts handle everything with Managed Sale.
              </p>

              <div className="flex flex-wrap gap-5">
                <button
                  className="flex items-center gap-3 rounded-full bg-orange-500 px-8 py-4 text-lg font-semibold text-white transition hover:scale-105 hover:bg-orange-600"
                  onClick={onGenericSale}
                  type="button"
                >
                  <User size={20} />
                  Generic Sale
                </button>

                <button
                  className="flex items-center gap-3 rounded-full border border-orange-500 px-8 py-4 text-lg font-semibold text-orange-500 transition hover:bg-orange-500 hover:text-white"
                  onClick={onManagedSale}
                  type="button"
                >
                  <Crown size={20} />
                  Managed Sale
                </button>
              </div>
            </div>

            <div className="hidden items-center justify-center lg:flex">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/5">
                <Crown className="text-orange-500" size={48} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
