import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Save, Send, Camera, Trash2, X,
  Plus, Check, AlertCircle, Image as ImageIcon, Car,
} from "lucide-react";
import axios from "axios";
import api from "../../../services/api";
import {
  getInspectionReport, updateInspectionReport, publishInspectionReport,
  getChecklistMeta,
} from "../../../services/adminService";
import { showSuccess, showError } from "../../../utils/toast";
import CarDiagram, { PANEL_LABELS as DIAGRAM_PANEL_LABELS } from "../../../components/CarDiagram";
import ReportBuilderSkeleton from "../../../components/admin/ReportBuilderSkeleton";

// ── Quality colour helpers ────────────────────────────────────────────────────

const Q_COLORS = {
  ok:      { bg:"#dcfce7", text:"#15803d", border:"#86efac" },
  caution: { bg:"#fff7ed", text:"#c2410c", border:"#fdba74" },
  bad:     { bg:"#fee2e2", text:"#b91c1c", border:"#fca5a5" },
  na:      { bg:"#f1f5f9", text:"#64748b", border:"#cbd5e1" },
};

function valueCell(quality) {
  return Q_COLORS[quality] ?? Q_COLORS.na;
}

function scoreColor(s) {
  if (s >= 80) return "#16a34a";
  if (s >= 50) return "#d97706";
  return "#dc2626";
}

function calcScore(items) {
  const scorable = items.filter(i => i.quality && i.quality !== "na" && i.value);
  if (!scorable.length) return 0;
  const pts = scorable.reduce((s, i) => s + (i.quality === "ok" ? 100 : i.quality === "caution" ? 50 : 0), 0);
  return Math.round(pts / scorable.length);
}

// ── Cloudinary upload helper ─────────────────────────────────────────────────

async function uploadImage(file) {
  const res = await api.post("/upload/sign", { folder: "inspection-reports", count: 1, resource_type: "image" });
  const sig = res.data.data.signatures[0];
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.api_key);
  fd.append("timestamp", sig.timestamp);
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);
  const up = await axios.post(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, fd);
  return { url: up.data.secure_url, fileId: up.data.public_id };
}

// ── ItemRow ───────────────────────────────────────────────────────────────────

function ItemRow({ itemDef, item, onChange }) {
  const [showNotes, setShowNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const isText = itemDef.type === "text";

  function handleOption(opt) {
    onChange({ ...item, value: opt.value, quality: opt.quality });
  }

  function handleTextChange(e) {
    onChange({ ...item, value: e.target.value });
  }

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadImage(file);
      onChange({ ...item, photos: [...(item.photos ?? []), uploaded] });
    } catch {
      showError("Photo upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removePhoto(i) {
    onChange({ ...item, photos: item.photos.filter((_, idx) => idx !== i) });
  }

  const vc = item.value ? valueCell(item.quality) : null;

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-stretch min-h-[44px]">
        {/* item name */}
        <div className="flex-1 flex items-center px-3 py-2">
          <span className="text-sm text-slate-700">{itemDef.name}</span>
        </div>

        {/* value */}
        <div className="w-48 flex items-center px-2 py-1.5 border-l border-slate-100">
          {isText ? (
            <input
              type="text"
              placeholder={itemDef.placeholder}
              value={item.value ?? ""}
              onChange={handleTextChange}
              className="w-full text-sm px-2 py-1 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {itemDef.options?.map(opt => {
                const active = item.value === opt.value;
                const c = Q_COLORS[opt.quality] ?? Q_COLORS.na;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleOption(opt)}
                    className="text-xs px-2 py-0.5 rounded-full font-medium border transition-all"
                    style={active
                      ? { background: c.bg, color: c.text, borderColor: c.border, boxShadow: `0 0 0 1.5px ${c.border}` }
                      : { background: "#f8fafc", color: "#94a3b8", borderColor: "#e2e8f0" }
                    }
                  >{opt.value}</button>
                );
              })}
            </div>
          )}
        </div>

        {/* action icons */}
        <div className="flex items-center gap-1 px-2 border-l border-slate-100">
          <button
            type="button"
            title="Add notes"
            onClick={() => setShowNotes(v => !v)}
            className={`p-1 rounded ${showNotes || item.notes ? "text-indigo-500" : "text-slate-300 hover:text-slate-500"}`}
          >
            <AlertCircle size={14} />
          </button>
          <button
            type="button"
            title="Add photo"
            onClick={() => fileRef.current?.click()}
            className={`p-1 rounded ${item.photos?.length ? "text-indigo-500" : "text-slate-300 hover:text-slate-500"}`}
            disabled={uploading}
          >
            {uploading ? (
              <span className="text-xs animate-pulse">...</span>
            ) : (
              <Camera size={14} />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </div>

      {/* notes row */}
      {(showNotes || item.notes) && (
        <div className="px-3 pb-2">
          <input
            type="text"
            placeholder="Add notes..."
            value={item.notes ?? ""}
            onChange={e => onChange({ ...item, notes: e.target.value })}
            className="w-full text-sm px-3 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-slate-50"
          />
        </div>
      )}

      {/* photo thumbnails */}
      {item.photos?.length > 0 && (
        <div className="flex gap-2 px-3 pb-2">
          {item.photos.map((p, i) => (
            <div key={i} className="relative group w-14 h-14 rounded-md overflow-hidden border border-slate-200">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SectionStep ───────────────────────────────────────────────────────────────

function SectionStep({ sectionKey, sectionDef, items, onItemChange }) {
  const score = calcScore(items);

  const itemMap = {};
  for (const item of items) itemMap[item.name] = item;

  function handleChange(name, updated) {
    onItemChange(items.map(i => i.name === name ? updated : i));
  }

  return (
    <div className="flex flex-col gap-0">
      {/* section header */}
      <div className="flex items-center justify-between px-4 py-3 rounded-t-lg"
        style={{ background: "#334155" }}>
        <span className="text-white font-semibold text-sm tracking-wide">{sectionDef.label}</span>
        <span className="text-sm font-bold" style={{ color: scoreColor(score) === "#16a34a" ? "#4ade80" : scoreColor(score) === "#d97706" ? "#fbbf24" : "#f87171" }}>
          {score}%
        </span>
      </div>

      {/* groups in 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-slate-200 rounded-b-lg overflow-hidden">
        {sectionDef.groups.map(group => {
          const groupItems = group.items.map(itemDef => ({
            def: itemDef,
            item: itemMap[itemDef.name] ?? { name: itemDef.name, group: group.name, type: itemDef.type ?? "select", value: "", quality: "na", notes: "", photos: [] },
          }));

          return (
            <div key={group.name} className="border-b border-r border-slate-100">
              {/* group sub-header */}
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{group.name}</span>
              </div>
              {groupItems.map(({ def: itemDef, item }) => (
                <ItemRow
                  key={itemDef.name}
                  itemDef={itemDef}
                  item={item}
                  onChange={updated => handleChange(itemDef.name, updated)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DamageStep ────────────────────────────────────────────────────────────────

function markId(m) { return m._id ?? m.localId; }

function DamageStep({ damage, onChange, damageCodes, damageLabels, panelLabels }) {
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [pendingCode, setPendingCode]     = useState("");
  const [uploading, setUploading]         = useState({});

  function handlePanelClick(panelKey) {
    setSelectedPanel(panelKey);
    setPendingCode("");
  }

  function confirmMark() {
    if (!selectedPanel || !pendingCode) return;
    const newMark = {
      localId:  `local_${Date.now()}_${Math.random()}`,
      panel:    selectedPanel,
      code:     pendingCode,
      note:     "",
      imageUrl: "",
      fileId:   "",
    };
    onChange([...damage, newMark]);
    setSelectedPanel(null);
    setPendingCode("");
  }

  function updateMarker(id, patch) {
    onChange(damage.map(d => markId(d) === id ? { ...d, ...patch } : d));
  }

  function removeMarker(id) {
    onChange(damage.filter(d => markId(d) !== id));
  }

  async function uploadPhoto(id, file) {
    setUploading(u => ({ ...u, [id]: true }));
    try {
      const { url, fileId } = await uploadImage(file);
      updateMarker(id, { imageUrl: url, fileId });
    } catch {
      showError("Upload failed");
    } finally {
      setUploading(u => ({ ...u, [id]: false }));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* diagram */}
      <div className="lg:col-span-3">
        <p className="text-sm text-slate-500 mb-3">Click a panel to add a damage mark. Multiple marks per panel are supported.</p>
        <CarDiagram markers={damage} onPanelClick={handlePanelClick} />
      </div>

      {/* sidebar */}
      <div className="lg:col-span-2 flex flex-col gap-4">

        {selectedPanel && (
          <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50">
            <p className="font-semibold text-indigo-800 mb-1 text-sm">Add damage — {panelLabels[selectedPanel]}</p>
            <p className="text-xs text-slate-500 mb-2">Select damage type:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {damageCodes.map(code => (
                <button
                  key={code} type="button"
                  onClick={() => setPendingCode(code)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    pendingCode === code
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-red-300"
                  }`}
                >
                  <span className="block">{code}</span>
                  <span className="font-normal text-[9px]">{damageLabels[code]}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button" onClick={confirmMark} disabled={!pendingCode}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white disabled:opacity-40 hover:bg-red-600 transition-colors"
              >
                Add Mark
              </button>
              <button
                type="button" onClick={() => { setSelectedPanel(null); setPendingCode(""); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {damage.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Marked Damage ({damage.length})</p>
            {damage.map(d => {
              const id = markId(d);
              return (
                <div key={id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold text-white" style={{ background: "#dc2626" }}>{d.code}</span>
                      <span className="text-xs font-semibold text-slate-700">{panelLabels[d.panel]}</span>
                      <span className="text-[10px] text-slate-400">{damageLabels[d.code]}</span>
                    </div>
                    <button type="button" onClick={() => removeMarker(id)}>
                      <X size={13} className="text-slate-400 hover:text-red-500"/>
                    </button>
                  </div>
                  <div className="p-3 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1">
                      {damageCodes.map(code => (
                        <button
                          key={code} type="button"
                          onClick={() => updateMarker(id, { code })}
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-bold transition-all ${
                            d.code === code
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:border-red-300"
                          }`}
                        >{code}</button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Inspector note (optional)"
                      value={d.note}
                      onChange={e => updateMarker(id, { note: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    {d.imageUrl ? (
                      <div className="relative rounded-lg overflow-hidden aspect-video bg-slate-100">
                        <img src={d.imageUrl} alt="" className="w-full h-full object-cover"/>
                        <button
                          type="button"
                          onClick={() => updateMarker(id, { imageUrl: "", fileId: "" })}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                        ><X size={11}/></button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 cursor-pointer transition-colors text-xs font-medium">
                        {uploading[id] ? <span>Uploading…</span> : <><Camera size={14}/><span>Attach damage photo</span></>}
                        <input
                          type="file" accept="image/*" className="hidden"
                          disabled={uploading[id]}
                          onChange={e => e.target.files?.[0] && uploadPhoto(id, e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {damage.length === 0 && !selectedPanel && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <Car size={32} className="mb-2 opacity-40"/>
            <p className="text-sm">No damage marked</p>
            <p className="text-xs">Click a panel on the diagram</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PhotosStep ────────────────────────────────────────────────────────────────

function PhotosStep({ photos, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(f => uploadImage(f)));
      onChange([...photos, ...uploaded.map(u => ({ ...u, caption: "" }))]);
    } catch {
      showError("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function updateCaption(i, caption) {
    onChange(photos.map((p, idx) => idx === i ? { ...p, caption } : p));
  }

  function remove(i) {
    onChange(photos.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        Add general inspection photos that will appear at the end of the public report.
      </p>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-colors mb-6"
      >
        <ImageIcon size={28} className="text-slate-400 mb-2" />
        <span className="text-sm font-medium text-slate-500">
          {uploading ? "Uploading..." : "Click to add photos"}
        </span>
        <span className="text-xs text-slate-400 mt-1">Multiple files supported</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((p, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Caption (optional)"
                value={p.caption ?? ""}
                onChange={e => updateCaption(i, e.target.value)}
                className="text-xs px-2 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── OverviewStep ──────────────────────────────────────────────────────────────

function OverviewStep({ meta, onChange }) {
  const cs = meta.carSnapshot ?? {};

  function setField(field, val) {
    onChange({ ...meta, [field]: val });
  }

  function setSnapshot(field, val) {
    onChange({ ...meta, carSnapshot: { ...cs, [field]: val } });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Car Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          {[
            ["Make", cs.brand], ["Model", cs.carModel], ["Year", cs.year],
            ["Transmission", cs.transmission], ["Engine Type", cs.engineType],
            ["Mileage", cs.mileage ? `${Number(cs.mileage).toLocaleString()} km` : ""],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="font-medium text-slate-700">{val || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inspector Name</span>
          <input
            type="text"
            value={meta.inspectorName ?? ""}
            onChange={e => setField("inspectorName", e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Full name"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inspection Date</span>
          <input
            type="date"
            value={meta.inspectionDate ? meta.inspectionDate.slice(0, 10) : ""}
            onChange={e => setField("inspectionDate", e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Chassis No.</span>
          <input type="text" value={cs.chassisNo ?? ""} onChange={e => setSnapshot("chassisNo", e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Engine No.</span>
          <input type="text" value={cs.engineNo ?? ""} onChange={e => setSnapshot("engineNo", e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Registration No.</span>
          <input type="text" value={cs.registrationNo ?? ""} onChange={e => setSnapshot("registrationNo", e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Registered City</span>
          <input type="text" value={cs.registeredCity ?? ""} onChange={e => setSnapshot("registeredCity", e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Exterior Color</span>
          <input type="text" value={cs.exteriorColor ?? ""} onChange={e => setSnapshot("exteriorColor", e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        </label>
      </div>
    </div>
  );
}

// ── PublishStep ───────────────────────────────────────────────────────────────

function PublishStep({ report, sectionKeys, checklistDef, sectionLabels, sections, onPublish, publishing }) {
  const scores = sectionKeys.map(k => ({
    key:   k,
    label: sectionLabels?.[k] ?? k,
    score: calcScore(sections[k] ?? []),
  }));
  const overall = scores.reduce((a, b) => a + b.score, 0) / scores.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center py-6">
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-extrabold text-white"
          style={{ background: `conic-gradient(${scoreColor(overall)} ${overall}%, #e2e8f0 0%)` }}
        >
          <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center w-[72px] h-[72px]">
            <span style={{ color: scoreColor(overall), fontSize: "1.5rem" }}>{(overall / 10).toFixed(1)}</span>
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-2">Overall Rating</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {scores.map(s => (
          <div key={s.key} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-sm text-slate-700">{s.label}</span>
            <span className="text-sm font-bold" style={{ color: scoreColor(s.score) }}>{s.score}%</span>
          </div>
        ))}
      </div>

      {report?.status !== "PUBLISHED" && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800 font-medium mb-1">Before publishing</p>
          <p className="text-xs text-amber-700">Publishing generates a public link and QR code. You can still edit the report afterwards — a "Last updated" date will show any later changes.</p>
        </div>
      )}

      {report?.status === "PUBLISHED" ? (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-green-50 border border-green-200">
          <Check size={18} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">Report Published</p>
            <p className="text-xs text-green-700 mt-0.5">
              Public link: <span className="font-mono">/reports/{report.verifyToken}</span>
            </p>
            <p className="text-xs text-green-700 mt-1.5">
              You can still edit any section — changes save immediately to this same link.
              {report.lastEditedAt && (
                <> Last updated {new Date(report.lastEditedAt).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}.</>
              )}
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          style={{ background: publishing ? "#94a3b8" : "#16a34a" }}
        >
          <Send size={16} />
          {publishing ? "Publishing..." : "Publish Report"}
        </button>
      )}
    </div>
  );
}

// ── Main ReportBuilder ────────────────────────────────────────────────────────

export default function ReportBuilder() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport]         = useState(null);
  const [meta, setMeta]             = useState({ inspectorName: "", inspectionDate: "", carSnapshot: {} });
  const [sectionItems, setSectionItems] = useState({});
  const [damage, setDamage]         = useState([]);
  const [reportPhotos, setReportPhotos] = useState([]);

  // fetched from backend — no hardcoded checklist
  const [checklistDef, setChecklistDef]   = useState(null);
  const [sectionLabels, setSectionLabels] = useState({});
  const [sectionKeys, setSectionKeys]     = useState([]);
  const [damageCodes, setDamageCodes]     = useState([]);
  const [damageLabels, setDamageLabels]   = useState({});
  const [panelLabels, setPanelLabels]     = useState({});

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [step, setStep]           = useState(0);

  // STEPS is derived from fetched sectionKeys — only built once meta is loaded
  const STEPS = checklistDef ? [
    { key: "overview", label: "Overview" },
    ...sectionKeys.map(k => ({ key: k, label: (sectionLabels[k] ?? k).split(" / ")[0] })),
    { key: "damage",   label: "Body Damage" },
    { key: "photos",   label: "Report Photos" },
    { key: "publish",  label: "Review & Publish" },
  ] : [];

  // ── Load report + checklist meta in parallel ──────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [r, meta_] = await Promise.all([
          getInspectionReport(reportId),
          getChecklistMeta(),
        ]);

        // report
        setReport(r);
        setMeta({
          inspectorName:  r.inspectorName ?? "",
          inspectionDate: r.inspectionDate ?? "",
          carSnapshot:    r.carSnapshot ?? {},
        });

        // checklist def from backend
        const { checklistDef: def, sectionLabels: sl, damageCodes: dc, damageLabels: dl, panelLabels: pl } = meta_;
        const keys = Object.keys(def);
        setChecklistDef(def);
        setSectionLabels(sl);
        setSectionKeys(keys);
        setDamageCodes(dc);
        setDamageLabels(dl);
        setPanelLabels(pl);

        // section items — initialise from saved report data
        const items = {};
        for (const key of keys) {
          items[key] = r.sections?.[key]?.items ?? [];
        }
        setSectionItems(items);

        setDamage(r.exteriorDamage ?? []);
        setReportPhotos(r.reportPhotos ?? []);
      } catch (err) {
        showError("Failed to load report");
      } finally {
        setLoading(false);
      }
    })();
  }, [reportId]);

  // ── Save current step ─────────────────────────────────────────────────────

  const saveCurrentStep = useCallback(async () => {
    if (!reportId || !STEPS.length) return;
    const currentStep = STEPS[step];
    setSaving(true);
    try {
      let body = {};

      if (currentStep.key === "overview") {
        body = {
          inspectorName:  meta.inspectorName,
          inspectionDate: meta.inspectionDate,
          carSnapshot:    meta.carSnapshot,
        };
      } else if (sectionKeys.includes(currentStep.key)) {
        body = {
          sectionKey: currentStep.key,
          items:      sectionItems[currentStep.key] ?? [],
        };
      } else if (currentStep.key === "damage") {
        body = { exteriorDamage: damage };
      } else if (currentStep.key === "photos") {
        body = { reportPhotos };
      }

      const updated = await updateInspectionReport(reportId, body);
      setReport(updated);
    } catch {
      showError("Save failed");
    } finally {
      setSaving(false);
    }
  }, [reportId, step, meta, sectionItems, damage, reportPhotos, STEPS, sectionKeys]);

  async function goTo(target) {
    await saveCurrentStep();
    setStep(target);
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const updated = await publishInspectionReport(reportId);
      setReport(updated);
      showSuccess("Report published successfully!");
    } catch (err) {
      showError(err?.response?.data?.message ?? "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading || !checklistDef) {
    return <ReportBuilderSkeleton />;
  }

  const currentStepKey = STEPS[step]?.key;

  function renderStepContent() {
    if (currentStepKey === "overview") {
      return <OverviewStep meta={meta} onChange={setMeta} />;
    }
    if (sectionKeys.includes(currentStepKey)) {
      return (
        <SectionStep
          sectionKey={currentStepKey}
          sectionDef={{ ...checklistDef[currentStepKey], label: sectionLabels[currentStepKey] ?? currentStepKey }}
          items={sectionItems[currentStepKey] ?? []}
          onItemChange={items => setSectionItems(prev => ({ ...prev, [currentStepKey]: items }))}
        />
      );
    }
    if (currentStepKey === "damage") {
      return (
        <DamageStep
          damage={damage}
          onChange={setDamage}
          damageCodes={damageCodes}
          damageLabels={damageLabels}
          panelLabels={panelLabels}
        />
      );
    }
    if (currentStepKey === "photos") {
      return <PhotosStep photos={reportPhotos} onChange={setReportPhotos} />;
    }
    if (currentStepKey === "publish") {
      return (
        <PublishStep
          report={report}
          sectionKeys={sectionKeys}
          checklistDef={checklistDef}
          sectionLabels={sectionLabels}
          sections={sectionItems}
          onPublish={handlePublish}
          publishing={publishing}
        />
      );
    }
    return null;
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* top bar — fixed, never scrolls */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">{report?.carSnapshot?.title || "Inspection Report"}</p>
          <p className="text-xs text-slate-400">Report Builder</p>
        </div>
        <button
          onClick={saveCurrentStep}
          disabled={saving}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
        >
          <Save size={14} />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="flex flex-1 min-h-0 w-full">
        {/* sidebar step navigator — flush left, own inner scroll */}
        <div className="hidden lg:flex flex-col w-52 shrink-0 py-6 pr-0 border-r border-slate-200 bg-white overflow-y-auto">
          {STEPS.map((s, i) => {
            const isCurrent = i === step;
            const isDone = i < step;
            return (
              <button
                key={s.key}
                onClick={() => goTo(i)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors border-l-2 ${
                  isCurrent
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : isDone
                      ? "border-green-400 text-slate-500 hover:bg-slate-50"
                      : "border-transparent text-slate-400 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent ? "bg-indigo-500 text-white"
                    : isDone   ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {isDone ? <Check size={10} /> : i + 1}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* main content — scrolls independently of the fixed sidebar */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-5xl mx-auto">
          {/* mobile step indicator */}
          <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => goTo(i)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  i === step ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {i + 1}. {s.label}
              </button>
            ))}
          </div>

          {/* step content */}
          <div>{renderStepContent()}</div>

          {/* navigation buttons */}
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => goTo(Math.max(0, step - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => goTo(Math.min(STEPS.length - 1, step + 1))}
              disabled={step === STEPS.length - 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white disabled:opacity-30 hover:bg-indigo-600"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
