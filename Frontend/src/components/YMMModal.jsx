import { useState, useEffect, useRef } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { showError } from "../utils/toast";
import * as masterService from "../services/masterService";

const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);

// ── Year / Make / Model Modal ─────────────────────────────────────────────────

export default function YMMModal({ brands, onDone, onClose, initialYear, initialBrand, initialModel }) {
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
