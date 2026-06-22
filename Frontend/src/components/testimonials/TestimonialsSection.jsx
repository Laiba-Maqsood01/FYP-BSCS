import { FaStar } from "react-icons/fa";
import { Container } from "react-bootstrap";
import { motion } from "framer-motion";
import "./TestimonialsSection.css";

const testimonials = [
  {
    text: "This platform completely transformed the way I learn. The structured courses and projects helped me build real confidence.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    name: "Briana Patton",
    role: "Student",
    company: "Google",
    rating: 5,
  },
  {
    text: "Super smooth experience from start to finish. The instructors explain complex topics in a very simple way.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    name: "Bilal Ahmed",
    role: "Developer",
    company: "Microsoft",
    rating: 5,
  },
  {
    text: "One of the best learning platforms I’ve used. Clean UI and high-quality content throughout.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    name: "Saman Malik",
    role: "Designer",
    company: "Adobe",
    rating: 4,
  },
  {
    text: "Very practical and job-oriented courses. Helped me build real portfolio projects.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    name: "Omar Raza",
    role: "Engineer",
    company: "Amazon",
    rating: 5,
  },
  {
    text: "Helped me switch careers into tech. The roadmap made everything easier.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    name: "Zainab Hussain",
    role: "QA Analyst",
    company: "Meta",
    rating: 5,
  },
  {
    text: "Clean UI, great content, and excellent support whenever needed.",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    name: "Aliza Khan",
    role: "Student",
    company: "Netflix",
    rating: 4,
  },
  {
    text: "Boosted my career growth significantly with real-world skills.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    name: "Farhan Siddiqui",
    role: "Marketing Director",
    company: "Spotify",
    rating: 5,
  },
  {
    text: "Amazing experience with a smooth and intuitive interface.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    name: "Sana Sheikh",
    role: "Manager",
    company: "Airbnb",
    rating: 4,
  },
  {
    text: "Highly recommended for serious learners who want real growth.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    name: "Hassan Ali",
    role: "Engineer",
    company: "Tesla",
    rating: 5,
  },
];

const col1 = testimonials.slice(0, 3);
const col2 = testimonials.slice(3, 6);
const col3 = testimonials.slice(6, 9);

function Column({ items, duration = 15 }) {
  return (
    <div className="testimonial-column">
      <motion.div
        animate={{ y: ["0%", "-50%"] }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
        className="testimonial-track"
      >
        {[...items, ...items].map((item, i) => (
          <div key={i} className="testimonial-card">

            <div className="testimonial-rating">
              {[...Array(item.rating)].map((_, i) => (
                <FaStar key={i} />
              ))}
            </div>

            <p className="testimonial-text">"{item.text}"</p>

            <div className="testimonial-user">
              <img src={item.image} alt={item.name} />
              <div>
                <h6>{item.name}</h6>
                <span>{item.role} • {item.company}</span>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="testimonials-section py-5">
      <Container>
        <div className="text-center mb-5">
          <h2 className="section-title">What our users say</h2>
          <p className="section-subtitle">
            Real feedback from learners using our platform.
          </p>
        </div>

        <div className="testimonial-wrapper">
          <Column items={col1} duration={14} />
          <Column items={col2} duration={18} />
          <Column items={col3} duration={16} />
        </div>
      </Container>
    </section>
  );
}