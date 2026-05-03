import { useState } from "react";
import { LuArrowRight, LuSearch } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import car from "../assets/car.jpg";
import { createSellInquiry, getCurrentUser } from "../../services/api";
import ListingFormModal from "./dashboard/ListingFormModal";

function Hero() {
  const navigate = useNavigate();
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser] = useState(() => getCurrentUser());

  const handleSellSubmit = async (formData) => {
    await createSellInquiry(formData);
    alert("Car details saved. We will review your listing details.");
  };

  const handleSearch = () => {
    const query = searchTerm.trim();
    navigate(query ? `/browse-cars?search=${encodeURIComponent(query)}` : "/browse-cars");
  };

  return (
    <>
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(rgba(15,39,71,0.9), rgba(15,39,71,0.8)), url(${car})`,
        }}
      >
        <div className="hero-content">
          <h1>
            Buy & Sell Cars with <br />
            <span className="highlight">Complete Confidence</span>
          </h1>

          <p>
            Pakistan&apos;s most trusted car marketplace with verified
            inspections. Every car is thoroughly checked so you can buy with
            peace of mind.
          </p>

          <div className="hero-buttons">
            <button
              className="browse-btn"
              type="button"
              onClick={() => navigate("/browse-cars")}
            >
              Browse Cars <LuArrowRight />
            </button>
            <button
              className="sell-btn"
              type="button"
              onClick={() => setIsSellModalOpen(true)}
            >
              Sell Your Car
            </button>
          </div>

          <div className="search-box-hero">
            <div className="hero-search-input">
              <LuSearch />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Search by make, model, or keyword..."
              />
            </div>
            <button type="button" onClick={handleSearch}>
              Search Cars
            </button>
          </div>
        </div>
      </section>

      <ListingFormModal
        isOpen={isSellModalOpen}
        currentUser={currentUser}
        onClose={() => setIsSellModalOpen(false)}
        onSubmitOverride={handleSellSubmit}
        createTitle="Sell Your Car"
        createDescription="Add your new listing details below."
        createActionLabel="Submit Car Details"
      />
    </>
  );
}

export default Hero;
