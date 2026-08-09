import { useEffect, useState, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminInspections, assignInspector, updateInspectionStatus, scheduleInspection, initInspectionReport } from "../../../services/adminService";
import { getAvailableSlots } from "../../../services/inspectionService";
import { showSuccess, showError } from "../../../utils/toast";
import { CalendarDays, User, ChevronDown, ClipboardList, X, RefreshCw, ExternalLink } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

// PENDING means the requester hasn't paid yet — admin cannot transition out of it.
const VALID_TRANSITIONS = {
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
};

const STATUS_COLORS = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  SCHEDULED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  IN_PROGRESS: "bg-orange-50 text-orange-700 border-orange-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS = {
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function patchInspection(id, patch) {
  return prev => prev.map(i => i._id === id ? { ...i, ...patch } : i);
}

// ── Reusable custom dropdowns ─────────────────────────────────────────────────

function FilterDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
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
      <button ref={btnRef} onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer text-brand-dark whitespace-nowrap transition-colors">
        {selected?.label} <ChevronDown size={12} className="text-brand-muted" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="fixed z-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-32.5"
            style={{ top: pos.top, left: pos.left }}>
            {options.map(opt => (
              <button key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 cursor-pointer transition-colors
                  ${value === opt.value ? "text-brand-orange font-medium" : "text-brand-dark"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function AdminSelectFull({ value, onChange, children, label }) {
  return (
    <div>
      {label && <label className="text-xs text-brand-muted mb-1 block">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-dark bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[180, 140, 80, 90, 110, 100, 60, 40].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: w }} />
          {i === 1 && <div className="h-3 rounded bg-gray-100 animate-pulse mt-1.5" style={{ width: 100 }} />}
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="flex-1 mr-4">
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="h-7 w-20 bg-gray-100 rounded-lg" />
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-20 bg-gray-100 rounded" />
        <div className="h-5 w-16 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><div className="h-3 bg-gray-100 rounded w-16 mb-1" /><div className="h-4 bg-gray-100 rounded w-24" /></div>
        <div><div className="h-3 bg-gray-100 rounded w-16 mb-1" /><div className="h-4 bg-gray-100 rounded w-24" /></div>
      </div>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${STATUS_COLORS[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function TypeBadge({ type, inspectionBy }) {
  const isManaged = type === "MANAGED";
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded border w-fit
        ${isManaged ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-sky-50 text-sky-700 border-sky-200"}`}>
        {isManaged ? "Managed" : "General"}
      </span>
      {inspectionBy && (
        <span className="text-[11px] text-brand-muted">{inspectionBy === "OWNER" ? "Owner" : "Buyer"}</span>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
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

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-brand-muted">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors">
          Previous
        </button>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 cursor-pointer transition-colors">
          Next
        </button>
      </div>
    </div>
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────────

function AssignModal({ inspection, onClose, onDone }) {
  const [name, setName] = useState(inspection.assignedInspector || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await assignInspector(inspection._id, name.trim());
      showSuccess("Inspector assigned");
      onDone(inspection._id, name.trim());
    } catch {
      showError("Failed to assign inspector");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Assign Inspector" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-brand-muted mb-1 block">Inspector name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ahmed Khan"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm rounded-lg text-white cursor-pointer disabled:opacity-60"
            style={{ background: "#ea6d00" }}>
            {loading ? "Saving…" : "Assign"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ScheduleModal({ inspection, onClose, onDone }) {
  const [address,  setAddress]  = useState(inspection.inspectionAddress || "");
  const [date,     setDate]     = useState(inspection.scheduledDate ? inspection.scheduledDate.slice(0, 10) : "");
  const [timeSlot, setTimeSlot] = useState(inspection.timeSlot || "");
  const [slots,    setSlots]    = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!date) { setSlots([]); return; }
    getAvailableSlots(date, inspection._id)
      .then(data => {
        const booked = new Set(data.bookedSlots ?? []);
        setSlots((data.slots ?? []).filter(s => !booked.has(s.label)));
      })
      .catch(() => setSlots([]));
  }, [date, inspection._id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!address.trim() || !date || !timeSlot.trim()) return;
    setLoading(true);
    try {
      await scheduleInspection(inspection._id, { inspectionAddress: address.trim(), scheduledDate: date, timeSlot: timeSlot.trim() });
      showSuccess("Inspection scheduled");
      onDone(inspection._id, { inspectionAddress: address.trim(), scheduledDate: date, timeSlot: timeSlot.trim() });
    } catch {
      showError("Failed to schedule inspection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Schedule Inspection" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs text-brand-muted mb-1 block">Inspection address</label>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
        </div>
        <div>
          <label className="text-xs text-brand-muted mb-1 block">Date</label>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setTimeSlot(""); }}
            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
        </div>
        <div>
          <label className="text-xs text-brand-muted mb-1 block">Time slot</label>
          {slots.length > 0 ? (
            <select
              value={timeSlot}
              onChange={e => setTimeSlot(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 bg-white"
            >
              <option value="">Select a time slot</option>
              {slots.map(s => (
                <option key={s._id} value={s.label}>{s.label}</option>
              ))}
            </select>
          ) : (
            <input
              value={timeSlot}
              onChange={e => setTimeSlot(e.target.value)}
              placeholder={date ? "e.g. 10:30 AM — no slots configured for this day" : "Select a date first"}
              disabled={!date}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 disabled:opacity-50"
            />
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm rounded-lg text-white cursor-pointer disabled:opacity-60"
            style={{ background: "#ea6d00" }}>
            {loading ? "Saving…" : "Save Schedule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function StatusModal({ inspection, onClose, onDone }) {
  const transitions = VALID_TRANSITIONS[inspection.status] || [];
  const [selected, setSelected] = useState(transitions[0] || "");
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const dropBtnRef = useRef(null);

  const isCancelling = selected === "CANCELLED";
  const canConfirm = !isCancelling || cancelReason.trim().length >= 5;

  async function handleConfirm() {
    setLoading(true);
    try {
      await updateInspectionStatus(inspection._id, selected, isCancelling ? cancelReason.trim() : undefined);
      showSuccess(`Status updated to ${STATUS_LABELS[selected]}`);
      onDone(inspection._id, selected);
    } catch {
      showError("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Update Status" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-brand-muted">
          Current: <StatusBadge status={inspection.status} />
        </div>
        <div>
          <label className="text-xs text-brand-muted mb-1 block">Transition to</label>
          <button
            ref={dropBtnRef}
            type="button"
            onClick={() => {
              if (dropBtnRef.current) {
                const r = dropBtnRef.current.getBoundingClientRect();
                setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
              }
              setDropOpen(p => !p);
            }}
            className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm text-brand-dark bg-white hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
          >
            {STATUS_LABELS[selected]}
            <ChevronDown size={14} className="text-brand-muted" />
          </button>
          {dropOpen && (
            <>
              <div className="fixed inset-0 z-60" onClick={() => setDropOpen(false)} />
              <div className="fixed z-70 bg-white border border-gray-100 rounded-xl shadow-lg py-1"
                style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
                {transitions.map(s => (
                  <button key={s} type="button"
                    onClick={() => { setSelected(s); setDropOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors
                      ${selected === s ? "text-brand-orange font-medium" : "text-brand-dark"}`}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {isCancelling && (
          <div>
            <label className="text-xs text-brand-muted mb-1 block">
              Cancel reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Cancellation Reason"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            {inspection.inspectionBy === "BUYER" && (
              <p className="text-[11px] text-amber-600 mt-1">
                Inspection fees are non-refundable — cancelling will not issue any refund to the payer.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button onClick={handleConfirm} disabled={loading || !canConfirm}
            className="px-4 py-2 text-sm rounded-lg text-white cursor-pointer disabled:opacity-60"
            style={{ background: isCancelling ? "#dc2626" : "#ea6d00" }}>
            {loading ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Actions dropdown ──────────────────────────────────────────────────────────

const ActionsDropdown = memo(function ActionsDropdown({ inspection, onAction }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const transitions = VALID_TRANSITIONS[inspection.status] || [];
  const canSchedule = inspection.status === "SCHEDULED";
  const canBuildReport   = inspection.status === "COMPLETED";
  // Inspector can't be changed once the inspection is finished
  const canAssign = !["COMPLETED", "CANCELLED"].includes(inspection.status);

  function handleToggle() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(p => !p);
  }

  // Nothing an admin can do (e.g. CANCELLED) — no menu at all
  if (!canAssign && !canSchedule && !canBuildReport && transitions.length === 0) {
    return <span className="text-xs text-brand-muted">—</span>;
  }

  return (
    <>
      <button ref={btnRef} onClick={handleToggle}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
        Actions <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="fixed z-40 bg-white border border-gray-100 rounded-xl shadow-lg w-48 py-1 text-sm"
            style={{ top: pos.top, right: pos.right }}>
            {canAssign && (
              <button onClick={() => { setOpen(false); onAction("assign"); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-brand-dark">
                <User size={13} /> Assign Inspector
              </button>
            )}
            {canSchedule && (
              <button onClick={() => { setOpen(false); onAction("schedule"); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-brand-dark">
                <CalendarDays size={13} /> Schedule
              </button>
            )}
            {transitions.length > 0 && (
              <button onClick={() => { setOpen(false); onAction("status"); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-brand-dark">
                <ChevronDown size={13} /> Update Status
              </button>
            )}
            {canBuildReport && (
              <button onClick={() => { setOpen(false); onAction("buildReport"); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-brand-dark">
                <ClipboardList size={13} /> {inspection.reportToken ? "Edit Report" : "Build Report"}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
});

// ── Memoized desktop row ──────────────────────────────────────────────────────

const InspectionRow = memo(function InspectionRow({ insp, onAction }) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm text-brand-dark">{insp.requestedBy?.username || "—"}</p>
        <p className="text-[11px] text-brand-muted">{insp.requestedBy?.email}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-brand-dark text-sm truncate max-w-45 mb-1.5">
          {insp.listing?.brand?.name
            ? `${insp.listing.brand.name} ${insp.listing.carModel?.name ?? ""} · ${insp.listing.year ?? ""}`
            : insp.externalCar?.brand
              ? `${insp.externalCar.brand} ${insp.externalCar.carModel ?? ""} · ${insp.externalCar.year ?? ""}`
              : "—"}
        </p>
        {insp.listing?._id ? (
          <a href={`/browse-cars/${insp.listing._id}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition"
            style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" }}>
            <ExternalLink size={12} /> View
          </a>
        ) : (
          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: "#e0f2fe", color: "#0369a1" }}>
            EXTERNAL
          </span>
        )}
      </td>
      <td className="px-4 py-3"><TypeBadge type={insp.type} inspectionBy={insp.inspectionBy} /></td>
      <td className="px-4 py-3">
        <StatusBadge status={insp.status} />
        {insp.status === "CANCELLED" && insp.cancelReason && (
          <p className="text-[11px] text-brand-muted mt-1 max-w-40" title={insp.cancelReason}>
            {insp.cancelReason}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        {insp.assignedInspector
          ? <span className="text-sm text-brand-dark">{insp.assignedInspector}</span>
          : <span className="text-xs text-brand-muted italic">Unassigned</span>}
      </td>
      <td className="px-4 py-3">
        {insp.scheduledDate ? (
          <div>
            <p className="text-sm text-brand-dark">
              {new Date(insp.scheduledDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            {insp.timeSlot && <p className="text-[11px] text-brand-muted">{insp.timeSlot}</p>}
          </div>
        ) : <span className="text-xs text-brand-muted italic">Not set</span>}
      </td>
      <td className="px-4 py-3">
        {insp.reportToken
          ? <a href={`/reports/${insp.reportToken}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium hover:underline cursor-pointer" style={{ color: "#ea6d00" }}>View Report</a>
          : <span className="text-xs text-brand-muted italic">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <ActionsDropdown inspection={insp} onAction={onAction} />
      </td>
    </tr>
  );
});

// ── Memoized mobile card ──────────────────────────────────────────────────────

const InspectionCard = memo(function InspectionCard({ insp, onAction }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-brand-dark text-sm truncate">
            {insp.listing?.brand?.name
              ? `${insp.listing.brand.name} ${insp.listing.carModel?.name ?? ""} · ${insp.listing.year ?? ""}`
              : insp.externalCar?.brand
                ? `${insp.externalCar.brand} ${insp.externalCar.carModel ?? ""} · ${insp.externalCar.year ?? ""}`
                : "—"}
          </p>
          <p className="text-xs text-brand-muted mt-0.5">{insp.requestedBy?.username} · {insp.requestedBy?.email}</p>
          {insp.listing?._id ? (
            <a href={`/browse-cars/${insp.listing._id}`} target="_blank" rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition"
              style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" }}>
              <ExternalLink size={12} /> View
            </a>
          ) : (
            <span className="mt-1.5 inline-flex px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: "#e0f2fe", color: "#0369a1" }}>
              EXTERNAL
            </span>
          )}
        </div>
        <ActionsDropdown inspection={insp} onAction={onAction} />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <StatusBadge status={insp.status} />
        <TypeBadge type={insp.type} inspectionBy={insp.inspectionBy} />
      </div>
      {insp.status === "CANCELLED" && insp.cancelReason && (
        <p className="text-xs text-brand-muted -mt-1 mb-3">Reason: {insp.cancelReason}</p>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">Inspector</p>
          <p className="text-brand-dark">{insp.assignedInspector || <span className="italic text-brand-muted">Unassigned</span>}</p>
        </div>
        <div>
          <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">Scheduled</p>
          {insp.scheduledDate ? (
            <p className="text-brand-dark">
              {new Date(insp.scheduledDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
              {insp.timeSlot && <span className="text-brand-muted"> · {insp.timeSlot}</span>}
            </p>
          ) : <p className="italic text-brand-muted">Not set</p>}
        </div>
        {insp.inspectionAddress && (
          <div className="col-span-2">
            <p className="text-brand-muted uppercase tracking-wider text-[10px] mb-0.5">Address</p>
            <p className="text-brand-dark">{insp.inspectionAddress}</p>
          </div>
        )}
        {insp.reportToken && (
          <div className="col-span-2">
            <a href={`/reports/${insp.reportToken}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium hover:underline" style={{ color: "#ea6d00" }}>View Report</a>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ManageInspections() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [page, setPage] = useState(1);

  const [assignTarget, setAssignTarget] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (assignedFilter) params.assignedInspector = assignedFilter;
      const res = await getAdminInspections(params);
      setInspections(res.data.data.inspections);
      setPagination(res.data.data.pagination);
    } catch {
      showError("Failed to load inspections");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, assignedFilter]);

  useEffect(() => { fetchInspections(); }, [fetchInspections]);

  function handleFilterChange(setter) {
    return (val) => { setter(val); setPage(1); };
  }

  // Targeted patch handlers — no full re-fetch after each action.
  const handleAssignDone = useCallback((id, inspectorName) => {
    setAssignTarget(null);
    setInspections(patchInspection(id, { assignedInspector: inspectorName }));
  }, []);

  const handleScheduleDone = useCallback((id, { inspectionAddress, scheduledDate, timeSlot }) => {
    setScheduleTarget(null);
    setInspections(patchInspection(id, { inspectionAddress, scheduledDate, timeSlot, status: "SCHEDULED" }));
  }, []);

  const handleStatusDone = useCallback((id, newStatus) => {
    setStatusTarget(null);
    setInspections(patchInspection(id, { status: newStatus }));
  }, []);

  // Stable open-handlers so memo'd rows are not invalidated.
  const openAssign   = useCallback((insp) => setAssignTarget(insp),   []);
  const openSchedule = useCallback((insp) => setScheduleTarget(insp), []);
  const openStatus   = useCallback((insp) => setStatusTarget(insp),   []);

  const handleBuildReport = useCallback(async (insp) => {
    // Open the tab synchronously (inside the click) so the popup blocker
    // doesn't kill it — the report id is only known after the async init,
    // so we point the already-open tab at the URL once we have it.
    const tab = window.open("", "_blank");
    try {
      const report = await initInspectionReport(insp._id);
      const url = `/admin/inspection-reports/${report._id}/build`;
      if (tab) {
        tab.location.href = url;
      } else {
        // Popup was blocked — fall back to same-tab navigation
        navigate(url);
      }
    } catch {
      if (tab) tab.close();
      showError("Failed to open report builder.");
    }
  }, [navigate]);

  const handleAction = useCallback((insp, action) => {
    if (action === "assign")        openAssign(insp);
    else if (action === "schedule") openSchedule(insp);
    else if (action === "status")   openStatus(insp);
    else if (action === "buildReport") handleBuildReport(insp);
  }, [openAssign, openSchedule, openStatus, handleBuildReport]);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-semibold text-brand-dark">Manage Inspections</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {pagination.total} inspection{pagination.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={fetchInspections}
          disabled={loading}
          title="Refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition text-brand-muted disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0">
          {STATUS_TABS.map(tab => (
            <button key={tab.value}
              onClick={() => handleFilterChange(setStatusFilter)(tab.value)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap
                ${statusFilter === tab.value
                  ? "border-brand-orange text-brand-orange bg-orange-50"
                  : "border-gray-200 text-brand-muted hover:bg-gray-50"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <FilterDropdown
            value={typeFilter}
            onChange={val => handleFilterChange(setTypeFilter)(val)}
            options={[
              { label: "All Types", value: "" },
              { label: "General", value: "GENERAL" },
              { label: "Managed", value: "MANAGED" },
            ]}
          />
          <FilterDropdown
            value={assignedFilter}
            onChange={val => handleFilterChange(setAssignedFilter)(val)}
            options={[
              { label: "All", value: "" },
              { label: "Unassigned", value: "false" },
              { label: "Assigned", value: "true" },
            ]}
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Requester", "Listing", "Type", "Status", "Inspector", "Scheduled", "Report", ""].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-medium text-brand-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : inspections.length === 0
              ? <tr><td colSpan={8} className="text-center py-12 text-sm text-brand-muted">No inspections found</td></tr>
              : inspections.map(insp => (
                <InspectionRow
                  key={insp._id}
                  insp={insp}
                  onAction={(action) => handleAction(insp, action)}
                />
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : inspections.length === 0
          ? <p className="text-center py-10 text-sm text-brand-muted">No inspections found</p>
          : inspections.map(insp => (
            <InspectionCard
              key={insp._id}
              insp={insp}
              onAction={(action) => handleAction(insp, action)}
            />
          ))}
      </div>

      <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />

      {assignTarget   && <AssignModal   inspection={assignTarget}   onClose={() => setAssignTarget(null)}   onDone={handleAssignDone} />}
      {scheduleTarget && <ScheduleModal inspection={scheduleTarget} onClose={() => setScheduleTarget(null)} onDone={handleScheduleDone} />}
      {statusTarget   && <StatusModal   inspection={statusTarget}   onClose={() => setStatusTarget(null)}   onDone={handleStatusDone} />}
    </div>
  );
}
