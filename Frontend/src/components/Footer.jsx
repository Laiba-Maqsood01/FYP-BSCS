import { ArrowRight } from 'lucide-react';

const quickLinks = ['Home', 'Browse Cars', 'Post an Ad', 'Car Inspection'];

const socialLinks = [
  { label: 'Instagram', icon: InstagramIcon },
  { label: 'YouTube', icon: YoutubeIcon },
  { label: 'Facebook', icon: FacebookIcon },
];

function Footer({ onNavigate }) {
  return (
    <footer className="bg-[#060b14]">
      <div className="mx-auto grid w-full max-w-[1500px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1.2fr] xl:gap-14 lg:px-8">
        <div>
          <button
            className="inline-flex items-center gap-3"
            onClick={() => onNavigate?.('Home')}
            type="button"
          >
            <span className="relative h-7 w-7 rounded-[10px] bg-[linear-gradient(135deg,#f5f7fb_0%,#ff7a18_100%)] shadow-[0_10px_30px_rgba(255,122,24,0.25)] [transform:skew(-12deg)]">
              <span className="absolute inset-[5px] rounded-[7px] bg-[rgba(11,18,32,0.55)]" />
            </span>
            <span className="text-[1.9rem] font-extrabold tracking-[-0.05em] text-white">
              AutoHub
            </span>
          </button>

          <p className="mt-6 max-w-[340px] text-lg leading-9 text-[#7e90b3]">
            Pakistan&apos;s trusted platform for buying and selling used cars. Every
            listing verified, every transaction secured.
          </p>
        </div>

        <div>
          <h3 className="text-3xl font-bold tracking-[-0.05em] text-white">Quick Links</h3>
          <div className="mt-6 flex flex-col gap-4 text-lg text-[#7e90b3]">
            {quickLinks.map((item) => (
              <button
                key={item}
                className="text-left transition hover:text-white"
                onClick={() => onNavigate?.(item === 'Car Inspection' ? 'Browse Cars' : item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-bold tracking-[-0.05em] text-white">Follow Us</h3>
          <div className="mt-6 flex flex-col gap-4 text-lg text-[#7e90b3]">
            {socialLinks.map(({ label, icon: Icon }) => (
              <a
                key={label}
                className="inline-flex items-center gap-3 transition hover:text-white"
                href="#"
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-bold tracking-[-0.05em] text-white">Stay Updated</h3>
          <p className="mt-6 max-w-[360px] text-lg leading-8 text-[#7e90b3]">
            Get the latest listings and market updates.
          </p>

          <div className="mt-7 flex items-center gap-3">
            <input
              className="min-h-[56px] flex-1 rounded-full border border-white/5 bg-[#293349] px-6 text-base text-white outline-none placeholder:text-[#94a3bf]"
              placeholder="Your email"
              type="email"
            />
            <button
              className="grid h-14 w-14 place-items-center rounded-full bg-[#ff7a18] text-white transition hover:scale-105"
              type="button"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-6 text-sm text-[#7e90b3] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 AutoHub. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a className="transition hover:text-white" href="#">
              Privacy Policy
            </a>
            <a className="transition hover:text-white" href="#">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

function InstagramIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect height="14" rx="4" width="14" x="5" y="5" />
      <circle cx="12" cy="12" r="3.25" />
      <circle cx="16.5" cy="7.5" fill="currentColor" r="0.9" stroke="none" />
    </svg>
  );
}

function YoutubeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M20 8.6a2.5 2.5 0 0 0-1.8-1.8C16.7 6.4 12 6.4 12 6.4s-4.7 0-6.2.4A2.5 2.5 0 0 0 4 8.6 26 26 0 0 0 3.6 12c0 1.1.1 2.3.4 3.4a2.5 2.5 0 0 0 1.8 1.8c1.5.4 6.2.4 6.2.4s4.7 0 6.2-.4a2.5 2.5 0 0 0 1.8-1.8c.3-1.1.4-2.3.4-3.4s-.1-2.3-.4-3.4Z" />
      <path d="m10 9.5 4.5 2.5-4.5 2.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M14 8h2.5V4.8c-.4-.1-1.2-.2-2.3-.2-2.3 0-3.9 1.4-3.9 4V11H8v3.6h2.3V20H14v-5.4h2.8L17.2 11H14V9c0-.7.2-1 1-1Z" />
    </svg>
  );
}
