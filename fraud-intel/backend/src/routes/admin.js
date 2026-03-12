const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireJWT, requireAdmin } = require("../middleware/auth");
const { runIngestion } = require("../jobs/ingestion");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/admin/orgs
router.get("/orgs", requireJWT, requireAdmin, async (req, res) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: { _count: { select: { users: true, apiKeys: true } } },
    });
    res.json({ orgs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orgs" });
  }
});

// GET /api/v1/admin/ingestion-logs
router.get("/ingestion-logs", requireJWT, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma.ingestionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// POST /api/v1/admin/ingest
router.post("/ingest", requireJWT, requireAdmin, async (req, res) => {
  try {
    res.json({ message: "Ingestion started" });
    runIngestion().catch(console.error);
  } catch (err) {
    res.status(500).json({ error: "Failed to start ingestion" });
  }
});

// PATCH /api/v1/admin/surge-alerts/:id/resolve
router.patch("/surge-alerts/:id/resolve", requireJWT, requireAdmin, async (req, res) => {
  res.json({ message: "Alert resolved" });
});

module.exports = router;
