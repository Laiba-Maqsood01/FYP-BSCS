import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, ShieldCheck, MapPin } from "lucide-react";
import api from "../../services/api";

// Shared badge helpers
const badgeCls = "inline-flex items-center gap-[0.28rem] px-[0.6rem] py-[0.28rem] rounded-full text-[0.7rem] font-bold leading-none";
const Badges = {
  featured: `${badgeCls} bg-brand-orange text-white`,
  inspected: `${badgeCls} bg-green-600 text-white`,
  city: `${badgeCls} bg-[rgba(15,23,42,0.55)] text-white border border-white/20 backdrop-blur-sm ml-auto`,
};

function ListingBadges({ listing }) {
  const isInspected = listing?.inspection?.status === "COMPLETED";
  const cityName = listing?.city?.name || null;
  return (
    <div className="absolute inset-[0.65rem] z-2 pointer-events-none flex flex-wrap content-start gap-[0.35rem]">
      <span className={Badges.featured}><Flame size={11} /> Featured</span>
      {isInspected && <span className={Badges.inspected}><ShieldCheck size={11} /> Inspected</span>}
      {cityName && <span className={Badges.city}><MapPin size={11} /> {cityName}</span>}
    </div>
  );
}

export default function FeatureSection({
  title = "Featured Listings",
  description = "Browse top-featured vehicles with verified inspections and trusted sellers.",
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/listings", {
          params: { limit: 3, featuredStatus: "ACTIVE", sortBy: "createdAt", sortOrder: "desc" },
        });
        setListings(res.data?.data?.listings || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const slides = useMemo(() => listings, [listings]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" />
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <section className="bg-transparent py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <h2
              className="font-[650] text-brand-btn tracking-tight mb-2"
              style={{ fontSize: "clamp(1.7rem, 2.6vw, 2.6rem)", letterSpacing: "-0.02em" }}
            >
              {title}
            </h2>
            <p className="text-brand-muted max-w-2xl">{description}</p>
          </div>
          <Link
            to="/browse-cars?typeFilter=featured"
            className="text-brand-dark font-semibold text-[0.92rem] border-[1.5px] border-black/20 px-4 py-1.5 rounded-lg hover:bg-black/5 hover:border-black/40 transition whitespace-nowrap"
          >
            View all →
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {slides.map((listing) => (
            <article key={listing._id} className="h-full">
              <div className="h-full rounded-2xl overflow-hidden border border-black/8 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)]">

                {/* Image */}
                <div className="relative h-55">
                  <img
                    src={listing.images?.[0]?.url || "https://via.placeholder.com/400x250?text=No+Image"}
                    alt={`${listing.brand?.name} ${listing.carModel?.name}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[rgba(3,7,18,0.38)] to-transparent" />
                  <ListingBadges listing={listing} />
                </div>

                {/* Body */}
                <div className="p-4">
                  <h3 className="text-[1.08rem] font-[650] text-brand-dark mb-2 tracking-tight">
                    {listing.year} {listing.brand?.name} {listing.carModel?.name}
                  </h3>
                  <p className="text-[0.9rem] leading-snug text-brand-muted mb-3 min-h-11">
                    {listing.description?.slice(0, 80)}{listing.description?.length > 80 ? "…" : ""}
                  </p>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-[0.78rem] text-[#475569] mb-3">
                    <span>{listing.engineCapacity}{listing.engineType === "electric" ? " kWh" : "cc"} · {listing.transmission}</span>
                    <span>{listing.mileage?.toLocaleString()} km</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[1.15rem] font-bold text-brand-dark">
                      PKR {listing.price?.toLocaleString()}
                    </span>
                    <Link
                      to={`/browse-cars/${listing._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-brand-btn text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-dark2 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
