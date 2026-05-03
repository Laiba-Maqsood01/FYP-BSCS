import { LuBadgeCheck, LuFileCheck2, LuUsersRound } from "react-icons/lu";

const features = [
  {
    title: "Verified Inspections",
    description:
      "Every car comes with detailed inspection reports from certified inspectors.",
    icon: LuBadgeCheck,
  },
  {
    title: "Transparent Reports",
    description:
      "Access PDF reports, photos, and videos of every inspection.",
    icon: LuFileCheck2,
  },
  {
    title: "Trusted Community",
    description:
      "Join thousands of buyers and sellers in Rahim Yar Khan and beyond.",
    icon: LuUsersRound,
  },
];

function Why() {
  return (
    <section className="why-section">
      <div className="why-header">
        <h2>
          Why Choose <span>AutoHub</span>?
        </h2>
        <p>
          We&apos;re not just a marketplace, we&apos;re your trusted partner in
          finding the perfect car.
        </p>
      </div>

      <div className="why-cards">
        {features.map(({ title, description, icon: Icon }) => (
          <article key={title} className="why-card">
            <div className="icon-box">
              <Icon />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Why;
