import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "5,000+", label: "Cars Listed" },
  { value: "2,500+", label: "Inspections Done" },
  { value: "10,000+", label: "Happy Customers" },
  { value: "50+", label: "Cities Covered" },
];

function Stats() {
  const sectionRef = useRef();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={`stats-section ${show ? "show" : ""}`}>
      <div className="stats-row">
        {stats.map((item) => (
          <article key={item.label} className="stats-item">
            <h2>{item.value}</h2>
            <p>{item.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Stats;
