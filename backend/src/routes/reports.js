const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { classifyFraudReport } = require("../services/classifier");
const { generateReportCode } = require("../utils/helpers");
const { detectNetworks } = require("../services/networkDetector");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/reports
// Query params: type, severity, state, city, from, to, page, limit
router.get("/", requireAuth, async (req, res) => {
  try {
    const { type, severity, state, city, from, to, page = 1, limit = 20, search } = req.query;

    const where = {};
    if (type) where.fraudType = type;
    if (severity) where.severity = severity;
    if (state) where.state = { contains: state, mode: "insensitive" };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { rawText: { contains: search, mode: "insensitive" } },
        { modusOperandi: { contains: search, mode: "insensitive" } },
        { reportCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.fraudReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        select: {
          id: true, reportCode: true, fraudType: true, severity: true,
          confidence: true, modusOperandi: true, estimatedLossInr: true,
          state: true, city: true, sourceType: true, networkId: true,
          redFlags: true, suggestedAction: true, createdAt: true,
        },
      }),
      prisma.fraudReport.count({ where }),
    ]);

    res.json({
      data: reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// GET /api/v1/reports/:id
router.get("/:id", requireAuth, async (req, res) => {
  const report = await prisma.fraudReport.findFirst({
    where: { OR: [{ id: req.params.id }, { reportCode: req.params.id }] },
    include: { network: true },
  });
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json(report);
});

// POST /api/v1/reports
// Submit a new fraud report (auto-classified by AI)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { rawText, sourceType = "API_SUBMISSION", sourceUrl } = req.body;
    if (!rawText || rawText.trim().length < 10) {
      return res.status(400).json({ error: "rawText must be at least 10 characters" });
    }

    // AI classify
    const classification = await classifyFraudReport(rawText);
    const reportCode = generateReportCode();

    const report = await prisma.fraudReport.create({
      data: {
        reportCode,
        rawText,
        sourceType,
        sourceUrl,
        ...classification,
      },
    });

    // Async: check if this links to an existing network
    detectNetworks(report).catch(console.error);

    res.status(201).json({
      reportCode: report.reportCode,
      id: report.id,
      classification: {
        fraudType: report.fraudType,
        severity: report.severity,
        confidence: report.confidence,
        modusOperandi: report.modusOperandi,
        estimatedLossInr: report.estimatedLossInr,
        suggestedAction: report.suggestedAction,
        redFlags: report.redFlags,
        state: report.state,
        city: report.city,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to submit report" });
  }
});

// GET /api/v1/reports/stats/summary
router.get("/stats/summary", requireAuth, async (req, res) => {
  try {
    const [total, byType, bySeverity, byState] = await Promise.all([
      prisma.fraudReport.count(),
      prisma.fraudReport.groupBy({ by: ["fraudType"], _count: true, orderBy: { _count: { fraudType: "desc" } } }),
      prisma.fraudReport.groupBy({ by: ["severity"], _count: true }),
      prisma.fraudReport.groupBy({ by: ["state"], _count: true, where: { state: { not: null } }, orderBy: { _count: { state: "desc" } }, take: 10 }),
    ]);

    res.json({ total, byType, bySeverity, byState });
  } catch (err) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

module.exports = router;
