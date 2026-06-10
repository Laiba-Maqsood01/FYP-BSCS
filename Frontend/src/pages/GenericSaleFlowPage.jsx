import { useMemo, useState } from 'react';
import { CarFront, ChevronDown, CloudUpload, Phone } from 'lucide-react';
import Header from '../components/Header.jsx';

const cityOptions = ['Rahim Yar Khan', 'Khanpur', 'Liaqat Pur', 'Sadiqabad'];
const colorOptions = ['White', 'Black', 'Silver', 'Grey', 'Blue', 'Red'];

const initialForm = {
  city: '',
  makeModel: '',
  registeredIn: 'Registered',
  registrationCity: '',
  exteriorColor: '',
  mileage: '',
  price: '',
  description: '',
  mobileNumber: '',
  secondaryNumber: '',
  whatsappAllowed: false,
};

function GenericSaleFlowPage({ currentPage, onNavigate }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const isStepOneComplete = useMemo(
    () =>
      Boolean(
        form.city &&
          form.makeModel.trim() &&
          form.registeredIn &&
          form.registrationCity &&
          form.exteriorColor &&
          form.mileage.trim(),
      ),
    [form],
  );

  const steps = [
    {
      id: 1,
      label: 'Car Information',
      status: currentStep === 1 ? 'active' : 'done',
    },
    {
      id: 2,
      label: 'Upload Photos',
      status: currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : 'upcoming',
    },
    {
      id: 3,
      label: 'Set Price',
      status: currentStep === 3 ? 'active' : 'upcoming',
    },
  ];

  const handleFieldChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleStepOneContinue = () => {
    if (!isStepOneComplete) {
      return;
    }

    setCurrentStep(2);
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
          {currentStep === 2 ? (
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
                Sell Your Car
              </h1>
              <p className="mx-auto mt-5 max-w-[700px] text-sm leading-7 text-[#91a1bf] sm:text-base">
                Post your ad in 3 easy steps. It&apos;s free and takes less than a minute.
              </p>
            </div>
          ) : null}

          <div className="mx-auto mt-10 flex max-w-[520px] items-start justify-between">
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
            <div className="mx-auto mt-12 max-w-[780px] rounded-[28px] border border-[#22304a] bg-[#161f2d] p-7 shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:p-8">
              <h2 className="text-2xl font-bold text-white">Car Information</h2>
              <p className="mt-6 text-base leading-7 text-[#90a3c4]">
                All fields marked with * are mandatory
              </p>

              <div className="mt-7 grid gap-6">
                <Field label="City *">
                  <SelectInput
                    onChange={(value) => handleFieldChange('city', value)}
                    options={cityOptions}
                    placeholder="Select City"
                    value={form.city}
                  />
                </Field>

                <Field label="Make / Model / Version *">
                  <div className="flex min-h-[52px] items-center gap-3 rounded-2xl bg-[#2b354b] px-4">
                    <CarFront className="h-4 w-4 text-[#8ea0bf]" />
                    <input
                      className="w-full border-0 bg-transparent text-lg text-white outline-none placeholder:text-[#8ea0bf]"
                      onChange={(event) => handleFieldChange('makeModel', event.target.value)}
                      placeholder="e.g. Toyota Corolla Altis 1.8"
                      type="text"
                      value={form.makeModel}
                    />
                  </div>
                </Field>

                <Field label="Registered In *">
                  <div className="flex flex-wrap gap-6 text-xl font-semibold text-white">
                    {['Registered', 'Un-Registered'].map((option) => {
                      const checked = form.registeredIn === option;
                      return (
                        <label className="inline-flex items-center gap-3" key={option}>
                          <span
                            className={`grid h-6 w-6 place-items-center rounded-full border ${
                              checked ? 'border-[#ff7a18]' : 'border-white/30'
                            }`}
                          >
                            <span
                              className={`h-3 w-3 rounded-full ${
                                checked ? 'bg-[#ff7a18]' : 'bg-transparent'
                              }`}
                            />
                          </span>
                          <input
                            checked={checked}
                            className="sr-only"
                            name="registeredIn"
                            onChange={() => handleFieldChange('registeredIn', option)}
                            type="radio"
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </Field>

                <SelectInput
                  onChange={(value) => handleFieldChange('registrationCity', value)}
                  options={cityOptions}
                  placeholder="Select Registration City"
                  value={form.registrationCity}
                />

                <Field label="Exterior Color *">
                  <SelectInput
                    onChange={(value) => handleFieldChange('exteriorColor', value)}
                    options={colorOptions}
                    placeholder="Select Color"
                    value={form.exteriorColor}
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
                  onClick={handleStepOneContinue}
                  type="button"
                >
                  Continue to Upload Photos
                </button>
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="mx-auto mt-12 max-w-[780px] rounded-[28px] border border-[#22304a] bg-[#161f2d] p-7 shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:p-8">
              <h2 className="text-2xl font-bold text-white">Upload Photos</h2>
              <p className="mt-6 max-w-[680px] text-base leading-7 text-[#90a3c4]">
                Adding at least 8 pictures improves chances for a quick sale. Include
                Front, Back, and Interior shots. Max 5MB per image. Formats: jpeg,
                jpg, png, gif.
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
                  className={`inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full px-8 text-xl font-semibold transition ${
                    uploadedFiles.length > 0
                      ? 'bg-[#ff7a18] text-white hover:bg-orange-600'
                      : 'bg-[#2a3448] text-[#7f93b6]'
                  }`}
                  disabled={uploadedFiles.length === 0}
                  onClick={() => setCurrentStep(3)}
                  type="button"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="mx-auto mt-12 max-w-[780px] rounded-[28px] border border-[#22304a] bg-[#161f2d] p-7 shadow-[0_16px_40px_rgba(0,0,0,0.18)] sm:p-8">
              <div className="grid gap-6">
                <Field label="Price (Rs.) *">
                  <div className="flex min-h-[52px] items-center gap-4 rounded-2xl bg-[#2b354b] px-4">
                    <span className="text-lg text-[#8ea0bf]">PKR</span>
                    <input
                      className="w-full border-0 bg-transparent text-lg text-white outline-none placeholder:text-[#8ea0bf]"
                      inputMode="numeric"
                      onChange={(event) =>
                        handleFieldChange('price', event.target.value.replace(/[^0-9]/g, ''))
                      }
                      placeholder="Enter realistic price"
                      type="text"
                      value={form.price}
                    />
                  </div>
                  <p className="text-base leading-7 text-[#90a3c4]">
                    Please enter a realistic price to get more genuine responses.
                  </p>
                </Field>

                <Field label="Ad Description *">
                  <div>
                    <textarea
                      className="min-h-[170px] w-full resize-none rounded-2xl border-0 bg-[#2b354b] px-4 py-4 text-lg text-white outline-none placeholder:text-[#8ea0bf]"
                      maxLength={995}
                      onChange={(event) => handleFieldChange('description', event.target.value)}
                      placeholder="Describe your car's condition, features, and history..."
                      value={form.description}
                    />
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <p className="text-base font-semibold text-[#ff9c2f]">
                        We don&apos;t allow promotional messages that are not relevant to the ad.
                      </p>
                      <p className="text-base text-[#90a3c4]">{form.description.length}/995</p>
                    </div>
                  </div>
                </Field>

                <Field label="Mobile Number *">
                  <div className="flex min-h-[52px] items-center gap-4 rounded-2xl bg-[#2b354b] px-4">
                    <Phone className="h-4 w-4 text-[#8ea0bf]" />
                    <input
                      className="w-full border-0 bg-transparent text-lg text-white outline-none placeholder:text-[#8ea0bf]"
                      inputMode="numeric"
                      onChange={(event) =>
                        handleFieldChange(
                          'mobileNumber',
                          event.target.value.replace(/[^0-9]/g, '').slice(0, 11),
                        )
                      }
                      placeholder="03XXXXXXXXX"
                      type="text"
                      value={form.mobileNumber}
                    />
                  </div>
                  <p className="text-base leading-7 text-[#90a3c4]">
                    Enter a genuine 11 digit mobile no. All inquiries will come on this number.
                  </p>
                </Field>

                <Field label="Secondary Number (Optional)">
                  <div className="flex min-h-[52px] items-center gap-4 rounded-2xl bg-[#2b354b] px-4">
                    <Phone className="h-4 w-4 text-[#8ea0bf]" />
                    <input
                      className="w-full border-0 bg-transparent text-lg text-white outline-none placeholder:text-[#8ea0bf]"
                      inputMode="numeric"
                      onChange={(event) =>
                        handleFieldChange(
                          'secondaryNumber',
                          event.target.value.replace(/[^0-9]/g, '').slice(0, 11),
                        )
                      }
                      placeholder="03XXXXXXXXX"
                      type="text"
                      value={form.secondaryNumber}
                    />
                  </div>
                </Field>

                <label className="inline-flex items-center gap-3 text-xl font-medium text-white">
                  <input
                    checked={form.whatsappAllowed}
                    className="h-5 w-5 rounded border-white/20 accent-[#ff7a18]"
                    onChange={(event) =>
                      handleFieldChange('whatsappAllowed', event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span>Allow WhatsApp Contact</span>
                </label>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#25314b] px-8 text-xl font-semibold text-white transition hover:bg-[#2b3958]"
                  onClick={() => setCurrentStep(2)}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#ff7a18] px-8 text-xl font-semibold text-white transition hover:bg-orange-600"
                  onClick={() => onNavigate('Post an Ad')}
                  type="button"
                >
                  Submit Listing
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
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

export default GenericSaleFlowPage;
