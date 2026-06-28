import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Car, Users, ShieldCheck, Star } from "lucide-react";

const stats = [
  { icon: <Car size={24} />, value: 5000, label: "Cars Listed", suffix: "+" },
  { icon: <Users size={24} />, value: 12000, label: "Happy Users", suffix: "+" },
  { icon: <ShieldCheck size={24} />, value: 3200, label: "Inspections Done", suffix: "+" },
  { icon: <Star size={24} />, value: 98, label: "Satisfaction Rate", suffix: "%" },
];

const glassCard = {
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(15,23,42,0.06)",
  boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
};

function StatCard({ icon, value, label, suffix }) {
  const ref = useRef();
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1200;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      className="text-center p-8 rounded-2xl"
      style={glassCard}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <div
        className="w-12.5 h-12.5 mx-auto flex items-center justify-center rounded-full mb-4 text-brand-dark transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
        }}
      >
        {icon}
      </div>
      <h3 className="text-[1.8rem] font-bold text-brand-dark">
        {count}{suffix}
      </h3>
      <p className="text-[0.9rem] text-brand-muted">{label}</p>
    </motion.div>
  );
}

export default function StatsCTASection() {
  return (
    <section className="bg-transparent py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>

        {/* CTA box */}
        <div className="text-center rounded-2xl p-12 mt-6" style={glassCard}>
          <h2
            className="font-[650] text-brand-dark mb-3"
            style={{ fontSize: "clamp(1.8rem, 2.5vw, 2.5rem)" }}
          >
            Ready to Buy or Sell?
          </h2>
          <p className="text-brand-muted max-w-160 mx-auto mb-6">
            Join thousands of Pakistanis who trust our platform for safe, transparent and
            hassle-free car deals.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              to="/browse-cars"
              className="bg-brand-btn text-white font-semibold px-7 py-3 rounded text-base hover:bg-brand-dark2 transition"
              style={{ borderRadius: "0.375rem" }}
            >
              Browse Cars
            </Link>
            <Link
              to="/post-ad"
              className="border-[1.5px] border-brand-btn text-brand-btn font-semibold px-7 py-3 rounded text-base hover:bg-brand-btn/5 transition"
              style={{ borderRadius: "0.375rem" }}
            >
              Post an Ad
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
