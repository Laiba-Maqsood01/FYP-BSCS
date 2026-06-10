// src/pages/BrowseCars.jsx

import { useMemo, useState } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { mockCars } from "../data/mockData";

import {
  Search,
  Flame,
  ShieldCheck,
  MapPin,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

const cars = mockCars;

export default function BrowseCars({ currentPage, onNavigate }) {
  const [activeTab, setActiveTab] = useState("All");

  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedMake, setSelectedMake] = useState("All Makes");
  const [selectedFuel, setSelectedFuel] = useState("All");
  const [selectedTransmission, setSelectedTransmission] = useState("All");
  const [selectedBodyType, setSelectedBodyType] = useState("All");
  const [sortOption, setSortOption] = useState("featured");

  const parseMileage = (kmString) => {
    const normalized = kmString?.toLowerCase().replace(/\s+/g, "") || "";
    const number = parseFloat(normalized.replace(/[^0-9.]/g, "")) || 0;
    return normalized.includes("k") ? number * 1000 : number;
  };

  const filteredCars = useMemo(() => {
    let filtered = [...cars];

    // Search
    if (search) {
      filtered = filtered.filter((car) =>
        car.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // City
    if (selectedCity !== "All Cities") {
      filtered = filtered.filter(
        (car) => car.city === selectedCity
      );
    }

    // Make
    if (selectedMake !== "All Makes") {
      filtered = filtered.filter(
        (car) => car.make === selectedMake
      );
    }

    // Fuel
    if (selectedFuel !== "All") {
      filtered = filtered.filter(
        (car) => car.fuel === selectedFuel
      );
    }

    // Transmission
    if (selectedTransmission !== "All") {
      filtered = filtered.filter(
        (car) => car.transmission === selectedTransmission
      );
    }

    // Body Type
    if (selectedBodyType !== "All") {
      filtered = filtered.filter(
        (car) => car.bodyType === selectedBodyType
      );
    }

    // Tabs
    if (activeTab === "Featured") {
      filtered = filtered.filter((car) => car.featured);
    }

    if (activeTab === "Managed") {
      filtered = filtered.filter((car) => car.managed);
    }

    if (activeTab === "Generic") {
      filtered = filtered.filter((car) => !car.managed);
    }

    if (sortOption === "priceHigh") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOption === "priceLow") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOption === "mileageHigh") {
      filtered.sort((a, b) => parseMileage(b.km) - parseMileage(a.km));
    } else if (sortOption === "yearNewest") {
      filtered.sort((a, b) => b.year - a.year);
    } else {
      filtered.sort((a, b) => {
        if (a.featured === b.featured) return 0;
        return a.featured ? -1 : 1;
      });
    }

    return filtered;
  }, [
    activeTab,
    search,
    selectedCity,
    selectedMake,
    selectedFuel,
    selectedTransmission,
    selectedBodyType,
    sortOption,
  ]);

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      
      {/* Header */}
      <section className="mx-auto w-full max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-8">
        <Header activeNav={currentPage} onNavChange={onNavigate} />
      </section>

      {/* Page Content */}
      <section className="px-6 md:px-10 py-12">
        
        <div className="max-w-[1600px] mx-auto">
          
          {/* Heading */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Browse Used Cars
              </h1>

              <p className="text-gray-400 text-lg">
                Find verified used cars across South Punjab
              </p>
            </div>

            <label className="relative flex items-center gap-3 rounded-3xl border border-[#1f2d47] bg-[#0b1220] px-6 py-4 text-lg font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-[#2f4368]">
              <span className="text-white">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="min-w-[260px] appearance-none rounded-2xl border border-[#233554] bg-[#121f33] px-5 py-3.5 pr-12 text-xl font-semibold text-white outline-none transition hover:border-[#2f4368]"
              >
                <option value="featured">Featured First</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="mileageHigh">Mileage: High to Low</option>
                <option value="yearNewest">Year: Newest First</option>
              </select>
              <ChevronDown
                size={20}
                className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 text-[#8ea2c2]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="rounded-3xl border border-[#1a2740] bg-[#0b1220] p-8 h-fit sticky top-6">
              <h3 className="text-3xl font-bold mb-10">
                {filteredCars.length} Results
              </h3>

              <div className="mb-10">
                <p className="text-gray-400 uppercase tracking-wider mb-4 text-sm">
                  Search By Keyword
                </p>

                <div className="flex items-center gap-3 rounded-2xl bg-[#182235] px-5 py-4">
                  <Search size={20} className="text-gray-400" />

                  <input
                    type="text"
                    placeholder="Search cars..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent outline-none w-full text-lg"
                  />
                </div>
              </div>

              {/* City */}
              <div className="mb-10">
                <p className="text-gray-400 uppercase tracking-wider mb-5 text-sm">
                  City
                </p>

                <div className="space-y-4">
                  {[
                    "All Cities",
                    "Rahim Yar Khan",
                    "KhanPur",
                    "Liaqat Pur",
                    "Sadiqabad",
                  ].map((city) => (
                    <label
                      key={city}
                      className="flex items-center gap-4 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="city"
                        checked={selectedCity === city}
                        onChange={() => setSelectedCity(city)}
                        className="accent-orange-500 w-5 h-5"
                      />

                      <span className="text-lg">{city}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Make */}
              <div className="mb-10">
                <p className="text-gray-400 uppercase tracking-wider mb-5 text-sm">
                  Make
                </p>

                <div className="space-y-4">
                  {[
                    "All Makes",
                    "Toyota",
                    "Suzuki",
                    "Honda",
                    "KIA",
                  ].map((make) => (
                    <label
                      key={make}
                      className="flex items-center gap-4 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="make"
                        checked={selectedMake === make}
                        onChange={() => setSelectedMake(make)}
                        className="accent-orange-500 w-5 h-5"
                      />

                      <span className="text-lg">{make}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Body Type */}
              <div className="mb-10">
                <p className="text-gray-400 uppercase tracking-wider mb-5 text-sm">
                  Body Type
                </p>

                <div className="flex flex-wrap gap-3">
                  {[
                    "All",
                    "Sedan",
                    "Hatchback",
                    "SUV",
                  ].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedBodyType(type)}
                      className={`rounded-full px-5 py-3 text-sm transition ${
                        selectedBodyType === type
                          ? "bg-orange-500 text-white"
                          : "bg-[#182235] text-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fuel */}
              <div className="mb-10">
                <p className="text-gray-400 uppercase tracking-wider mb-5 text-sm">
                  Fuel Type
                </p>

                <div className="flex flex-wrap gap-3">
                  {["All", "Petrol", "Diesel"].map((fuel) => (
                    <button
                      key={fuel}
                      onClick={() => setSelectedFuel(fuel)}
                      className={`rounded-full px-5 py-3 text-sm transition ${
                        selectedFuel === fuel
                          ? "bg-orange-500 text-white"
                          : "bg-[#182235] text-gray-300"
                      }`}
                    >
                      {fuel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div>
                <p className="text-gray-400 uppercase tracking-wider mb-5 text-sm">
                  Transmission
                </p>

                <div className="flex flex-wrap gap-3">
                  {["All", "Automatic", "Manual"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setSelectedTransmission(item)}
                      className={`rounded-full px-5 py-3 text-sm transition ${
                        selectedTransmission === item
                          ? "bg-orange-500 text-white"
                          : "bg-[#182235] text-gray-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right Side */}
            <section>
              
              {/* Tabs */}
              <div className="flex flex-wrap gap-4 mb-10">
                {["All", "Featured", "Managed", "Generic"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-7 py-3 text-lg font-semibold transition ${
                      activeTab === tab
                        ? "bg-orange-500 text-white"
                        : "border border-[#1f2d47] text-gray-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                
                {filteredCars.map((car, index) => (
                  <div
                    key={car.id}
                    className={`animate-fade-in-up-delay-${(index % 4) + 1} group flex flex-col overflow-hidden rounded-3xl border border-[#1a2740] bg-[#0b1220] transition duration-300 hover:border-orange-500/40`}
                  >
                    
                    {/* Image */}
                    <div className="relative overflow-hidden bg-gray-800 h-[320px]">
                      
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      {/* Badges */}
                      <div className="absolute left-4 top-4 flex flex-col gap-3">
                        
                        {car.featured && (
                          <div className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold">
                            <Flame size={15} />
                            Featured
                          </div>
                        )}

                        {car.inspected && (
                          <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold">
                            <ShieldCheck size={15} className="text-white" />
                            Inspected
                          </div>
                        )}

                        {car.managed && (
                          <div className="flex items-center gap-2 rounded-full bg-[#16233a] px-4 py-2 text-sm font-semibold">
                            <ShieldCheck
                              size={15}
                              className="text-green-400"
                            />
                            Managed
                          </div>
                        )}
                      </div>

                      {/* City */}
                      <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm">
                        <MapPin size={14} />
                        {car.city}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-6">
                      
                      <h3 className="text-2xl font-bold mb-3 transition duration-300 group-hover:text-orange-500">
                        {car.name}
                      </h3>

                      <div className="flex flex-wrap gap-4 text-gray-400 text-[13px] mb-5">
                        <span>{car.year}</span>
                        <span>{car.km}</span>
                        <span>{car.fuel}</span>
                        <span>{car.transmission}</span>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                        
                        <h4 className="text-3xl font-bold text-orange-500">
                          {car.priceLabel}
                        </h4>

                        <button
                          className="flex items-center gap-2 rounded-full border border-white/70 px-5 py-3 text-lg text-orange-500 transition hover:border-orange-500 hover:bg-orange-500 hover:text-white"
                          onClick={() => onNavigate?.("Car Details", car)}
                          type="button"
                        >
                          Details
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              </div>

              {/* No Cars */}
              {filteredCars.length === 0 && (
                <div className="rounded-3xl border border-[#1a2740] bg-[#0b1220] py-20 text-center">
                  <h3 className="text-3xl font-bold mb-3">
                    No Cars Found
                  </h3>

                  <p className="text-gray-400">
                    Try changing your filters
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </main>
  );
}
