import { LuStar } from "react-icons/lu";

const testimonials = [
  {
    id: 1,
    quote:
      '"Bought my first car through AutoHub. The inspection report gave me complete confidence!"',
    name: "Ahmed Raza",
    city: "Rahim Yar Khan",
    initial: "A",
  },
  {
    id: 2,
    quote:
      '"Sold my Honda Civic in just 3 days. The platform is incredibly easy to use."',
    name: "Fatima Khan",
    city: "Lahore",
    initial: "F",
  },
  {
    id: 3,
    quote:
      '"The video inspection feature is amazing. I could see every detail before visiting."',
    name: "Muhammad Ali",
    city: "Multan",
    initial: "M",
  },
];

function Testimonials() {
  return (
    <section className="testimonial-section">
      <div className="testimonial-header">
        <h2>
          What Our <span>Customers</span> Say
        </h2>
        <p>Join thousands of satisfied buyers and sellers across Pakistan.</p>
      </div>

      <div className="t-cards">
        {testimonials.map((testimonial) => (
          <article key={testimonial.id} className="t-card">
            <div className="stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <LuStar key={index} fill="currentColor" />
              ))}
            </div>

            <p className="testimonial-quote">{testimonial.quote}</p>

            <div className="user">
              <div className="user-avatar">{testimonial.initial}</div>
              <div>
                <h4>{testimonial.name}</h4>
                <span>{testimonial.city}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
