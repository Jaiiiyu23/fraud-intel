import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";

import reportRoutes from "./routes/reports.js";
import statsRoutes from "./routes/stats.js";
import detectRoutes from "./routes/detect.js";

import { ingestReddit } from "./jobs/redditIngestion.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/*
Routes
*/
app.use("/api/reports", reportRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/detect", detectRoutes);

const PORT = process.env.PORT || 5000;

/*
Start server
*/
app.listen(PORT, async () => {

  console.log(`Server running on port ${PORT}`);

  try {
    console.log("Running initial Reddit ingestion...");
    await ingestReddit();
  } catch (err) {
    console.error("Initial ingestion failed:", err);
  }

});

/*
Run Reddit ingestion every hour
*/
cron.schedule("0 * * * *", async () => {

  console.log("Running hourly Reddit ingestion...");

  try {
    await ingestReddit();
  } catch (err) {
    console.error("Scheduled ingestion failed:", err);
  }

});
