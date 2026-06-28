import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Check, ArrowLeft, Upload, X } from "lucide-react";
import { showError, showSuccess } from "../../utils/toast";
import * as masterService from "../../services/masterService";
import { getMyListingDetail, updateListing, getUploadSignatures, uploadToCloudinary } from "../../services/listingService";

// ── Constants ─────────────────────────────────────────────────────────────────

const ENGINE_TYPES = [
  { value: "petrol",   label: "Petrol"   },
  { value: "diesel",   label: "Diesel"   },
  { value: "hybrid",   label: "Hybrid"   },
  { value: "electric", label: "Electric" },
];

const TRANSMISSIONS = [
  { value: "manual",    label: "Manual"    },
  { value: "automatic", label: "Automatic" },
];

const ASSEMBLIES = [
  { value: "local",    label: "Local"    },
  { value: "imported", label: "Imported" },
];

const COLORS = [
  "White", "Pearl White", "Silver", "Grey", "Black",
  "Red", "Maroon", "Blue", "Green", "Brown",
  "Beige", "Champagne", "Gold", "Other",
];

// ── Shared UI ─────────────────────────────────────────────────────────────────

const inputCls = "w-full bg-white border border-black/10 rounded-lg px-3 py-2.5 text-brand-dark2 text-sm outline-none focus:border-[#374151] focus:ring-2 focus:ring-[#37415114] transition placeholder:text-gray-400";

const labelCls = "block text-sm font-medium text-brand-dark2 mb-1";

function FormField({ label, required, children, hint }) {
  return (
    <div>
      <label className={labelCls}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

function CustomSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen(p => !p); }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-black/10 text-sm text-left transition bg-white"
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <span className={selected ? "text-brand-dark2" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} className="text-gray-400 shrink-0" />
      </button>
      {open && !disabled && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-black/10 rounded-xl shadow-lg overflow-y-auto max-h-56 z-50">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 text-sm transition ${
                value === opt.value ? "bg-gray-100 font-semibold text-brand-dark" : "text-brand-dark2 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WhatsAppToggle({ checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#25D366" }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>
        <span className="text-sm font-medium text-brand-dark2">Allow WhatsApp Contact</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0"
        style={{ background: checked ? "#25D366" : "#cbd5e1" }}
      >
        <span
          className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(1.375rem)" : "translateX(0.125rem)" }}
        />
      </button>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
      <h2 className="text-base font-semibold text-brand-dark mb-5">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function FullRow({ children }) {
  return <div className="sm:col-span-2">{children}</div>;
}

// ── Image management ──────────────────────────────────────────────────────────

function ImageManager({ images, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleFiles(files) {
    if (!files?.length) return;
    const remaining = 10 - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) return showError("Maximum 10 images allowed.");
    setUploading(true);
    try {
      const sigs = await getUploadSignatures(toUpload.length);
      const uploaded = await Promise.all(toUpload.map((f, i) => uploadToCloudinary(f, sigs[i])));
      onChange([...images, ...uploaded]);
    } catch {
      showError("Failed to upload one or more images.");
    } finally { setUploading(false); }
  }

  function remove(idx) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((img, i) => (
          <div key={i} className="relative w-24 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"
            >
              <X size={11} />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-brand-orange text-white">COVER</span>
            )}
          </div>
        ))}

        {images.length < 10 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-24 h-20 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-brand-muted hover:border-brand-orange hover:text-brand-orange transition text-xs font-medium"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
            ) : (
              <><Upload size={16} /> Add</>
            )}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => handleFiles(e.target.files)} />
      <p className="text-xs text-brand-muted">{images.length}/10 photos · First photo is the cover</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [listing,  setListing]  = useState(null);
  const [form,     setForm]     = useState(null);
  const [errors,   setErrors]   = useState({});

  // master data
  const [brands,     setBrands]     = useState([]);
  const [models,     setModels]     = useState([]);
  const [cities,     setCities]     = useState([]);
  const [provinces,  setProvinces]  = useState([]);
  const [bodyTypes,  setBodyTypes]  = useState([]);

  useEffect(() => {
    Promise.all([
      getMyListingDetail(id),
      masterService.getBrands(),
      masterService.getCities(),
      masterService.getProvinces(),
      masterService.getBodyTypes(),
    ]).then(([l, b, c, p, bt]) => {
      setListing(l);
      setBrands(b);
      setCities(c);
      setProvinces(p);
      setBodyTypes(bt);
      setForm({
        // Location
        city:             l.city?._id ?? l.city ?? "",
        registeredIn:     l.registeredIn?._id ?? l.registeredIn ?? "",
        // Car identity
        year:             String(l.year ?? ""),
        brand:            l.brand?._id ?? l.brand ?? "",
        carModel:         l.carModel?._id ?? l.carModel ?? "",
        bodyType:         l.bodyType?._id ?? l.bodyType ?? "",
        // Engine
        engineType:       l.engineType ?? "",
        engineCapacity:   String(l.engineCapacity ?? ""),
        // Specs
        transmission:     l.transmission ?? "",
        assembly:         l.assembly ?? "",
        // Appearance
        exteriorColor:    l.exteriorColor ?? "",
        // Listing
        mileage:          String(l.mileage ?? ""),
        price:            String(l.price ?? ""),
        description:      l.description ?? "",
        images:           l.images ?? [],
        // Contact
        mobileNumber:     l.mobileNumber ?? "",
        secondaryNumber:  l.secondaryNumber ?? "",
        whatsappAllowed:  l.whatsappAllowed ?? false,
      });
    }).catch(() => {
      showError("Failed to load listing.");
      navigate("/dashboard/listings");
    }).finally(() => setLoading(false));
  }, [id]);

  // fetch models when brand changes
  useEffect(() => {
    if (!form?.brand) { setModels([]); return; }
    masterService.getModels(form.brand).then(setModels).catch(() => setModels([]));
  }, [form?.brand]);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.city)          e.city = "City is required";
    if (!form.year)          e.year = "Year is required";
    if (!form.brand)         e.brand = "Make is required";
    if (!form.carModel)      e.carModel = "Model is required";
    if (!form.engineType)    e.engineType = "Engine type is required";
    if (!form.engineCapacity || isNaN(Number(form.engineCapacity)) || Number(form.engineCapacity) <= 0)
      e.engineCapacity = "Valid capacity is required";
    if (!form.transmission)  e.transmission = "Transmission is required";
    if (!form.assembly)      e.assembly = "Assembly is required";
    if (!form.exteriorColor) e.exteriorColor = "Color is required";
    if (!form.mileage || isNaN(Number(form.mileage)) || Number(form.mileage) < 0)
      e.mileage = "Valid mileage is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      e.price = "Valid price is required";
    if (!form.mobileNumber)  e.mobileNumber = "Mobile number is required";
    if (form.images.length === 0) e.images = "At least one photo is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await updateListing(id, {
        city:            form.city,
        registeredIn:    form.registeredIn || null,
        year:            Number(form.year),
        brand:           form.brand,
        carModel:        form.carModel,
        bodyType:        form.bodyType,
        engineType:      form.engineType,
        engineCapacity:  Number(form.engineCapacity),
        transmission:    form.transmission,
        assembly:        form.assembly,
        exteriorColor:   form.exteriorColor,
        mileage:         Number(form.mileage),
        price:           Number(form.price),
        description:     form.description,
        images:          form.images,
        mobileNumber:    form.mobileNumber,
        secondaryNumber: form.secondaryNumber || undefined,
        whatsappAllowed: form.whatsappAllowed,
      });
      showSuccess("Listing updated successfully!");
      navigate("/dashboard/listings");
    } catch (err) {
      showError(err?.response?.data?.message ?? "Failed to update listing.");
    } finally { setSaving(false); }
  }

  const CURRENT_YEAR = new Date().getFullYear();
  const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" />
      </div>
    );
  }

  const isElectric = form.engineType === "electric";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/dashboard/listings")}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-brand-muted hover:bg-gray-100 transition"
          style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-dark">Edit Listing</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            {listing?.year} {listing?.brand?.name} {listing?.carModel?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Location ── */}
        <Section title="Location">
          <FormField label="City" required>
            <CustomSelect
              value={form.city}
              onChange={v => set("city", v)}
              placeholder="Select City"
              options={[{ value: "", label: "Select City" }, ...cities.map(c => ({ value: c._id, label: c.name }))]}
            />
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
          </FormField>

          <FormField label="Registered In" hint="Province where car is registered">
            <CustomSelect
              value={form.registeredIn}
              onChange={v => set("registeredIn", v)}
              placeholder="Select Province"
              options={[{ value: "", label: "None" }, ...provinces.map(p => ({ value: p._id, label: p.name }))]}
            />
          </FormField>
        </Section>

        {/* ── Car Identity ── */}
        <Section title="Car Details">
          <FormField label="Year" required>
            <CustomSelect
              value={form.year}
              onChange={v => set("year", v)}
              placeholder="Select Year"
              options={[{ value: "", label: "Select Year" }, ...YEARS.map(y => ({ value: String(y), label: String(y) }))]}
            />
            {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year}</p>}
          </FormField>

          <FormField label="Make" required>
            <CustomSelect
              value={form.brand}
              onChange={v => { set("brand", v); set("carModel", ""); }}
              placeholder="Select Make"
              options={[{ value: "", label: "Select Make" }, ...brands.map(b => ({ value: b._id, label: b.name }))]}
            />
            {errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}
          </FormField>

          <FormField label="Model" required>
            <CustomSelect
              value={form.carModel}
              onChange={v => set("carModel", v)}
              placeholder="Select Model"
              disabled={!form.brand}
              options={[{ value: "", label: form.brand ? "Select Model" : "Select make first" }, ...models.map(m => ({ value: m._id, label: m.name }))]}
            />
            {errors.carModel && <p className="mt-1 text-xs text-red-500">{errors.carModel}</p>}
          </FormField>

          <FormField label="Body Type">
            <CustomSelect
              value={form.bodyType}
              onChange={v => set("bodyType", v)}
              placeholder="Select Body Type"
              options={[{ value: "", label: "Select Body Type" }, ...bodyTypes.map(b => ({ value: b._id, label: b.name }))]}
            />
          </FormField>
        </Section>

        {/* ── Engine & Specs ── */}
        <Section title="Engine & Specs">
          <FormField label="Engine Type" required>
            <CustomSelect
              value={form.engineType}
              onChange={v => set("engineType", v)}
              placeholder="Select Engine Type"
              options={[{ value: "", label: "Select Engine Type" }, ...ENGINE_TYPES.map(o => ({ value: o.value, label: o.label }))]}
            />
            {errors.engineType && <p className="mt-1 text-xs text-red-500">{errors.engineType}</p>}
          </FormField>

          <FormField label={isElectric ? "Battery Capacity * (kWh)" : "Engine Capacity (CC)"} required>
            <input type="number" className={inputCls}
              placeholder={isElectric ? "e.g. 75" : "e.g. 1300"}
              value={form.engineCapacity}
              onChange={e => set("engineCapacity", e.target.value)}
              min={1} />
            {errors.engineCapacity && <p className="mt-1 text-xs text-red-500">{errors.engineCapacity}</p>}
          </FormField>

          <FormField label="Transmission" required>
            <div className="flex gap-3">
              {TRANSMISSIONS.map(o => (
                <button key={o.value} type="button"
                  onClick={() => set("transmission", o.value)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
                  style={form.transmission === o.value
                    ? { background: "#ea6d00", color: "#fff", border: "2px solid #ea6d00" }
                    : { background: "#fff", color: "#374151", border: "1px solid rgba(0,0,0,0.12)" }}>
                  {o.label}
                </button>
              ))}
            </div>
            {errors.transmission && <p className="mt-1 text-xs text-red-500">{errors.transmission}</p>}
          </FormField>

          <FormField label="Assembly" required>
            <div className="flex gap-3">
              {ASSEMBLIES.map(o => (
                <button key={o.value} type="button"
                  onClick={() => set("assembly", o.value)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
                  style={form.assembly === o.value
                    ? { background: "#ea6d00", color: "#fff", border: "2px solid #ea6d00" }
                    : { background: "#fff", color: "#374151", border: "1px solid rgba(0,0,0,0.12)" }}>
                  {o.label}
                </button>
              ))}
            </div>
            {errors.assembly && <p className="mt-1 text-xs text-red-500">{errors.assembly}</p>}
          </FormField>

          <FormField label="Exterior Color" required>
            <CustomSelect
              value={form.exteriorColor}
              onChange={v => set("exteriorColor", v)}
              placeholder="Select Color"
              options={[{ value: "", label: "Select Color" }, ...COLORS.map(c => ({ value: c, label: c }))]}
            />
            {errors.exteriorColor && <p className="mt-1 text-xs text-red-500">{errors.exteriorColor}</p>}
          </FormField>

          <FormField label="Mileage (km)" required>
            <input type="number" className={inputCls} placeholder="e.g. 45000"
              value={form.mileage} onChange={e => set("mileage", e.target.value)} min={0} />
            {errors.mileage && <p className="mt-1 text-xs text-red-500">{errors.mileage}</p>}
          </FormField>
        </Section>

        {/* ── Pricing & Description ── */}
        <Section title="Price & Description">
          <FormField label="Price (PKR)" required>
            <input type="number" className={inputCls} placeholder="e.g. 2500000"
              value={form.price} onChange={e => set("price", e.target.value)} min={1} />
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
          </FormField>

          <FullRow>
            <FormField label="Description">
              <textarea rows={4} className={inputCls + " resize-none"} placeholder="Describe your car's condition, features, history..."
                value={form.description} onChange={e => set("description", e.target.value)} />
            </FormField>
          </FullRow>
        </Section>

        {/* ── Photos ── */}
        <div className="bg-white rounded-2xl p-6 mb-5" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
          <h2 className="text-base font-semibold text-brand-dark mb-4">Photos</h2>
          <ImageManager images={form.images} onChange={v => set("images", v)} />
          {errors.images && <p className="mt-2 text-xs text-red-500">{errors.images}</p>}
        </div>

        {/* ── Contact ── */}
        <Section title="Contact Information">
          <FormField label="Mobile Number" required>
            <input type="tel" className={inputCls} placeholder="+92 300 1234567"
              value={form.mobileNumber} onChange={e => set("mobileNumber", e.target.value)} />
            {errors.mobileNumber && <p className="mt-1 text-xs text-red-500">{errors.mobileNumber}</p>}
          </FormField>

          <FormField label="Secondary Number" hint="Optional second contact number">
            <input type="tel" className={inputCls} placeholder="+92 300 7654321"
              value={form.secondaryNumber} onChange={e => set("secondaryNumber", e.target.value)} />
          </FormField>

          <FullRow>
            <WhatsAppToggle checked={form.whatsappAllowed} onChange={v => set("whatsappAllowed", v)} />
          </FullRow>
        </Section>

        {/* ── Submit ── */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate("/dashboard/listings")}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-brand-muted bg-white hover:bg-gray-50 transition"
            style={{ border: "1px solid rgba(0,0,0,0.12)" }}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
            style={{ background: "#ea6d00" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
