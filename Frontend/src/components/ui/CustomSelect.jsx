import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

// Styled dropdown used across forms (Post Ad, external inspection booking…).
// options: [{ value, label }] — pass searchable for long lists (e.g. cities).
export default function CustomSelect({ value, onChange, options, placeholder, disabled, searchable, searchPlaceholder = "Search..." }) {
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
