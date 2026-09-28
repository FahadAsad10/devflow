import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import teamRoutes from "./routes/teams.js";
import commentRoutes from "./routes/comments.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
const allowedOrigins = new Set(
  (process.env.FRONTEND_URL ?? "http://localhost:5174").split(",").map((origin) => origin.trim()).filter(Boolean),
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
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

app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/comments", commentRoutes);
app.use(errorHandler);

export default app;
