import { useState, useEffect } from "react";
import { ChevronRight, Calendar, Clock } from "lucide-react";
import * as inspectionService from "../services/inspectionService";

// Build 7 date options: tomorrow → +7 days
function buildDateOptions() {
  const options = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = i === 1
      ? `Tomorrow - ${d.toLocaleDateString("en-PK", { day: "numeric", month: "long" })}`
      : d.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    options.push({ date: d, label, iso });
  }
  return options;
}
const DATE_OPTIONS = buildDateOptions();

// ── Slot Picker Modal ─────────────────────────────────────────────────────────

export default function SlotPickerModal({ onConfirm, onCancel, initial }) {
  const [selectedDate, setSelectedDate] = useState(initial?.date || null);
  const [selectedSlot, setSelectedSlot] = useState(initial?.slot || null);
  const [slots,        setSlots]        = useState([]);
  const [bookedSlots,  setBookedSlots]  = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [cantFind, setCantFind]         = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    inspectionService.getAvailableSlots(selectedDate.iso)
      .then(data => { setSlots(data.slots ?? []); setBookedSlots(data.bookedSlots ?? []); })
      .catch(() => { setSlots([]); setBookedSlots([]); })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate?.iso]);

  const canConfirm = selectedDate && (cantFind || selectedSlot);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      date: selectedDate,
      slot: cantFind ? null : selectedSlot,
    });
  };

  return (
    <div className="fixed inset-0 z-2000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div
        className="relative bg-white w-full flex flex-col"
        style={{ maxWidth: 640, maxHeight: "85vh", borderRadius: "1rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)" }}
      >
        {/* Column headers */}
        <div className="flex border-b border-black/8">
          <div className="w-2/5 px-5 py-3 border-r border-black/8">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">DATE</span>
          </div>
          <div className="flex-1 px-5 py-3 flex items-center gap-2">
            <div className="w-0 h-0 border-t-10 border-b-10 border-l-12 border-t-transparent border-b-transparent border-l-gray-200" />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">TIME</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Date column */}
          <div className="w-2/5 border-r border-black/8 overflow-y-auto">
            {DATE_OPTIONS.map(opt => {
              const active = selectedDate?.iso === opt.iso;
              return (
                <button
                  key={opt.iso}
                  onClick={() => setSelectedDate(opt)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-left transition border-b border-black/5"
                  style={{
                    background: active ? "#EFF6FF" : undefined,
                    color: active ? "#1D4ED8" : "#334155",
                    fontWeight: active ? 600 : 400,
                    outline: active ? "2px solid #BFDBFE" : undefined,
                    outlineOffset: "-2px",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = ""; }}
                >
                  {opt.label}
                  <ChevronRight size={14} style={{ color: active ? "#1D4ED8" : "#94a3b8", flexShrink: 0 }} />
                </button>
              );
            })}
          </div>

          {/* Time slot column */}
          <div className="flex-1 px-5 py-5 overflow-y-auto">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Calendar size={40} className="text-gray-200 mb-3" />
                <p className="text-sm font-semibold text-brand-dark2">Select a date first</p>
                <p className="text-xs text-brand-muted mt-1">Then pick an available time slot</p>
              </div>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-brand-muted">Loading slots…</p>
              </div>
            ) : (
              <>
                {slots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Clock size={32} className="text-gray-200 mb-2" />
                    <p className="text-sm text-brand-muted">No slots available on this day</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {slots.map(slot => {
                      const booked = bookedSlots.includes(slot.label);
                      const active = selectedSlot === slot.label;
                      return (
                        <button
                          key={slot._id}
                          disabled={booked || cantFind}
                          onClick={() => setSelectedSlot(slot.label)}
                          className="px-3 py-2.5 rounded-lg border text-sm font-medium text-center transition"
                          style={{
                            borderColor: active ? "#ea6d00" : booked ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.12)",
                            background: active ? "#FFF7ED" : booked ? "#f8fafc" : "#fff",
                            color: active ? "#ea6d00" : booked ? "#cbd5e1" : "#334155",
                            cursor: booked || cantFind ? "not-allowed" : "pointer",
                            textDecoration: booked ? "line-through" : undefined,
                            borderRadius: "0.5rem",
                          }}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cantFind}
                    onChange={e => { setCantFind(e.target.checked); setSelectedSlot(null); }}
                    className="w-4 h-4 accent-brand-orange cursor-pointer"
                  />
                  <span className="text-sm text-brand-dark2">I can't find my slot here</span>
                </label>
                {cantFind && (
                  <p className="mt-2 text-xs text-brand-muted leading-relaxed">
                    Our team will contact you to schedule a convenient time.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-black/8 bg-gray-50" style={{ borderRadius: "0 0 1rem 1rem" }}>
          <button
            onClick={onCancel}
            className="text-sm font-medium text-brand-orange hover:underline transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-6 py-2 text-sm font-semibold text-white transition"
            style={{
              background: canConfirm ? "#111827" : "#e2e8f0",
              color: canConfirm ? "#fff" : "#94a3b8",
              borderRadius: "0.5rem",
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
