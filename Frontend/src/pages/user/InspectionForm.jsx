import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronRight, AlertCircle, Calendar, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as inspectionService from "../../services/inspectionService";
import { showError } from "../../utils/toast";

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inputCls =  "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";

const cardCls = "bg-white rounded-2xl shadow-xl p-8";

const Field = ({ label, required, children, error, hint }) => (
  <div>
    <label className="block text-sm font-medium text-brand-dark2 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint  && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// ── Slot Picker Modal ─────────────────────────────────────────────────────────

function SlotPickerModal({ onConfirm, onCancel, initial }) {
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

// ── Main Form ─────────────────────────────────────────────────────────────────

/*
  URL: /inspection/book/:listingId?mode=managed|seller|buyer

  mode=managed  → Onboarding inspection after MANAGED listing creation (owner, PENDING listing)
  mode=seller   → Seller re-inspection on GENERAL listing (owner, ACTIVE listing)
  mode=buyer    → Buyer inspection request (buyer, ACTIVE listing)
*/

export default function InspectionForm() {
  const { listingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode = searchParams.get("mode") || "buyer"; // managed | seller | buyer

  const isBuyer  = mode === "buyer";
  const isOwner  = mode === "managed" || mode === "seller";

  // Listing info (fetched on mount)
  const [listing, setListing]   = useState(null);
  const [fetchErr, setFetchErr] = useState(false);

  // Form state
  const [city, setCity]           = useState("");
  const [address, setAddress]     = useState("");
  const [slot, setSlot]           = useState(null);  // { date: {iso, label}, slot: "10AM-12PM"|null }
  const [fullName, setFullName]   = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [fee, setFee]             = useState(null); // real fee from settings (CC / body type / EV kWh)

  // Fetch listing details on mount
  useEffect(() => {
    if (!listingId) return;
    const fetch = isOwner
      ? inspectionService.getMyListingDetail(listingId)
      : inspectionService.getPublicListingDetail(listingId);

    fetch
      .then(l => {
        setListing(l);
        // City always comes from the listing — not user-editable
        setCity(l.city?.name || "");
        // Prefill name from auth user
        if (user?.username) setFullName(user.username);
      })
      .catch(() => setFetchErr(true));

    inspectionService.getInspectionFeeQuote(listingId)
      .then(q => setFee(q.amount))
      .catch(() => setFee(null));
  }, [listingId]);

  // Coordination always happens on the requester's verified account number —
  // it's also where the backend sends schedule/reminder SMS (requestedBy).
  const phone = user?.mobileNumber || "";

  const carLabel = listing
    ? `${listing.year} ${listing.brand?.name || ""} ${listing.carModel?.name || ""}`.trim()
    : "";

  // Same form for buyer and seller — the buyer coordinates day/time/place
  // with the seller directly, then books it here.
  const validate = () => {
    const e = {};
    if (!address) e.address = "Address is required";
    if (!slot)    e.slot    = "Please select an inspection slot";
    if (!fullName.trim()) e.fullName = "Full name is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      let inspection;

      const body = {
        inspectionAddress: `${city}, ${address}`,
        scheduledDate: new Date(slot.date.iso).toISOString(),
        ...(slot.slot ? { timeSlot: slot.slot } : {}),
      };

      if (isBuyer) {
        inspection = await inspectionService.requestBuyerInspection(listingId, body);
      } else if (mode === "managed") {
        inspection = await inspectionService.requestManagedInspection(listingId, body);
      } else {
        inspection = await inspectionService.requestSellerReInspection(listingId, body);
      }

      // Create Stripe payment session
      const { checkoutUrl } = await inspectionService.createInspectionPayment(inspection._id);

      // Redirect to Stripe
      window.location.href = checkoutUrl;
    } catch (err) {
      const msg = err?.response?.data?.message || "Something went wrong. Please try again.";
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Slot display label
  const slotLabel = slot
    ? slot.slot
      ? `${slot.date.label} · ${slot.slot}`
      : `${slot.date.label} · Team will contact you`
    : "";

  if (fetchErr) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-brand-dark mb-1">Listing Not Found</h2>
          <p className="text-sm text-brand-muted mb-4">We couldn't load the listing details.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-lg bg-brand-btn text-white text-sm font-medium"
            style={{ borderRadius: "0.5rem" }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-lg">
        <div className={cardCls}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-brand-dark mb-1">
              {mode === "managed" && "Schedule Onboarding Inspection"}
              {mode === "seller"  && "Schedule Car Inspection"}
              {mode === "buyer"   && "Request Car Inspection"}
            </h1>
            <p className="text-sm text-brand-muted">
              {mode === "managed" && "Our inspector will visit to onboard your car for managed sale."}
              {mode === "seller"  && "Book a slot for our inspector to evaluate your car."}
              {mode === "buyer"   && "Agree on a time and place with the seller, then book the slot here — our inspector will meet you both there."}
            </p>
          </div>

          <div className="space-y-4">
            {/* ── CITY (auto-filled from the listing, non-editable) ── */}
            <Field label="City" hint="Inspection takes place in the listing's city">
              <div className={`${inputCls} bg-gray-50 cursor-default`} style={{ pointerEvents: "none" }}>
                {listing ? (city || "—") : <span className="text-gray-400">Loading…</span>}
              </div>
            </Field>

            {/* ── ADDRESS ── */}
            <Field label="Inspection Address" required error={errors.address}
              hint="House/Building No, Street, Area">
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. House 12, Street 4, Model Town"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </Field>

            {/* ── CAR (auto-filled) ── */}
            <Field label="Car">
              <div className={`${inputCls} bg-gray-50 cursor-default`} style={{ pointerEvents: "none" }}>
                {listing ? carLabel : <span className="text-gray-400">Loading…</span>}
              </div>
            </Field>

            {/* ── INSPECTION SLOT ── */}
            <Field label="Inspection Slot" required error={errors.slot}>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-full text-left rounded-lg px-3 py-2.5 text-sm border border-black/10 bg-brand-surface flex items-center justify-between transition hover:border-gray-400"
                style={{ color: slotLabel ? "#1f2937" : "#9ca3af" }}
              >
                <span className="flex items-center gap-2">
                  <Clock size={15} className="text-brand-muted shrink-0" />
                  {slotLabel || "Select date & time slot"}
                </span>
                <ChevronRight size={15} className="text-gray-400 shrink-0" />
              </button>
            </Field>

            {/* ── FULL NAME ── */}
            <Field label="Full Name" required error={errors.fullName}>
              <input
                type="text"
                className={inputCls}
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </Field>

            {/* ── PHONE (requester's verified account number, read-only) ── */}
            <Field label="Phone Number"
              hint="All coordination will happen on your registered account number">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">📞</span>
                <div className={`${inputCls} pl-9 bg-gray-50 cursor-default`} style={{ pointerEvents: "none" }}>
                  {phone || "—"}
                </div>
              </div>
            </Field>

            {/* ── PRICE NOTE ── */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-2">
              <AlertCircle size={15} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                A one-time inspection fee of{" "}
                <span className="font-bold">
                  {fee != null ? `PKR ${fee.toLocaleString()}` : "PKR —"}
                </span>{" "}
                will be charged.
                You'll be redirected to Stripe to complete payment securely.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="flex-1 py-2.5 border border-black/10 text-sm font-semibold text-brand-dark2 bg-white hover:bg-gray-50 transition"
              style={{ borderRadius: "0.5rem" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !listing}
              className="flex-1 py-2.5 text-sm font-semibold text-white transition"
              style={{
                background: submitting || !listing ? "#94a3b8" : "#111827",
                borderRadius: "0.5rem",
                cursor: submitting || !listing ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Processing…" : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>

      {showPicker && (
        <SlotPickerModal
          initial={slot ? { date: slot.date, slot: slot.slot } : null}
          onCancel={() => setShowPicker(false)}
          onConfirm={picked => {
            setSlot(picked);
            setShowPicker(false);
            setErrors(prev => ({ ...prev, slot: undefined }));
          }}
        />
      )}
    </div>
  );
}
