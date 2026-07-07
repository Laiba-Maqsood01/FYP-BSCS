import { useEffect, useMemo, useRef, useState } from "react";
import { Search, PlusCircle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const fieldLabel = "text-[0.67rem] font-bold tracking-[0.07em] text-brand-muted uppercase mb-2 block";

function CityDropdown({ cities, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = cities.find(c => c._id === value);
  const filtered = cities.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  const openDropdown = () => {
    setQuery("");
    setOpen(p => !p);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={openDropdown}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-black/10 text-[0.9rem] text-left transition"
        style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}
      >
        <span className={selected ? "text-brand-dark2" : "text-gray-400"}>
          {selected ? selected.name : "All Cities"}
        </span>
        <ChevronDown size={15} className="text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-black/10 rounded-xl shadow-[0_10px_30px_rgba(15,23,42,0.1)] max-h-56 flex flex-col overflow-hidden z-500">
          {/* Search bar */}
          <div className="p-2 border-b border-black/6 shrink-0">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                className="w-full bg-brand-surface border border-black/10 rounded-lg text-brand-dark2 text-[0.85rem] outline-none focus:border-[#374151] transition pl-8 pr-3 py-2"
                placeholder="Search cities..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          {/* List */}
          <div className="overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 text-[0.88rem] cursor-pointer transition ${
                value === "" ? "bg-[#f1f5f9] font-semibold text-brand-dark" : "text-[#374151] hover:bg-brand-surface"
              }`}
            >
              All Cities
            </button>
            {filtered.map(c => (
              <button
                key={c._id}
                type="button"
                onClick={() => { onChange(c._id); setOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 text-[0.88rem] cursor-pointer transition ${
                  value === c._id ? "bg-[#f1f5f9] font-semibold text-brand-dark" : "text-[#374151] hover:bg-brand-surface"
                }`}
              >
                {c.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-[0.85rem] text-brand-muted">No cities found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
const inputBase =
  "w-full bg-brand-surface border border-black/10 rounded-lg text-brand-dark2 text-[0.9rem] outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition";

const suggestionHeading = "px-4 pt-2.5 pb-1 text-[0.7rem] font-bold text-brand-muted uppercase tracking-[0.06em]";

export default function HeroSection() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchBoxRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    api.get("/master/cities").then((res) => setCities(res.data?.data || [])).catch(() => {});
    api.get("/master/brands").then((res) => setBrands(res.data?.data || [])).catch(() => {});
    api.get("/master/models").then((res) => setModels(res.data?.data || [])).catch(() => {});
  }, []);

  // Close make/model suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setSuggestionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Makes and models whose name starts with what the user typed
  const suggestions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return { makes: [], models: [] };

    const makes = brands.filter(b => b.name.toLowerCase().startsWith(q));
    const matchedModels = models.filter(m => {
      const modelName = m.name.toLowerCase();
      const fullName = `${m.brand?.name ?? ""} ${m.name}`.trim().toLowerCase();
      return modelName.startsWith(q) || fullName.startsWith(q);
    });

    return { makes, models: matchedModels };
  }, [searchText, brands, models]);

  const hasSuggestions = suggestions.makes.length > 0 || suggestions.models.length > 0;

  const pickSuggestion = (text) => {
    setSearchText(text);
    setSuggestionsOpen(false);
  };

  const handleScrollToSearch = () => {
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => searchInputRef.current?.focus(), 400);
  };

  const handleSearch = () => {
    setSuggestionsOpen(false);
    const params = new URLSearchParams();
    if (searchText.trim()) params.set("search", searchText.trim());
    if (selectedCity) params.set("city", selectedCity);
    if (minPrice) params.set("minPrice", String(Number(minPrice) * 100000));
    if (maxPrice) params.set("maxPrice", String(Number(maxPrice) * 100000));
    navigate(`/browse-cars?${params.toString()}`);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  return (
    <section className="bg-transparent pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Banner text */}
        <div className="flex flex-col items-center text-center mb-10">
          <h1
            className="font-bold tracking-tight text-brand-dark2 mb-4"
            style={{ fontSize: "clamp(1.9rem, 2.7vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            Find Your Perfect{" "}
            <span className="italic text-brand-btn">Used Car</span>
          </h1>
          <p
            className="text-[#4b5563] max-w-152 mb-7"
            style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)", lineHeight: 1.6 }}
          >
            Pakistan's trusted platform for buying and selling used cars with verified listings
            and professional inspections.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleScrollToSearch}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-btn text-white rounded-lg font-semibold text-[0.92rem] hover:bg-brand-dark2 hover:-translate-y-px hover:shadow-lg transition-all"
              style={{ borderRadius: "0.5rem" }}
            >
              <Search size={17} /> Search Cars
            </button>
            <button
              onClick={() => navigate("/post-ad")}
              className="inline-flex items-center gap-2 px-6 py-2.5 border-[1.5px] border-brand-btn/25 text-brand-btn bg-transparent rounded-lg font-semibold text-[0.92rem] hover:bg-brand-btn/5 hover:border-brand-btn/40 hover:-translate-y-px transition-all"
              style={{ borderRadius: "0.5rem" }}
            >
              <PlusCircle size={17} /> Post an Ad
            </button>
          </div>
        </div>

        {/* Search box */}
        <div
          className="rounded-2xl p-6 flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-0"
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 10px 30px rgba(15,23,42,0.07)",
          }}
        >
          {/* Keyword */}
          <div ref={searchBoxRef} className="flex flex-col flex-2 min-w-0 relative">
            <label className={fieldLabel}>CAR MAKE OR MODEL</label>
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-2.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                className={inputBase + " pl-8 pr-3 py-2.5"}
                placeholder="e.g. Toyota Corolla"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setSuggestionsOpen(true); }}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={handleKeyDown}
              />
            </div>
            {suggestionsOpen && hasSuggestions && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-black/10 rounded-xl shadow-[0_10px_30px_rgba(15,23,42,0.1)] overflow-y-auto max-h-56 z-500">
                {suggestions.makes.length > 0 && (
                  <>
                    <p className={suggestionHeading}>Makes</p>
                    {suggestions.makes.map(b => (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => pickSuggestion(b.name)}
                        className="block w-full text-left px-4 py-2.5 text-[0.88rem] text-[#374151] cursor-pointer hover:bg-brand-surface transition"
                      >
                        {b.name}
                      </button>
                    ))}
                  </>
                )}
                {suggestions.models.length > 0 && (
                  <>
                    <p className={suggestionHeading}>Models</p>
                    {suggestions.models.map(m => (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => pickSuggestion(m.name)}
                        className="block w-full text-left px-4 py-2.5 text-[0.88rem] text-[#374151] cursor-pointer hover:bg-brand-surface transition"
                      >
                        {m.name}
                        {m.brand?.name && (
                          <span className="text-[0.78rem] text-brand-muted ml-1.5">{m.brand.name}</span>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Divider — desktop only */}
          <div className="hidden lg:block w-px h-12 bg-black/10 mx-4 shrink-0 self-end mb-0.5" />

          {/* City */}
          <div className="flex flex-col flex-1 min-w-0">
            <label className={fieldLabel}>CITY</label>
            <CityDropdown cities={cities} value={selectedCity} onChange={setSelectedCity} />
          </div>

          {/* Divider — desktop only */}
          <div className="hidden lg:block w-px h-12 bg-black/10 mx-4 shrink-0 self-end mb-0.5" />

          {/* Price Range */}
          <div className="flex flex-col flex-1 min-w-0">
            <label className={fieldLabel}>PRICE RANGE (LACS)</label>
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center flex-1 rounded-lg px-2.5 py-2.5 min-w-0 focus-within:ring-2 focus-within:ring-[#37415114] focus-within:border-[#374151] transition"
                style={{ background: "#f8fafc", border: "1px solid rgba(15,23,42,0.1)" }}
              >
                <span className="text-[0.75rem] text-gray-400 mr-1.5 whitespace-nowrap">Min</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none outline-none text-brand-dark2 text-[0.9rem] w-full min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <span className="text-[0.7rem] font-bold text-gray-400 tracking-wide">TO</span>
              <div
                className="flex items-center flex-1 rounded-lg px-2.5 py-2.5 min-w-0 focus-within:ring-2 focus-within:ring-[#37415114] focus-within:border-[#374151] transition"
                style={{ background: "#f8fafc", border: "1px solid rgba(15,23,42,0.1)" }}
              >
                <span className="text-[0.75rem] text-gray-400 mr-1.5 whitespace-nowrap">Max</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none outline-none text-brand-dark2 text-[0.9rem] w-full min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="lg:ml-4 lg:self-end inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-btn text-white rounded-lg font-semibold text-[0.9rem] whitespace-nowrap shrink-0 hover:bg-brand-dark2 hover:-translate-y-px hover:shadow-lg transition-all"
            style={{ borderRadius: "0.5rem" }}
          >
            <Search size={16} /> Search
          </button>
        </div>
      </div>
    </section>
  );
}
