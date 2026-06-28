import { X } from "lucide-react";

export default function Modal({ title, onClose, children, maxWidth = "max-w-md" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className={`bg-white rounded-xl shadow-xl w-full ${maxWidth}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-brand-dark text-sm">{title}</h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
