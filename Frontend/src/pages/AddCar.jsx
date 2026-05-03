import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ListingFormModal from "../components/dashboard/ListingFormModal";
import { getCurrentUser } from "../../services/api";

function AddCar() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  return (
    <>
      <Navbar />
      <section className="browse-page">
        <ListingFormModal
          isOpen
          currentUser={currentUser}
          onClose={() => navigate("/dashboard")}
          onSaved={() => navigate("/dashboard")}
        />
      </section>
    </>
  );
}

export default AddCar;
