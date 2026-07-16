import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as inspectionService from "../../services/inspectionService";
import * as masterService from "../../services/masterService";
import { showError } from "../../utils/toast";
import YMMModal from "../../components/YMMModal";
import SlotPickerModal from "../../components/SlotPickerModal";
import CustomSelect from "../../components/ui/CustomSelect";
import { MANAGED_CITY_NAMES } from "../../utils/managedCities";

// ── Shared styles (same as InspectionForm) ────────────────────────────────────

const inputCls = "w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";
const cardCls  = "bg-white rounded-2xl shadow-xl p-8";

const ENGINE_TYPES = [
  { value: "petrol",   label: "Petrol" },
  { value: "diesel",   label: "Diesel" },
  { value: "hybrid",   label: "Hybrid" },
  { value: "electric", label: "Electric" },
];

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

/*
  URL: /inspection/external

  Inspection booking for a car that is NOT listed on GearTrade. The requester
  enters the vehicle details themselves; the fee uses the same formula as
  listing inspections (body type → engine type → CC).
*/

export default function ExternalInspectionForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Masters
  const [brands,    setBrands]    = useState([]);
  const [bodyTypes, setBodyTypes] = useState([]);

  // Vehicle details
  const [ymm, setYmm]               = useState(null); // { year, brand, model }
  const [showYmm, setShowYmm]       = useState(false);
  const [bodyType, setBodyType]     = useState("");
  const [engineType, setEngineType] = useState("");
  const [engineCapacity, setEngineCapacity] = useState("");

  // Time & place
  const [city, setCity]         = useState("");
  const [address, setAddress]   = useState("");
  const [slot, setSlot]         = useState(null); // { date: {iso, label}, slot }
  const [showPicker, setShowPicker] = useState(false);

  // Contact
  const [fullName, setFullName] = useState(user?.username ?? "");

  const [fee, setFee]           = useState(null);
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isElectric = engineType === "electric";
  const phone = user?.mobileNumber || "";

  useEffect(() => {
    Promise.all([masterService.getBrands(), masterService.getBodyTypes()])
      .then(([b, bt]) => { setBrands(b ?? []); setBodyTypes(bt ?? []); })
      .catch(() => showError("Failed to load form data."));
  }, []);

  // Live fee quote — recalculates whenever the fee inputs are complete
  useEffect(() => {
    if (!bodyType || !engineType || !engineCapacity || Number(engineCapacity) <= 0) {
      setFee(null);
      return;
    }
    inspectionService.getExternalFeeQuote({ bodyType, engineType, engineCapacity })
      .then(q => setFee(q.amount))
      .catch(() => setFee(null));
  }, [bodyType, engineType, engineCapacity]);

  const validate = () => {
    const e = {};
    if (!ymm)                e.ymm = "Select the car's year, make and model";
    if (!bodyType)           e.bodyType = "Body type is required";
    if (!engineType)         e.engineType = "Engine type is required";
    if (!engineCapacity || isNaN(Number(engineCapacity)) || Number(engineCapacity) <= 0)
      e.engineCapacity = isElectric ? "Valid battery capacity is required" : "Valid engine capacity is required";
    if (!city)               e.city = "City is required";
    if (!address)            e.address = "Address is required";
    if (!slot)               e.slot = "Please select an inspection slot";
    if (!fullName.trim())    e.fullName = "Full name is required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      const inspection = await inspectionService.requestExternalInspection({
        year:           ymm.year,
        brand:          ymm.brand.name,
        carModel:       ymm.model.name,
        bodyType,
        engineType,
        engineCapacity: Number(engineCapacity),
        city,
        inspectionAddress: address,
        scheduledDate: new Date(slot.date.iso).toISOString(),
        ...(slot.slot ? { timeSlot: slot.slot } : {}),
      });

      // Create Stripe payment session and redirect
      const { checkoutUrl } = await inspectionService.createInspectionPayment(inspection._id);
      window.location.href = checkoutUrl;
    } catch (err) {
      showError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const slotLabel = slot
    ? slot.slot
      ? `${slot.date.label} · ${slot.slot}`
      : `${slot.date.label} · Team will contact you`
    : "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className={cardCls}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-brand-dark mb-1">Book an Inspection — Any Car</h1>
          <p className="text-sm text-brand-muted">
            For cars not listed on GearTrade. Agree the time and place with the car's owner first —
            our inspector arrives at the address you give below.
          </p>
        </div>

        <div className="space-y-4">
          {/* ── VEHICLE DETAILS ── */}
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted pt-1">Vehicle details</p>

          <Field label="Year, Make & Model" required error={errors.ymm}>
            <button
              type="button"
              onClick={() => setShowYmm(true)}
              className={`${inputCls} flex items-center justify-between text-left cursor-pointer`}
            >
              <span className={ymm ? "" : "text-gray-400"}>
                {ymm ? `${ymm.year} ${ymm.brand.name} ${ymm.model.name}` : "Select year, make and model"}
              </span>
              <ChevronDown size={15} className="text-gray-400 shrink-0" />
            </button>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Body Type" required error={errors.bodyType}>
              <CustomSelect
                value={bodyType}
                onChange={setBodyType}
                placeholder="Select Body Type"
                options={[{ value: "", label: "Select Body Type" }, ...bodyTypes.map(bt => ({ value: bt.name, label: bt.name }))]}
              />
            </Field>

            <Field label="Engine Type" required error={errors.engineType}>
              <CustomSelect
                value={engineType}
                onChange={setEngineType}
                placeholder="Select Engine Type"
                options={[{ value: "", label: "Select Engine Type" }, ...ENGINE_TYPES.map(o => ({ value: o.value, label: o.label }))]}
              />
            </Field>
          </div>

          <Field
            label={isElectric ? "Battery Capacity (kWh)" : "Engine Capacity (CC)"}
            required
            error={errors.engineCapacity}
          >
            <input
              type="number"
              min={1}
              className={inputCls}
              placeholder={isElectric ? "e.g. 75" : "e.g. 1300"}
              value={engineCapacity}
              onChange={e => setEngineCapacity(e.target.value)}
            />
          </Field>

          {/* ── TIME & PLACE ── */}
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted pt-3">Inspection time &amp; place</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City" required error={errors.city}
              hint={`Service cities: ${MANAGED_CITY_NAMES.join(", ")}`}>
              <CustomSelect
                value={city}
                onChange={setCity}
                placeholder="Select City"
                options={[{ value: "", label: "Select City" }, ...MANAGED_CITY_NAMES.map(c => ({ value: c, label: c }))]}
              />
            </Field>

            <Field label="Date & Time Slot" required error={errors.slot}>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className={`${inputCls} flex items-center justify-between text-left cursor-pointer`}
              >
                <span className={slot ? "" : "text-gray-400"}>{slotLabel || "Select date and slot"}</span>
                <ChevronDown size={15} className="text-gray-400 shrink-0" />
              </button>
            </Field>
          </div>

          <Field label="Inspection Address" required error={errors.address}>
            <input
              type="text"
              className={inputCls}
              placeholder="House / street where the car will be available"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </Field>

          {/* ── CONTACT ── */}
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted pt-3">Your contact details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.fullName}>
              <input
                type="text"
                className={inputCls}
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </Field>

            <Field label="Phone Number"
              hint="All coordination will happen on your registered account number">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">📞</span>
                <div className={`${inputCls} pl-9 bg-gray-50 cursor-default`} style={{ pointerEvents: "none" }}>
                  {phone || "—"}
                </div>
              </div>
            </Field>
          </div>

          {/* ── FEE ── */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-2">
            <AlertCircle size={15} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              A one-time inspection fee of{" "}
              <span className="font-bold">
                {fee != null ? `PKR ${fee.toLocaleString()}` : "PKR — (complete the vehicle details)"}
              </span>{" "}
              will be charged. You'll be redirected to Stripe to complete payment securely.
            </p>
          </div>
          <p className="text-[11px] px-1" style={{ color: "#b45309" }}>
            Inspection fees are non-refundable once paid — see Terms of Service.
          </p>
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
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ borderRadius: "0.5rem", background: "#ea6d00" }}
          >
            {submitting ? "Processing…" : "Pay & Book Inspection"}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showYmm && (
        <YMMModal
          brands={brands}
          initialYear={ymm?.year}
          initialBrand={ymm?.brand}
          initialModel={ymm?.model}
          onClose={() => setShowYmm(false)}
          onDone={(year, brand, model) => { setYmm({ year, brand, model }); setShowYmm(false); }}
        />
      )}
      {showPicker && (
        <SlotPickerModal
          initial={slot}
          onCancel={() => setShowPicker(false)}
          onConfirm={s => { setSlot(s); setShowPicker(false); }}
        />
      )}
    </div>
  );
}
