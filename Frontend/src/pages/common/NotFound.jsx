import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  // Load lottie-player web component script once
  useEffect(() => {
    if (!document.querySelector('script[src*="lottie-player"]')) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center  px-4 py-12">
      <div className="w-full max-w-5xl flex flex-col-reverse md:flex-row items-center gap-8">

        {/* Left — text */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-8xl font-extrabold text-gray-500 mb-4">Error 404</h1>
          <p className="text-base mb-8 text-gray-500 " >
            The page you are looking for was moved, removed or might never existed.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 text-base font-medium text-white rounded-md transition hover:opacity-90"
            style={{ background: "#5a6474", borderRadius: "0.375rem" }}
          >
            Back to homepage
          </button>
        </div>

        {/* Right — Lottie animation */}
        <div className="flex-1 flex justify-center">
          <lottie-player
            src="https://assets9.lottiefiles.com/packages/lf20_kcsr6fcp.json"
            background="transparent"
            speed="1"
            loop
            autoplay
            style={{ width: "100%", maxWidth: "480px", height: "auto" }}
          />
        </div>

      </div>
    </div>
  );
}
