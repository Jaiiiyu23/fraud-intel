const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/patterns/networks
router.get("/networks", requireAuth, async (req, res) => {
  try {
    const networks = await prisma.scamNetwork.findMany({
      include: { _count: { select: { reports: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ networks });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch networks" });
  }
});

// GET /api/v1/patterns/networks/:id
router.get("/networks/:id", requireAuth, async (req, res) => {
  try {
    const network = await prisma.scamNetwork.findUnique({
      where: { id: req.params.id },
      include: { reports: { take: 20, orderBy: { createdAt: "desc" } } },
    });
    if (!network) return res.status(404).json({ error: "Network not found" });
    res.json(network);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch network" });
  }
});

// GET /api/v1/patterns/surge-alerts
router.get("/surge-alerts", requireAuth, async (req, res) => {
  res.json({ alerts: [] });
});

// GET /api/v1/patterns/trends
router.get("/trends", requireAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const reports = await prisma.fraudReport.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, fraudType: true, severity: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({ trends: reports });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

module.exports = router;
