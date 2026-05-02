import { LuEye, LuPencil, LuTrash2 } from "react-icons/lu";

function ListingCard({ listing, onDelete, onEdit, onView }) {
  const inspected = listing.status === "Inspected";

  return (
    <article className="dashboard-listing-card">
      <img
        className="dashboard-listing-image"
        src={listing.image}
        alt={listing.name}
      />

      <div className="dashboard-listing-body">
        <div className="dashboard-listing-top">
          <div>
            <h3>{listing.name}</h3>
            <p className="dashboard-listing-price">{listing.price}</p>
            <p className="dashboard-listing-meta">
              {listing.year} . {listing.location}
            </p>
          </div>

          <span
            className={`dashboard-status-badge ${
              inspected ? "is-inspected" : "is-pending"
            }`}
          >
            {listing.status}
          </span>
        </div>

        <div className="dashboard-actions">
          <button type="button" className="outline" onClick={() => onView(listing)}>
            <LuEye /> View
          </button>
          <button type="button" className="outline" onClick={() => onEdit(listing)}>
            <LuPencil /> Edit
          </button>
          <button
            type="button"
            className="ghost-danger"
            onClick={() => onDelete(listing.id)}
          >
            <LuTrash2 /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
