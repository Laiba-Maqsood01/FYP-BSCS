// src/components/WhatWeOffer.jsx

import {
  ShieldCheck,
  User,
  Crown,
  Flame,
  ArrowRight,
} from "lucide-react";

const services = [
  {
    id: 1,
    title: "Car Inspection",
    description:
      "Our certified technicians inspect every car on 200+ points. Get a detailed computerized report before you buy.",
    icon: ShieldCheck,
    image: "/assets/inspection.jpg",
  },
  {
    id: 2,
    title: "Generic Sale",
    description:
      "List your car yourself. Create your ad, set your price, and connect directly with buyers. Simple and free.",
    icon: User,
    image: "/assets/genaric%20sales.jpg",
  },
  {
    id: 3,
    title: "Managed Sale",
    description:
      "We handle everything for you. From photography to negotiations and paperwork. Sit back and get the best price.",
    icon: Crown,
    image: "/assets/managed%20sales.jpg",
  },
  {
    id: 4,
    title: "Boost Visibility",
    description:
      "Get your listing seen by more buyers. Feature your car for 7, 15, or 30 days and sell faster at the best price.",
    icon: Flame,
    image: "/assets/Boost%20Visibility.jpg",
  },
];

export default function WhatWeOffer({ onAction }) {
  return (
    <section className="bg-[#020817] text-white py-20 px-6 md:px-10">
      <div className="mx-auto w-full max-w-[1700px]">
        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What We Offer
          </h2>

          <p className="text-gray-400 text-lg">
            Everything you need to buy or sell a used car with confidence
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;
            const delayClass = `animate-fade-in-up-delay-${service.id}`;

            return (
              <div
                key={service.id}
                className={`${delayClass} group relative overflow-hidden rounded-3xl border border-gray-800 bg-[#0B1220] hover:border-orange-500/40 transition duration-300`}
              >
                {/* Background Image */}
                <div className="relative h-[410px]">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#071120]/80 to-[#071120]" />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col justify-end h-full p-6">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-full border border-orange-500/30 flex items-center justify-center mb-5">
                      <Icon className="text-orange-500 w-5 h-5" />
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 text-3xl font-semibold">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="mb-5 text-[16px] leading-7 text-gray-300">
                      {service.description}
                    </p>

                    {/* Button */}
                     <button
                       className="flex items-center gap-2 text-orange-500 font-semibold group-hover:gap-3 transition-all"
                       onClick={() => onAction?.(service)}
                       type="button"
                     >
                       Learn More
                       <ArrowRight size={18} />
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
