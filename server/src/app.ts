import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import projectRoutes from "./routes/projects.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:5174",
  credentials: true,
}));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const forwarded = req.headers["x-forwarded-proto"];
    if (forwarded !== "https" && req.path !== "/health") {
      return res.redirect(`https://${req.headers.host}${req.originalUrl}`);
    }
    return next();
  });
}

app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use(errorHandler);

export default app;
