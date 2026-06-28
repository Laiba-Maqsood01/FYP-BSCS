import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, X, MapPin, Flame, ShieldCheck, ChevronDown, SlidersHorizontal, ArrowLeft, ArrowRight } from "lucide-react";
import api from "../../services/api";

// ─── badge helpers ─────────────────────────────────
const badgeCls = "inline-flex items-center gap-[0.28rem] px-[0.6rem] py-[0.28rem] rounded-full text-[0.7rem] font-bold leading-none";
const badge = {
  featured:  `${badgeCls} bg-[#ea6d00] text-white`,
  inspected: `${badgeCls} bg-green-600 text-white`,
  managed:   `${badgeCls} bg-blue-700 text-white`,
  city:      `${badgeCls} bg-[rgba(15,23,42,0.55)] text-white border border-white/20 backdrop-blur-sm ml-auto`,
};

// ─── constants ─────────────────────────────────────
const TYPE_FILTERS = [
  { label: "All",       value: ""        },
  { label: "Featured",  value: "featured" },
  { label: "Inspected", value: "inspected"},
  { label: "Managed",   value: "MANAGED"  },
  { label: "Generic",   value: "GENERAL"  },
];

const SORT_OPTIONS = [
  { label: "Newest First",        sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest First",        sortBy: "createdAt", sortOrder: "asc"  },
  { label: "Price: Low → High",   sortBy: "price",     sortOrder: "asc"  },
  { label: "Price: High → Low",   sortBy: "price",     sortOrder: "desc" },
  { label: "Year: Newest",        sortBy: "year",      sortOrder: "desc" },
  { label: "Year: Oldest",        sortBy: "year",      sortOrder: "asc"  },
  { label: "Mileage: Low → High", sortBy: "mileage",   sortOrder: "asc"  },
  { label: "Mileage: High → Low", sortBy: "mileage",   sortOrder: "desc" },
];

// ─── shared input style ────────────────────────────
const inputCls = "w-full bg-[#f8fafc] border border-black/10 rounded-lg text-[#1f2937] text-[0.88rem] outline-none focus:border-[#374151] focus:shadow-[0_0_0_3px_rgba(55,65,81,0.08)] transition placeholder:text-gray-400";

// ─── Shared selection modal (City / Brand / Model) ──
function SelectionModal({ title, searchPlaceholder, items, selected, onSelect, onClose, renderCount }) {
  const [search, setSearch] = useState("");
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const top  = filtered.slice(0, 8);
  const more = filtered.slice(8);

  const Item = ({ item }) => (
    <label
      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer border-[1.5px] transition text-[0.88rem] text-[#374151] ${
        selected === item._id
          ? "bg-orange-50 border-brand-orange"
          : "bg-brand-surface border-transparent hover:bg-[#f1f5f9] hover:border-black/10"
      }`}
    >
      <input
        type="radio"
        name={`modal-${title}`}
        checked={selected === item._id}
        onChange={() => { onSelect(item._id); onClose(); }}
        className="hidden"
      />
      <span>{item.name}</span>
      {renderCount && item.listingCount > 0 && (
        <span className="text-[0.75rem] bg-[#e2e8f0] text-[#475569] rounded-full px-2 py-0.5 font-semibold">
          {item.listingCount}
        </span>
      )}
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-160 max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(15,23,42,0.2)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
          <h5 className="font-bold text-brand-dark">{title}</h5>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-black/6">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              className={inputCls + " pl-9 py-2.5"}
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {filtered.length === 0 ? (
            <p className="text-center text-brand-muted text-[0.88rem] py-6">No results found.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {top.map(item => <Item key={item._id} item={item} />)}
              </div>
              {more.length > 0 && (
                <>
                  <p className="text-[0.78rem] font-bold text-brand-muted uppercase tracking-[0.06em] mt-4 mb-2">More</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {more.map(item => <Item key={item._id} item={item} />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-3.5 border-t border-black/8">
          <button
            onClick={() => { onSelect(""); onClose(); }}
            className="border border-black/15 text-[#374151] text-[0.88rem] font-semibold px-5 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="bg-brand-dark text-white text-[0.88rem] font-semibold px-6 py-2 rounded-lg hover:bg-brand-dark2 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Range Filter ───────────────────────────────────
function RangeFilter({ label, minKey, maxKey, filters, onApply }) {
  const [min, setMin] = useState(filters[minKey] || "");
  const [max, setMax] = useState(filters[maxKey] || "");

  useEffect(() => {
    setMin(filters[minKey] || "");
    setMax(filters[maxKey] || "");
  }, [filters[minKey], filters[maxKey]]);

  return (
    <div className="mb-5 pb-5 border-b border-black/[0.07] last:mb-0 last:pb-0 last:border-0">
      <div className="text-[0.68rem] font-bold tracking-[0.07em] text-brand-muted uppercase mb-2.5">{label}</div>
      <div className="flex items-center gap-1.5">
        <input
          className={inputCls + " py-2 px-2.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"}
          type="number" placeholder="From" min="0"
          value={min} onChange={e => setMin(e.target.value)}
        />
        <input
          className={inputCls + " py-2 px-2.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"}
          type="number" placeholder="To" min="0"
          value={max} onChange={e => setMax(e.target.value)}
        />
        <button
          onClick={() => onApply({ [minKey]: min || undefined, [maxKey]: max || undefined })}
          className="bg-[#1e293b] text-white text-[0.82rem] font-semibold px-3.5 py-2 rounded-lg hover:bg-brand-dark transition shrink-0"
        >
          Go
        </button>
      </div>
    </div>
  );
}

// ─── Listing Card ───────────────────────────────────
function ListingCard({ listing }) {
  const navigate = useNavigate();
  const isInspected = listing?.isInspected === true;
  const cityName = listing?.city?.name;

  return (
    <div
      className="bg-white border border-black/8 rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(15,23,42,0.06)] cursor-pointer transition-all duration-200 hover:-translate-y-0.75 hover:shadow-[0_10px_28px_rgba(15,23,42,0.1)]"
      onClick={() => navigate(`/browse-cars/${listing._id}`)}
    >
      <div className="relative h-45">
        <img
          src={listing.images?.[0]?.url || "https://via.placeholder.com/400x250?text=No+Image"}
          alt={`${listing.brand?.name} ${listing.carModel?.name}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[rgba(3,7,18,0.3)] to-transparent" />
        <div className="absolute inset-[0.55rem] flex flex-wrap content-start gap-[0.3rem] pointer-events-none">
          {listing.isFeatured && <span className={badge.featured}><Flame size={11} /> Featured</span>}
          {isInspected        && <span className={badge.inspected}><ShieldCheck size={11} /> Inspected</span>}
          {listing.saleMode === "MANAGED" && <span className={badge.managed}><ShieldCheck size={11} /> Managed</span>}
          {cityName           && <span className={badge.city}><MapPin size={11} /> {cityName}</span>}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-[0.98rem] font-bold text-brand-dark mb-1">
          {listing.year} {listing.brand?.name} {listing.carModel?.name}
        </h3>
        <p className="text-[0.82rem] text-brand-muted leading-snug mb-2 min-h-[2.4rem]">
          {listing.description?.slice(0, 70)}{listing.description?.length > 70 ? "…" : ""}
        </p>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[0.76rem] text-[#475569] mb-2.5
          [&>span]:after:content-['·'] [&>span]:after:ml-2 [&>span]:after:text-[#cbd5e1] [&>span:last-child]:after:content-['']">
          <span>{listing.engineCapacity}cc</span>
          <span>{listing.transmission}</span>
          <span>{listing.mileage?.toLocaleString()} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-brand-dark">
            PKR {listing.price?.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── FilterLabel ───────────────────────────────────
const FilterLabel = ({ children }) => (
  <div className="text-[0.68rem] font-bold tracking-[0.07em] text-brand-muted uppercase mb-2.5">
    {children}
  </div>
);

// ─── RadioList ─────────────────────────────────────
function RadioList({ name, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-[0.9rem] text-[#374151] select-none">
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="w-4 h-4 accent-brand-orange shrink-0 cursor-pointer"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── FilterGroup ───────────────────────────────────
function FilterGroup({ label, children }) {
  return (
    <div className="mb-5 pb-5 border-b border-black/[0.07] last:mb-0 last:pb-0 last:border-0">
      <FilterLabel>{label}</FilterLabel>
      {children}
    </div>
  );
}

// ─── SidebarContent (shared between desktop sidebar & mobile drawer) ──
function SidebarContent({
  total, filters, setFilter,
  searchInput, setSearchInput,
  topCities, cityObj,
  inlineBrandOptions, models,
  inlineModelOptions, modelObj,
  provinces,
  onOpenCityModal, onOpenBrandModal, onOpenModelModal,
}) {
  return (
    <>
      <div className="text-[1.35rem] font-extrabold text-brand-dark mb-6">
        <span>{total}</span> Results
      </div>

      {/* Keyword */}
      <FilterGroup label="SEARCH BY KEYWORD">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className={inputCls + " pl-8 py-2.5"}
            placeholder="Search cars..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
      </FilterGroup>

      {/* City */}
      <FilterGroup label="CITY">
        <RadioList
          name="city"
          value={filters.city}
          onChange={v => setFilter({ city: v })}
          options={[
            { label: "All Cities", value: "" },
            ...topCities.map(c => ({ label: c.name, value: c._id })),
            ...(filters.city && !topCities.find(c => c._id === filters.city) && cityObj
              ? [{ label: cityObj.name, value: filters.city }]
              : []),
          ]}
        />
        <button
          onClick={onOpenCityModal}
          className="text-[0.85rem] text-blue-500 hover:underline mt-1.5 block"
        >
          more choices...
        </button>
      </FilterGroup>

      {/* Make */}
      <FilterGroup label="MAKE">
        <RadioList
          name="brand"
          value={filters.brand}
          onChange={v => setFilter({ brand: v, carModel: "" })}
          options={inlineBrandOptions}
        />
        <button
          onClick={onOpenBrandModal}
          className="text-[0.85rem] text-blue-500 hover:underline mt-1.5 block"
        >
          more choices...
        </button>
      </FilterGroup>

      {/* Model */}
      {filters.brand && models.length > 0 && (
        <FilterGroup label="MODEL">
          <RadioList
            name="carModel"
            value={filters.carModel}
            onChange={v => setFilter({ carModel: v })}
            options={inlineModelOptions}
          />
          {models.length > 4 && (
            <button
              onClick={onOpenModelModal}
              className="text-[0.85rem] text-blue-500 hover:underline mt-1.5 block"
            >
              more choices...
            </button>
          )}
        </FilterGroup>
      )}

      {/* Registered In */}
      <FilterGroup label="REGISTERED IN">
        <RadioList
          name="registeredIn"
          value={filters.registeredIn}
          onChange={v => setFilter({ registeredIn: v })}
          options={[
            { label: "All Provinces", value: "" },
            ...provinces.map(p => ({ label: p.name, value: p._id })),
          ]}
        />
      </FilterGroup>

      {/* Engine Type */}
      <FilterGroup label="ENGINE TYPE">
        <RadioList
          name="engineType"
          value={filters.engineType}
          onChange={v => setFilter({ engineType: v })}
          options={["", "petrol", "diesel", "hybrid", "electric"].map(v => ({
            label: v === "" ? "All" : v.charAt(0).toUpperCase() + v.slice(1),
            value: v,
          }))}
        />
      </FilterGroup>

      {/* Transmission */}
      <FilterGroup label="TRANSMISSION">
        <RadioList
          name="transmission"
          value={filters.transmission}
          onChange={v => setFilter({ transmission: v })}
          options={["", "manual", "automatic"].map(v => ({
            label: v === "" ? "All" : v.charAt(0).toUpperCase() + v.slice(1),
            value: v,
          }))}
        />
      </FilterGroup>

      {/* Assembly */}
      <FilterGroup label="ASSEMBLY">
        <RadioList
          name="assembly"
          value={filters.assembly}
          onChange={v => setFilter({ assembly: v })}
          options={["", "local", "imported"].map(v => ({
            label: v === "" ? "All" : v.charAt(0).toUpperCase() + v.slice(1),
            value: v,
          }))}
        />
      </FilterGroup>

      <RangeFilter label="PRICE RANGE"  minKey="minPrice"   maxKey="maxPrice"   filters={filters} onApply={setFilter} />
      <RangeFilter label="YEAR"         minKey="minYear"    maxKey="maxYear"    filters={filters} onApply={setFilter} />
      <RangeFilter label="MILEAGE (KM)" minKey="minMileage" maxKey="maxMileage" filters={filters} onApply={setFilter} />
    </>
  );
}

// ─── Main Page ──────────────────────────────────────
export default function BrowseCars() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [listings, setListings]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [brands, setBrands]       = useState([]);
  const [models, setModels]       = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities]       = useState([]);

  const [showCityModal,       setShowCityModal]       = useState(false);
  const [showBrandModal,      setShowBrandModal]      = useState(false);
  const [showModelModal,      setShowModelModal]      = useState(false);
  const [showSortDropdown,    setShowSortDropdown]    = useState(false);
  const [showFilterDrawer,    setShowFilterDrawer]    = useState(false);

  const sortRef = useRef();

  const getFilters = () => ({
    search:       searchParams.get("search")       || "",
    city:         searchParams.get("city")         || "",
    brand:        searchParams.get("brand")        || "",
    typeFilter:   searchParams.get("typeFilter")   || "",
    minPrice:     searchParams.get("minPrice")     || "",
    maxPrice:     searchParams.get("maxPrice")     || "",
    minYear:      searchParams.get("minYear")      || "",
    maxYear:      searchParams.get("maxYear")      || "",
    minMileage:   searchParams.get("minMileage")   || "",
    maxMileage:   searchParams.get("maxMileage")   || "",
    sortBy:       searchParams.get("sortBy")       || "createdAt",
    sortOrder:    searchParams.get("sortOrder")    || "desc",
    carModel:     searchParams.get("carModel")     || "",
    registeredIn: searchParams.get("registeredIn") || "",
    engineType:   searchParams.get("engineType")   || "",
    transmission: searchParams.get("transmission") || "",
    assembly:     searchParams.get("assembly")     || "",
    page:         Number(searchParams.get("page")  || 1),
  });

  const filters = getFilters();

  const setFilter = (updates) => {
    const current = getFilters();
    const next    = { ...current, ...updates, page: 1 };
    const params  = {};
    Object.entries(next).forEach(([k, v]) => { if (v !== "" && v !== undefined) params[k] = String(v); });
    setSearchParams(params);
  };

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  useEffect(() => { setSearchInput(filters.search); }, [filters.search]);

  useEffect(() => {
    const t = setTimeout(() => { setFilter({ search: searchInput }); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    api.get("/master/brands").then(r => setBrands(r.data?.data || [])).catch(() => {});
    api.get("/master/cities-with-count").then(r => setCities(r.data?.data || [])).catch(() => {});
    api.get("/master/provinces").then(r => setProvinces(r.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!filters.brand) { setModels([]); return; }
    api.get("/master/models", { params: { brand: filters.brand } })
      .then(r => setModels(r.data?.data || [])).catch(() => {});
  }, [filters.brand]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page: filters.page, limit: 9 };
        if (filters.search)      params.search        = filters.search;
        if (filters.city)        params.city          = filters.city;
        if (filters.brand)       params.brand         = filters.brand;
        if (filters.minPrice)    params.minPrice      = filters.minPrice;
        if (filters.maxPrice)    params.maxPrice      = filters.maxPrice;
        if (filters.minYear)     params.minYear       = filters.minYear;
        if (filters.maxYear)     params.maxYear       = filters.maxYear;
        if (filters.minMileage)  params.minMileage    = filters.minMileage;
        if (filters.maxMileage)  params.maxMileage    = filters.maxMileage;
        params.sortBy    = filters.sortBy;
        params.sortOrder = filters.sortOrder;
        if (filters.typeFilter === "featured")  params.featuredStatus   = "ACTIVE";
        if (filters.typeFilter === "inspected") params.inspectionStatus = "INSPECTED";
        if (filters.typeFilter === "MANAGED")   params.saleMode         = "MANAGED";
        if (filters.typeFilter === "GENERAL")   params.saleMode         = "GENERAL";
        if (filters.carModel)     params.carModel     = filters.carModel;
        if (filters.registeredIn) params.registeredIn = filters.registeredIn;
        if (filters.engineType)   params.engineType   = filters.engineType;
        if (filters.transmission) params.transmission = filters.transmission;
        if (filters.assembly)     params.assembly     = filters.assembly;

        const res = await api.get("/listings", { params });
        setListings(res.data?.data?.listings || []);
        setTotal(res.data?.data?.pagination?.total || 0);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams.toString()]);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll when filter drawer is open
  useEffect(() => {
    document.body.style.overflow = showFilterDrawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showFilterDrawer]);

  const activeSortLabel = SORT_OPTIONS.find(
    o => o.sortBy === filters.sortBy && o.sortOrder === filters.sortOrder
  )?.label || "Newest First";

  // ── Lookup objects ──
  const cityObj  = cities.find(c => c._id === filters.city);
  const brandObj = brands.find(b => b._id === filters.brand);
  const modelObj = models.find(m => m._id === filters.carModel);
  const provObj  = provinces.find(p => p._id === filters.registeredIn);

  // ── Applied filter chips ──
  const appliedFilters = [];
  if (filters.search)   appliedFilters.push({ key: "search",       label: filters.search });
  if (cityObj)          appliedFilters.push({ key: "city",          label: cityObj.name });
  if (brandObj)         appliedFilters.push({ key: "brand",         label: brandObj.name });
  if (filters.typeFilter) appliedFilters.push({ key: "typeFilter",  label: TYPE_FILTERS.find(t => t.value === filters.typeFilter)?.label });
  if (filters.minPrice || filters.maxPrice)
    appliedFilters.push({ key: "price",    label: `Price: ${filters.minPrice || "0"} – ${filters.maxPrice || "∞"}` });
  if (filters.minYear || filters.maxYear)
    appliedFilters.push({ key: "year",     label: `Year: ${filters.minYear || "—"} - ${filters.maxYear || "—"}` });
  if (filters.minMileage || filters.maxMileage)
    appliedFilters.push({ key: "mileage",  label: `Mileage: ${filters.minMileage || "0"} - ${filters.maxMileage || "∞"}` });
  if (modelObj) appliedFilters.push({ key: "carModel",      label: modelObj.name });
  if (provObj)  appliedFilters.push({ key: "registeredIn",  label: `Reg: ${provObj.name}` });
  if (filters.engineType)   appliedFilters.push({ key: "engineType",   label: filters.engineType });
  if (filters.transmission) appliedFilters.push({ key: "transmission", label: filters.transmission });
  if (filters.assembly)     appliedFilters.push({ key: "assembly",     label: filters.assembly });

  // count non-search filters for the badge (search is visible in the keyword box)
  const activeFilterCount = appliedFilters.filter(f => f.key !== "search").length;

  const removeFilter = (key) => {
    const clears = {
      price:   { minPrice: "",    maxPrice: ""   },
      year:    { minYear: "",     maxYear: ""    },
      mileage: { minMileage: "",  maxMileage: "" },
      brand:   { brand: "", carModel: "" },
    };
    setFilter(clears[key] || { [key]: "" });
  };

  const clearAll   = () => setSearchParams({});
  const totalPages = Math.ceil(total / 9);

  // ── Sidebar data ──
  const topCities = cities
    .filter(c => c.listingCount > 0)
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, 4);

  const top5Brands = brands.slice(0, 5);
  const brandNotInTop5 = filters.brand && !top5Brands.find(b => b._id === filters.brand);
  const inlineBrandOptions = [
    { label: "All Makes", value: "" },
    ...top5Brands.map(b => ({ label: b.name, value: b._id })),
    ...(brandNotInTop5 && brandObj ? [{ label: brandObj.name, value: filters.brand }] : []),
  ];

  const top4Models = models.slice(0, 4);
  const modelNotInTop4 = filters.carModel && !top4Models.find(m => m._id === filters.carModel);
  const inlineModelOptions = [
    { label: "All Models", value: "" },
    ...top4Models.map(m => ({ label: m.name, value: m._id })),
    ...(modelNotInTop4 && modelObj ? [{ label: modelObj.name, value: filters.carModel }] : []),
  ];

  const sidebarStyle = {
    background:    "rgba(255,255,255,0.65)",
    backdropFilter: "blur(10px)",
    border:        "1px solid rgba(15,23,42,0.08)",
    boxShadow:     "0 8px 24px rgba(15,23,42,0.05)",
  };

  // shared sidebar props
  const sidebarProps = {
    total, filters, setFilter,
    searchInput, setSearchInput,
    topCities, cityObj,
    inlineBrandOptions, models,
    inlineModelOptions, modelObj,
    provinces,
    onOpenCityModal:  () => setShowCityModal(true),
    onOpenBrandModal: () => setShowBrandModal(true),
    onOpenModelModal: () => setShowModelModal(true),
  };

  return (
    <div className="py-8 pb-16 min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-6">
          <h1
            className="font-extrabold text-brand-dark tracking-tight m-0 mb-1"
            style={{ fontSize: "clamp(1.7rem, 2.5vw, 2.4rem)", letterSpacing: "-0.02em" }}
          >
            Browse Used Cars
          </h1>
          <p className="text-brand-muted text-[0.95rem]">Find verified used cars across Pakistan</p>
        </div>

        {/* ══ CONTROLS ROW ══ */}
        <div className="relative z-10 flex items-center justify-between gap-3 mb-5 flex-wrap">

          {/* Left: Filters button (mobile/tablet only) + type pills */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Filters button — hidden on desktop where sidebar is visible */}
            <button
              onClick={() => setShowFilterDrawer(true)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.88rem] font-semibold border-[1.5px] border-black/15 bg-transparent text-[#374151] hover:bg-black/5 hover:border-black/30 transition cursor-pointer"
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-brand-orange text-white text-[0.7rem] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Type pills */}
            {TYPE_FILTERS.map(t => (
              <button
                key={t.value}
                onClick={() => setFilter({ typeFilter: t.value })}
                className={`px-4 py-1.5 rounded-full text-[0.88rem] font-semibold border-[1.5px] transition cursor-pointer ${
                  filters.typeFilter === t.value
                    ? "bg-brand-orange border-brand-orange text-white"
                    : "bg-transparent border-black/15 text-[#374151] hover:bg-black/5 hover:border-black/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Right: Sort dropdown */}
          <div
            ref={sortRef}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-black/10 shrink-0"
            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}
          >
            <span className="text-[0.82rem] font-semibold text-brand-muted whitespace-nowrap">Sort:</span>
            <button
              onClick={() => setShowSortDropdown(p => !p)}
              className="flex items-center gap-1.5 text-[0.9rem] font-semibold text-brand-dark bg-none border-none p-0 cursor-pointer whitespace-nowrap"
            >
              {activeSortLabel} <ChevronDown size={15} />
            </button>
            {showSortDropdown && (
              <div className="absolute top-[calc(100%+6px)] left-0 bg-white border border-black/10 rounded-xl shadow-[0_10px_30px_rgba(15,23,42,0.1)] overflow-hidden min-w-50 z-500">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => { setFilter({ sortBy: opt.sortBy, sortOrder: opt.sortOrder }); setShowSortDropdown(false); }}
                    className={`block w-full text-left px-4 py-2.5 text-[0.88rem] cursor-pointer transition ${
                      opt.sortBy === filters.sortBy && opt.sortOrder === filters.sortOrder
                        ? "bg-[#f1f5f9] font-semibold text-brand-dark"
                        : "text-[#374151] hover:bg-brand-surface"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body: sidebar + main */}
        <div className="flex gap-6 items-start">

          {/* ══ DESKTOP SIDEBAR ══ */}
          <aside
            className="hidden lg:block w-72 shrink-0 rounded-2xl p-6 sticky top-21.25"
            style={sidebarStyle}
          >
            <SidebarContent {...sidebarProps} />
          </aside>

          {/* ══ MAIN ══ */}
          <div className="flex-1 min-w-0">

            {/* Applied filter chips */}
            {appliedFilters.length > 0 && (
              <div
                className="rounded-xl px-4 py-3 mb-5 border border-black/8"
                style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}
              >
                <div className="flex items-center gap-1.5 text-[0.7rem] font-bold tracking-[0.07em] text-brand-muted uppercase mb-2">
                  <SlidersHorizontal size={13} /> SEARCH FILTERS
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {appliedFilters.map(f => (
                    <span
                      key={f.key}
                      className="inline-flex items-center gap-1.5 bg-[#f1f5f9] border border-black/10 rounded-md px-2.5 py-1 text-[0.82rem] text-[#374151]"
                    >
                      {f.label}
                      <button
                        onClick={() => removeFilter(f.key)}
                        className="text-gray-400 hover:text-red-500 transition flex items-center"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                  <button onClick={clearAll} className="text-[0.82rem] font-semibold text-blue-500 hover:underline">
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Listings */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-white border border-black/8 rounded-2xl overflow-hidden">
                    <div className="h-45 bg-gray-200" />
                    <div className="p-4">
                      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-full bg-gray-100 rounded mb-1.5" />
                      <div className="h-3 w-2/3 bg-gray-100 rounded mb-3" />
                      <div className="flex gap-2 mb-3">
                        <div className="h-3 w-12 bg-gray-100 rounded" />
                        <div className="h-3 w-16 bg-gray-100 rounded" />
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                      </div>
                      <div className="h-5 w-32 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 text-brand-muted">
                <p className="mb-4">No listings found for the selected filters.</p>
                <button
                  onClick={clearAll}
                  className="border border-black/15 text-brand-dark text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {listings.map(l => <ListingCard key={l._id} listing={l} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.set("page", filters.page - 1); return n; })}
                  className="bg-white/70 border border-black/10 rounded-lg px-4 py-2 text-[0.88rem] font-semibold text-brand-dark hover:bg-[#f1f5f9] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {/* ← Prev */}
                  <ArrowLeft/> Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - filters.page) <= 2)
                  .reduce((acc, n, i, arr) => {
                    if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === "..." ? (
                      <span key={`e-${i}`} className="text-[#94a3b8] text-[0.88rem] self-center">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setSearchParams(p => { const np = new URLSearchParams(p); np.set("page", n); return np; })}
                        className={`min-w-9 h-9 px-2 rounded-lg text-[0.88rem] font-semibold transition ${
                          filters.page === n
                            ? "bg-brand-dark text-white border-brand-dark border"
                            : "bg-white/70 border border-black/10 text-[#374151] hover:bg-[#f1f5f9]"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )
                }

                <button
                  disabled={filters.page >= totalPages}
                  onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.set("page", filters.page + 1); return n; })}
                  className="bg-white/70 border border-black/10 rounded-lg px-4 py-2 text-[0.88rem] font-semibold text-brand-dark hover:bg-[#f1f5f9] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {/* Next → */}
                  Next <ArrowRight/>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══ MOBILE FILTER DRAWER ══ */}
      {showFilterDrawer && (
        <div className="lg:hidden fixed inset-0 z-200 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[rgba(15,23,42,0.45)]"
            style={{ backdropFilter: "blur(2px)" }}
            onClick={() => setShowFilterDrawer(false)}
          />

          {/* Panel */}
          <div className="relative w-80 max-w-[90vw] h-full bg-white flex flex-col shadow-[4px_0_32px_rgba(15,23,42,0.15)] overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/8 shrink-0">
              <span className="font-bold text-brand-dark text-[1rem]">Filters</span>
              <div className="flex items-center gap-3">
                {appliedFilters.length > 0 && (
                  <button
                    onClick={() => { clearAll(); setShowFilterDrawer(false); }}
                    className="text-[0.82rem] font-semibold text-blue-500 hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilterDrawer(false)}
                  className="text-brand-muted hover:text-brand-dark p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable filter content */}
            <div className="overflow-y-auto flex-1 px-5 py-5">
              <SidebarContent {...sidebarProps} />
            </div>

            {/* Done button */}
            <div className="shrink-0 px-5 py-4 border-t border-black/8">
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="w-full bg-brand-dark text-white font-semibold py-3 rounded-xl hover:bg-brand-dark2 transition text-[0.95rem]"
              >
                Show {total} Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Selection Modals ── */}
      {showCityModal && (
        <SelectionModal
          title="Select City"
          searchPlaceholder="Search cities..."
          items={cities}
          selected={filters.city}
          onSelect={city => setFilter({ city })}
          onClose={() => setShowCityModal(false)}
          renderCount
        />
      )}
      {showBrandModal && (
        <SelectionModal
          title="Select Make"
          searchPlaceholder="Search makes..."
          items={brands}
          selected={filters.brand}
          onSelect={brand => setFilter({ brand, carModel: "" })}
          onClose={() => setShowBrandModal(false)}
        />
      )}
      {showModelModal && (
        <SelectionModal
          title="Select Model"
          searchPlaceholder="Search models..."
          items={models}
          selected={filters.carModel}
          onSelect={carModel => setFilter({ carModel })}
          onClose={() => setShowModelModal(false)}
        />
      )}
    </div>
  );
}
