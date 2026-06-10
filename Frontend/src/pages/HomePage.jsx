import { useState } from 'react';
import Header from '../components/Header.jsx';
import HeroContent from '../components/HeroContent.jsx';
import SearchPanel from '../components/SearchPanel.jsx';
import WhatWeOffer from "../components/WhatWeOffer.jsx";
import SellYourCarSection from "../components/SellYourCarSection";
import FeaturedCars from "../components/FeaturedCars";
import Footer from '../components/Footer.jsx';

const defaultFilters = {
  model: '',
  city: 'All Cities',
  minPrice: '',
  maxPrice: '',
  bodyType: 'Any Body Type',
  fuelType: 'Any Fuel Type',
};

function HomePage({ currentPage, onNavigate }) {
  const [filters, setFilters] = useState(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSearch = () => {
    onNavigate('Browse Cars');
  };

  const handlePrimaryAction = () => {
    document.getElementById('search-panel')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSecondaryAction = () => {
    onNavigate('Post an Ad');
  };

  const handleServiceAction = (service) => {
    if (service.title === 'Car Inspection') {
      document.getElementById('search-panel')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    onNavigate('Post an Ad');
  };

  const handleBrowseAllCars = () => {
    onNavigate('Browse Cars');
  };

  const handleFeaturedCarAction = (car) => {
    onNavigate('Car Details', car);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(14,22,39,0)_72%,#090e18_72%),radial-gradient(circle_at_top,#2a3350_0%,#182133_38%,#0b1220_100%)] text-white">
      
      <section className="mx-auto w-full max-w-[1500px] px-4 pb-30 pt-6 sm:px-6 lg:px-8">
        <Header activeNav={currentPage} onNavChange={onNavigate} />

        <HeroContent
          onBrowseClick={handlePrimaryAction}
          onPostAdClick={handleSecondaryAction}
        />
      </section>

      <SearchPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced((current) => !current)}
      />

      {/* What We Offer Section */}
      <WhatWeOffer onAction={handleServiceAction} />
      <SellYourCarSection
        onGenericSale={() => onNavigate('Generic Sale')}
        onManagedSale={() => onNavigate('Managed Sale')}
      />
      <FeaturedCars
        onBrowseAll={handleBrowseAllCars}
        onViewDetails={handleFeaturedCarAction}
      />
      <Footer onNavigate={onNavigate} />

    </main>
  );
}

export default HomePage;
