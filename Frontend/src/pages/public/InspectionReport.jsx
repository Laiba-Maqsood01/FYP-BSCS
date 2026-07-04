import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Printer, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Camera } from "lucide-react";
import { getPublicReport } from "../../services/reportService";
import CarDiagram from "../../components/CarDiagram";

// ── Print styles injected into <head> ─────────────────────────────────────────
// Forces background colours to render in PDF/print, hides nav/footer, prevents
// section headers and rows from splitting across page breaks.

const PRINT_STYLES = `
@media print {
  /* hide site chrome */
  nav, header, footer,
  [data-print-hide],
  .print\\:hidden { display: none !important; }

  body { background: white !important; }

  /* force background colours (Chrome strips them by default) */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* prevent sections from splitting across pages */
  .section-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* prevent a group column from orphaning */
  .group-col {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* keep section header glued to its first row */
  .section-header {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* keep each item row together */
  .item-row {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* ensure header card stays together */
  .report-header {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* page margins */
  @page {
    margin: 12mm 10mm;
  }
}
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTION_LABELS = {
  bodyFrame:  "Body Frame / Accident Checklist",
  engine:     "Engine / Transmission / Clutch",
  brakes:     "Brakes",
  suspension: "Suspension / Steering",
  interior:   "Interior",
  acHeater:   "AC / Heater",
  electrical: "Electrical & Electronics",
  exterior:   "Exterior & Body",
  tyres:      "Tyres",
  testDrive:  "Test Drive",
};

const SECTION_ICONS = {
  bodyFrame:  "🔩",
  engine:     "⚙️",
  brakes:     "🛑",
  suspension: "🔧",
  interior:   "🪑",
  acHeater:   "❄️",
  electrical: "⚡",
  exterior:   "🚗",
  tyres:      "🔵",
  testDrive:  "🏁",
};

const SECTION_KEYS = Object.keys(SECTION_LABELS);

// ── Sensitive field masking ───────────────────────────────────────────────────
// Shows first 2 + last 2 characters; replaces middle with ****

function maskSensitive(value) {
  if (!value || value.length <= 4) return value || "—";
  const stars = "*".repeat(Math.max(value.length - 4, 4));
  return `${value.slice(0, 2)}${stars}${value.slice(-2)}`;
}

// ── Quality colour helpers ─────────────────────────────────────────────────────

function qualityStyle(quality) {
  if (quality === "ok")      return { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" };
  if (quality === "caution") return { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" };
  if (quality === "bad")     return { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" };
  return { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" };
}

function QualityIcon({ quality, size = 13 }) {
  if (quality === "ok")      return <CheckCircle2 size={size} className="shrink-0 text-green-600" />;
  if (quality === "caution") return <AlertTriangle size={size} className="shrink-0 text-orange-500" />;
  if (quality === "bad")     return <XCircle       size={size} className="shrink-0 text-red-600" />;
  return <MinusCircle size={size} className="shrink-0 text-slate-400" />;
}

function scoreColor(s) {
  if (s >= 80) return "#16a34a";
  if (s >= 50) return "#d97706";
  return "#dc2626";
}

// ── ScoreGauge ────────────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 90 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.2} fontWeight="700" fontFamily="sans-serif">
        {score}%
      </text>
    </svg>
  );
}

// ── QRCodeBlock ───────────────────────────────────────────────────────────────

function QRCodeBlock({ token, compact = false }) {
  const url = `${window.location.origin}/reports/${token}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}`;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <img src={qrSrc} alt="Verify QR Code" className="w-14 h-14" />
        <div>
          <p className="text-xs font-semibold text-slate-700">Scan to verify</p>
          <p className="text-xs font-mono text-indigo-600 break-all">{url}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white">
      <img src={qrSrc} alt="Verify QR Code" className="w-24 h-24" />
      <p className="text-xs text-slate-400 text-center">Scan to verify</p>
      <p className="text-xs font-mono text-indigo-600 break-all text-center">{url}</p>
    </div>
  );
}

// ── SectionBlock ──────────────────────────────────────────────────────────────

function SectionBlock({ sectionKey, section }) {
  if (!section?.items?.length) return null;

  const score = section.score ?? 0;
  const scoreLabel = scoreColor(score);

  const groupMap = {};
  for (const item of section.items) {
    const g = item.group || SECTION_LABELS[sectionKey];
    if (!groupMap[g]) groupMap[g] = [];
    groupMap[g].push(item);
  }
  const groups = Object.entries(groupMap);

  return (
    <div
      className="section-block rounded-xl overflow-hidden border border-slate-200 shadow-sm"
      style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
    >
      {/* dark header — background forced in print via print-color-adjust */}
      <div
        className="section-header flex items-center justify-between px-5 py-3"
        style={{
          background: "#1e293b",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        <div className="flex items-center gap-2">
          <span>{SECTION_ICONS[sectionKey]}</span>
          <span className="text-white font-semibold text-sm">{SECTION_LABELS[sectionKey]}</span>
        </div>
        <span
          className="text-sm font-bold"
          style={{ color: scoreLabel === "#16a34a" ? "#4ade80" : scoreLabel === "#d97706" ? "#fbbf24" : "#f87171" }}
        >
          {score}%
        </span>
      </div>

      {/* groups — 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {groups.map(([ groupName, items ]) => (
          <div
            key={groupName}
            className="group-col border-b border-r border-slate-100"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            {/* sub-group header */}
            <div
              className="px-4 py-2 border-b border-slate-200"
              style={{
                background: "#f8fafc",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{groupName}</span>
            </div>

            {items.map((item, i) => {
              const qs = item.value ? qualityStyle(item.quality) : qualityStyle("na");
              return (
                <div
                  key={i}
                  className="item-row"
                  style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                >
                  <div
                    className="flex items-stretch border-b border-slate-100 last:border-0"
                    style={{
                      background: i % 2 === 0 ? "#ffffff" : "#fafafa",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    {/* name */}
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5">
                      <QualityIcon quality={item.value ? item.quality : "na"} />
                      <span className="text-sm text-slate-700">{item.name}</span>
                      {item.photos?.length > 0 && (
                        <Camera size={11} className="text-indigo-400 shrink-0" />
                      )}
                    </div>

                    {/* value badge */}
                    <div className="flex items-center px-4 py-2.5 border-l border-slate-100">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={item.value
                          ? { background: qs.bg, color: qs.text, border: `1px solid ${qs.border}`, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }
                          : { background: "#f1f5f9", color: "#94a3b8" }
                        }
                      >
                        {item.value || "—"}
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="px-10 pb-2 text-xs text-slate-400 italic">{item.notes}</div>
                  )}

                  {item.photos?.length > 0 && (
                    <div className="flex gap-2 px-10 pb-3">
                      {item.photos.map((p, pi) => (
                        <a key={pi} href={p.url} target="_blank" rel="noreferrer">
                          <img src={p.url} alt="" className="w-16 h-12 object-cover rounded-lg border border-slate-200 hover:opacity-90" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InspectionReport() {
  const { verifyToken } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(null);
  const [activeDamageMarker, setActiveDamageMarker] = useState(null);

  // inject print styles once
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "report-print-styles";
    el.textContent = PRINT_STYLES;
    if (!document.getElementById("report-print-styles")) {
      document.head.appendChild(el);
    }
    return () => el.remove();
  }, []);

  useEffect(() => {
    getPublicReport(verifyToken)
      .then(setReport)
      .catch(() => setError("Report not found or not yet published."))
      .finally(() => setLoading(false));
  }, [verifyToken]);

  useEffect(() => {
    if (!report) return;
    const cs = report.carSnapshot ?? {};
    const prevTitle = document.title;
    document.title = cs.title || [cs.brand, cs.carModel, cs.year].filter(Boolean).join(" ") || "Inspection Report";
    return () => { document.title = prevTitle; };
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <XCircle size={48} className="text-red-400" />
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  const cs = report.carSnapshot ?? {};
  const overallScore = Math.round((report.overallRating ?? 0) * 10);
  const sections = report.sections ?? {};
  const damage = report.exteriorDamage ?? [];
  const photos = report.reportPhotos ?? [];

  const sectionScores = SECTION_KEYS.map(k => ({
    key: k,
    label: SECTION_LABELS[k],
    icon:  SECTION_ICONS[k],
    score: sections[k]?.score ?? 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">

      {/* print button — hidden in print */}
      <div className="flex justify-end px-4 pt-4 print:hidden" data-print-hide>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 shadow-sm"
        >
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-8">

        {/* ── Header card ──────────────────────────────────────────────── */}
        <div
          className="report-header bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          <div className="p-5">
            {/* TOP ROW — cover photo | rating + QR */}
            <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"20px", alignItems:"center" }}>

              {/* LEFT — cover photo */}
              {cs.images?.[0]?.url && (
                <img
                  src={cs.images[0].url}
                  alt={cs.title || "Cover photo"}
                  style={{ width:"160px", height:"160px", objectFit:"cover", borderRadius:"12px", flexShrink:0 }}
                />
              )}

              {/* RIGHT — score + verified badge with QR */}
              <div style={{ display:"flex", alignItems:"center", gap:"24px", flexWrap:"wrap" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                  <ScoreGauge score={overallScore} size={88} />
                  <p style={{ fontSize:"10px", color:"#94a3b8", fontWeight:600, margin:0 }}>Overall Score</p>
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <img src="/logo2.svg" alt="GearTrade" style={{ height:"32px", width:"auto", flexShrink:0 }} />
                  <div>
                    <p style={{ color:"#16a34a", fontSize:"12px", fontWeight:700, margin:0, lineHeight:1.2 }}>GearTrade Verified Report</p>
                  </div>
                  <QRCodeBlock token={verifyToken} compact />
                </div>
              </div>
            </div>

            {/* BOTTOM — all remaining details */}
            <div style={{ marginTop:"16px", paddingTop:"14px", borderTop:"1px solid #f1f5f9" }}>
              <h1 style={{ fontSize:"1.35rem", fontWeight:800, color:"#1e293b", lineHeight:1.2, margin:0 }}>
                {cs.title || `${cs.brand} ${cs.carModel} ${cs.year}`}
              </h1>

              {/* key specs as a compact table-like grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,auto)", gap:"2px 20px", marginTop:"10px" }}>
                {[
                  ["Year",         cs.year],
                  ["Transmission", cs.transmission],
                  ["Engine",       cs.engineType],
                  ["Mileage",      cs.mileage ? `${Number(cs.mileage).toLocaleString()} km` : null],
                  ["Color",        cs.exteriorColor],
                  ["City",         cs.location || cs.registeredCity],
                ].filter(([,v]) => v).map(([label, val]) => (
                  <div key={label} style={{ lineHeight:1.4 }}>
                    <span style={{ fontSize:"10px", color:"#94a3b8", display:"block" }}>{label}</span>
                    <span style={{ fontSize:"12px", fontWeight:600, color:"#374151" }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* masked sensitive fields */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 20px", marginTop:"10px", paddingTop:"8px", borderTop:"1px solid #f1f5f9" }}>
                {cs.registrationNo && (
                  <span style={{ fontSize:"11px", color:"#64748b" }}>
                    Reg: <strong style={{ fontFamily:"monospace", color:"#1e293b" }}>{maskSensitive(cs.registrationNo)}</strong>
                  </span>
                )}
                {cs.chassisNo && (
                  <span style={{ fontSize:"11px", color:"#64748b" }}>
                    Chassis: <strong style={{ fontFamily:"monospace", color:"#1e293b" }}>{maskSensitive(cs.chassisNo)}</strong>
                  </span>
                )}
                {cs.engineNo && (
                  <span style={{ fontSize:"11px", color:"#64748b" }}>
                    Engine No: <strong style={{ fontFamily:"monospace", color:"#1e293b" }}>{maskSensitive(cs.engineNo)}</strong>
                  </span>
                )}
                {cs.registeredCity && (
                  <span style={{ fontSize:"11px", color:"#64748b" }}>
                    Registered: <strong style={{ color:"#1e293b" }}>{cs.registeredCity}</strong>
                  </span>
                )}
              </div>

              {/* inspector + date */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 20px", marginTop:"8px", fontSize:"11px", color:"#64748b" }}>
                {report.inspectorName && (
                  <span>Inspector: <strong style={{ color:"#1e293b" }}>{report.inspectorName}</strong></span>
                )}
                {report.inspectionDate && (
                  <span>Date: <strong style={{ color:"#1e293b" }}>
                    {new Date(report.inspectionDate).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
                  </strong></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section score bars ────────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          <h2 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Inspection Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sectionScores.map(s => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{s.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">{s.label}</span>
                    <span className="text-xs font-bold" style={{ color: scoreColor(s.score) }}>{s.score}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.score}%`, background: scoreColor(s.score), WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Exterior damage diagram ───────────────────────────────────── */}
        {damage.length > 0 && (
          <div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            <h2 className="text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">Exterior Damage Map</h2>
            <p className="text-xs text-slate-400 mb-4 print:hidden">Tap a label to view the damage photo.</p>
            <CarDiagram
              markers={damage}
              readonly
              onImageClick={m => setActiveDamageMarker(m)}
            />
          </div>
        )}

        {/* ── All sections ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {SECTION_KEYS.map(key => (
            <SectionBlock key={key} sectionKey={key} section={sections[key]} />
          ))}
        </div>

        {/* ── Report photos ─────────────────────────────────────────────── */}
        {photos.length > 0 && (
          <div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            <h2 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Inspection Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((p, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="rounded-xl overflow-hidden border border-slate-200 aspect-video hover:opacity-90 print:hidden"
                    onClick={() => setActivePhotoIdx(i)}
                  >
                    <img src={p.url} alt={p.caption || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                  {/* print version (non-interactive) */}
                  <div className="hidden print:block rounded-xl overflow-hidden border border-slate-200 aspect-video">
                    <img src={p.url} alt={p.caption || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                  {p.caption && <p className="text-xs text-slate-500 text-center">{p.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Damage photos (PDF-visible, screen-visible, shown at end) ── */}
        {damage.filter(d => d.imageUrl).length > 0 && (
          <div
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            <h2 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Damage Documentation</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {damage.filter(d => d.imageUrl).map((d, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="rounded-xl overflow-hidden border border-slate-200 aspect-video hover:opacity-90 print:hidden"
                    onClick={() => setActiveDamageMarker(d)}
                  >
                    <img src={d.imageUrl} alt={d.panel} className="w-full h-full object-cover"/>
                  </button>
                  {/* print version */}
                  <div className="hidden print:block rounded-xl overflow-hidden border border-slate-200 aspect-video">
                    <img src={d.imageUrl} alt={d.panel} className="w-full h-full object-cover"/>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 text-center">
                    {d.code && <span className="mr-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-red-500">{d.code}</span>}
                    {d.panel?.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  {d.note && <p className="text-xs text-slate-400 text-center">{d.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer strip ─────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-xs text-slate-400"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          <p>
            This report was generated by a GearTrade certified inspector and is tamper-proof once published.
            Token: <span className="font-mono text-indigo-500">{verifyToken}</span>
          </p>
          <span className="text-slate-300">geartrade.app</span>
        </div>

      </div>

      {/* ── Report photo lightbox ──────────────────────────────────────── */}
      {activePhotoIdx !== null && photos[activePhotoIdx] && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:hidden"
          onClick={() => setActivePhotoIdx(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={photos[activePhotoIdx].url} alt="" className="w-full rounded-xl" />
            {photos[activePhotoIdx].caption && (
              <p className="text-white text-sm text-center mt-3">{photos[activePhotoIdx].caption}</p>
            )}
            <button
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-800 shadow-lg text-lg font-bold"
              onClick={() => setActivePhotoIdx(null)}
            >×</button>
          </div>
        </div>
      )}

      {/* ── Damage marker lightbox ─────────────────────────────────────── */}
      {activeDamageMarker?.imageUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:hidden"
          onClick={() => setActiveDamageMarker(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={activeDamageMarker.imageUrl} alt={activeDamageMarker.panel} className="w-full rounded-xl"/>
            <div className="mt-3 text-center">
              <p className="text-white font-semibold text-sm">
                {activeDamageMarker.panel?.replace(/([A-Z])/g, " $1").trim()}
              </p>
              {activeDamageMarker.note && (
                <p className="text-slate-300 text-xs mt-1">{activeDamageMarker.note}</p>
              )}
            </div>
            <button
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-800 shadow-lg text-lg font-bold"
              onClick={() => setActiveDamageMarker(null)}
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
}
