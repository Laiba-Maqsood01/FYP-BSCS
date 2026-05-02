import { LuArrowLeft, LuCircleCheckBig } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { footerPages } from "../data/footerPages";

function FooterInfoPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const page = footerPages[slug];
  const handleBackHome = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />

      <main className="info-page">
        <section className="info-page-hero">
          <button type="button" className="view-btn" onClick={handleBackHome}>
            <LuArrowLeft /> Back
          </button>

          {page ? (
            <>
              <h1>{page.title}</h1>
              <p>{page.intro}</p>
            </>
          ) : (
            <>
              <h1>Page Not Found</h1>
              <p>This footer page is not available yet.</p>
            </>
          )}
        </section>

        {page && (
          <section className="info-page-grid">
            {page.sections.map((section) => (
              <article key={section.heading} className="info-card">
                <div className="info-card-icon">
                  <LuCircleCheckBig />
                </div>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}

export default FooterInfoPage;
