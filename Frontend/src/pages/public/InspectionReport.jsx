import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Printer, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Camera,
  BadgeCheck, MapPin, Gauge, Settings, Fuel, Palette, Lock,
  Frame, Cog, Disc, Wrench, Armchair, Snowflake, Zap, Car, CircleDot, Route,
} from "lucide-react";
import { getPublicReport } from "../../services/reportService";
import CarDiagram from "../../components/CarDiagram";
import { Lightbox } from "../../components/common/ImageLightbox";

// ── Print styles injected into <head> ─────────────────────────────────────────
// Forces background colours to render in PDF/print, hides nav/footer, prevents
// section headers and rows from splitting across page breaks.

const PRINT_STYLES = `
@media print {
  nav, header, footer,
  [data-print-hide],
  .print\\:hidden { display: none !important; }

  body { background: white !important; }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .section-block { break-inside: avoid; page-break-inside: avoid; }
  .group-col { break-inside: avoid; page-break-inside: avoid; }
  .section-header { break-after: avoid; page-break-after: avoid; }
  .item-row { break-inside: avoid; page-break-inside: avoid; }
  .report-header { break-inside: avoid; page-break-inside: avoid; }

  @page { margin: 12mm 10mm; }
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

const SECTION_ICON = {
  bodyFrame:  Frame,
  engine:     Cog,
  brakes:     Disc,
  suspension: Wrench,
  interior:   Armchair,
  acHeater:   Snowflake,
  electrical: Zap,
  exterior:   Car,
  tyres:      CircleDot,
  testDrive:  Route,
};

const SECTION_KEYS = Object.keys(SECTION_LABELS);

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : s);

// ── Sensitive field masking ───────────────────────────────────────────────────

function maskSensitive(value) {
  if (!value || value.length <= 4) return value || "—";
  const stars = "*".repeat(Math.max(value.length - 4, 4));
  return `${value.slice(0, 2)}${stars}${value.slice(-2)}`;
}

// ── Colour helpers ─────────────────────────────────────────────────────────────

function qualityStyle(quality) {
  if (quality === "ok")      return { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" };
  if (quality === "caution") return { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" };
  if (quality === "bad")     return { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" };
  return { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" };
}

function QualityIcon({ quality, size = 15 }) {
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

function scoreTint(s) {
  if (s >= 80) return { bg: "#dcfce7", text: "#15803d" };
  if (s >= 50) return { bg: "#fff7ed", text: "#c2410c" };
  return { bg: "#fee2e2", text: "#b91c1c" };
}

function verdictLabel(s) {
  if (s >= 90) return "Excellent condition";
  if (s >= 80) return "Good condition";
  if (s >= 50) return "Fair condition";
  return "Poor condition";
}

// ── ScoreGauge ────────────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 88 }) {
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
        fill="#0f172a" fontSize={size * 0.22} fontWeight="700" fontFamily="sans-serif">
        {score}%
      </text>
    </svg>
  );
}

// ── SectionCard title ──────────────────────────────────────────────────────────

function CardTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={16} className="text-slate-400" />}
      <h2 className="text-[0.95rem] font-semibold text-slate-800">{children}</h2>
    </div>
  );
}

// ── SectionBlock ──────────────────────────────────────────────────────────────

function SectionBlock({ sectionKey, section, onPhotoClick }) {
  if (!section?.items?.length) return null;

  const score = section.score ?? 0;
  const color = scoreColor(score);
  const tint = scoreTint(score);
  const Icon = SECTION_ICON[sectionKey];

  const groupMap = {};
  for (const item of section.items) {
    const g = item.group || SECTION_LABELS[sectionKey];
    if (!groupMap[g]) groupMap[g] = [];
    groupMap[g].push(item);
  }
  const groups = Object.entries(groupMap);

  return (
    <div
      className="section-block rounded-xl overflow-hidden border border-slate-200 bg-white"
      style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
    >
      {/* header — light with a score-coloured accent line */}
      <div
        className="section-header flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: `2px solid ${color}` }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 30, height: 30, background: tint.bg, color: tint.text }}
          >
            {Icon && <Icon size={16} />}
          </span>
          <span className="font-semibold text-slate-800 text-[0.95rem] truncate">{SECTION_LABELS[sectionKey]}</span>
        </div>
        <span className="font-bold text-sm shrink-0" style={{ color }}>{score}%</span>
      </div>

      <div>
        {groups.map(([ groupName, items ]) => (
          <div
            key={groupName}
            className="group-col"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            <div className="px-5 pt-3 pb-1">
              <span className="text-[11px] font-semibold text-slate-400 tracking-wide">{groupName}</span>
            </div>

            {items.map((item, i) => {
              const q = item.value ? item.quality : "na";
              const qs = qualityStyle(q);
              return (
                <div
                  key={i}
                  className="item-row px-5"
                  style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                >
                  <div className="flex items-center justify-between gap-3 py-2.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <QualityIcon quality={q} />
                      <span className="text-sm text-slate-700">{item.name}</span>
                      {item.photos?.length > 0 && <Camera size={12} className="text-slate-300 shrink-0" />}
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: qs.bg, color: qs.text, border: `1px solid ${qs.border}` }}
                    >
                      {item.value || "—"}
                    </span>
                  </div>

                  {item.notes && (
                    <div className="pb-2 text-xs text-slate-400 italic" style={{ paddingLeft: "26px" }}>{item.notes}</div>
                  )}

                  {item.photos?.length > 0 && (
                    <div className="flex gap-2 pb-3" style={{ paddingLeft: "26px" }}>
                      {item.photos.map((p, pi) => (
                        <img
                          key={pi}
                          src={p.url}
                          alt={item.name || ""}
                          onClick={() => onPhotoClick?.(p.url, item.name)}
                          className="w-20 h-14 object-cover rounded-lg border border-slate-200 hover:opacity-90 cursor-pointer"
                        />
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
  const [activeItemPhoto, setActiveItemPhoto] = useState(null);

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
      .catch(e => setError(e?.response?.data?.message ?? "Report not found or not yet published."))
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
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

  const verifyUrl = `${window.location.origin}/reports/${verifyToken}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verifyUrl)}`;
  const shortUrl = verifyUrl.replace(/^https?:\/\//, "").replace(verifyToken, `${verifyToken.slice(0, 8)}…${verifyToken.slice(-4)}`);

  const sectionScores = SECTION_KEYS
    .filter(k => sections[k]?.items?.length)
    .map(k => ({ key: k, label: SECTION_LABELS[k], score: sections[k]?.score ?? 0 }));

  // Sections with failed (bad) or caution items — surfaced up front so a buyer
  // sees what's wrong without reading all pages.
  const flagged = SECTION_KEYS.map(k => {
    const items = sections[k]?.items ?? [];
    const bad = items.filter(it => it.value && it.quality === "bad");
    const caution = items.filter(it => it.value && it.quality === "caution");
    return { key: k, label: SECTION_LABELS[k], score: sections[k]?.score ?? 0, bad, caution };
  }).filter(s => s.bad.length || s.caution.length);

  const flaggedCount = flagged.reduce((n, s) => n + s.bad.length + s.caution.length, 0);

  const chips = [
    cs.mileage ? { icon: Gauge, text: `${Number(cs.mileage).toLocaleString()} km` } : null,
    cs.transmission ? { icon: Settings, text: cap(cs.transmission) } : null,
    cs.engineType ? { icon: Fuel, text: cap(cs.engineType) } : null,
    cs.exteriorColor ? { icon: Palette, text: cap(cs.exteriorColor) } : null,
  ].filter(Boolean);

  const identity = [
    cs.registrationNo ? { label: "Registration", value: maskSensitive(cs.registrationNo), mono: true } : null,
    cs.chassisNo ? { label: "Chassis no", value: maskSensitive(cs.chassisNo), mono: true } : null,
    cs.engineNo ? { label: "Engine no", value: maskSensitive(cs.engineNo), mono: true } : null,
    cs.year ? { label: "Year", value: cs.year } : null,
    cs.engineCapacity ? { label: "Engine", value: `${cs.engineCapacity} cc` } : null,
    cs.registeredCity ? { label: "Registered in", value: cs.registeredCity } : null,
  ].filter(Boolean);

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen print:bg-white">

      <div className="flex justify-end px-4 pt-4 print:hidden" data-print-hide>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 shadow-sm"
        >
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Header card ──────────────────────────────────────────────── */}
        <div
          className="report-header bg-white rounded-2xl border border-slate-200 overflow-hidden"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          {/* brand bar */}
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div className="flex items-center gap-2.5">
              <img src="/logo2.svg" alt="GearTrade" style={{ height: "30px", width: "auto" }} />
              <div>
                <div className="text-sm font-semibold text-slate-900 leading-tight">GearTrade</div>
                <div className="text-xs text-slate-400">Certified inspection report</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#dcfce7", color: "#15803d" }}>
              <BadgeCheck size={14} /> Verified
            </span>
          </div>

          {/* hero — listing gallery cover, else the first inspector photo
              (external reports have no listing gallery) */}
          <div className="flex gap-5 p-5 items-center flex-wrap">
            {(cs.images?.[0]?.url || photos?.[0]?.url) ? (
              <img
                src={cs.images?.[0]?.url ?? photos[0].url}
                alt={cs.title || "Cover photo"}
                style={{ width: "150px", height: "104px", objectFit: "cover", borderRadius: "10px", flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: "150px", height: "104px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Car size={38} className="text-slate-300" />
              </div>
            )}

            <div style={{ flex: 1, minWidth: "220px" }}>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="text-[1.35rem] font-bold text-slate-900 leading-tight">
                  {cs.title || `${cs.brand ?? ""} ${cs.carModel ?? ""}`.trim()}
                </span>
                {cs.year && (
                  <span className="text-[13px] font-semibold text-slate-600" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "2px 9px", borderRadius: "6px" }}>{cs.year}</span>
                )}
              </div>
              {(cs.location || cs.registeredCity) && (
                <div className="flex items-center gap-1.5 text-[13px] text-slate-500 mb-3">
                  <MapPin size={14} />
                  {[cs.location, cs.registeredCity ? `Registered ${cs.registeredCity}` : null].filter(Boolean).join(" · ")}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {chips.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs text-slate-600"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "20px" }}>
                    <c.icon size={13} /> {c.text}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <ScoreGauge score={overallScore} size={88} />
              <div className="text-xs text-slate-400">Overall score</div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md"
                style={{ background: scoreTint(overallScore).bg, color: scoreTint(overallScore).text }}>
                {verdictLabel(overallScore)}
              </span>
            </div>
          </div>

          {/* verification band */}
          <div className="flex items-center gap-4 px-5 py-3.5 flex-wrap" style={{ background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
            <img src={qrSrc} alt="Scan to verify" style={{ width: "58px", height: "58px", borderRadius: "6px", background: "#fff", padding: "2px" }} />
            <div style={{ flex: 1, minWidth: "180px" }}>
              <div className="text-[13px] font-semibold text-slate-800">Scan to verify authenticity</div>
              <div className="text-xs font-mono text-indigo-600 break-all">{shortUrl}</div>
            </div>
            <div className="flex gap-5 text-xs">
              {report.inspectorName && (
                <div><div className="text-slate-400 mb-0.5">Inspector</div><div className="font-semibold text-slate-800">{report.inspectorName}</div></div>
              )}
              {report.inspectionDate && (
                <div><div className="text-slate-400 mb-0.5">Inspected</div><div className="font-semibold text-slate-800">{fmtDate(report.inspectionDate)}</div></div>
              )}
              {report.lastEditedAt && (
                <div><div className="text-slate-400 mb-0.5">Last updated</div><div className="font-semibold text-slate-800">{fmtDate(report.lastEditedAt)}</div></div>
              )}
            </div>
          </div>

          {/* identity grid */}
          {identity.length > 0 && (
            <div className="px-5 py-4" style={{ borderTop: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "14px 20px" }}>
              {identity.map((f) => (
                <div key={f.label}>
                  <div className="text-[11px] text-slate-400 mb-0.5">{f.label}</div>
                  <div className={`text-sm font-semibold text-slate-800 ${f.mono ? "font-mono" : ""}`}>{f.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Condition at a glance ─────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border border-slate-200 p-5"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          <CardTitle icon={Gauge}>Condition at a glance</CardTitle>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "10px 24px", marginBottom: "16px" }}>
            {sectionScores.map(s => (
              <div key={s.key}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-slate-600">{s.label}</span>
                  <span className="font-semibold" style={{ color: scoreColor(s.score) }}>{s.score}%</span>
                </div>
                <div style={{ height: "6px", borderRadius: "3px", background: "#e2e8f0", overflow: "hidden" }}>
                  <div style={{ width: `${s.score}%`, height: "100%", background: scoreColor(s.score) }} />
                </div>
              </div>
            ))}
          </div>

          {flagged.length > 0 ? (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "13px 15px" }}>
              <div className="flex items-center gap-2 mb-2.5">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-[13px] font-semibold text-red-700">Needs attention — {flaggedCount} item{flaggedCount !== 1 ? "s" : ""} flagged</span>
              </div>
              <div className="flex flex-col gap-2">
                {flagged.map(s => {
                  const names = [...s.bad, ...s.caution].map(i => i.name);
                  const shown = names.slice(0, 5).join(", ");
                  const more = names.length > 5 ? ` +${names.length - 5} more` : "";
                  const labelColor = s.bad.length ? "#b91c1c" : "#c2410c";
                  return (
                    <div key={s.key} className="flex gap-3 items-baseline flex-wrap">
                      <span className="text-xs font-semibold shrink-0" style={{ width: "150px", color: labelColor }}>{s.label} · {s.score}%</span>
                      <span className="text-xs text-slate-500" style={{ flex: 1, minWidth: "180px" }}>{shown}{more}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "13px 15px" }}>
              <BadgeCheck size={16} className="text-green-600" />
              <span className="text-[13px] font-semibold text-green-700">No major issues found — all sections passed inspection.</span>
            </div>
          )}
        </div>

        {/* ── Exterior damage diagram ───────────────────────────────────── */}
        {damage.length > 0 && (
          <div
            className="bg-white rounded-2xl border border-slate-200 p-5"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            <CardTitle icon={Car}>Exterior damage map</CardTitle>
            <p className="text-xs text-slate-400 mb-4 print:hidden" style={{ marginTop: "-10px" }}>Tap a marker to view the damage photo.</p>
            <CarDiagram
              markers={damage}
              readonly
              bodyType={cs.bodyType}
              onImageClick={m => setActiveDamageMarker(m)}
            />
          </div>
        )}

        {/* ── All sections ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {SECTION_KEYS.map(key => (
            <SectionBlock
              key={key}
              sectionKey={key}
              section={sections[key]}
              onPhotoClick={(url, title) => setActiveItemPhoto({ url, title })}
            />
          ))}
        </div>

        {/* ── Report photos ─────────────────────────────────────────────── */}
        {photos.length > 0 && (
          <div
            className="bg-white rounded-2xl border border-slate-200 p-5"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            <CardTitle icon={Camera}>Inspection photos</CardTitle>
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
                  <div className="hidden print:block rounded-xl overflow-hidden border border-slate-200 aspect-video">
                    <img src={p.url} alt={p.caption || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                  {p.caption && <p className="text-xs text-slate-500 text-center">{p.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Damage documentation ──────────────────────────────────────── */}
        {damage.filter(d => d.imageUrl).length > 0 && (
          <div
            className="bg-white rounded-2xl border border-slate-200 p-5"
            style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
          >
            <CardTitle icon={AlertTriangle}>Damage documentation</CardTitle>
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
          className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-4"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          <Lock size={20} className="text-green-600 shrink-0" />
          <div className="text-xs text-slate-500 leading-relaxed" style={{ flex: 1, minWidth: "200px" }}>
            Generated by a GearTrade certified inspector · tamper-proof once published.<br />
            <span className="font-mono text-slate-400">Token {verifyToken}</span>
          </div>
          <span className="text-xs text-slate-400">geartrade.app</span>
        </div>

      </div>

      {/* ── Report photo lightbox ──────────────────────────────────────── */}
      {activePhotoIdx !== null && photos[activePhotoIdx] && (
        <Lightbox
          src={photos[activePhotoIdx].url}
          alt={photos[activePhotoIdx].caption || "Inspection photo"}
          caption={photos[activePhotoIdx].caption}
          onClose={() => setActivePhotoIdx(null)}
        />
      )}

      {/* ── Damage marker lightbox ─────────────────────────────────────── */}
      {activeDamageMarker?.imageUrl && (
        <Lightbox
          src={activeDamageMarker.imageUrl}
          alt={activeDamageMarker.panel || "Damage photo"}
          title={activeDamageMarker.panel?.replace(/([A-Z])/g, " $1").trim()}
          note={activeDamageMarker.note}
          onClose={() => setActiveDamageMarker(null)}
        />
      )}

      {/* ── Checklist item photo lightbox ──────────────────────────────── */}
      {activeItemPhoto && (
        <Lightbox
          src={activeItemPhoto.url}
          alt={activeItemPhoto.title || "Photo"}
          title={activeItemPhoto.title}
          onClose={() => setActiveItemPhoto(null)}
        />
      )}
    </div>
  );
}
