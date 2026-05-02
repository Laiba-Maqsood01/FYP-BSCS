import { useEffect, useMemo, useState } from "react";
import { LuChevronDown, LuFilter, LuSearch } from "react-icons/lu";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import CarCard from "../components/CarCard";
import { getListings } from "../../services/api";

const priceRanges = [
  { value: "all", label: "All Prices" },
  { value: "under-4m", label: "Under Rs 4M" },
  { value: "4m-8m", label: "Rs 4M - Rs 8M" },
  { value: "8m-plus", label: "Above Rs 8M" },
];

function BrowseCars() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") || "",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedFuel, setSelectedFuel] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");

  const loadListings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getListings();
      setCars(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearchTerm(query);
  }, [searchParams]);

  const years = useMemo(
    () => ["all", ...new Set(cars.map((car) => String(car.year)))],
    [cars],
  );
  const fuels = useMemo(
    () => ["all", ...new Set(cars.map((car) => car.fuel))],
    [cars],
  );
  const models = useMemo(
    () => ["all", ...new Set(cars.map((car) => car.model))],
    [cars],
  );

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchesSearch = `${car.name} ${car.model} ${car.location}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesYear = selectedYear === "all" || car.year === selectedYear;
      const matchesFuel = selectedFuel === "all" || car.fuel === selectedFuel;
      const matchesModel =
        selectedModel === "all" || car.model === selectedModel;

      const matchesPrice =
        selectedPriceRange === "all" ||
        (selectedPriceRange === "under-4m" && car.priceValue < 4000000) ||
        (selectedPriceRange === "4m-8m" &&
          car.priceValue >= 4000000 &&
          car.priceValue <= 8000000) ||
        (selectedPriceRange === "8m-plus" && car.priceValue > 8000000);

      return (
        matchesSearch &&
        matchesYear &&
        matchesFuel &&
        matchesModel &&
        matchesPrice
      );
    });
  }, [
    cars,
    searchTerm,
    selectedYear,
    selectedFuel,
    selectedPriceRange,
    selectedModel,
  ]);

  return (
    <>
      <Navbar />

      <section className="browse-page">
        <div className="browse-header">
          <h1 className="browse-title">
            Browse <span>Cars</span>
          </h1>
          <p className="browse-desc">
            Find your perfect car from our verified listings
          </p>
        </div>

        <div className="browse-toolbar-wrap">
          <div className="browse-toolbar">
            <div className="browse-search-box">
              <LuSearch />
              <input
                className="search-input"
                value={searchTerm}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchTerm(value);

                  if (value.trim()) {
                    setSearchParams({ search: value });
                    return;
                  }

                  setSearchParams({});
                }}
                placeholder="Search by make, model, or keyword..."
              />
            </div>

            <button
              className="filter-btn"
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <LuFilter /> Filters <LuChevronDown />
            </button>
          </div>

          {filtersOpen && (
            <div className="filter-dropdown">
              <div className="filter-grid">
                <label className="filter-field">
                  <span>Year</span>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year === "all" ? "All Years" : year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-field">
                  <span>Fuel</span>
                  <select
                    value={selectedFuel}
                    onChange={(event) => setSelectedFuel(event.target.value)}
                  >
                    {fuels.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel === "all" ? "All Fuel Types" : fuel}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-field">
                  <span>Price Range</span>
                  <select
                    value={selectedPriceRange}
                    onChange={(event) =>
                      setSelectedPriceRange(event.target.value)
                    }
                  >
                    {priceRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-field">
                  <span>Model</span>
                  <select
                    value={selectedModel}
                    onChange={(event) => setSelectedModel(event.target.value)}
                  >
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model === "all" ? "All Models" : model}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="dashboard-empty-state compact-state">
            <h3>Loading listings...</h3>
          </div>
        ) : error ? (
          <div className="dashboard-empty-state compact-state">
            <h3>failed to load listing
            </h3>
            <p>{error}</p>
            <button
              type="button"
              className="dashboard-empty-button"
              onClick={loadListings}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="results-top">
              <p className="results-text">Showing {filteredCars.length} cars</p>
              <span className="badge">Verified Listings</span>
            </div>

            {filteredCars.length === 0 ? (
              <div className="dashboard-empty-state compact-state">
                <h3>No matching cars found</h3>
                <p>Try another car name, model, or keyword.</p>
              </div>
            ) : (
              <div className="browse-cars-grid">
                {filteredCars.map((car) => (
                  <CarCard key={car.id} car={car} variant="featured" />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

export default BrowseCars;
