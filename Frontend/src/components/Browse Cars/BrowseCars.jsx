import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner, Button } from "react-bootstrap";
import { Search, X, MapPin, Flame, ShieldCheck, ChevronDown, SlidersHorizontal } from "lucide-react";
import api from "../../services/api";
import "./BrowseCars.css";

// ─── helpers ─────────────────────────────────────
const PRICE_IN_LACS = (v) => `${(v / 100000).toFixed(0)} Lac`;

const TYPE_FILTERS = [
  { label: "All",       value: "" },
  { label: "Featured",  value: "featured" },
  { label: "Inspected", value: "inspected" },
  { label: "Managed",   value: "MANAGED" },
  { label: "Generic",   value: "GENERAL" },
];

const SORT_OPTIONS = [
  { label: "Newest First",       sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest First",       sortBy: "createdAt", sortOrder: "asc" },
  { label: "Price: Low → High",  sortBy: "price",     sortOrder: "asc" },
  { label: "Price: High → Low",  sortBy: "price",     sortOrder: "desc" },
  { label: "Year: Newest",       sortBy: "year",      sortOrder: "desc" },
  { label: "Year: Oldest",       sortBy: "year",      sortOrder: "asc" },
  { label: "Mileage: Low → High",sortBy: "mileage",   sortOrder: "asc" },
  { label: "Mileage: High → Low",sortBy: "mileage",   sortOrder: "desc" },
];

// ─── City Modal ───────────────────────────────────
function CityModal({ cities, selected, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const top = filtered.filter(c => c.listingCount > 0).sort((a,b) => b.listingCount - a.listingCount).slice(0, 8);
  const more = filtered.filter(c => !top.find(t => t._id === c._id));

  return (
    <div className="bc-modal-backdrop" onClick={onClose}>
      <div className="bc-modal" onClick={e => e.stopPropagation()}>
        <div className="bc-modal-header">
          <h5 className="mb-0">Select City</h5>
          <button className="bc-modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="bc-modal-search">
          <Search size={14} className="bc-modal-search-icon"/>
          <input
            className="bc-modal-search-input"
            placeholder="Search cities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="bc-modal-body">
          <div className="bc-modal-grid">
            {top.map(city => (
              <label key={city._id} className={`bc-modal-city-item ${selected === city._id ? "active" : ""}`}>
                <input
                  type="radio"
                  name="city-modal"
                  checked={selected === city._id}
                  onChange={() => { onSelect(city._id); onClose(); }}
                  className="d-none"
                />
                <span className="bc-modal-city-name">{city.name}</span>
                {city.listingCount > 0 && (
                  <span className="bc-modal-city-count">{city.listingCount}</span>
                )}
              </label>
            ))}
          </div>
          {more.length > 0 && (
            <>
              <p className="bc-modal-more-label">More Cities</p>
              <div className="bc-modal-grid">
                {more.map(city => (
                  <label key={city._id} className={`bc-modal-city-item ${selected === city._id ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="city-modal"
                      checked={selected === city._id}
                      onChange={() => { onSelect(city._id); onClose(); }}
                      className="d-none"
                    />
                    <span className="bc-modal-city-name">{city.name}</span>
                    {city.listingCount > 0 && (
                      <span className="bc-modal-city-count">{city.listingCount}</span>
                    )}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="bc-modal-footer">
          <button className="bc-modal-clear" onClick={() => { onSelect(""); onClose(); }}>Clear</button>
          <button className="bc-modal-submit" onClick={onClose}>Submit</button>
        </div>
      </div>
    </div>
  );
}

// ─── Range Input ──────────────────────────────────
function RangeFilter({ label, minKey, maxKey, filters, onApply, placeholder="0" }) {
  const [min, setMin] = useState(filters[minKey] || "");
  const [max, setMax] = useState(filters[maxKey] || "");

  useEffect(() => {
    setMin(filters[minKey] || "");
    setMax(filters[maxKey] || "");
  }, [filters[minKey], filters[maxKey]]);

  return (
    <div className="bc-filter-group">
      <div className="bc-filter-label">{label}</div>
      <div className="bc-range-row">
        <input
          className="bc-range-input"
          type="number"
          placeholder="From"
          min="0"
          value={min}
          onChange={e => setMin(e.target.value)}
        />
        <input
          className="bc-range-input"
          type="number"
          placeholder="To"
          min="0"
          value={max}
          onChange={e => setMax(e.target.value)}
        />
        <button
          className="bc-range-go"
          onClick={() => onApply({ [minKey]: min || undefined, [maxKey]: max || undefined })}
        >
          Go
        </button>
      </div>
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────
function ListingCard({ listing }) {
  const navigate = useNavigate();
  const isInspected = listing?.inspection?.status === "COMPLETED";
  const cityName = listing?.city?.name;

  return (
    <div className="bc-card" onClick={() => navigate(`/listings/${listing._id}`)}>
      <div className="bc-card-img-wrap">
        <img
          src={listing.images?.[0]?.url || "https://via.placeholder.com/400x250?text=No+Image"}
          alt={`${listing.brand?.name} ${listing.carModel?.name}`}
          className="bc-card-img"
        />
        <div className="bc-card-overlay"/>
        <div className="bc-card-badges">
          {listing.isFeatured && (
            <span className="fl-badge fl-badge-featured"><Flame size={11}/> Featured</span>
          )}
          {isInspected && (
            <span className="fl-badge fl-badge-inspected"><ShieldCheck size={11}/> Inspected</span>
          )}
          {listing.saleMode === "MANAGED" && (
            <span className="fl-badge fl-badge-managed"><ShieldCheck size={11}/> Managed</span>
          )}
          {cityName && (
            <span className="fl-badge fl-badge-city"><MapPin size={11}/> {cityName}</span>
          )}
        </div>
      </div>
      <div className="bc-card-body">
        <h3 className="bc-card-title">
          {listing.year} {listing.brand?.name} {listing.carModel?.name}
        </h3>
        <p className="bc-card-desc">
          {listing.description?.slice(0, 70)}{listing.description?.length > 70 ? "…" : ""}
        </p>
        <div className="bc-card-meta">
          <span>{listing.engineCapacity}cc</span>
          <span>{listing.transmission}</span>
          <span>{listing.mileage?.toLocaleString()} km</span>
        </div>
        <div className="bc-card-footer">
          <span className="bc-card-price">PKR {listing.price?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────
export default function BrowseCars() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── state
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortRef = useRef();

  // ── read filters from URL
  const getFilters = () => ({
    search:     searchParams.get("search")     || "",
    city:       searchParams.get("city")       || "",
    brand:      searchParams.get("brand")      || "",
    typeFilter: searchParams.get("typeFilter") || "",
    minPrice:   searchParams.get("minPrice")   || "",
    maxPrice:   searchParams.get("maxPrice")   || "",
    minYear:    searchParams.get("minYear")    || "",
    maxYear:    searchParams.get("maxYear")    || "",
    minMileage: searchParams.get("minMileage") || "",
    maxMileage: searchParams.get("maxMileage") || "",
    sortBy:     searchParams.get("sortBy")     || "createdAt",
    sortOrder:  searchParams.get("sortOrder")  || "desc",
    page:       Number(searchParams.get("page") || 1),
  });

  const filters = getFilters();

  const setFilter = (updates) => {
    const current = getFilters();
    const next = { ...current, ...updates, page: 1 };
    const params = {};
    Object.entries(next).forEach(([k,v]) => { if (v !== "" && v !== undefined) params[k] = String(v); });
    setSearchParams(params);
  };

  // ── master data
  useEffect(() => {
    api.get("/master/brands").then(r => setBrands(r.data?.data || [])).catch(()=>{});
    api.get("/master/cities-with-count").then(r => setCities(r.data?.data || [])).catch(()=>{});
  }, []);

  // ── fetch listings
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page: filters.page, limit: 9 };
        if (filters.search)     params.search      = filters.search;
        if (filters.city)       params.city        = filters.city;
        if (filters.brand)      params.brand       = filters.brand;
        if (filters.minPrice)   params.minPrice    = filters.minPrice;
        if (filters.maxPrice)   params.maxPrice    = filters.maxPrice;
        if (filters.minYear)    params.minYear     = filters.minYear;
        if (filters.maxYear)    params.maxYear     = filters.maxYear;
        if (filters.minMileage) params.minMileage  = filters.minMileage;
        if (filters.maxMileage) params.maxMileage  = filters.maxMileage;
        params.sortBy    = filters.sortBy;
        params.sortOrder = filters.sortOrder;

        // typeFilter → translate to backend params
        if (filters.typeFilter === "featured")  params.featuredStatus = "ACTIVE";
        if (filters.typeFilter === "inspected") params.inspectionStatus = "INSPECTED";
        if (filters.typeFilter === "MANAGED")   params.saleMode = "MANAGED";
        if (filters.typeFilter === "GENERAL")   params.saleMode = "GENERAL";

        const res = await api.get("/listings", { params });
        setListings(res.data?.data?.listings || []);
        setTotal(res.data?.data?.pagination?.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchParams.toString()]);

  // close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── active sort label
  const activeSortLabel = SORT_OPTIONS.find(
    o => o.sortBy === filters.sortBy && o.sortOrder === filters.sortOrder
  )?.label || "Newest First";

  // ── applied filters chips
  const appliedFilters = [];
  const cityObj = cities.find(c => c._id === filters.city);
  const brandObj = brands.find(b => b._id === filters.brand);
  if (filters.search)     appliedFilters.push({ key: "search",     label: filters.search });
  if (cityObj)            appliedFilters.push({ key: "city",       label: cityObj.name });
  if (brandObj)           appliedFilters.push({ key: "brand",      label: brandObj.name });
  if (filters.typeFilter) appliedFilters.push({ key: "typeFilter", label: TYPE_FILTERS.find(t=>t.value===filters.typeFilter)?.label });
  if (filters.minPrice || filters.maxPrice) appliedFilters.push({ key: "price", label: `Price: ${filters.minPrice||"0"} – ${filters.maxPrice||"∞"}` });
  if (filters.minYear  || filters.maxYear)  appliedFilters.push({ key: "year",  label: `Year: ${filters.minYear||"—"} – ${filters.maxYear||"—"}` });
  if (filters.minMileage||filters.maxMileage) appliedFilters.push({ key: "mileage", label: `Mileage: ${filters.minMileage||"0"} – ${filters.maxMileage||"∞"}` });

  const removeFilter = (key) => {
    const clears = {
      price:   { minPrice: "", maxPrice: "" },
      year:    { minYear:  "", maxYear:  "" },
      mileage: { minMileage: "", maxMileage: "" },
    };
    setFilter(clears[key] || { [key]: "" });
  };

  const clearAll = () => setSearchParams({});

  const totalPages = Math.ceil(total / 9);

  // ── top cities (first 4 with listings)
  const topCities = cities
    .filter(c => c.listingCount > 0)
    .sort((a,b) => b.listingCount - a.listingCount)
    .slice(0, 4);

  return (
    <div className="bc-page">
      <Container fluid="xl">

        {/* ── PAGE HEADER ── */}
        <div className="bc-header">
          <div>
            <h1 className="bc-page-title">Browse Used Cars</h1>
            <p className="bc-page-sub">Find verified used cars across Pakistan</p>
          </div>

          {/* Sort dropdown */}
          <div className="bc-sort-wrap" ref={sortRef}>
            <span className="bc-sort-label">Sort:</span>
            <button
              className="bc-sort-btn"
              onClick={() => setShowSortDropdown(p => !p)}
            >
              {activeSortLabel} <ChevronDown size={15}/>
            </button>
            {showSortDropdown && (
              <div className="bc-sort-dropdown">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    className={`bc-sort-option ${opt.sortBy === filters.sortBy && opt.sortOrder === filters.sortOrder ? "active" : ""}`}
                    onClick={() => { setFilter({ sortBy: opt.sortBy, sortOrder: opt.sortOrder }); setShowSortDropdown(false); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Row className="g-4">

          {/* ══ LEFT SIDEBAR ══ */}
          <Col lg={3}>
            <div className="bc-sidebar">

              {/* Results count */}
              <div className="bc-results-count">
                <span className="bc-results-num">{total}</span> Results
              </div>

              {/* Keyword search */}
              <div className="bc-filter-group">
                <div className="bc-filter-label">SEARCH BY KEYWORD</div>
                <div className="bc-search-wrap">
                  <Search size={14} className="bc-search-icon"/>
                  <input
                    className="bc-search-input"
                    placeholder="Search cars..."
                    value={filters.search}
                    onChange={e => setFilter({ search: e.target.value })}
                  />
                </div>
              </div>

              {/* City */}
              <div className="bc-filter-group">
                <div className="bc-filter-label">CITY</div>
                <div className="bc-radio-list">
                  <label className="bc-radio-item">
                    <input type="radio" name="city" checked={!filters.city} onChange={() => setFilter({ city: "" })} className="bc-radio"/>
                    <span>All Cities</span>
                  </label>
                  {topCities.map(city => (
                    <label key={city._id} className="bc-radio-item">
                      <input type="radio" name="city" checked={filters.city === city._id} onChange={() => setFilter({ city: city._id })} className="bc-radio"/>
                      <span>{city.name}</span>
                    </label>
                  ))}
                  <button className="bc-more-choices" onClick={() => setShowCityModal(true)}>
                    more choices...
                  </button>
                </div>
              </div>

              {/* Make */}
              <div className="bc-filter-group">
                <div className="bc-filter-label">MAKE</div>
                <div className="bc-radio-list">
                  <label className="bc-radio-item">
                    <input type="radio" name="brand" checked={!filters.brand} onChange={() => setFilter({ brand: "" })} className="bc-radio"/>
                    <span>All Makes</span>
                  </label>
                  {brands.slice(0, 5).map(b => (
                    <label key={b._id} className="bc-radio-item">
                      <input type="radio" name="brand" checked={filters.brand === b._id} onChange={() => setFilter({ brand: b._id })} className="bc-radio"/>
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <RangeFilter
                label="PRICE RANGE"
                minKey="minPrice"
                maxKey="maxPrice"
                filters={filters}
                onApply={setFilter}
              />

              {/* Year */}
              <RangeFilter
                label="YEAR"
                minKey="minYear"
                maxKey="maxYear"
                filters={filters}
                onApply={setFilter}
              />

              {/* Mileage */}
              <RangeFilter
                label="MILEAGE (KM)"
                minKey="minMileage"
                maxKey="maxMileage"
                filters={filters}
                onApply={setFilter}
              />

            </div>
          </Col>

          {/* ══ MAIN CONTENT ══ */}
          <Col lg={9}>

            {/* Type filter pills */}
            <div className="bc-type-filters">
              {TYPE_FILTERS.map(t => (
                <button
                  key={t.value}
                  className={`bc-type-btn ${filters.typeFilter === t.value ? "active" : ""}`}
                  onClick={() => setFilter({ typeFilter: t.value })}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Applied filters */}
            {appliedFilters.length > 0 && (
              <div className="bc-applied-filters">
                <span className="bc-applied-label">
                  <SlidersHorizontal size={13}/> SEARCH FILTERS
                </span>
                <div className="bc-applied-chips">
                  {appliedFilters.map(f => (
                    <span key={f.key} className="bc-applied-chip">
                      {f.label}
                      <button className="bc-chip-remove" onClick={() => removeFilter(f.key)}>
                        <X size={11}/>
                      </button>
                    </span>
                  ))}
                  <button className="bc-clear-all" onClick={clearAll}>Clear All</button>
                </div>
              </div>
            )}

            {/* Listings grid */}
            {loading ? (
              <div className="text-center py-5"><Spinner/></div>
            ) : listings.length === 0 ? (
              <div className="bc-empty">
                <p>No listings found for the selected filters.</p>
                <Button variant="outline-dark" size="sm" onClick={clearAll}>Clear Filters</Button>
              </div>
            ) : (
              <div className="bc-grid">
                {listings.map(l => <ListingCard key={l._id} listing={l}/>)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bc-pagination">
                <button
                  className="bc-page-btn"
                  disabled={filters.page <= 1}
                  onClick={() => setFilter({ page: filters.page - 1 })}
                >← Prev</button>
                <span className="bc-page-info">Page {filters.page} of {totalPages}</span>
                <button
                  className="bc-page-btn"
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilter({ page: filters.page + 1 })}
                >Next →</button>
              </div>
            )}

          </Col>
        </Row>
      </Container>

      {/* City Modal */}
      {showCityModal && (
        <CityModal
          cities={cities}
          selected={filters.city}
          onSelect={city => setFilter({ city })}
          onClose={() => setShowCityModal(false)}
        />
      )}
    </div>
  );
}