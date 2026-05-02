import { useEffect, useState } from "react";
import { LuArrowRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import CarCard from "./CarCard";
import { getFeaturedListings } from "../../services/api";

function Featured() {
  const navigate = useNavigate();
  const [featuredCars, setFeaturedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFeaturedCars = async () => {
    try {
      setLoading(true);
      setError("");
      const cars = await getFeaturedListings();
      setFeaturedCars(cars);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedCars();
  }, []);

  return (
    <section className="featured-section">
      <div className="featured-header">
        <div>
          <h2>
            Featured <span>Cars</span>
          </h2>
          <p>Hand-picked vehicles with verified inspections</p>
        </div>

        <button
          className="view-btn"
          type="button"
          onClick={() => navigate("/browse-cars")}
        >
          View All Cars <LuArrowRight />
        </button>
      </div>

      {loading ? (
        <div className="dashboard-empty-state compact-state">
          <h3>Loading featured cars...</h3>
        </div>
      ) : error ? (
        <div className="dashboard-empty-state compact-state">
          <h3>no featured Cars</h3>
          <p>{error}</p>
          <button
            type="button"
            className="dashboard-empty-button"
            onClick={loadFeaturedCars}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="featured-cards">
          {featuredCars.map((car) => (
            <CarCard key={car.id} car={car} variant="featured" />
          ))}
        </div>
      )}
    </section>
  );
}

export default Featured;
