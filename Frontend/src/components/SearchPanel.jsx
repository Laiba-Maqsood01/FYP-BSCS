import { ChevronDownIcon, SearchIcon, SlidersIcon } from './Icons.jsx';

const cities = ['All Cities', 'Rahim Yar Khan', 'Khanpur', 'Liaqat Pur', 'Sadiqabad'];
const bodyTypes = ['Any Body Type', 'Sedan', 'SUV', 'Hatchback', 'Crossover'];
const fuelTypes = ['Any Fuel Type', 'Petrol', 'Diesel', 'Hybrid', 'Electric'];

function SearchPanel({
  filters,
  onFilterChange,
  onSearch,
  showAdvanced,
  onToggleAdvanced,
}) {
  return (
    <section
      className="relative z-10 mx-auto -mt-18 w-[calc(100%-1rem)] max-w-[1460px] rounded-[30px] bg-[#151d2c] px-4 py-5 shadow-[0_24px_60px_rgba(5,9,16,0.42),inset_0_0_0_1px_rgba(154,173,213,0.08)] sm:w-[94%] sm:px-6 sm:py-6 lg:px-7 lg:py-7"
      id="search-panel"
    >
      <div className="grid gap-4 lg:grid-cols-[1.18fr_0.9fr_1.12fr_auto] lg:items-end lg:gap-4">
        <label className="flex flex-col gap-3">
          <span className="text-[0.82rem] font-bold uppercase tracking-[0.05em] text-[#7f91b2] sm:text-[0.9rem]">
            Car Make Or Model
          </span>
          <div className="flex min-h-[58px] items-center gap-3 rounded-[20px] bg-[#293349] px-5">
            <SearchIcon className="h-4 w-4 text-[#7d8dad]" />
            <input
              className="w-full border-0 bg-transparent text-[15px] text-white outline-none placeholder:text-[#7d8dad]"
              onChange={(event) => onFilterChange('model', event.target.value)}
              placeholder="e.g. Toyota Corolla"
              type="text"
              value={filters.model}
            />
          </div>
        </label>

        <SelectField
          label="City"
          options={cities}
          value={filters.city}
          onChange={(value) => onFilterChange('city', value)}
        />

        <div className="flex min-w-0 flex-col gap-3">
          <span className="text-[0.82rem] font-bold uppercase tracking-[0.05em] text-[#7f91b2] sm:text-[0.9rem]">
            Price Range (Lacs)
          </span>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_42px_minmax(0,1fr)] sm:items-center">
            <NumberStepperField
              label="Min"
              onChange={(value) => onFilterChange('minPrice', value)}
              value={filters.minPrice}
            />
            <strong className="text-center text-sm font-bold uppercase tracking-[0.08em] text-[#a2aec8]">
              to
            </strong>
            <NumberStepperField
              label="Max"
              onChange={(value) => onFilterChange('maxPrice', value)}
              value={filters.maxPrice}
            />
          </div>
        </div>

        <button
          className="inline-flex min-h-[58px] items-center justify-center gap-3 rounded-full bg-[#ff7a18] px-8 text-base font-bold text-white shadow-[0_14px_34px_rgba(255,122,24,0.24)] transition hover:-translate-y-0.5 lg:min-w-[152px] lg:self-end"
          onClick={onSearch}
          type="button"
        >
          <SearchIcon />
          Search
        </button>
      </div>

      {showAdvanced ? (
        <div className="mt-5 grid gap-4 border-t border-white/8 pt-5 md:grid-cols-2">
          <SelectField
            label="Body Type"
            options={bodyTypes}
            value={filters.bodyType}
            onChange={(value) => onFilterChange('bodyType', value)}
          />
          <SelectField
            label="Fuel Type"
            options={fuelTypes}
            value={filters.fuelType}
            onChange={(value) => onFilterChange('fuelType', value)}
          />
        </div>
      ) : null}

      <div className="mt-5 border-t border-white/8 pt-4 text-center">
        <button
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#8294b5] transition hover:text-slate-200"
          onClick={onToggleAdvanced}
          type="button"
        >
          <SlidersIcon />
          {showAdvanced ? 'Hide Extra Filters' : 'Filter More Options'}
        </button>
      </div>
    </section>
  );
}

function SelectField({ label, options, value, onChange }) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-[0.82rem] font-bold uppercase tracking-[0.05em] text-[#7f91b2] sm:text-[0.9rem]">
        {label}
      </span>
      <div className="relative flex min-h-[58px] items-center rounded-[20px] bg-[#293349] px-5">
        <select
          className="w-full appearance-none border-0 bg-transparent pr-8 text-[15px] text-white outline-none"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {options.map((option) => (
            <option className="bg-[#f8fafc] text-[#0f172a]" key={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 h-4 w-4 text-[#7d8dad]" />
      </div>
    </label>
  );
}

function NumberStepperField({ label, value, onChange }) {
  const parsedValue = Number.parseInt(value, 10);
  const safeValue = Number.isNaN(parsedValue) ? 0 : parsedValue;

  const handleStep = (delta) => {
    const nextValue = Math.max(0, safeValue + delta);
    onChange(String(nextValue));
  };

  return (
    <div className="flex min-h-[58px] items-center rounded-[20px] bg-[#293349] pl-5 pr-2">
      <span className="shrink-0 text-[15px] font-semibold text-[#9aaccc]">{label}</span>
      <input
        className="w-full border-0 bg-transparent px-3 text-[15px] text-white outline-none"
        inputMode="numeric"
        onChange={(event) => {
          const nextValue = event.target.value.replace(/[^0-9]/g, '');
          onChange(nextValue);
        }}
        type="text"
        value={value || '0'}
      />

      <div className="flex flex-col gap-1">
        <button
          aria-label={`Increase ${label}`}
          className="grid h-5 w-7 place-items-center rounded-md text-[#9aaccc] transition hover:bg-white/8 hover:text-white"
          onClick={() => handleStep(1)}
          type="button"
        >
          <ChevronUpSmall />
        </button>
        <button
          aria-label={`Decrease ${label}`}
          className="grid h-5 w-7 place-items-center rounded-md text-[#9aaccc] transition hover:bg-white/8 hover:text-white"
          onClick={() => handleStep(-1)}
          type="button"
        >
          <ChevronDownSmall />
        </button>
      </div>
    </div>
  );
}

function ChevronUpSmall() {
  return (
    <svg
      aria-hidden="true"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 14 6-6 6 6" />
    </svg>
  );
}

function ChevronDownSmall() {
  return (
    <svg
      aria-hidden="true"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 10 6 6 6-6" />
    </svg>
  );
}

export default SearchPanel;
