import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/AuthRoute.js";
import adminRoutes from "./routes/admin.js";
import portalRoutes from "./routes/portal.js";

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

  // Routes
  app.use("/api/auth", authRoute);

  // Protected portal and admin routes
  app.use("/api/portal", portalRoutes);
  app.use("/api/admin", adminRoutes);

  return app;
}

// Standalone mode (only when executed directly)
if (process.argv[1] && process.argv[1].includes("server/index.js")) {
  const PORT = process.env.PORT || 5000;
  const app = createServer();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
