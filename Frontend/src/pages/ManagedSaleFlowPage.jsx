import { useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  CarFront,
  ChevronDown,
  CircleAlert,
  CloudUpload,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';
import Header from '../components/Header.jsx';

const yearOptions = Array.from({ length: 16 }, (_, index) => `${2025 - index}`);
const cityOptions = ['Rahim Yar Khan', 'Khanpur', 'Liaqat Pur', 'Sadiqabad'];
const transmissionOptions = ['Automatic', 'Manual'];
const fuelOptions = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];

const initialForm = {
  modelYear: '',
  makeModel: '',
  city: '',
  mileage: '',
  transmission: '',
  fuelType: '',
};

const policyLinks = [
  'Eligibility Criteria',
  'Required Documents',
  'Pricing / Commission',
  'Terms of Service',
];

function ManagedSaleFlowPage({ currentPage, onNavigate }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const isStepOneComplete = useMemo(
    () =>
      Boolean(
        form.modelYear &&
          form.makeModel.trim() &&
          form.city &&
          form.mileage.trim() &&
          form.transmission &&
          form.fuelType,
      ),
    [form],
  );

  const steps = [
    {
      id: 1,
      label: 'Car Details',
      status: currentStep === 1 ? 'active' : 'done',
    },
    {
      id: 2,
      label: 'Upload Photos',
      status: currentStep === 2 ? 'active' : 'upcoming',
    },
  ];

  const handleFieldChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
  };

  return (
    <main className="min-h-screen bg-[#0b1220] text-white">
      <section className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <Header activeNav={currentPage} onNavChange={onNavigate} />

        <div className="mx-auto mt-12 max-w-[1080px]">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
              Sell It For Me
            </h1>
            <p className="mx-auto mt-5 max-w-[840px] text-sm leading-7 text-[#91a1bf] sm:text-base">
              Let our experts take the difficulty out of selling your car. We will
              manage your ad and find the best deal for you.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-[760px] rounded-[26px] border border-[#22304a] bg-[#161f2d] px-6 py-7 shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <div className="grid gap-6 md:grid-cols-3">
              <FeatureItem
                description="To sell your car"
                icon={UserRoundCog}
                title="Dedicated Sales Expert"
              />
              <FeatureItem
                description="Share the best offer"
                icon={BadgeDollarSign}
                title="We Bargain For You"
              />
              <FeatureItem
                description="Transaction guaranteed"
                icon={ShieldCheck}
                title="Safe & Secure"
              />
            </div>

            <div className="mt-6 flex items-start gap-3 text-base font-semibold text-[#ff9c2f]">
              <CircleAlert className="mt-1 h-4 w-4 shrink-0" />
              <p>Service available only in Rahim Yar Khan, KhanPur, Liaqat Pur, and Sadiqabad</p>
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-[760px] flex-wrap items-center justify-center gap-x-8 gap-y-3 text-base font-semibold text-[#ff7a18]">
            {policyLinks.map((item) => (
              <button className="transition hover:text-[#ff9c2f]" key={item} type="button">
                {item}
              </button>
            ))}
          </div>

          <div className="mx-auto mt-8 flex max-w-[320px] items-start justify-between">
            {steps.map((step, index) => (
              <div className="flex items-center" key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-full text-lg font-bold ${
                      step.status === 'upcoming'
                        ? 'bg-[#25314b] text-[#8a9ab7]'
                        : 'bg-[#ff7a18] text-white'
                    }`}
                  >
                    {step.id}
                  </div>
                  <p
                    className={`mt-3 text-center text-sm font-semibold ${
                      step.status === 'upcoming' ? 'text-[#8a9ab7]' : 'text-[#ff7a18]'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>

                {index < steps.length - 1 ? (
                  <div className="mx-6 mt-6 h-px w-10 bg-[#31415e]" />
                ) : null}
              </div>
            ))}
          </div>

          {currentStep === 1 ? (
            <div className="mx-auto mt-10 max-w-[780px] rounded-[28px] border border-[#22304a] bg-[#161f2d] p-7 shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:p-8">
              <h2 className="text-2xl font-bold text-white">Car Details</h2>

              <div className="mt-7 grid gap-6">
                <Field label="Model Year *">
                  <SelectInput
                    onChange={(value) => handleFieldChange('modelYear', value)}
                    options={yearOptions}
                    placeholder="Select Year"
                    value={form.modelYear}
                  />
                </Field>

                <Field label="Make / Model *">
                  <div className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-[#2b354b] px-4">
                    <CarFront className="h-4 w-4 text-[#8ea0bf]" />
                    <input
                      className="w-full border-0 bg-transparent text-lg text-white outline-none placeholder:text-[#8ea0bf]"
                      onChange={(event) => handleFieldChange('makeModel', event.target.value)}
                      placeholder="e.g. Toyota Corolla"
                      type="text"
                      value={form.makeModel}
                    />
                  </div>
                </Field>

                <Field label="City *">
                  <SelectInput
                    onChange={(value) => handleFieldChange('city', value)}
                    options={cityOptions}
                    placeholder="Select City"
                    value={form.city}
                  />
                </Field>

                <Field label="Mileage (KM) *">
                  <div className="flex min-h-[52px] items-center gap-4 rounded-2xl bg-[#2b354b] px-4">
                    <span className="text-lg text-[#8ea0bf]">KM</span>
                    <input
                      className="w-full border-0 bg-transparent text-lg text-white outline-none placeholder:text-[#8ea0bf]"
                      inputMode="numeric"
                      onChange={(event) =>
                        handleFieldChange(
                          'mileage',
                          event.target.value.replace(/[^0-9]/g, ''),
                        )
                      }
                      placeholder="e.g. 45000"
                      type="text"
                      value={form.mileage}
                    />
                  </div>
                </Field>

                <Field label="Transmission *">
                  <SelectInput
                    onChange={(value) => handleFieldChange('transmission', value)}
                    options={transmissionOptions}
                    placeholder="Select Transmission"
                    value={form.transmission}
                  />
                </Field>

                <Field label="Fuel Type *">
                  <SelectInput
                    onChange={(value) => handleFieldChange('fuelType', value)}
                    options={fuelOptions}
                    placeholder="Select Fuel Type"
                    value={form.fuelType}
                  />
                </Field>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  className="inline-flex min-h-[58px] items-center justify-center rounded-full bg-[#25314b] px-8 text-xl font-semibold text-white transition hover:bg-[#2b3958]"
                  onClick={() => onNavigate('Home')}
                  type="button"
                >
                  Back
                </button>
                <button
                  className={`inline-flex min-h-[58px] items-center justify-center rounded-full px-8 text-xl font-semibold transition ${
                    isStepOneComplete
                      ? 'bg-[#ff7a18] text-white hover:bg-orange-600'
                      : 'bg-[#2a3448] text-[#7f93b6]'
                  }`}
                  disabled={!isStepOneComplete}
                  onClick={() => setCurrentStep(2)}
                  type="button"
                >
                  Continue to Upload Photos
                </button>
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="mx-auto mt-10 max-w-[780px] rounded-[28px] border border-[#22304a] bg-[#161f2d] p-7 shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:p-8">
              <h2 className="text-2xl font-bold text-white">Upload Photos</h2>
              <p className="mt-6 max-w-[680px] text-base leading-7 text-[#90a3c4]">
                Upload clear photos so our team can review the car faster and prepare
                your managed sale listing.
              </p>

              <label className="mt-6 block cursor-pointer rounded-[24px] border border-dashed border-[#2d3a55] bg-[#141d2a] px-6 py-14 transition hover:border-[#ff7a18]/50 hover:bg-[#182233]">
                <input
                  accept=".jpeg,.jpg,.png,.gif"
                  className="sr-only"
                  multiple
                  onChange={handleFileChange}
                  type="file"
                />
                <div className="flex flex-col items-center text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#25314b] text-[#ff7a18]">
                    <CloudUpload className="h-6 w-6" />
                  </div>
                  <p className="mt-6 text-2xl font-semibold text-white">
                    Click to upload images
                  </p>
                  <p className="mt-2 text-lg text-[#90a3c4]">or drag and drop files here</p>
                </div>
              </label>

              {uploadedFiles.length > 0 ? (
                <div className="mt-5 rounded-[20px] border border-[#22304a] bg-[#141d2a] p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8ea0bf]">
                    Selected Photos
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {uploadedFiles.map((file) => (
                      <div
                        className="rounded-2xl bg-[#25314b] px-4 py-3 text-sm text-white"
                        key={`${file.name}-${file.size}`}
                      >
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="mt-1 text-[#8ea0bf]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#25314b] px-8 text-xl font-semibold text-white transition hover:bg-[#2b3958]"
                  onClick={() => setCurrentStep(1)}
                  type="button"
                >
                  Back
                </button>
                <button
                  className={`inline-flex min-h-[56px] items-center justify-center rounded-full px-8 text-xl font-semibold transition ${
                    uploadedFiles.length > 0
                      ? 'bg-[#ff7a18] text-white hover:bg-orange-600'
                      : 'bg-[#2a3448] text-[#7f93b6]'
                  }`}
                  disabled={uploadedFiles.length === 0}
                  onClick={() => onNavigate('Post an Ad')}
                  type="button"
                >
                  Submit Managed Request
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function FeatureItem({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 text-[#ff7a18]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold leading-8 text-white">{title}</p>
        <p className="mt-1 text-lg leading-7 text-[#90a3c4]">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-3">
      <span className="text-[0.95rem] font-bold uppercase tracking-[0.08em] text-[#8ea0bf]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        className={`min-h-[52px] w-full appearance-none rounded-2xl border-0 bg-[#2b354b] px-4 pr-12 text-lg outline-none ${
          value ? 'text-white' : 'text-[#d6deea]'
        }`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option className="bg-[#f8fafc] text-[#0f172a]" key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8ea0bf]" />
    </div>
  );
}

export default ManagedSaleFlowPage;
