import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, ChevronDown, Upload, X, User, Crown, AlertCircle } from "lucide-react";
import { showError, showSuccess } from "../../utils/toast";
import * as masterService from "../../services/masterService";
import * as listingService from "../../services/listingService";
import { useAuth } from "../../context/AuthContext";

// ── Constants ────────────────────────────────────────────────────────────────

const MANAGED_CITY_NAMES = ["Rahim Yar Khan", "Khanpur", "Liaqat Pur", "Sadiqabad"];

// Compare city names ignoring case, spaces and hyphens, so DB spellings like
// "Khan Pur" or "Liaqatpur" still count as managed cities.
const normalizeCityName = (name) => String(name || "").toLowerCase().replace(/[\s-]+/g, "");
const isManagedCity = (name) =>
  MANAGED_CITY_NAMES.some(n => normalizeCityName(n) === normalizeCityName(name));

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);

const COLORS = [
  "White", "Pearl White", "Silver", "Grey", "Black",
  "Red", "Maroon", "Blue", "Green", "Brown",
  "Beige", "Champagne", "Gold", "Other",
];

const ENGINE_TYPES = [
  { value: "petrol",   label: "Petrol"   },
  { value: "diesel",   label: "Diesel"   },
  { value: "hybrid",   label: "Hybrid"   },
  { value: "electric", label: "Electric" },
];

const TRANSMISSIONS = [
  { value: "manual",    label: "Manual"    },
  { value: "automatic", label: "Automatic" },
];

const ASSEMBLIES = [
  { value: "local",    label: "Local"    },
  { value: "imported", label: "Imported" },
];

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";

const selectCls =
  "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition appearance-none cursor-pointer";

function CustomSelect({ value, onChange, options, placeholder, disabled, searchable, searchPlaceholder = "Search..." }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value);

  const visibleOptions = searchable && query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { if (!disabled) { setQuery(""); setOpen(p => !p); } }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-black/10 text-sm text-left transition"
        style={{
          background: disabled ? "#f1f5f9" : "rgba(255,255,255,0.8)",
          backdropFilter: "blur(8px)",
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <span className={selected ? "text-brand-dark2" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} className="text-gray-400 shrink-0" />
      </button>
      {open && !disabled && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-black/10 rounded-xl shadow-[0_10px_30px_rgba(15,23,42,0.1)] max-h-56 flex flex-col overflow-hidden z-500">
          {searchable && (
            <div className="p-2 border-b border-black/6 shrink-0">
              <input
                autoFocus
                className="w-full bg-brand-surface border border-black/10 rounded-lg text-brand-dark2 text-[0.85rem] outline-none focus:border-[#374151] transition px-3 py-2"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}
          <div className="overflow-y-auto">
            {visibleOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`block w-full text-left px-4 py-2.5 text-[0.88rem] cursor-pointer transition ${
                  value === opt.value
                    ? "bg-[#f1f5f9] font-semibold text-brand-dark"
                    : "text-[#374151] hover:bg-brand-surface"
                }`}
              >
                {opt.label}
              </button>
            ))}
            {visibleOptions.length === 0 && (
              <p className="px-4 py-3 text-[0.85rem] text-brand-muted">No results found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelCls = "block text-sm font-medium text-brand-dark2 mb-1";

const cardCls = "bg-white rounded-2xl shadow-xl p-8";

const FormField = ({ label, required, children, hint }) => (
  <div>
    <label className={labelCls}>
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
  </div>
);

// ── Stepper ───────────────────────────────────────────────────────────────────

const STEPS = ["Car Information", "Upload Photos", "Set Price"];

function Stepper({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: done || active ? "#ea6d00" : "#e2e8f0",
                  color: done || active ? "#fff" : "#64748b",
                }}
              >
                {done ? <Check size={16} strokeWidth={3} /> : idx}
              </div>
              <span
                className="mt-1.5 text-[11px] font-medium whitespace-nowrap"
                style={{ color: active ? "#ea6d00" : done ? "#0f172a" : "#94a3b8" }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-16 sm:w-24 h-0.5 mx-1 mb-5"
                style={{ background: done ? "#ea6d00" : "#e2e8f0" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── WhatsApp Toggle ───────────────────────────────────────────────────────────

function WhatsAppToggle({ checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        {/* WhatsApp icon */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#25D366" }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <span className="text-sm font-medium text-brand-dark2">Allow WhatsApp Contact</span>
      </div>
      {/* Toggle switch */}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0"
        style={{ background: checked ? "#25D366" : "#cbd5e1", borderRadius: "9999px" }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(1.375rem)" : "translateX(0.125rem)" }}
        />
      </button>
    </div>
  );
}

// ── Year / Make / Model Modal ─────────────────────────────────────────────────

function YMMModal({ brands, onDone, onClose, initialYear, initialBrand, initialModel }) {
  const [year, setYear]   = useState(initialYear || null);
  const [brand, setBrand] = useState(initialBrand || null);
  const [model, setModel] = useState(initialModel || null);
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Per-column search
  const [yearQuery,  setYearQuery]  = useState("");
  const [makeQuery,  setMakeQuery]  = useState("");
  const [modelQuery, setModelQuery] = useState("");

  const yearRef  = useRef(null);

  useEffect(() => {
    if (year && yearRef.current) {
      const el = yearRef.current.querySelector(`[data-year="${year}"]`);
      if (el) el.scrollIntoView({ block: "center" });
    }
  }, []);

  useEffect(() => {
    if (!brand) { setModels([]); setModel(null); return; }
    setLoadingModels(true);
    setModel(null);
    masterService.getModels(brand._id)
      .then(setModels)
      .catch(() => showError("Failed to load models"))
      .finally(() => setLoadingModels(false));
  }, [brand?._id]);

  const canDone = year && brand && model;

  const visibleYears  = yearQuery.trim()
    ? YEARS.filter(y => String(y).includes(yearQuery.trim()))
    : YEARS;
  const visibleBrands = makeQuery.trim()
    ? brands.filter(b => b.name.toLowerCase().includes(makeQuery.trim().toLowerCase()))
    : brands;
  const visibleModels = modelQuery.trim()
    ? models.filter(m => m.name.toLowerCase().includes(modelQuery.trim().toLowerCase()))
    : models;

  const searchInputCls =
    "w-full bg-white border border-black/10 rounded-lg px-2.5 py-1.5 text-[13px] text-brand-dark2 outline-none focus:border-[#374151] transition placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white w-full overflow-hidden flex flex-col"
        style={{
          maxWidth: "720px",
          maxHeight: "90vh",
          borderRadius: "1rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
        }}
      >
        {/* Breadcrumb header */}
        <div className="flex items-center px-5 py-4 border-b border-black/8">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span
              className="text-sm font-semibold"
              style={{ color: year ? "#ea6d00" : "#94a3b8" }}
            >
              {year || "MODEL YEAR"}
            </span>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
            <span
              className="text-sm font-semibold"
              style={{ color: brand ? "#ea6d00" : "#94a3b8" }}
            >
              {brand ? brand.name : "MAKE"}
            </span>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
            <span
              className="text-sm font-semibold"
              style={{ color: model ? "#ea6d00" : "#94a3b8" }}
            >
              {model ? model.name : "MODEL"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Three columns */}
        <div className="flex flex-1 min-h-0 divide-x divide-black/8" style={{ minHeight: "400px" }}>
          {/* MODEL YEAR */}
          <div className="flex flex-col w-1/3 min-h-0">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-black/8">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Model Year</span>
            </div>
            <div className="px-3 py-2 border-b border-black/6 shrink-0">
              <input
                className={searchInputCls}
                placeholder="Search year..."
                value={yearQuery}
                onChange={e => setYearQuery(e.target.value)}
              />
            </div>
            <div ref={yearRef} className="flex-1 overflow-y-auto">
              {visibleYears.length === 0 && (
                <p className="px-4 py-6 text-sm text-brand-muted text-center">No years found</p>
              )}
              {visibleYears.map(y => (
                <button
                  key={y}
                  data-year={y}
                  onClick={() => setYear(y)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition"
                  style={{
                    background: year === y ? "#fff7ed" : undefined,
                    color: year === y ? "#ea6d00" : "#334155",
                    fontWeight: year === y ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (year !== y) e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { if (year !== y) e.currentTarget.style.background = ""; }}
                >
                  {y}
                  {year === y && <ChevronRight size={14} style={{ color: "#ea6d00", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>

          {/* MAKE */}
          <div className="flex flex-col w-1/3 min-h-0">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-black/8">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Make</span>
            </div>
            <div className="px-3 py-2 border-b border-black/6 shrink-0">
              <input
                className={searchInputCls}
                placeholder="Search make..."
                value={makeQuery}
                onChange={e => setMakeQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {visibleBrands.length === 0 && (
                <p className="px-4 py-6 text-sm text-brand-muted text-center">No makes found</p>
              )}
              {visibleBrands.map(b => (
                <button
                  key={b._id}
                  onClick={() => { setBrand(b); setModel(null); setModelQuery(""); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition"
                  style={{
                    background: brand?._id === b._id ? "#fff7ed" : undefined,
                    color: brand?._id === b._id ? "#ea6d00" : "#334155",
                    fontWeight: brand?._id === b._id ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (brand?._id !== b._id) e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { if (brand?._id !== b._id) e.currentTarget.style.background = ""; }}
                >
                  {b.name}
                  {brand?._id === b._id && <ChevronRight size={14} style={{ color: "#ea6d00", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>

          {/* MODEL */}
          <div className="flex flex-col w-1/3 min-h-0">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-black/8">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">Model</span>
            </div>
            <div className="px-3 py-2 border-b border-black/6 shrink-0">
              <input
                className={searchInputCls}
                placeholder="Search model..."
                value={modelQuery}
                onChange={e => setModelQuery(e.target.value)}
                disabled={!brand}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {!brand ? (
                <p className="px-4 py-6 text-sm text-brand-muted text-center">Select a make first</p>
              ) : loadingModels ? (
                <p className="px-4 py-6 text-sm text-brand-muted text-center">Loading…</p>
              ) : visibleModels.length === 0 ? (
                <p className="px-4 py-6 text-sm text-brand-muted text-center">No models found</p>
              ) : visibleModels.map(m => (
                <button
                  key={m._id}
                  onClick={() => setModel(m)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition"
                  style={{
                    background: model?._id === m._id ? "#fff7ed" : undefined,
                    color: model?._id === m._id ? "#ea6d00" : "#334155",
                    fontWeight: model?._id === m._id ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (model?._id !== m._id) e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { if (model?._id !== m._id) e.currentTarget.style.background = ""; }}
                >
                  {m.name}
                  {model?._id === m._id && <Check size={14} style={{ color: "#ea6d00", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-black/8 bg-gray-50">
          <p className="text-sm text-brand-muted">
            {canDone
              ? `${year} · ${brand.name} · ${model.name}`
              : "Select year, make, and model to continue"}
          </p>
          <button
            onClick={() => canDone && onDone(year, brand, model)}
            disabled={!canDone}
            className="px-6 py-2 text-sm font-semibold transition"
            style={{
              background: canDone ? "#ea6d00" : "#e2e8f0",
              color: canDone ? "#fff" : "#94a3b8",
              cursor: canDone ? "pointer" : "not-allowed",
              borderRadius: "0.5rem",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 0 – Sale Mode Selection ──────────────────────────────────────────────

function SaleModeStep({ selected, onChange, onContinue }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className={cardCls}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-dark mb-2">Sell Your Car Online</h1>
          <p className="text-brand-muted text-sm">Choose how you want to sell your car. Post it yourself or let our experts handle everything.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* GENERAL card */}
          <button
            onClick={() => onChange("GENERAL")}
            className="relative text-left rounded-xl border-2 p-6 transition-all flex flex-col items-stretch justify-start"
            style={{
              borderColor: selected === "GENERAL" ? "#ea6d00" : "rgba(0,0,0,0.1)",
              background: selected === "GENERAL" ? "#fff7ed" : "#fff",
            }}
          >
            {selected === "GENERAL" && (
              <span className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#ea6d00" }}>
                <Check size={13} color="#fff" strokeWidth={3} />
              </span>
            )}
            <User size={26} style={{ color: "#ea6d00", marginBottom: "0.75rem" }} />
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1">General Sale</p>
            <h2 className="text-xl font-bold text-brand-dark mb-2">Sell It Myself!</h2>
            <p className="text-sm text-brand-muted mb-4 leading-relaxed min-h-[68px]">
              Post an ad in 2 minutes and connect directly with buyers. Simple, free, and you're in control.
            </p>
            <ul className="space-y-1.5">
              {["Post an ad in 2 minutes", "Connect directly with buyers", "Set your own price", "Manage your listing"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-brand-dark2">
                  <Check size={14} style={{ color: "#ea6d00", flexShrink: 0 }} strokeWidth={3} />
                  {f}
                </li>
              ))}
            </ul>
          </button>

          {/* MANAGED card */}
          <button
            onClick={() => onChange("MANAGED")}
            className="relative text-left rounded-xl border-2 p-6 transition-all flex flex-col items-stretch justify-start"
            style={{
              borderColor: selected === "MANAGED" ? "#ea6d00" : "rgba(0,0,0,0.1)",
              background: selected === "MANAGED" ? "#fff7ed" : "#fff",
            }}
          >
            {selected === "MANAGED" && (
              <span className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#ea6d00" }}>
                <Check size={13} color="#fff" strokeWidth={3} />
              </span>
            )}
            <Crown size={26} style={{ color: "#ea6d00", marginBottom: "0.75rem" }} />
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1">Managed Sale</p>
            <h2 className="text-xl font-bold text-brand-dark mb-2">Sell It For Me</h2>
            <p className="text-sm text-brand-muted mb-4 leading-relaxed min-h-[68px]">
              Let our experts handle everything. Free inspection, featured ad, and a dedicated sales agent to get you the best deal.
            </p>
            <ul className="space-y-1.5">
              {["Free Car Inspection", "Featured Ad Included", "Dedicated Sales Agent", "Best Price Guarantee"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-brand-dark2">
                  <Check size={14} style={{ color: "#ea6d00", flexShrink: 0 }} strokeWidth={3} />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-start gap-2 rounded-lg p-2.5" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
              <AlertCircle size={14} style={{ color: "#ea6d00", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px] text-brand-muted leading-snug">
                Available only in <span className="font-semibold text-brand-orange">Rahim Yar Khan, Khanpur, Liaqat Pur, and Sadiqabad</span>
              </p>
            </div>
          </button>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-2.5 text-white font-semibold text-sm transition hover:opacity-90 bg-brand-btn hover:bg-brand-dark2"
          style={{ borderRadius: "0.5rem" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ── Step 1 – Car Information ──────────────────────────────────────────────────

function CarInfoStep({ saleMode, cities, provinces, brands, bodyTypes, onBack, onContinue }) {
  const [form, setForm] = useState({
    city: "",
    year: null,
    brand: null,
    carModel: null,
    bodyType: "",
    engineType: "",
    engineCapacity: "",
    transmission: "",
    assembly: "",
    exteriorColor: "",
    mileage: "",
    isRegistered: true,
    registeredIn: "",
  });

  const [showYMM, setShowYMM] = useState(false);
  const [errors, setErrors] = useState({});

  const managedCities = cities.filter(c => isManagedCity(c.name));
  const displayCities = saleMode === "MANAGED" ? managedCities : cities;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.city)          e.city = "City is required";
    if (!form.year)          e.year = "Year is required";
    if (!form.brand)         e.brand = "Make is required";
    if (!form.carModel)      e.carModel = "Model is required";
    if (!form.bodyType)      e.bodyType = "Body type is required";
    if (!form.engineType)    e.engineType = "Engine type is required";
    if (!form.engineCapacity || isNaN(Number(form.engineCapacity)) || Number(form.engineCapacity) <= 0)
      e.engineCapacity = "Valid engine capacity is required";
    if (!form.transmission)  e.transmission = "Transmission is required";
    if (!form.assembly)      e.assembly = "Assembly is required";
    if (!form.exteriorColor) e.exteriorColor = "Color is required";
    if (form.mileage === "" || isNaN(Number(form.mileage)) || Number(form.mileage) < 0)
      e.mileage = "Valid mileage is required";
    if (form.isRegistered && !form.registeredIn)
      e.registeredIn = "Registration province is required";
    return e;
  };

  const handleContinue = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onContinue({
      city: form.city,
      year: Number(form.year),
      brand: form.brand._id,
      carModel: form.carModel._id,
      bodyType: form.bodyType,
      engineType: form.engineType,
      engineCapacity: Number(form.engineCapacity),
      transmission: form.transmission,
      assembly: form.assembly,
      exteriorColor: form.exteriorColor,
      mileage: Number(form.mileage),
      isRegistered: form.isRegistered,
      registeredIn: form.isRegistered ? form.registeredIn : null,
    });
  };

  const ymmLabel = form.year && form.brand && form.carModel
    ? `${form.year} · ${form.brand.name} · ${form.carModel.name}`
    : "";

  return (
    <div className="max-w-xl mx-auto px-4 pb-10">
      <Stepper current={1} />

      <div className={cardCls}>
        <h2 className="text-xl font-bold text-brand-dark mb-1">Car Information</h2>
        <p className="text-sm text-brand-muted mb-6">
          All fields marked with <span className="text-red-500">*</span> are mandatory
        </p>

        <div className="space-y-4">
          {/* City */}
          <FormField label="City" required>
            <CustomSelect
              value={form.city}
              onChange={v => set("city", v)}
              placeholder="Select City"
              searchable
              searchPlaceholder="Search cities..."
              options={[{ value: "", label: "Select City" }, ...displayCities.map(c => ({ value: c._id, label: c.name }))]}
            />
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
          </FormField>

          {/* Year / Make / Model */}
          <FormField label="Year / Make / Model" required>
            <button
              type="button"
              onClick={() => setShowYMM(true)}
              className="w-full text-left rounded-lg px-3 py-2.5 text-sm border border-black/10 bg-brand-surface transition focus:border-[#374151] focus:ring-2 focus:ring-[#37415114]"
              style={{ color: ymmLabel ? "#1f2937" : "#9ca3af" }}
            >
              {ymmLabel || "e.g. 2022 Toyota Corolla"}
            </button>
            {(errors.year || errors.brand || errors.carModel) && (
              <p className="mt-1 text-xs text-red-500">Year, Make, and Model are required</p>
            )}
          </FormField>

          {/* Body Type */}
          <FormField label="Body Type" required>
            <CustomSelect
              value={form.bodyType}
              onChange={v => set("bodyType", v)}
              placeholder="Select Body Type"
              options={[{ value: "", label: "Select Body Type" }, ...bodyTypes.map(b => ({ value: b._id, label: b.name }))]}
            />
            {errors.bodyType && <p className="mt-1 text-xs text-red-500">{errors.bodyType}</p>}
          </FormField>

          {/* Engine Type */}
          <FormField label="Engine Type" required>
            <CustomSelect
              value={form.engineType}
              onChange={v => set("engineType", v)}
              placeholder="Select Engine Type"
              options={[{ value: "", label: "Select Engine Type" }, ...ENGINE_TYPES.map(o => ({ value: o.value, label: o.label }))]}
            />
            {errors.engineType && <p className="mt-1 text-xs text-red-500">{errors.engineType}</p>}
          </FormField>

          {/* Engine / Battery Capacity */}
          <FormField label={form.engineType === "electric" ? "Battery Capacity * (kWh)" : "Engine Capacity (CC)"} required>
            <input
              type="number"
              className={inputCls}
              placeholder={form.engineType === "electric" ? "e.g. 75" : "e.g. 1300"}
              value={form.engineCapacity}
              onChange={e => set("engineCapacity", e.target.value)}
              min={1}
            />
            {errors.engineCapacity && <p className="mt-1 text-xs text-red-500">{errors.engineCapacity}</p>}
          </FormField>

          {/* Transmission */}
          <FormField label="Transmission" required>
            <div className="flex gap-3">
              {TRANSMISSIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set("transmission", o.value)}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition"
                  style={{
                    borderColor: form.transmission === o.value ? "#ea6d00" : "rgba(0,0,0,0.1)",
                    background: form.transmission === o.value ? "#fff7ed" : "#f8fafc",
                    color: form.transmission === o.value ? "#ea6d00" : "#334155",
                    borderRadius: "0.5rem",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {errors.transmission && <p className="mt-1 text-xs text-red-500">{errors.transmission}</p>}
          </FormField>

          {/* Assembly */}
          <FormField label="Assembly" required>
            <div className="flex gap-3">
              {ASSEMBLIES.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set("assembly", o.value)}
                  className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition"
                  style={{
                    borderColor: form.assembly === o.value ? "#ea6d00" : "rgba(0,0,0,0.1)",
                    background: form.assembly === o.value ? "#fff7ed" : "#f8fafc",
                    color: form.assembly === o.value ? "#ea6d00" : "#334155",
                    borderRadius: "0.5rem",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {errors.assembly && <p className="mt-1 text-xs text-red-500">{errors.assembly}</p>}
          </FormField>

          {/* Exterior Color */}
          <FormField label="Exterior Color" required>
            <CustomSelect
              value={form.exteriorColor}
              onChange={v => set("exteriorColor", v)}
              placeholder="Select Color"
              options={[{ value: "", label: "Select Color" }, ...COLORS.map(c => ({ value: c, label: c }))]}
            />
            {errors.exteriorColor && <p className="mt-1 text-xs text-red-500">{errors.exteriorColor}</p>}
          </FormField>

          {/* Mileage */}
          <FormField label="Mileage (KM)" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-muted">KM</span>
              <input
                type="number"
                className={`${inputCls} pl-10`}
                placeholder="e.g. 45000"
                value={form.mileage}
                onChange={e => set("mileage", e.target.value)}
                min={0}
              />
            </div>
            {errors.mileage && <p className="mt-1 text-xs text-red-500">{errors.mileage}</p>}
          </FormField>

          {/* Registered In */}
          <FormField label="Registered In" required>
            <div className="flex gap-6 mb-3">
              {[{ val: true, label: "Registered" }, { val: false, label: "Un-Registered" }].map(opt => (
                <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isRegistered"
                    checked={form.isRegistered === opt.val}
                    onChange={() => {
                      set("isRegistered", opt.val);
                      if (!opt.val) set("registeredIn", "");
                    }}
                    className="w-4 h-4 accent-brand-orange cursor-pointer"
                  />
                  <span className="text-sm font-medium text-brand-dark2">{opt.label}</span>
                </label>
              ))}
            </div>
            <CustomSelect
              value={form.registeredIn}
              onChange={v => set("registeredIn", v)}
              placeholder="Select Province"
              disabled={!form.isRegistered}
              options={[{ value: "", label: "Select Province" }, ...provinces.map(p => ({ value: p._id, label: p.name }))]}
            />
            {errors.registeredIn && <p className="mt-1 text-xs text-red-500">{errors.registeredIn}</p>}
          </FormField>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 border border-black/10 text-sm font-semibold text-brand-dark2 bg-white hover:bg-gray-50 transition"
            style={{ borderRadius: "0.5rem" }}
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-btn hover:bg-brand-dark2 transition"
            style={{ borderRadius: "0.5rem" }}
          >
            Continue to Upload Photos
          </button>
        </div>
      </div>

      {showYMM && (
        <YMMModal
          brands={brands}
          initialYear={form.year}
          initialBrand={form.brand}
          initialModel={form.carModel}
          onClose={() => setShowYMM(false)}
          onDone={(y, b, m) => {
            set("year", y);
            set("brand", b);
            set("carModel", m);
            setShowYMM(false);
            setErrors(prev => ({ ...prev, year: undefined, brand: undefined, carModel: undefined }));
          }}
        />
      )}
    </div>
  );
}

// ── Step 2 – Upload Photos ────────────────────────────────────────────────────

function UploadStep({ onBack, onContinue }) {
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((incoming) => {
    const allowed = Array.from(incoming).filter(f => f.type.startsWith("image/"));
    const newEntries = allowed.map(f => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      file: f,
      name: f.name,
      size: f.size,
      localUrl: URL.createObjectURL(f),
    }));
    setFiles(prev => [...prev, ...newEntries].slice(0, 10));
  }, []);

  const removeFile = (id) => {
    setFiles(prev => {
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.localUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleContinue = async () => {
    if (files.length === 0) { showError("Please upload at least one photo"); return; }
    setUploading(true);
    try {
      const signatures = await listingService.getUploadSignatures(files.length);
      const uploaded = await Promise.all(
        files.map((f, i) => listingService.uploadToCloudinary(f.file, signatures[i]))
      );
      onContinue(uploaded);
    } catch {
      showError("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 pb-10">
      <Stepper current={2} />

      <div className={cardCls}>
        <h2 className="text-xl font-bold text-brand-dark mb-1">Upload Photos</h2>
        <p className="text-sm text-brand-muted mb-6 leading-relaxed">
          Adding at least 8 pictures improves chances for a quick sale. Include Front, Back, and Interior shots.
          Max 5MB per image. (Max 10 images)
        </p>

        <div
          className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-10 cursor-pointer transition-colors"
          style={{
            borderColor: dragging ? "#ea6d00" : "rgba(0,0,0,0.12)",
            background: dragging ? "#fff7ed" : "#f8fafc",
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "#ea6d00" }}>
            <Upload size={22} color="#fff" />
          </div>
          <p className="text-sm font-semibold text-brand-dark">Click to upload images</p>
          <p className="text-xs text-brand-muted mt-1">or drag and drop files here</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            multiple
            className="hidden"
            onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
              {files.length} photo{files.length !== 1 ? "s" : ""} selected
            </p>
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border border-black/8 bg-brand-surface">
                <img src={f.localUrl} alt={f.name} className="w-12 h-10 object-cover rounded-md shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-dark2 truncate">{f.name}</p>
                  <p className="text-xs text-brand-muted">{formatSize(f.size)}</p>
                </div>
                <button
                  onClick={() => removeFile(f.id)}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition"
                >
                  <X size={15} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 border border-black/10 text-sm font-semibold text-brand-dark2 bg-white hover:bg-gray-50 transition"
            style={{ borderRadius: "0.5rem" }}
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={uploading}
            className="flex-1 py-2.5 text-sm font-semibold text-white transition"
            style={{
              background: uploading ? "#94a3b8" : "#111827",
              borderRadius: "0.5rem",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 – Set Price & Submit ───────────────────────────────────────────────

function PriceStep({ onBack, onSubmit, submitting, saleMode }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    price: "",
    description: "",
    secondaryNumber: "",
    whatsappAllowed: true,
  });
  const [errors, setErrors] = useState({});
  const [descLen, setDescLen] = useState(0);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Primary contact is always the seller's verified account number
  const accountNumber = user?.mobileNumber || "";

  const validate = () => {
    const e = {};
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 1000)
      e.price = "Enter a valid price (min PKR 1,000)";
    if (!form.description || form.description.trim().length < 10)
      e.description = "Description must be at least 10 characters";
    if (form.secondaryNumber && !/^03\d{9}$/.test(form.secondaryNumber))
      e.secondaryNumber = "Enter a valid 11-digit mobile number";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSubmit({
      price: Number(form.price),
      description: form.description.trim(),
      // Sent for completeness — the backend pins it to the account number anyway
      mobileNumber: accountNumber,
      secondaryNumber: form.secondaryNumber || undefined,
      whatsappAllowed: form.whatsappAllowed,
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 pb-10">
      <Stepper current={3} />

      <div className={cardCls}>
        <h2 className="text-xl font-bold text-brand-dark mb-6">Set Price & Contact</h2>

        <div className="space-y-4">
          {/* Price */}
          <FormField label="Price (Rs.)" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted">PKR</span>
              <input
                type="number"
                className={`${inputCls} pl-12`}
                placeholder="Enter realistic price"
                value={form.price}
                onChange={e => set("price", e.target.value)}
                min={1000}
              />
            </div>
            <p className="mt-1 text-xs text-brand-muted">Please enter a realistic price to get more genuine responses.</p>
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
          </FormField>

          {/* Description */}
          <FormField label="Ad Description" required>
            <textarea
              className={`${inputCls} resize-none`}
              rows={5}
              placeholder="Describe your car's condition, features, and history…"
              value={form.description}
              maxLength={995}
              onChange={e => { set("description", e.target.value); setDescLen(e.target.value.length); }}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-red-400">We don't allow promotional messages that are not relevant to the ad.</p>
              <span className="text-xs text-brand-muted">{descLen}/995</span>
            </div>
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </FormField>

          {/* Mobile — verified account number, read-only */}
          <FormField label="Mobile Number" hint="Your verified account number. All inquiries will come on this number.">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">📞</span>
              <div className={`${inputCls} pl-9 bg-gray-50 cursor-default`} style={{ pointerEvents: "none" }}>
                {accountNumber || "—"}
              </div>
            </div>
          </FormField>

          {/* Secondary Number */}
          <FormField label="Secondary Number (Optional)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">📞</span>
              <input
                type="tel"
                className={`${inputCls} pl-9`}
                placeholder="03XXXXXXXXX"
                value={form.secondaryNumber}
                onChange={e => set("secondaryNumber", e.target.value)}
                maxLength={11}
              />
            </div>
            {errors.secondaryNumber && <p className="mt-1 text-xs text-red-500">{errors.secondaryNumber}</p>}
          </FormField>

          {/* WhatsApp Toggle */}
          <div className="border border-black/10 rounded-lg px-4 py-3 bg-brand-surface">
            <WhatsAppToggle
              checked={form.whatsappAllowed}
              onChange={val => set("whatsappAllowed", val)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onBack}
            disabled={submitting}
            className="flex-1 py-2.5 border border-black/10 text-sm font-semibold text-brand-dark2 bg-white hover:bg-gray-50 transition"
            style={{ borderRadius: "0.5rem" }}
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-semibold text-white transition"
            style={{
              background: submitting ? "#94a3b8" : "#111827",
              borderRadius: "0.5rem",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting
              ? "Submitting…"
              : saleMode === "MANAGED"
                ? "Continue for Inspection"
                : "Submit Listing"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PostAd() {
  const navigate = useNavigate();

  const [step, setStep]         = useState(0);
  const [saleMode, setSaleMode] = useState("GENERAL");
  const [carData, setCarData]   = useState(null);
  const [images, setImages]     = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [cities, setCities]       = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [brands, setBrands]       = useState([]);
  const [bodyTypes, setBodyTypes] = useState([]);

  useEffect(() => {
    Promise.all([
      masterService.getCities(),
      masterService.getProvinces(),
      masterService.getBrands(),
      masterService.getBodyTypes(),
    ]).then(([c, p, b, bt]) => {
      setCities(c);
      setProvinces(p);
      setBrands(b);
      setBodyTypes(bt);
    }).catch(() => showError("Failed to load form data. Please refresh."));
  }, []);

  const handleSubmit = async (priceData) => {
    setSubmitting(true);
    try {
      const payload = { saleMode, ...carData, images, ...priceData };
      const created = await listingService.createListing(payload);
      const listingId = created?._id;

      if (saleMode === "MANAGED" && listingId) {
        showSuccess("Listing created! Now schedule your onboarding inspection.");
        navigate(`/inspection/book/${listingId}?mode=managed`);
      } else {
        showSuccess("Listing submitted! It will be reviewed shortly.");
        navigate("/browse-cars");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit listing. Please try again.";
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-start justify-center py-10">
      <div className="w-full">
        {step === 0 && (
          <SaleModeStep
            selected={saleMode}
            onChange={setSaleMode}
            onContinue={() => setStep(1)}
          />
        )}

        {step === 1 && (
          <CarInfoStep
            saleMode={saleMode}
            cities={cities}
            provinces={provinces}
            brands={brands}
            bodyTypes={bodyTypes}
            onBack={() => setStep(0)}
            onContinue={(data) => { setCarData(data); setStep(2); }}
          />
        )}

        {step === 2 && (
          <UploadStep
            onBack={() => setStep(1)}
            onContinue={(imgs) => { setImages(imgs); setStep(3); }}
          />
        )}

        {step === 3 && (
          <PriceStep
            onBack={() => setStep(2)}
            onSubmit={handleSubmit}
            submitting={submitting}
            saleMode={saleMode}
          />
        )}
      </div>
    </div>
  );
}
