const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");
const { generateReportCode } = require("../utils/helpers");

const prisma = new PrismaClient();

// Rule-based classifier (no AI credits needed)
function ruleBasedClassify(text) {
  const t = text.toLowerCase();
  let fraudType = "OTHER_FRAUD";
  let severity = "MEDIUM";
  let confidence = 0.72;
  const redFlags = [];
  const suspiciousNumbers = [];

  if (t.match(/upi|gpay|phonepe|paytm|bhim|payment|transaction/)) fraudType = "UPI_PAYMENT_FRAUD";
  else if (t.match(/kyc|aadhar|pan|bank account|otp|verify.*account/)) fraudType = "IMPERSONATION_KYC";
  else if (t.match(/investment|stock|trading|sebi|mutual fund|return|profit/)) fraudType = "INVESTMENT_STOCK_SCAM";
  else if (t.match(/job|recruitment|offer letter|salary|work from home/)) fraudType = "JOB_RECRUITMENT_FRAUD";
  else if (t.match(/sextortion|blackmail|video|nude|intimate/)) fraudType = "CYBER_BLACKMAIL";
  else if (t.match(/lottery|prize|winner|kbc|claim.*reward/)) fraudType = "LOTTERY_PRIZE_FRAUD";

  const amountMatch = t.match(/(?:rs|₹|inr)\.?\s*([0-9,]+)/);
  if (amountMatch) {
    const amount = parseInt(amountMatch[1].replace(/,/g, ""));
    if (amount >= 1000000) severity = "CRITICAL";
    else if (amount >= 100000) severity = "HIGH";
    else if (amount >= 10000) severity = "MEDIUM";
    else severity = "LOW";
  }

  let location = null;
  const states = ["maharashtra","mumbai","delhi","bangalore","bengaluru","hyderabad","chennai","kolkata","rajasthan","gujarat","ahmedabad","pune","lucknow","uttar pradesh","karnataka","tamil nadu","kerala","bihar","haryana","west bengal","goa","assam","punjab"];
  for (const s of states) { if (t.includes(s)) { location = s.charAt(0).toUpperCase() + s.slice(1); break; } }

  if (t.match(/whatsapp|telegram/)) redFlags.push("Contact via messaging app");
  if (t.match(/otp/)) redFlags.push("OTP requested");
  if (t.match(/urgent|immediately/)) redFlags.push("Urgency pressure tactic");
  if (t.match(/link|click/)) redFlags.push("Suspicious link shared");

  const phones = text.match(/(?:\+91|0)?[6-9]\d{9}/g);
  if (phones) suspiciousNumbers.push(...phones.slice(0, 3));

  return { fraudType, severity, confidence, location, redFlags, suspiciousNumbers, suspiciousUrls: [], suggestedAction: severity === "CRITICAL" ? "ESCALATE_TO_NODAL" : severity === "HIGH" ? "INVESTIGATE_IMMEDIATELY" : "MONITOR", summary: text.substring(0, 200) };
}

// GET all reports (no org filter — platform-wide)
router.get("/", requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const reports = await prisma.fraudReport.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new report — classify with AI or rule-based fallback
router.post("/", requireAuth, async (req, res) => {
  try {
    const { rawText, sourceType = "MANUAL_SUBMISSION" } = req.body;
    if (!rawText || rawText.trim().length < 10) {
      return res.status(400).json({ error: "Report text too short" });
    }

    let classification = ruleBasedClassify(rawText);

    // Try AI classification if credits available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = require("@anthropic-ai/sdk");
        const client = new Anthropic();
        const response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          messages: [{ role: "user", content: `Classify this Indian cybercrime report as JSON only (no markdown). Fields: fraudType (UPI_PAYMENT_FRAUD|INVESTMENT_STOCK_SCAM|JOB_RECRUITMENT_FRAUD|IMPERSONATION_KYC|CYBER_BLACKMAIL|LOTTERY_PRIZE_FRAUD|OTHER_FRAUD), severity (LOW|MEDIUM|HIGH|CRITICAL), confidence (0-1 float), location (Indian city/state string or null), redFlags (string array max 3), suspiciousNumbers (string array), suggestedAction (string), summary (string max 150 chars). Text: "${rawText.substring(0, 500)}"` }],
        });
        const raw = response.content[0].text.replace(/```json|```/g, "").trim();
        classification = { ...classification, ...JSON.parse(raw) };
      } catch (e) {
        // Use rule-based fallback silently
      }
    }

    const report = await prisma.fraudReport.create({
      data: {
        reportCode: generateReportCode(),
        rawText,
        sourceType,
        submittedById: req.user?.id || null,
        ...classification,
      },
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single report
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const report = await prisma.fraudReport.findUnique({ where: { id: req.params.id } });
    if (!report) return res.status(404).json({ error: "Not found" });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
