import { useEffect, useState } from "react";
import { Phone, Save, Settings, Clock, Plus, Pencil, X, Percent, Wrench } from "lucide-react";
import { getSiteSettings, updateSiteSettings, getInspectionSlots, addInspectionSlot, updateInspectionSlot, } from "../../../services/adminService";
import { showSuccess, showError } from "../../../utils/toast";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DAYS   = [0, 1, 2, 3, 4, 5, 6];

/* ── day checkboxes used inside modal ─────────────────────────────────────── */
function DayCheckboxes({ selected, onChange }) {
  function toggle(day) {
    onChange(selected.includes(day) ? selected.filter(d => d !== day) : [...selected, day]);
  }
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {DAY_LABELS.map((label, i) => {
        const checked = selected.includes(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition"
            style={
              checked
                ? { background: "#ea6d00", color: "#fff", borderColor: "#ea6d00" }
                : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── slot modal ────────────────────────────────────────────────────────────── */
function SlotModal({ slot, defaultDay, onClose, onSave }) {
  const isEdit    = !!slot;
  const isDefault = slot?.isDefault ?? false;

  const [label,         setLabel]         = useState(slot?.label ?? "");
  const [availableDays, setAvailableDays] = useState(
    slot?.availableDays ?? (defaultDay !== undefined ? [defaultDay] : ALL_DAYS)
  );
  const [isActive, setIsActive] = useState(slot?.isActive ?? true);
  const [saving,   setSaving]   = useState(false);

  async function handleSave() {
    if (!label.trim())            { showError("Label is required.");            return; }
    if (availableDays.length === 0) { showError("Select at least one day."); return; }
    setSaving(true);
    try {
      const payload = isDefault
        ? { availableDays, isActive }
        : { label: label.trim(), availableDays, isActive };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-sm font-semibold text-brand-dark">
            {isEdit ? "Edit Slot" : "Add New Slot"}
          </p>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-dark transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1.5">
              Start Time
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              disabled={isDefault}
              placeholder="e.g. 10:30 AM"
              className="w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-sm text-brand-dark outline-none focus:border-brand-orange transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isDefault && (
              <p className="mt-1 text-[11px] text-brand-muted">Default slot labels cannot be changed.</p>
            )}
          </div>

          {/* Days */}
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-0.5">
              Available Days
            </label>
            <p className="text-[11px] text-brand-muted mb-1">Toggle days to enable or disable this slot on specific days</p>
            <DayCheckboxes selected={availableDays} onChange={setAvailableDays} />
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-medium text-brand-dark">Active</p>
                <p className="text-xs text-brand-muted">Inactive slots won't appear for any day</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(v => !v)}
                className="relative rounded-full transition-colors shrink-0"
                style={{ background: isActive ? "#ea6d00" : "#cbd5e1", height: 22, width: 40 }}
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white shadow"
                  style={{
                    width: 18, height: 18, top: 2, left: 2,
                    transform: isActive ? "translateX(18px)" : "translateX(0)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-brand-dark border border-black/10 hover:bg-brand-surface transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "#ea6d00" }}
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Slot"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── main page ─────────────────────────────────────────────────────────────── */
export default function SiteSettings() {
  // ── phone ──
  const [companyPhone, setCompanyPhone] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(true);
  const [phoneSaving,  setPhoneSaving]  = useState(false);

  // ── slots ──
  const [slots,        setSlots]        = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedDay,  setSelectedDay]  = useState(new Date().getDay());
  const [modal,        setModal]        = useState(null);

  // ── inspection fees ──
  const [fees,       setFees]       = useState({ standard: "", managed: "", premium: "" });
  const [feesSaving, setFeesSaving] = useState(false);

  // ── commission ──
  const [commission,       setCommission]       = useState("");
  const [commissionSaving, setCommissionSaving] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then(s => {
        setCompanyPhone(s.companyPhone ?? "");
        setFees({
          standard:     s.inspectionFees?.standard     ?? 2000,
          managed:      s.inspectionFees?.managed      ?? 5000,
          premium:      s.inspectionFees?.premium      ?? 7000,
        });
        setCommission(s.commissionPercentage ?? 0.9);
      })
      .catch(() => showError("Failed to load settings."))
      .finally(() => setPhoneLoading(false));

    getInspectionSlots()
      .then(setSlots)
      .catch(() => showError("Failed to load inspection slots."))
      .finally(() => setSlotsLoading(false));
  }, []);

  const daySlots = slots.filter(s => s.availableDays.includes(selectedDay));

  async function handleAddSlot(payload) {
    try {
      const updated = await addInspectionSlot(payload);
      setSlots(updated);
      showSuccess("Slot added.");
    } catch (e) {
      showError(e?.response?.data?.message ?? "Failed to add slot.");
      throw e;
    }
  }

  async function handleUpdateSlot(slotId, payload) {
    try {
      const updated = await updateInspectionSlot(slotId, payload);
      setSlots(updated);
      showSuccess("Slot updated.");
    } catch (e) {
      showError(e?.response?.data?.message ?? "Failed to update slot.");
      throw e;
    }
  }

  async function savePhone() {
    if (!companyPhone.trim()) { showError("Phone number cannot be empty."); return; }
    setPhoneSaving(true);
    try {
      const updated = await updateSiteSettings({ companyPhone: companyPhone.trim() });
      setCompanyPhone(updated.companyPhone);
      showSuccess("Settings saved.");
    } catch {
      showError("Failed to save settings.");
    } finally { setPhoneSaving(false); }
  }

  async function saveFees() {
    const parsed = {
      standard:     Number(fees.standard),
      managed:      Number(fees.managed),
      premium:      Number(fees.premium),
    };
    if (Object.values(parsed).some(v => !v || v <= 0)) {
      showError("All fees must be positive numbers."); return;
    }
    setFeesSaving(true);
    try {
      const updated = await updateSiteSettings({ inspectionFees: parsed });
      setFees({ standard: updated.inspectionFees.standard, managed: updated.inspectionFees.managed, premium: updated.inspectionFees.premium });
      showSuccess("Inspection fees saved.");
    } catch {
      showError("Failed to save inspection fees.");
    } finally { setFeesSaving(false); }
  }

  async function saveCommission() {
    const val = Number(commission);
    if (!val || val <= 0 || val > 100) { showError("Enter a valid percentage between 0 and 100."); return; }
    setCommissionSaving(true);
    try {
      const updated = await updateSiteSettings({ commissionPercentage: val });
      setCommission(updated.commissionPercentage);
      showSuccess("Commission percentage saved.");
    } catch {
      showError("Failed to save commission.");
    } finally { setCommissionSaving(false); }
  }

  /* ── skeleton ── */
  if (phoneLoading || slotsLoading) return (
    <div className="p-4 sm:p-6 max-w-6xl animate-pulse space-y-4">
      <div className="mb-6">
        <div className="h-5 w-36 bg-gray-200 rounded mb-2" />
        <div className="h-3.5 w-80 bg-gray-100 rounded" />
      </div>
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
            <div>
              <div className="h-4 w-48 bg-gray-200 rounded mb-1.5" />
              <div className="h-3 w-72 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="px-5 py-5 space-y-2">
            <div className="h-8 bg-gray-100 rounded-lg w-full max-w-xs" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl">

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Settings size={18} className="text-brand-muted" />
          <h1 className="text-lg font-bold text-brand-dark">Site Settings</h1>
        </div>
        <p className="text-sm text-brand-muted">Manage company-wide configuration used across the platform</p>
      </div>

      {/* ── Company Phone card ── */}
      <div className="bg-white rounded-xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#fff7ed" }}>
            <Phone size={15} style={{ color: "#ea6d00" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-dark">Company Contact Number</p>
            <p className="text-xs text-brand-muted mt-0.5">
              Displayed to buyers on all MANAGED listings instead of the seller's personal number
            </p>
          </div>
        </div>
        <div className="px-5 py-5">
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
            Phone Number
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:max-w-sm">
            <input
              type="text"
              value={companyPhone}
              onChange={e => setCompanyPhone(e.target.value)}
              placeholder="e.g. 03001234567"
              className="flex-1 bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 text-sm text-brand-dark outline-none focus:border-brand-orange transition"
              onKeyDown={e => e.key === "Enter" && savePhone()}
            />
            <button
              onClick={savePhone}
              disabled={phoneSaving}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:shrink-0"
              style={{ background: "#ea6d00" }}
            >
              <Save size={14} />
              {phoneSaving ? "Saving…" : "Save"}
            </button>
          </div>
          <p className="mt-2.5 text-xs text-brand-muted">Pakistani format: 03XXXXXXXXX (11 digits)</p>
        </div>
      </div>

      {/* ── Inspection Fees card ── */}
      <div className="bg-white rounded-xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
            <Wrench size={15} style={{ color: "#16a34a" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-dark">Inspection Fees</p>
            <p className="text-xs text-brand-muted mt-0.5">Fees charged to users when requesting an inspection (PKR)</p>
          </div>
        </div>
        <div className="px-5 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              { key: "standard",     label: "Standard",     hint: "Cars ≤ 1000cc" },
              { key: "managed",      label: "Managed",      hint: "Cars ≤ 2000cc / default" },
              { key: "premium",      label: "Premium",      hint: "SUV / 4x4 / Jeep / Luxury" },
            ].map(({ key, label, hint }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-muted">PKR</span>
                  <input
                    type="number"
                    min={1}
                    value={fees[key]}
                    onChange={e => setFees(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-brand-surface border border-black/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-brand-dark outline-none focus:border-brand-orange transition"
                  />
                </div>
                <p className="mt-1 text-[11px] text-brand-muted">{hint}</p>
              </div>
            ))}
          </div>
          <button
            onClick={saveFees}
            disabled={feesSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "#ea6d00" }}
          >
            <Save size={14} />
            {feesSaving ? "Saving…" : "Save Fees"}
          </button>
        </div>
      </div>

      {/* ── Commission card ── */}
      <div className="bg-white rounded-xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#faf5ff" }}>
            <Percent size={15} style={{ color: "#7c3aed" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-dark">Commission Percentage</p>
            <p className="text-xs text-brand-muted mt-0.5">Applied to the sale price on all MANAGED listing sales</p>
          </div>
        </div>
        <div className="px-5 py-5">
          <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wide mb-2">
            Percentage (%)
          </label>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
            <div className="relative sm:w-48">
              <input
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                value={commission}
                onChange={e => setCommission(e.target.value)}
                className="w-full bg-brand-surface border border-black/10 rounded-lg px-3 py-2.5 pr-8 text-sm text-brand-dark outline-none focus:border-brand-orange transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-muted">%</span>
            </div>
            <button
              onClick={saveCommission}
              disabled={commissionSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
              style={{ background: "#ea6d00" }}
            >
              <Save size={14} />
              {commissionSaving ? "Saving…" : "Save"}
            </button>
          </div>
          {commission > 0 && (
            <p className="mt-2.5 text-xs text-brand-muted">
              On a PKR 10,00,000 sale → commission = PKR {Math.round(1000000 * Number(commission) / 100).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* ── Inspection Slots card ── */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>

        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
              <Clock size={15} style={{ color: "#16a34a" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-dark">Inspection Time Slots</p>
              <p className="text-xs text-brand-muted mt-0.5">
                Manage which slots are available on each day of the week
              </p>
            </div>
          </div>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white shrink-0 transition hover:opacity-90"
            style={{ background: "#ea6d00" }}
          >
            <Plus size={13} />
            Add Slot
          </button>
        </div>

        {/* Day tabs */}
        <div className="flex px-5 pt-4 gap-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          {DAY_LABELS.map((label, i) => {
            const active  = i === selectedDay;
            const count   = slots.filter(s => s.isActive && s.availableDays.includes(i)).length;
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className="flex flex-col items-center gap-0.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition relative shrink-0"
                style={{
                  color: active ? "#ea6d00" : "#64748b",
                  borderBottom: active ? "2px solid #ea6d00" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {label}
                <span
                  className="text-[10px] font-medium"
                  style={{ color: active ? "#ea6d00" : "#94a3b8" }}
                >
                  {count} slot{count !== 1 ? "s" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slot list for selected day */}
        <div className="divide-y divide-black/4 min-h-30">
          {daySlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Clock size={28} className="text-gray-200" />
              <p className="text-sm text-brand-muted">No slots on {DAY_LABELS[selectedDay]}</p>
              <button
                onClick={() => setModal("add")}
                className="mt-1 text-xs font-semibold flex items-center gap-1 transition hover:opacity-80"
                style={{ color: "#ea6d00" }}
              >
                <Plus size={12} /> Add a slot for this day
              </button>
            </div>
          ) : (
            daySlots.map(slot => (
              <div key={slot._id} className="flex items-center gap-3 px-5 py-3.5">
                {/* Active dot */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: slot.isActive ? "#16a34a" : "#cbd5e1" }}
                />

                {/* Label + badges */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-brand-dark truncate">{slot.label}</span>
                  {slot.isDefault && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                    >
                      Default
                    </span>
                  )}
                  {!slot.isActive && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                    >
                      Inactive
                    </span>
                  )}
                </div>

                {/* Edit */}
                <button
                  onClick={() => setModal(slot)}
                  className="flex items-center gap-1 text-xs font-medium text-brand-muted hover:text-brand-dark transition shrink-0 px-2.5 py-1.5 rounded-lg hover:bg-brand-surface"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer note */}
        <div className="px-5 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.04)", background: "#f8fafc" }}>
          <p className="text-[11px] text-brand-muted">
            Changes take effect for all future inspection bookings. Deactivating a slot won't affect already-scheduled inspections.
          </p>
        </div>
      </div>

      {/* Modals */}
      {modal === "add" && (
        <SlotModal
          slot={null}
          defaultDay={selectedDay}
          onClose={() => setModal(null)}
          onSave={handleAddSlot}
        />
      )}
      {modal && modal !== "add" && (
        <SlotModal
          slot={modal}
          defaultDay={selectedDay}
          onClose={() => setModal(null)}
          onSave={payload => handleUpdateSlot(modal._id, payload)}
        />
      )}

    </div>
  );
}
