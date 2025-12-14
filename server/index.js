import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { clerkMiddleware } from "@clerk/express";
import { jobListingsRouter } from "./routes/jobListings.js";
import { jobApplicationsRouter } from "./routes/jobApplications.js";
import { dashboardRouter } from "./routes/dashboard.js";
import adminRoutes from "./routes/admin.js";
import portalRoutes from "./routes/portal.js";
import alumniRoute from "./routes/alumni.js";
import clerkWebhooks from "./routes/clerkWebhooks.js";
import scrapingRoutes from './routes/scraping.js';
import apifyScrapingRoutes from './routes/apifyscraping.js';
import { seedInitialDomain } from "./utils/domainValidator.js";


dotenv.config();

export function createServer() {
  const app = express();

  // Clerk webhook route MUST be before express.json() middleware
  // because it needs raw body for signature verification
  app.use("/api/webhooks/clerk", clerkWebhooks);

  // Middlewares
  app.use(express.json());
  app.use(cookieParser());

  // Clerk middleware - adds auth to all requests
  // Requires CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY env vars
  if (process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY) {
    app.use(clerkMiddleware());
  } else {
    console.warn("Clerk keys not configured. Authentication will not work.");
    console.warn("Set CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY in your .env file.");
  }

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
    }),
  );

  // Serve static assets from the project's dist or client build (if present)
  const staticDirs = [
    path.resolve(process.cwd(), "dist"),
    path.resolve(process.cwd(), "client", "dist"),
    path.resolve(process.cwd(), "client", "build"),
    path.resolve(process.cwd(), "public"),
  ];

  for (const dir of staticDirs) {
    try {
      app.use(express.static(dir));
    } catch (err) {
      /* ignore */
    }
  }

  // Optional MongoDB connection (skipped if MONGO_URI not set)
  const uri = process.env.MONGO_URI;
  if (uri && mongoose.connection.readyState === 0) {
    mongoose
      .connect(uri)
      .then(async () => {
        console.log("MongoDB connected");
        // Seed initial allowed domain if needed
        await seedInitialDomain();
      })
      .catch((err) => console.error("MongoDB connection error:", err));
  }

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "pong" });
  });

  // Detailed health diagnostics
  app.get("/api/health", (_req, res) => {
    const uriPresent = Boolean(process.env.MONGO_URI);
    const mongoState = mongoose.connection.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    res.json({
      mongo: {
        uriPresent,
        readyState: mongoState,
      },
      clerkConfigured: Boolean(process.env.CLERK_SECRET_KEY),
      clientOrigin: process.env.CLIENT_ORIGIN ?? null,
      portDefault: process.env.PORT ?? 8080,
    });
  });

  // Protected portal and admin routes
  app.use("/api/portal", portalRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/alumni", alumniRoute);

  // Scraping routes
  app.use('/api/scrape', scrapingRoutes);
  app.use('/api/apify-scrape', apifyScrapingRoutes);

  // Job listings (Prisma/SQLite)
  app.use('/api/job-listings', jobListingsRouter);

  // Job applications (Prisma/SQLite)
  app.use('/api/job-applications', jobApplicationsRouter);

  // Dashboard stats
  app.use('/api/dashboard', dashboardRouter);



  return app;
}

// Standalone mode
const PORT = process.env.PORT || 8080;
const app = createServer();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
