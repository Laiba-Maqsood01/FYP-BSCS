import { PlusCircleIcon, SearchIcon } from './Icons.jsx';

function HeroContent({ onBrowseClick, onPostAdClick }) {
  return (
    <div className="mx-auto mt-18 flex max-w-[980px] flex-col items-center text-center sm:mt-24">
      <h1 className="animate-fade-in-down text-[2.9rem] font-black leading-[0.96] tracking-[-0.07em] sm:text-[4.2rem] lg:text-[5rem]">
        Find Your Perfect <span className="text-[#ff7a18]">Used Car</span>
      </h1>

      <p className="animate-fade-in-up mt-6 max-w-[760px] text-[15px] leading-8 text-[#8696b5] sm:text-[1rem]">
        Pakistan&apos;s trusted platform for buying and selling used cars with
        verified listings and professional inspections.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          className="animate-fade-in-up-delay-1 inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full bg-[#ff7a18] px-8 text-base font-bold text-white shadow-[0_14px_34px_rgba(255,122,24,0.24)] transition hover:-translate-y-0.5"
          onClick={onBrowseClick}
          type="button"
        >
          <SearchIcon />
          Search Cars
        </button>

        <button
          className="animate-fade-in-up-delay-2 inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full bg-transparent px-8 text-base font-bold text-[#ff7a18] shadow-[inset_0_0_0_1px_rgba(255,122,24,0.65)] transition hover:-translate-y-0.5 hover:bg-[#ff7a18] hover:text-white"
          onClick={onPostAdClick}
          type="button"
        >
          <PlusCircleIcon />
          Post an Ad
        </button>
      </div>
    </div>
  );
}

export default HeroContent;
