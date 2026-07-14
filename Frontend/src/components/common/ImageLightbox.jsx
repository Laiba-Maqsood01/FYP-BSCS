import { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, X, ChevronLeft, ChevronRight } from "lucide-react";

// ── Zoomable image lightbox ────────────────────────────────────────────────────
// Full-screen viewer that sits ABOVE the navbar (z-index), fits the image to the
// viewport, and offers zoom in/out/reset with an always-visible close button.
// Pass onPrev/onNext (+ optional counter) to enable gallery navigation.

export function Lightbox({ src, alt, title, note, caption, onClose, onPrev, onNext, counter }) {
  const [zoom, setZoom] = useState(1);
  const clamp = (z) => Math.min(4, Math.max(1, Math.round(z * 10) / 10));

  // Reset zoom whenever the shown image changes (gallery prev/next)
  useEffect(() => { setZoom(1); }, [src]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom(z => clamp(z + 0.5));
      if (e.key === "-") setZoom(z => clamp(z - 0.5));
      if (e.key === "ArrowLeft"  && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    // lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onPrev, onNext]);

  const btnCls = "w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer";
  const navCls = "absolute top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition cursor-pointer";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col print:hidden" onClick={onClose}>
      {/* Toolbar — always visible at the top */}
      <div className="shrink-0 flex items-center justify-end gap-2 p-3" onClick={e => e.stopPropagation()}>
        {counter && <span className="text-white/70 text-xs font-medium mr-auto pl-1">{counter}</span>}
        <button className={btnCls} onClick={() => setZoom(z => clamp(z - 0.5))} disabled={zoom <= 1} title="Zoom out">
          <ZoomOut size={17} />
        </button>
        <span className="text-white text-xs font-medium w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <button className={btnCls} onClick={() => setZoom(z => clamp(z + 0.5))} disabled={zoom >= 4} title="Zoom in">
          <ZoomIn size={17} />
        </button>
        <button className={btnCls} onClick={() => setZoom(1)} disabled={zoom === 1} title="Reset zoom">
          <RotateCcw size={15} />
        </button>
        <button className={btnCls} onClick={onClose} title="Close">
          <X size={18} />
        </button>
      </div>

      {/* Image area — scrolls when zoomed beyond the viewport */}
      <div className="flex-1 overflow-auto p-4 relative">
        {onPrev && (
          <button className={`${navCls} left-3`} onClick={e => { e.stopPropagation(); onPrev(); }} title="Previous">
            <ChevronLeft size={22} />
          </button>
        )}
        {onNext && (
          <button className={`${navCls} right-3`} onClick={e => { e.stopPropagation(); onNext(); }} title="Next">
            <ChevronRight size={22} />
          </button>
        )}
        <div className="min-h-full flex items-center justify-center">
          <div onClick={e => e.stopPropagation()}>
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="object-contain rounded-xl select-none mx-auto"
              style={{ maxHeight: `${78 * zoom}vh`, maxWidth: `${92 * zoom}vw` }}
            />
            {(title || note || caption) && (
              <div className="mt-3 text-center">
                {title   && <p className="text-white font-semibold text-sm">{title}</p>}
                {note    && <p className="text-slate-300 text-xs mt-1">{note}</p>}
                {caption && <p className="text-white text-sm">{caption}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lightbox;
