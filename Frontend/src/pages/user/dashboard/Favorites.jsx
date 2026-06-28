import { useEffect, useState, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ExternalLink } from "lucide-react";
import { getMyFavorites, removeFavorite } from "../../../services/favoriteService";

function formatPKR(n) {
  if (!n) return "PKR 0";
  if (n >= 100000) return `PKR ${(n / 100000).toFixed(1)}L`;
  return `PKR ${Number(n).toLocaleString()}`;
}

// ── FavoriteCard — memo so removing one card doesn't re-render the rest ───────

const FavoriteCard = memo(function FavoriteCard({ fav, onRemove }) {
  const navigate = useNavigate();
  const listing  = fav.listing ?? fav;
  const car      = `${listing.year ?? ""} ${listing.brand?.name ?? ""} ${listing.carModel?.name ?? ""}`.trim();
  const image    = listing.images?.[0]?.url;
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    try { await onRemove(listing._id); }
    finally { setRemoving(false); }
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <div className="relative h-40 bg-gray-100">
        {image
          ? <img src={image} alt={car} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-xs text-brand-muted">No image</div>}
        <button onClick={handleRemove} disabled={removing}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-white shadow hover:bg-red-50 transition cursor-pointer"
          title="Remove from favorites">
          <Heart size={14} fill={removing ? "#e5e7eb" : "#dc2626"} stroke="none" />
        </button>
      </div>
      <div className="px-3 py-3 flex-1 flex flex-col">
        <p className="text-sm font-semibold text-brand-dark truncate">{car || "Unknown car"}</p>
        <p className="text-xs text-brand-muted mt-0.5">{listing.city?.name ?? "—"} · {listing.mileage ? `${Number(listing.mileage).toLocaleString()} km` : ""}</p>
        <p className="text-base font-bold text-brand-dark mt-1.5 flex-1">{formatPKR(listing.price)}</p>
        <button onClick={() => navigate(`/browse-cars/${listing._id}`)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-brand-muted hover:bg-gray-50 transition cursor-pointer"
          style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
          <ExternalLink size={12} /> View Listing
        </button>
      </div>
    </div>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Favorites() {
  const [favs,    setFavs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyFavorites()
      .then(d => setFavs(Array.isArray(d) ? d : []))
      .catch(() => setFavs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = useCallback(async (listingId) => {
    await removeFavorite(listingId).catch(() => {});
    setFavs(prev => prev.filter(f => (f.listing?._id ?? f._id) !== listingId));
  }, []);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-brand-dark mb-5">
        Favorites <span className="text-base font-normal text-brand-muted ml-1">({favs.length})</span>
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="h-40 bg-gray-200" />
              <div className="px-3 py-3">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-100 rounded mb-3" />
                <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : favs.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-brand-muted text-sm">No saved cars yet. Browse listings and save the ones you like.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favs.map(fav => (
            <FavoriteCard key={fav._id} fav={fav} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
