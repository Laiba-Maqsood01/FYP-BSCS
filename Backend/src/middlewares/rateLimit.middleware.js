import rateLimit from "express-rate-limit";

// It's General API limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15m 
    max: 100,
    message: {
        message: "Too many requests, please try again later."
    }
});

// It's specially for auth
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,         // very strict for login/register/otp
    message:{
        message: "Too many requests, please try again later."
    }
})

