import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import authRoute from "./routes/AuthRoute.js";
import adminRoutes from "./routes/admin.js";
import portalRoutes from "./routes/portal.js";
import alumniRoute from "./routes/alumni.js";

dotenv.config();

export function createServer() {
  const app = express();

  // Middlewares
  app.use(express.json());
  app.use(cookieParser());

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
      .then(() => console.log("MongoDB connected"))
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
      jwtSecretPresent: Boolean(process.env.JWT_SECRET),
      clientOrigin: process.env.CLIENT_ORIGIN ?? null,
      portDefault: process.env.PORT ?? 8080,
    });
  });

  // Routes
  app.use("/api/auth", authRoute);

  // Protected portal and admin routes
  app.use("/api/portal", portalRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/alumni", alumniRoute);

  // Serve index.html for root and client-side routing fallback
  app.get('/', (req, res) => {
    const indexPaths = [
      path.resolve(process.cwd(), 'dist', 'index.html'),
      path.resolve(process.cwd(), 'client', 'dist', 'index.html'),
      path.resolve(process.cwd(), 'client', 'index.html'),
      path.resolve(process.cwd(), 'index.html')
    ];

    for (const p of indexPaths) {
      try {
        if (require('fs').existsSync(p)) {
          return res.sendFile(p);
        }
      } catch (e) {
        // ignore
      }
    }

    // If no index.html found, fallback to a simple JSON message
    res.send('<!doctype html><html><head><meta charset="utf-8"/><title>App</title></head><body><pre>API is running. Visit /api/health for diagnostics.</pre></body></html>');
  });

  return app;
}


// Standalone mode (only when executed directly or when running the built bundle)
if (process.argv[1] && (process.argv[1].includes("server/index.js") || process.argv[1].includes("server/dist/server.js") || process.argv[1].includes("server/dist/server.js"))) {
  const PORT = process.env.PORT || 8080;
  const app = createServer();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

}
