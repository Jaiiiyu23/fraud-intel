const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/stats/overview
router.get("/overview", requireAuth, async (req, res) => {
  try {
    const [total, byType, bySeverity, recentCount] = await Promise.all([
      prisma.fraudReport.count(),
      prisma.fraudReport.groupBy({ by: ["fraudType"], _count: true }),
      prisma.fraudReport.groupBy({ by: ["severity"], _count: true }),
      prisma.fraudReport.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);
    res.json({ total, byType, bySeverity, recentCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/v1/stats/region/:state
router.get("/region/:state", requireAuth, async (req, res) => {
  try {
    const reports = await prisma.fraudReport.findMany({
      where: { state: { contains: req.params.state, mode: "insensitive" } },
      select: { fraudType: true, severity: true, estimatedLossInr: true, createdAt: true },
    });
    res.json({ state: req.params.state, total: reports.length, reports });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch region stats" });
  }
});

module.exports = router;
