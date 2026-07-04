import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// It's General API limiter.
// Sized for a SPA: one Browse Cars visit fires ~10 requests (master data,
// listings, auth refresh), doubled in dev by React StrictMode — 100/15min
// was exhausted within minutes of normal browsing.
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15m
    max: 1000,
    message: {
        message: "Too many requests, please try again later."
    }
});

// It's specially for auth
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,         // very strict for login/register/otp
    message: {
        message: "Too many requests, please try again later."
    }
})

// Contact-reveal OTP — stop scraping of seller numbers.
// Keyed per authenticated user (falls back to IP) so one account can't
// mass-reveal every listing's number.
export const contactOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) =>
        req.user?._id
            ? String(req.user._id)
            : ipKeyGenerator(req.ip),
    message: {
        message: "Too many contact requests. Please try again later."
    }
})

