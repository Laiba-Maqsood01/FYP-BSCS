// src/components/FeaturedCars.jsx

import { Flame, MapPin, ArrowRight, ShieldCheck } from "lucide-react";
import { featuredCars } from '../data/cars.js';

export default function FeaturedCars({ onBrowseAll, onViewDetails }) {
  return (
    <section className="bg-[#020817] px-6 md:px-10 py-20 text-white">
      <div className="mx-auto w-full max-w-[1700px]">
        
        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Featured Used Cars
            </h2>

            <p className="text-gray-400 text-lg">
              Hand-picked verified vehicles from trusted sellers
            </p>
          </div>

          <button
            className="flex items-center gap-2 text-orange-500 text-lg font-semibold hover:gap-3 transition-all"
            onClick={onBrowseAll}
            type="button"
          >
            View All
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredCars.map((car, index) => (
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

                {/* Featured Badge */}
                <div className="absolute left-4 top-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold">
                    <Flame size={15} />
                    Featured
                  </div>
                  {car.inspected ? (
                    <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold">
                      <ShieldCheck size={15} />
                      Inspected
                    </div>
                  ) : null}
                </div>

                {/* Location */}
                <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-md px-4 py-2 text-sm font-medium">
                  <MapPin size={15} />
                  {car.city}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6">
                
                {/* Title */}
                <h3 className="text-2xl font-bold mb-3 transition duration-300 group-hover:text-orange-500">
                  {car.name}
                </h3>

                {/* Details */}
                <div className="flex flex-wrap gap-4 text-gray-400 text-[13px] mb-5">
                  <span>{car.year}</span>
                  <span>{car.km}</span>
                  <span>{car.fuel}</span>
                  <span>{car.transmission}</span>
                </div>

                {/* Bottom */}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  
                  <h4 className="text-3xl font-bold text-orange-500">
                    {car.price}
                  </h4>

                  <button
                    className="flex items-center gap-2 rounded-full border border-white/70 px-5 py-2 text-sm font-medium text-orange-500 transition hover:border-orange-500 hover:bg-orange-500 hover:text-white"
                    onClick={() => onViewDetails?.(car)}
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

      </div>
    </section>
  );
}
