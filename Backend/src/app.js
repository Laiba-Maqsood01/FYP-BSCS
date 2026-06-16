import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

import listingRouter from "./modules/listing/listing.routes.js";
import inspectionRouter from "./modules/inspection/inspection.routes.js"

import featuredRouter from "./modules/featured/featured.routes.js";

import paymentRouter from "./modules/payment/payment.routes.js";

import masterRouter from "./modules/master/master.routes.js";

import favoriteRoutes from "./modules/favorite/favorite.routes.js";

import adminRouter from "./modules/admin/admin.routes.js";

import { startExpiryJobs  } from "./jobs/featured.expiry.job.js";

import managedSaleRouter from "./modules/managed-sale/managed-sale.routes.js";

import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

const app = express()


// Rate limiter FIRST (global protection)
app.use(apiLimiter);

//for now just use 
app.use(cors());

// app.use(cors({
//   origin: "http://localhost:5173", // useful when frontend is integrated
//   credentials: true
// }));


// Helmet for securing extra information, like hackers can check our tool(express) then can find the vulnerability and attack our website.
//It's Standard security headers
app.use(helmet());

// Start cron jobs to auto handle featured expiry every midnight, and commission expiry after every 5mins
startExpiryJobs();

// for stripe webhook  /api/payment
app.use(
  "/api/payment",
  express.raw({ type: "application/json" }),
  paymentRouter
);


// express middleware
app.use(express.json());

// morgan middleware for logging
app.use(morgan("dev"));

// use cookieParsera
app.use(cookieParser());

// All routes starting with /api/master 
app.use("/api/master", masterRouter);

// All routes starting with /api/auth
app.use("/api/auth", authRouter)

// All routes starting with /api/listings
app.use("/api/listings", listingRouter);

// All inspection related routes starts with /api/inspection
app.use("/api/inspection", inspectionRouter)

// Featured request handling, starts with /api/featured
app.use("/api/featured", featuredRouter);

// Favorite request handling, starts with /api/favorite
app.use("/api/favorite", favoriteRoutes)

// Admin routes, starts with /api/admin
app.use("/api/admin", adminRouter);

// Managed Sale routes, start with /api/managed-sale
app.use("/api/managed-sale", managedSaleRouter);

// use global error handler
app.use(errorHandler);

export default app