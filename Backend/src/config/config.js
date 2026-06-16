import dotenv from "dotenv"

dotenv.config()

if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI is not existed in environment variables.");
}

if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not existed in environment variables.");
}

if(!process.env.GOOGLE_APP_PASSWORD){
    throw new Error("GOOGLE_APP_PASSWORD is not existed in environment variables.");
}

// if(!process.env.GOOGLE_CLIENT_ID){
//     throw new Error("GOOGLE_CLIENT_ID is not defined in environment variables.");
// }

// if(!process.env.GOOGLE_CLIENT_SECRET){
//     throw new Error("GOOGLE_CLIENT_SECRET is not defined in environment variables.");
// }

// if(!process.env.GOOGLE_REFRESH_TOKEN){
//     throw new Error("GOOGLE_REFRESH_TOKEN is not defined in environment variables.");
// }



if(!process.env.GOOGLE_USER){
    throw new Error("GOOGLE_USER is not defined in environment variables.");
}

// Stripe related variables
if(!process.env.STRIPE_SECRET_KEY){
    throw new Error("STRIPE_SECRET_KEY is not defined in environment variables.");
}
if(!process.env.STRIPE_WEBHOOK_SECRET){
    throw new Error("STRIPE_WEBHOOK_SECRET is not defined in environment variables.");
}
if(!process.env.CLIENT_URL){
    throw new Error("CLIENT_URL is not defined in environment variables.");
}

if(!process.env.EMAIL_ADMIN){
    throw new Error("EMAIL_ADMIN is not defined in environment variables.");
}

if(!process.env.ADMIN_PASSWORD){
    throw new Error("ADMIN_PASSWORD is not defined in environment variables.");
}

if(!process.env.PORT){
    throw new Error("PORT is not defined in environment variables.");
}


if(!process.env.FRONTEND_URL){
    throw new Error("PORT is not defined in environment variables.");
}



const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    // GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    // GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    // GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER: process.env.GOOGLE_USER,
    GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    CLIENT_URL: process.env.CLIENT_URL,

    EMAIL_ADMIN: process.env.EMAIL_ADMIN,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,

    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL
}

export default config