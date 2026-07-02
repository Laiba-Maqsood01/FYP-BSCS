import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, Share2, ChevronLeft, ChevronRight, Phone, ShieldCheck, ExternalLink, Clock, CheckCircle2, MapPin, Calendar, Gauge, Flame, Settings2, AlertCircle, Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getListingDetail } from "../../services/listingService";
import { getListingInspectionStatus } from "../../services/inspectionService";
import { checkFavoriteStatus, addFavorite, removeFavorite } from "../../services/favoriteService";
import api from "../../services/api";
import { toast } from "react-toastify";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(n) {
  if (n >= 10000000) return `PKR ${(n / 10000000).toFixed(1)} Crore`;
  if (n >= 100000)   return `PKR ${(n / 100000).toFixed(1)} Lacs`;
  return `PKR ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function cap(s) {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ─── ImageGallery ─────────────────────────────────────────────────────────────

function ImageGallery({ images, isFeatured, isManaged, isInspected, isFavorited, favLoading, copied, onFavorite, onShare }) {
  const [active, setActive] = useState(0);
  const count = images.length;
  const prev = () => setActive(i => (i - 1 + count) % count);
  const next = () => setActive(i => (i + 1) % count);
  const mainImg = count > 0 ? images[active]?.url : null;

  return (
    <div>
      {/* Main image */}
      <div
        className="relative rounded-xl overflow-hidden bg-gray-100"
        style={{ aspectRatio: "16/9" }}
      >
        {mainImg ? (
          <img src={mainImg} alt="Car" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-300 text-sm">No images available</span>
          </div>
        )}

        {count > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Badges — top left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isFeatured && (
            <span
              className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded text-white"
              style={{ background: "#ea6d00" }}
            >
              Featured
            </span>
          )}
          {isManaged && (
            <span
              className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded text-white"
              style={{ background: "#1D4ED8" }}
            >
              Managed
            </span>
          )}
          {isInspected && (
            <span
              className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded text-white flex items-center gap-1"
              style={{ background: "#16a34a" }}
            >
              <Check size={10} strokeWidth={3} />
              Inspected
            </span>
          )}
        </div>

        {/* Actions — top right */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={onShare}
            title={copied ? "Copied!" : "Copy link"}
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition"
          >
            {copied
              ? <Check size={16} className="text-green-600" />
              : <Share2 size={16} className="text-gray-600" />
            }
          </button>
          <button
            onClick={onFavorite}
            disabled={favLoading}
            title={isFavorited ? "Remove from favorites" : "Save to favorites"}
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition"
          >
            <Heart
              size={16}
              style={{
                color: isFavorited ? "#ef4444" : "#9ca3af",
                fill: isFavorited ? "#ef4444" : "none",
              }}
            />
          </button>
        </div>

        {count > 1 && (
          <div
            className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full text-xs text-white font-medium"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            {active + 1}/{count}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition"
              style={{ borderColor: active === i ? "#ea6d00" : "transparent" }}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StatsRow ─────────────────────────────────────────────────────────────────

function StatsRow({ year, mileage, engineType, transmission }) {
  const items = [
    { icon: <Calendar size={22} style={{ color: "#ea6d00" }} />, label: "Year",         value: year ?? "—" },
    { icon: <Gauge     size={22} style={{ color: "#ea6d00" }} />, label: "Mileage",      value: mileage != null ? `${Number(mileage).toLocaleString()} km` : "—" },
    { icon: <Flame     size={22} style={{ color: "#ea6d00" }} />, label: "Fuel",         value: cap(engineType) },
    { icon: <Settings2 size={22} style={{ color: "#ea6d00" }} />, label: "Transmission", value: cap(transmission) },
  ];

  return (
    <div
      className="grid grid-cols-4 rounded-xl overflow-hidden mt-5"
      style={{ border: "1px solid rgba(0,0,0,0.1)" }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col items-center py-4 gap-1.5"
          style={{ borderRight: i < 3 ? "1px solid rgba(0,0,0,0.08)" : "none" }}
        >
          {item.icon}
          <span className="text-sm font-semibold text-brand-dark">{item.value}</span>
          <span className="text-[11px] text-brand-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── InspectionSection ────────────────────────────────────────────────────────

function InspectionSection({ listingId, inspection, isAuthenticated, isOwner, navigate, isManaged }) {
  const handleRequest = () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    const mode = isOwner ? "seller" : "buyer";
    navigate(`/inspection/book/${listingId}?mode=${mode}`);
  };

  const activeStatuses = ["PENDING_COORDINATION", "SCHEDULED", "IN_PROGRESS"];
  const isActive    = inspection && activeStatuses.includes(inspection.status);
  const isCompleted = inspection?.status === "COMPLETED";

  const statusConfig = {
    PENDING_COORDINATION: {
      color: "#d97706", bg: "#fffbeb", border: "#fde68a",
      icon: <Clock size={18} style={{ color: "#d97706" }} />,
      label: "Inspection Requested",
      sub: "Our team is coordinating with all parties to schedule the inspection.",
    },
    SCHEDULED: {
      color: "#1D4ED8", bg: "#eff6ff", border: "#bfdbfe",
      icon: <Calendar size={18} style={{ color: "#1D4ED8" }} />,
      label: "Inspection Scheduled",
      sub: "The inspection has been scheduled. Our inspector will evaluate the car soon.",
    },
    IN_PROGRESS: {
      color: "#ea6d00", bg: "#fff7ed", border: "#fed7aa",
      icon: <Clock size={18} style={{ color: "#ea6d00" }} />,
      label: "Inspection In Progress",
      sub: "Our certified inspector is currently evaluating this car.",
    },
  };

  if (isCompleted) {
    const reportToken = inspection?.reportToken;
    const hasReport   = !!reportToken;
    return (
      <div className="rounded-xl p-5 mt-5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#16a34a" }}>
            <CheckCircle2 size={20} color="#fff" />
          </div>
          <div>
            <p className="font-semibold text-sm text-green-800">This Car Has Been Inspected</p>
            <p className="text-xs text-green-700 mt-0.5">
              {hasReport
                ? "Our certified inspector has evaluated this car and the full report is available."
                : "Inspection completed. The report is being prepared and will be available shortly."}
            </p>
          </div>
        </div>

        {hasReport && (
          <>
            {/* Trust badge */}
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg"
              style={{ background: "#dcfce7", border: "1px solid #86efac" }}>
              <ShieldCheck size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
              <p className="text-xs font-semibold text-green-800">
                GearTrade Verified — This report is authenticated and tamper-proof
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={`/reports/${reportToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
                style={{ background: "#16a34a" }}
              >
                <ShieldCheck size={15} />
                View Inspection Report
                <ExternalLink size={12} />
              </a>
              <button
                onClick={handleRequest}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition hover:opacity-90"
                style={{ background: "#fff", border: "1px solid #bbf7d0", color: "#16a34a" }}
              >
                {!isAuthenticated ? "Login to Re-inspect" : "Request Re-inspection"}
              </button>
            </div>

            <p className="text-[11px] text-green-700 mt-3 opacity-70">
              Re-inspection creates a fresh evaluation — useful if the car has been modified or repaired since the last report.
            </p>
          </>
        )}
      </div>
    );
  }

  if (isActive) {
    const cfg = statusConfig[inspection.status];
    return (
      <div className="rounded-xl p-5 mt-5" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: cfg.color + "20" }}
          >
            {cfg.icon}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: cfg.color }}>{cfg.label}</p>
            <p className="text-xs text-brand-muted mt-0.5">{cfg.sub}</p>
          </div>
        </div>
        <button
          disabled
          className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-400 bg-gray-100 cursor-not-allowed"
          style={{ borderRadius: "0.5rem" }}
        >
          Inspection Underway
        </button>
      </div>
    );
  }

  // Managed listing with pending inspection — no CTA, inspection is handled by admin
  if (isManaged) {
    return (
      <div className="rounded-xl p-5 mt-5" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1d4ed820" }}>
            <ShieldCheck size={20} style={{ color: "#1d4ed8" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#1d4ed8" }}>Managed Sale — Inspection Included</p>
            <p className="text-xs text-brand-muted mt-0.5">This listing is managed by GearTrade. An inspection report will be available once the car is verified.</p>
          </div>
        </div>
      </div>
    );
  }

  // Default: show CTA
  return (
    <div className="rounded-xl p-5 mt-5" style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.08)" }}>
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "#ea6d00" }}
        >
          <ShieldCheck size={20} color="#fff" />
        </div>
        <div>
          <p className="font-bold text-brand-dark text-sm">Know Before You Buy</p>
          <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">
            Get a comprehensive inspection by our certified team. We check 200+ points so you buy with confidence.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {["Engine & Mechanical", "Suspension & Brakes", "Exterior & Body", "Interior & Electronics"].map(pt => (
          <div key={pt} className="flex items-center gap-1.5 text-xs text-brand-dark2">
            <Check size={12} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={3} />
            {pt}
          </div>
        ))}
      </div>
      <button
        onClick={handleRequest}
        className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
        style={{ background: "#ea6d00", borderRadius: "0.5rem" }}
      >
        {!isAuthenticated
          ? "Login to Request Inspection"
          : isOwner
            ? "Schedule Inspection"
            : "Request Inspection"}
      </button>
    </div>
  );
}

// ─── SafetyTips ───────────────────────────────────────────────────────────────

function SafetyTips() {
  return (
    <div
      className="rounded-xl p-5 mt-5"
      style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <p className="text-sm font-semibold text-brand-dark mb-3 flex items-center gap-2">
        <AlertCircle size={15} style={{ color: "#ea6d00" }} />
        Safety Tips for Transaction
      </p>
      <ol className="space-y-1.5 list-none pl-0">
        {[
          "Use a safe, public location to meet the seller",
          "Avoid making cash transactions",
          "Beware of unrealistic offers",
          "Never pay before physically seeing the car",
        ].map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-brand-muted">
            <span className="font-bold mt-0.5" style={{ color: "#ea6d00" }}>{i + 1}.</span>
            {tip}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── CarDetails ───────────────────────────────────────────────────────────────

function CarDetails({ listing }) {
  const rows = [
    ["Registered In",  listing.isRegistered ? (listing.registeredIn?.name || "—") : "Un-Registered"],
    ["Assembly",        cap(listing.assembly)],
    ["Body Type",       listing.bodyType?.name || "—"],
    ["Engine Capacity", listing.engineCapacity ? `${listing.engineCapacity} cc` : "—"],
    ["Color",           listing.exteriorColor || "—"],
    ["Last Updated",    formatDate(listing.updatedAt)],
  ];

  return (
    <div className="mt-5 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
      <div className="px-5 py-3 bg-gray-50" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <h3 className="text-sm font-bold text-brand-dark">Car Details</h3>
      </div>
      <div>
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className="grid grid-cols-2 px-5 py-3"
            style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
          >
            <span className="text-xs text-brand-muted">{label}</span>
            <span className="text-xs font-medium text-brand-dark2 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Description ──────────────────────────────────────────────────────────────

function Description({ text }) {
  if (!text) return null;
  return (
    <div className="mt-5 rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
      <h3 className="text-sm font-bold text-brand-dark mb-3">Ad Description</h3>
      <p className="text-sm text-brand-dark2 leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing,       setListing]       = useState(null);
  const [inspection,    setInspection]    = useState(undefined); // undefined = not yet fetched
  const [isFavorited,   setIsFavorited]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [favLoading,    setFavLoading]    = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [companyPhone,  setCompanyPhone]  = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const promises = [
      getListingDetail(id),
      getListingInspectionStatus(id).catch(() => null),
      isAuthenticated ? checkFavoriteStatus(id).catch(() => null) : Promise.resolve(null),
      api.get("/settings").then(r => r.data.data).catch(() => null),
    ];

    Promise.all(promises)
      .then(([l, insp, fav, settings]) => {
        setListing(l);
        setInspection(insp);
        if (fav !== null) setIsFavorited(fav?.isFavorite ?? false);
        if (settings?.companyPhone) setCompanyPhone(settings.companyPhone);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  const sellerId = listing?.seller?._id ?? listing?.seller;
  const isOwner  = !!(user && sellerId && sellerId.toString() === user._id?.toString());
  const isInspected = inspection?.status === "COMPLETED";
  const isManaged = listing?.saleMode === "MANAGED";
  const displayPhone = isManaged ? (companyPhone ?? "—") : listing?.mobileNumber;

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setFavLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(id);
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        await addFavorite(id);
        setIsFavorited(true);
        toast.success("Added to favorites");
      }
    } catch {
      toast.error("Failed to update favorites");
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };


  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        {/* Title area */}
        <div className="h-7 w-72 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-100 rounded mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column */}
          <div className="lg:col-span-7">
            {/* Main image */}
            <div className="w-full rounded-xl bg-gray-200" style={{ aspectRatio: "16/9" }} />
            {/* Thumbnails */}
            <div className="flex gap-2 mt-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-16 h-12 rounded-lg bg-gray-200 shrink-0" />
              ))}
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-4 rounded-xl overflow-hidden mt-5" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center py-4 gap-2"
                  style={{ borderRight: i < 3 ? "1px solid rgba(0,0,0,0.08)" : "none" }}>
                  <div className="w-6 h-6 rounded bg-gray-200" />
                  <div className="h-3.5 w-14 bg-gray-200 rounded" />
                  <div className="h-3 w-10 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
            {/* Inspection block */}
            <div className="rounded-xl p-5 mt-5 bg-gray-100" style={{ minHeight: 96 }} />
            {/* Car details */}
            <div className="mt-5 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="px-5 py-3 bg-gray-50">
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="grid grid-cols-2 px-5 py-3" style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded ml-auto" />
                </div>
              ))}
            </div>
            {/* Description */}
            <div className="mt-5 rounded-xl p-5" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-4/6" />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              {/* Price + phone card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="h-8 w-40 bg-gray-200 rounded mb-5" />
                <div className="h-12 bg-gray-200 rounded-xl mb-3" />
                <div className="h-12 bg-gray-100 rounded-xl" />
              </div>
              {/* Seller card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                  <div>
                    <div className="h-4 w-28 bg-gray-200 rounded mb-1.5" />
                    <div className="h-3 w-36 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
              {/* Safety tips card */}
              <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="h-4 w-36 bg-gray-200 rounded mb-3" />
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${75 + i * 5}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !listing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-base font-semibold text-brand-dark">Listing not found</p>
        <button
          onClick={() => navigate("/browse-cars")}
          className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition"
          style={{ background: "#111827", borderRadius: "0.5rem" }}
        >
          Back to Browse
        </button>
      </div>
    );
  }

  const title = `${listing.year ?? ""} ${listing.brand?.name ?? ""} ${listing.carModel?.name ?? ""}`.trim();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page title + location */}
      <h1 className="text-2xl font-bold text-brand-dark mb-1">{title}</h1>
      <div className="flex items-center gap-2 mb-6 text-sm text-brand-muted flex-wrap">
        <MapPin size={14} />
        <span>{listing.city?.name || "Pakistan"}</span>
        {listing.saleMode === "MANAGED" && (
          <>
            <span>·</span>
            <span className="font-medium" style={{ color: "#1D4ED8" }}>Managed Sale</span>
          </>
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── LEFT column ── */}
        <div className="lg:col-span-7">
          <ImageGallery
            images={listing.images || []}
            isFeatured={listing.isFeatured}
            isManaged={listing.saleMode === "MANAGED"}
            isInspected={isInspected}
            isFavorited={isFavorited}
            favLoading={favLoading}
            copied={copied}
            onFavorite={handleFavoriteToggle}
            onShare={handleShare}
          />

          <StatsRow
            year={listing.year}
            mileage={listing.mileage}
            engineType={listing.engineType}
            transmission={listing.transmission}
          />

          <InspectionSection
            listingId={id}
            inspection={inspection}
            isAuthenticated={isAuthenticated}
            isOwner={isOwner}
            navigate={navigate}
            isManaged={listing.saleMode === "MANAGED"}
          />

          <CarDetails listing={listing} />

          <Description text={listing.description} />
        </div>

        {/* ── RIGHT column ── */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">

            {/* Price + phone */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <p className="text-2xl font-extrabold text-brand-dark mb-5">
                {formatPrice(listing.price)}
              </p>

              {isManaged ? (
                phoneRevealed ? (
                  <div className="mb-3 rounded-xl overflow-hidden" style={{ border: "1px solid #fed7aa" }}>
                    <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#fff7ed" }}>
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#ea6d00" }}>GearTrade</span>
                      <span className="text-[10px] text-brand-muted">Official Contact</span>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-3 bg-white">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fff7ed" }}>
                        <Phone size={14} style={{ color: "#ea6d00" }} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-brand-dark tracking-wide">{displayPhone}</p>
                        <p className="text-[11px] text-brand-muted mt-0.5">Call or SMS to enquire about this car</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: "#ea6d00" }}>
                        Managed by GearTrade
                      </span>
                    </div>
                    <button
                      onClick={() => setPhoneRevealed(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
                      style={{ background: "#ea6d00", borderRadius: "0.75rem" }}
                    >
                      <Phone size={16} />
                      Show GearTrade Number
                    </button>
                  </div>
                )
              ) : (
                phoneRevealed ? (
                  <div
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm mb-3"
                    style={{ background: "#16a34a", borderRadius: "0.75rem" }}
                  >
                    <Phone size={16} />
                    {displayPhone}
                  </div>
                ) : (
                  <button
                    onClick={() => setPhoneRevealed(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm mb-3 transition hover:opacity-90"
                    style={{ background: "#16a34a", borderRadius: "0.75rem" }}
                  >
                    <Phone size={16} />
                    Show Phone Number
                  </button>
                )
              )}

              {!isManaged && listing.whatsappAllowed && listing.mobileNumber && (
                <a
                  href={`https://wa.me/92${listing.mobileNumber.replace(/^0/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
                  style={{ background: "#25D366", borderRadius: "0.75rem", display: "flex" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
              )}
            </div>

            {/* Seller / GearTrade card */}
            {isManaged ? (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-sm font-bold text-brand-dark mb-4">Managed By</h3>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: "#ea6d00" }}
                  >
                    GT
                  </div>
                  <div>
                    <p className="font-semibold text-brand-dark text-sm">GearTrade</p>
                    <p className="text-xs text-brand-muted mt-0.5">End-to-end managed sale</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-sm font-bold text-brand-dark mb-4">Seller Details</h3>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ background: "#ea6d00" }}
                  >
                    {(listing.seller?.username?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-dark text-sm">
                      {listing.seller?.username || "Seller"}
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Member since {formatDate(listing.seller?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <SafetyTips />

          </div>
        </div>
      </div>
    </div>
  );
}
