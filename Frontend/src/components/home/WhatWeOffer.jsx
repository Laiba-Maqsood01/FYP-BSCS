import { Shield, User, Crown, Flame } from "lucide-react";

const OFFERS = [
  {
    icon: <Shield size={20} />,
    title: "Car Inspection",
    description:
      "Our certified technicians inspect every car on 200+ points. Get a detailed computerized report before you buy.",
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStFDknE2qdj8DNCfdWTn0dbOgf3te4XOhYXlDOo9DgtLKyaZEssJ1jFng&s=10",
  },
  {
    icon: <User size={20} />,
    title: "Generic Sale",
    description:
      "List your car yourself. Create your ad, set your price, and connect directly with buyers. Simple and free.",
    img: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80&auto=format&fit=crop",
  },
  {
    icon: <Crown size={20} />,
    title: "Managed Sale",
    description:
      "We handle everything for you. From photography to negotiations and paperwork. Sit back and get the best price.",
    img: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80&auto=format&fit=crop",
  },
  {
    icon: <Flame size={20} />,
    title: "Boost Visibility",
    description:
      "Get your listing seen by more buyers. Feature your car for 7, 15, or 30 days and sell faster at the best price.",
    img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80&auto=format&fit=crop",
  },
];

export default function WhatWeOffer() {
  return (
    <section className="bg-transparent py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="font-[650] text-brand-dark tracking-tight"
            style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.5rem)", letterSpacing: "-0.02em" }}
          >
            What We Offer
          </h2>
          <p className="text-brand-muted text-base max-w-xl mx-auto mt-2">
            Everything you need to buy or sell a used car with confidence
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {OFFERS.map((item) => (
            <div
              key={item.title}
              className="group relative rounded-2xl overflow-hidden border border-black/6 shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
              style={{ height: "400px" }}
            >
              {/* Background image */}
              <img
                src={item.img}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.5) 50%, rgba(15,23,42,0.88) 100%)",
                }}
              />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="w-9.5 h-9.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center mb-3">
                  {item.icon}
                </div>
                <h3 className="text-white font-bold text-[1.15rem] tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-white/75 text-[0.86rem] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
