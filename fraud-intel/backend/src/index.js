import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import reportRoutes from "./routes/reports.js";
import statsRoutes from "./routes/stats.js";

import { ingestReddit } from "./jobs/redditIngestion.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "Fraud Intel API",
    status: "running"
  });
});

app.use("/api/reports", reportRoutes);
app.use("/api/stats", statsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {

  console.log(`Server running on port ${PORT}`);

  try {
    await ingestReddit();
  } catch (err) {
    console.error("Initial ingestion failed:", err);
  }

});
