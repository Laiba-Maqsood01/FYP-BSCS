import {
  LuBadgeCheck,
  LuCalendarDays,
  LuFuel,
  LuGauge,
  LuMapPin,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";

function CarCard({ car, variant = "default" }) {
  const navigate = useNavigate();

  return (
    <article
      className={`car-card ${variant === "featured" ? "featured-card" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/vehicle/${car.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/vehicle/${car.id}`);
        }
      }}
    >
      <div className="car-img">
        <img src={car.image} alt={car.name} />

        <div className="tag-row">
          {car.featured && <span className="tag featured">Featured</span>}

          {car.status === "inspected" && (
            <span className="tag inspected">
              <LuBadgeCheck /> Inspected
            </span>
          )}

          {car.status === "pending" && (
            <span className="tag pending">Pending</span>
          )}
        </div>
      </div>

      <div className="car-info">
        <h3 className="car-title">{car.name}</h3>
        <p className="car-price">{car.price}</p>

        {variant === "featured" && (
          <div className="car-meta-grid">
            <span>
              <LuCalendarDays /> {car.year}
            </span>
            <span>
              <LuGauge /> {car.mileage}
            </span>
            <span>
              <LuFuel /> {car.fuel}
            </span>
            <span>
              <LuMapPin /> {car.location}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export default CarCard;
