import { useState } from "react";
import { LuArrowRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { createSellInquiry, getCurrentUser } from "../../services/api";
import ListingFormModal from "./dashboard/ListingFormModal";

function CtaSection() {
  const navigate = useNavigate();
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [currentUser] = useState(() => getCurrentUser());

  const handleSellSubmit = async (formData) => {
    await createSellInquiry(formData);
    alert("Car details saved. We will review your listing details.");
  };

  return (
    <>
      <section className="cta-section">
        <div className="cta-inner">
          <h2>Ready to Find Your Dream Car?</h2>
          <p>Browse thousands of verified cars or list your own in minutes.</p>

          <div className="cta-buttons">
            <button
              className="primary-btn"
              type="button"
              onClick={() => navigate("/browse-cars")}
            >
              Browse Cars Now <LuArrowRight />
            </button>
            <button
              className="secondary-btn"
              type="button"
              onClick={() => setIsListingModalOpen(true)}
            >
              List Your Car Free
            </button>
          </div>
        </div>
      </section>

      <ListingFormModal
        isOpen={isListingModalOpen}
        currentUser={currentUser}
        onClose={() => setIsListingModalOpen(false)}
        onSubmitOverride={handleSellSubmit}
        createTitle="List Your Car"
        createDescription="Add your new listing details below."
        createActionLabel="Submit Listing"
      />
    </>
  );
}

export default CtaSection;
