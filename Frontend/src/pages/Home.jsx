import Stats from "../components/Stats";
import Why from "../components/Why";
import Featured from "../components/Featured";
import Testimonials from "../components/Testimonials";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import CtaSection from "../components/CtaSection";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Why />
      <Featured />
      <Testimonials />
      <CtaSection />
    </>
  );
}
export default Home;
