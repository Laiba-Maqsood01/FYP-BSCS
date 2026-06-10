import { CarIcon, ShieldIcon, UsersIcon } from './Icons.jsx';

const trustItems = [
  {
    title: 'Verified Listings',
    description: 'Every car is screened before it appears on the marketplace.',
    icon: ShieldIcon,
  },
  {
    title: 'Inspection Support',
    description: 'Buyers can request professional inspection before closing the deal.',
    icon: CarIcon,
  },
  {
    title: 'Trusted Community',
    description: 'Connect with serious buyers and sellers across major cities.',
    icon: UsersIcon,
  },
];

function TrustSection() {
  return (
    <section className="mx-auto w-full max-w-[1480px] px-4 pb-14 pt-10 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
        {trustItems.map(({ title, description, icon: Icon }) => (
          <article
            key={title}
            className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff7a18]/12 text-[#ff7a18]">
              <Icon />
            </div>
            <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-[#91a1bf]">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TrustSection;
