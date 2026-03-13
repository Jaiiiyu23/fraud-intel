const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const prisma = new PrismaClient();

router.get("/overview", requireAuth, async (req, res) => {
  try {
    const [totalReports, totalNetworks, recentReports] = await Promise.all([
      prisma.fraudReport.count(),
      prisma.scamNetwork.count(),
      prisma.fraudReport.findMany({
        take: 100,
        select: { location: true, fraudType: true, severity: true },
      }),
    ]);

    // Count unique states
    const stateSet = new Set();
    recentReports.forEach(r => { if (r.location) stateSet.add(r.location); });

    res.json({
      totalReports,
      totalNetworks,
      statesAffected: stateSet.size,
      fraudTypeBreakdown: recentReports.reduce((acc, r) => {
        if (r.fraudType) acc[r.fraudType] = (acc[r.fraudType] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
