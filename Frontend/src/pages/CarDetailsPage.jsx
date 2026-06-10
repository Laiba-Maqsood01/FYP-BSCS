import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  Download,
  Fuel,
  Gauge,
  MapPin,
  Settings2,
  ShieldCheck,
  Star,
  Upload,
} from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

function CarDetailsPage({ car, currentPage, onNavigate }) {
  if (!car) {
    return (
      <main className="min-h-screen bg-[#0b1220] text-white">
        <section className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <Header activeNav={currentPage} onNavChange={onNavigate} />
          <div className="mt-14 rounded-[32px] border border-white/6 bg-[#161f2d] px-6 py-12 text-center">
            <h1 className="text-3xl font-bold text-white">Car details not available</h1>
            <button
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#ff7a18] px-8 text-lg font-semibold text-white"
              onClick={() => onNavigate('Browse Cars')}
              type="button"
            >
              Back to Browse Cars
            </button>
          </div>
        </section>
      </main>
    );
  }

  const baseImages = useMemo(() => {
    if (Array.isArray(car.images) && car.images.length > 0) {
      return car.images;
    }

    return [car.image, car.image, car.image, car.image].filter(Boolean);
  }, [car.image, car.images]);

  const [galleryImages, setGalleryImages] = useState(baseImages);
  const [activeImage, setActiveImage] = useState(baseImages[0] || car.image);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionRequested, setInspectionRequested] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    fullName: '',
    phone: '',
    city: car.city || '',
    preferredDate: '',
    notes: '',
  });

  const isInspected = Boolean(car.inspected || car.inspectionReport);
  const inspectionReport = car.inspectionReport || {
    score: '8.0 / 10',
    checkedPoints: '180+ checkpoints',
    engine: 'Good',
    suspension: 'Good',
    exterior: 'Minor scratches',
    interior: 'Excellent',
    verdict: 'Recommended purchase',
    inspector: 'In-house expert',
    inspectorOpinion: 'This car is in solid condition, but we recommend close review of the exterior panels and rubber seals.',
    ratings: {
      Engine: 8,
      Suspension: 8,
      Exterior: 7,
      Interior: 9,
    },
    pdfUrl: null,
  };

  const handleUploadImages = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    const uploadedUrls = files.map((file) => URL.createObjectURL(file));
    setGalleryImages((current) => [...current, ...uploadedUrls]);

    if (!activeImage) {
      setActiveImage(uploadedUrls[0]);
    }
  };

  const handleFormChange = (field, value) => {
    setInspectionForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleInspectionSubmit = (event) => {
    event.preventDefault();
    setInspectionRequested(true);
    setShowInspectionForm(false);
  };

  const quickSpecs = [
    { icon: CalendarDays, label: 'Year', value: car.year },
    { icon: Gauge, label: 'Mileage', value: car.km },
    { icon: Fuel, label: 'Fuel Type', value: car.fuel },
    { icon: Settings2, label: 'Transmission', value: car.transmission },
  ];

  const carSpecs = [
    ['Registered In', car.city || 'Rahim Yar Khan'],
    ['Color', car.color || 'Super White'],
    ['Assembly', 'Local'],
    ['Engine Capacity', car.engine || '1300 cc'],
    ['Body Type', car.bodyType || 'Sedan'],
    ['Last Updated', 'May 08, 2026'],
    ['Ad Ref #', '11446114'],
    ['Make', car.make || 'Toyota'],
  ];

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <section className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <Header activeNav={currentPage} onNavChange={onNavigate} />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-white/6 bg-[#161f2d]">
              <div className="relative">
                <img
                  src={activeImage || car.image}
                  alt={car.name}
                  className="h-[420px] w-full object-cover sm:h-[520px]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08101c] to-transparent px-6 pb-6 pt-24">
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md"
                    onClick={() => onNavigate('Browse Cars')}
                    type="button"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#ff7a18] px-4 py-2 text-sm font-semibold text-white">
                      <BadgeCheck className="h-4 w-4" />
                      Verified Listing
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                      <MapPin className="h-4 w-4" />
                      {car.city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/6 bg-[#111a2c] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-3">
                    {galleryImages.map((image, index) => {
                      const isActive = activeImage === image;
                      return (
                        <button
                          className={`overflow-hidden rounded-xl border ${
                            isActive ? 'border-orange-500' : 'border-white/10'
                          }`}
                          key={`${image}-${index}`}
                          onClick={() => setActiveImage(image)}
                          type="button"
                        >
                          <img
                            alt={`${car.name} ${index + 1}`}
                            className="h-16 w-24 object-cover"
                            src={image}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#2b3d5f] bg-[#0d1627] px-4 py-2 text-sm font-semibold text-[#9fb3d3] transition hover:border-orange-500 hover:text-orange-400">
                    <Upload className="h-4 w-4" />
                    Upload More Photos
                    <input
                      accept="image/*"
                      className="hidden"
                      multiple
                      onChange={handleUploadImages}
                      type="file"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickSpecs.map(({ icon: Icon, label, value }) => (
                <div
                  className="rounded-[24px] border border-white/7 bg-white/[0.03] px-4 py-5 text-center"
                  key={label}
                >
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#25314b] text-[#ff7a18]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-2xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-base text-[#8ea0bf]">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-white/7 bg-white/[0.03] px-6 py-6">
              <p className="text-3xl font-bold text-white">Car Inspection Report</p>

              {isInspected ? (
                <div className="mt-4 space-y-2 text-sm text-[#a8b7d3]">
                  <p className="mb-3 text-base text-[#90a3c4]">
                    Never buy a used car without a professional inspection. Our experts
                    check 200+ checkpoints.
                  </p>
                  <p>
                    Inspection Score: <span className="font-semibold text-white">{inspectionReport.score}</span>
                  </p>
                  <p>
                    Checked Points:{' '}
                    <span className="font-semibold text-white">{inspectionReport.checkedPoints}</span>
                  </p>
                  <p>
                    Engine: <span className="font-semibold text-white">{inspectionReport.engine}</span>
                  </p>
                  <p>
                    Suspension:{' '}
                    <span className="font-semibold text-white">{inspectionReport.suspension}</span>
                  </p>
                  <p>
                    Exterior:{' '}
                    <span className="font-semibold text-white">{inspectionReport.exterior}</span>
                  </p>
                  <p>
                    Interior:{' '}
                    <span className="font-semibold text-white">{inspectionReport.interior}</span>
                  </p>
                  <p>
                    Verdict: <span className="font-semibold text-emerald-400">{inspectionReport.verdict}</span>
                  </p>
                  <p className="mt-3 text-sm text-[#cbd4ef]">
                    Inspector: <span className="font-semibold text-white">{inspectionReport.inspector}</span>
                  </p>
                  <p className="mt-2 text-sm text-[#cbd4ef]">
                    Opinion: <span className="font-semibold text-white">{inspectionReport.inspectorOpinion}</span>
                  </p>

                  {inspectionReport.pdfUrl ? (
                    <a
                      href={inspectionReport.pdfUrl}
                      download
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ff7a18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      <Download className="h-4 w-4" />
                      Download Inspection PDF
                    </a>
                  ) : null}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {Object.entries(inspectionReport.ratings || {}).map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl bg-[#0d1627] p-4"
                      >
                        <p className="text-sm text-[#8ea0bf]">{label}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-2xl font-semibold text-white">{value}/10</span>
                          <Star className="h-4 w-4 text-orange-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-[#90a3c4]">
                    This car is not inspected yet. Request a professional report before purchase.
                  </p>
                  {!showInspectionForm && !inspectionRequested ? (
                    <button
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ff7a18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                      onClick={() => setShowInspectionForm(true)}
                      type="button"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Request Inspection
                    </button>
                  ) : null}

                  {inspectionRequested ? (
                    <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                      Inspection request submitted successfully. Our team will contact you soon.
                    </p>
                  ) : null}

                  {showInspectionForm ? (
                    <form className="mt-4 grid gap-3" onSubmit={handleInspectionSubmit}>
                      <input
                        className="min-h-[44px] rounded-xl border border-white/10 bg-[#111a2b] px-3 text-sm text-white outline-none placeholder:text-[#7f91b2]"
                        onChange={(event) => handleFormChange('fullName', event.target.value)}
                        placeholder="Full Name"
                        required
                        type="text"
                        value={inspectionForm.fullName}
                      />
                      <input
                        className="min-h-[44px] rounded-xl border border-white/10 bg-[#111a2b] px-3 text-sm text-white outline-none placeholder:text-[#7f91b2]"
                        onChange={(event) => handleFormChange('phone', event.target.value)}
                        placeholder="Phone Number"
                        required
                        type="text"
                        value={inspectionForm.phone}
                      />
                      <input
                        className="min-h-[44px] rounded-xl border border-white/10 bg-[#111a2b] px-3 text-sm text-white outline-none placeholder:text-[#7f91b2]"
                        onChange={(event) => handleFormChange('city', event.target.value)}
                        placeholder="City"
                        required
                        type="text"
                        value={inspectionForm.city}
                      />
                      <input
                        className="min-h-[44px] rounded-xl border border-white/10 bg-[#111a2b] px-3 text-sm text-white outline-none"
                        onChange={(event) =>
                          handleFormChange('preferredDate', event.target.value)
                        }
                        required
                        type="date"
                        value={inspectionForm.preferredDate}
                      />
                      <textarea
                        className="min-h-[88px] rounded-xl border border-white/10 bg-[#111a2b] px-3 py-2 text-sm text-white outline-none placeholder:text-[#7f91b2]"
                        onChange={(event) => handleFormChange('notes', event.target.value)}
                        placeholder="Notes (optional)"
                        value={inspectionForm.notes}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-full bg-[#ff7a18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                          type="submit"
                        >
                          Submit Request
                        </button>
                        <button
                          className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-[#9fb3d3]"
                          onClick={() => setShowInspectionForm(false)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/7 bg-white/[0.03] px-6 py-6">
              <h3 className="text-3xl font-bold text-white">Car Specifications</h3>
              <div className="mt-5 grid gap-0 md:grid-cols-2">
                {carSpecs.map(([label, value]) => (
                  <div
                    className="flex items-center justify-between border-b border-white/10 px-0 py-4 md:pr-5 md:[&:nth-child(odd)]:mr-4"
                    key={label}
                  >
                    <span className="text-base text-[#8ea0bf]">{label}</span>
                    <span className="text-xl font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[24px] border border-white/7 bg-white/[0.03] px-6 py-6">
              <p className="text-lg text-[#8ea0bf]">Price</p>
              <p className="mt-2 text-5xl font-black text-[#ff7a18]">{car.price}</p>
              <button
                className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#ff7a18] px-6 text-xl font-semibold text-white"
                type="button"
              >
                Show Phone No.
              </button>
              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-2xl font-semibold text-white">{car.seller || 'Ali Ahmed'}</p>
                <p className="text-base text-[#8ea0bf]">ali.ahmed@email.com</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/7 bg-white/[0.03] px-6 py-6">
              <p className="text-3xl font-bold text-white">Safety Tips</p>
              <ul className="mt-4 space-y-2 text-base text-[#8ea0bf]">
                <li>Use a safe location to meet seller</li>
                <li>Avoid cash transactions</li>
                <li>Beware of unrealistic offers</li>
                <li>Verify car documents before purchase</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </main>
  );
}

export default CarDetailsPage;
