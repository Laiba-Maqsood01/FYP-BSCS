import { X } from "lucide-react";

// User-facing modal. Uses z-[9000] to sit above the dashboard sidebar overlay.
export default function Modal({ title, onClose, children, maxWidth = "max-w-md" }) {
  return (
    <div className="fixed inset-0 z-9000 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className={`bg-white rounded-2xl w-full ${maxWidth} shadow-xl`}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="font-semibold text-brand-dark">{title}</p>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark transition cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
