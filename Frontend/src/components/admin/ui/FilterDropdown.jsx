import { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  function handleToggle() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(p => !p);
  }

  const selected = options.find(o => o.value === value);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer text-brand-dark whitespace-nowrap transition-colors"
      >
        {selected?.label} <ChevronDown size={12} className="text-brand-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="fixed z-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-32.5"
            style={{ top: pos.top, left: pos.left }}
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 cursor-pointer transition-colors
                  ${value === opt.value ? "text-brand-orange font-medium" : "text-brand-dark"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
