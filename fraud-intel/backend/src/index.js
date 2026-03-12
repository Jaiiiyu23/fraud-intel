require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");

// Routes
const authRoutes = require("./routes/auth");
const reportsRoutes = require("./routes/reports");
const classifyRoutes = require("./routes/classify");
const patternsRoutes = require("./routes/patterns");
const statsRoutes = require("./routes/stats");
const adminRoutes = require("./routes/admin");

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "*").split(","),
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));

// Global rate limiter
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
}));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Health check (no auth)
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/classify", classifyRoutes);
app.use("/api/v1/patterns", patternsRoutes);
app.use("/api/v1/stats", statsRoutes);
app.use("/api/v1/admin", adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.message });
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Fraud Intel API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
