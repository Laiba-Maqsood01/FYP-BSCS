import { useEffect, useState } from "react";
import { LuImagePlus, LuX } from "react-icons/lu";
import { createListing, updateListing } from "../../../services/api";

const defaultFormState = {
  name: "",
  model: "",
  year: "",
  fuel: "Petrol",
  price: "",
  mileage: "",
  location: "",
  image: "",
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function ListingFormModal({
  isOpen,
  mode = "create",
  currentUser,
  initialValues = null,
  onClose,
  onSaved,
  onSubmitOverride,
  createTitle = "Add New Car",
  createDescription = "Enter car details and upload an image for your listing.",
  createActionLabel = "Save Listing",
}) {
  const [formData, setFormData] = useState(defaultFormState);
  const [imageName, setImageName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const values = initialValues
      ? {
          name: initialValues.name || "",
          model: initialValues.model || "",
          year: initialValues.year || "",
          fuel: initialValues.fuel || "Petrol",
          price: initialValues.price || "",
          mileage: initialValues.mileage || "",
          location: initialValues.location || "",
          image: initialValues.image || "",
        }
      : defaultFormState;

    setFormData(values);
    setImageName(initialValues?.name ? `${initialValues.name} image` : "");
  }, [initialValues, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = async (event) => {
    const { name, value, files } = event.target;

    if (name === "image") {
      const file = files?.[0];
      if (!file) {
        return;
      }

      const image = await fileToDataUrl(file);
      setFormData((current) => ({
        ...current,
        image,
      }));
      setImageName(file.name);
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser && !onSubmitOverride) {
      alert("Please login first.");
      return;
    }

    try {
      setSubmitting(true);

      if (onSubmitOverride) {
        const result = await onSubmitOverride(formData);

        if (onSaved) {
          onSaved(result, mode);
        }
      } else if (mode === "edit" && initialValues?.id) {
        const listing = await updateListing(initialValues.id, formData);
        onSaved(listing, "edit");
      } else {
        const listing = await createListing({
          ...formData,
          ownerId: currentUser.id,
        });
        onSaved(listing, "create");
      }

      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="listing-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="listing-modal"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "edit" ? "Edit listing" : createTitle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="listing-modal-header">
          <div>
            <h2>{mode === "edit" ? "Edit Listing" : createTitle}</h2>
            <p>
              {mode === "edit"
                ? "Enter car details and upload an image for your listing."
                : createDescription}
            </p>
          </div>

          <button type="button" className="listing-modal-close" onClick={onClose}>
            <LuX />
          </button>
        </div>

        <form className="listing-modal-form" onSubmit={handleSubmit}>
          <div className="listing-modal-grid">
            <label className="dashboard-field">
              <span>Car Name</span>
              <input name="name" value={formData.name} onChange={handleChange} required />
            </label>

            <label className="dashboard-field">
              <span>Model</span>
              <input name="model" value={formData.model} onChange={handleChange} required />
            </label>

            <label className="dashboard-field">
              <span>Year</span>
              <input name="year" value={formData.year} onChange={handleChange} required />
            </label>

            <label className="dashboard-field">
              <span>Fuel</span>
              <input name="fuel" value={formData.fuel} onChange={handleChange} required />
            </label>

            <label className="dashboard-field">
              <span>Price</span>
              <input name="price" value={formData.price} onChange={handleChange} required />
            </label>

            <label className="dashboard-field">
              <span>Mileage</span>
              <input
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                required
              />
            </label>

            <label className="dashboard-field">
              <span>Location</span>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </label>

            <label className="dashboard-field listing-upload-field">
              <span>Car Image</span>
              <label className="listing-upload-box">
                <LuImagePlus />
                <strong>{imageName || "Upload image"}</strong>
                <small>JPG, PNG, or WebP image</small>
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                />
              </label>
            </label>
          </div>

          {formData.image && (
            <div className="listing-image-preview">
              <img src={formData.image} alt={formData.name || "Listing preview"} />
            </div>
          )}

          <button type="submit" className="dashboard-save-button">
            {submitting
              ? "Saving..."
              : mode === "edit"
                ? "Update Listing"
                : createActionLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ListingFormModal;
