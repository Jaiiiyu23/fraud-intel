const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");
const { runIngestion } = require("../jobs/ingestion");
const { generateReportCode } = require("../utils/helpers");

const prisma = new PrismaClient();

router.post("/ingest/run", requireAuth, async (req, res) => {
  res.json({ message: "Ingestion started", status: "running" });
  runIngestion().catch(console.error);
});

router.post("/seed", requireAuth, async (req, res) => {
  const realCases = [
    { rawText: "Mumbai victim received WhatsApp from SBI official demanding KYC update. Shared OTP, ₹1,45,000 debited. Fraudster number +91-9867543210", fraudType: "IMPERSONATION_KYC", severity: "HIGH", confidence: 0.95, location: "Mumbai", redFlags: ["OTP sharing","Bank impersonation","WhatsApp"], suspiciousNumbers: ["+91-9867543210"], suspiciousUrls: [], suggestedAction: "INVESTIGATE_IMMEDIATELY", summary: "SBI KYC fraud via WhatsApp. ₹1.45L lost.", sourceType: "MANUAL_REPORT" },
    { rawText: "Bengaluru software engineer lost ₹8.2 lakhs to WhatsApp group with fake SEBI certified stock advisors promising high returns.", fraudType: "INVESTMENT_STOCK_SCAM", severity: "HIGH", confidence: 0.97, location: "Bengaluru", redFlags: ["High return promises","Fake SEBI","WhatsApp group"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "INVESTIGATE_IMMEDIATELY", summary: "Fake stock advisory WhatsApp group. ₹8.2L lost.", sourceType: "MANUAL_REPORT" },
    { rawText: "Delhi cyber police arrested 3 running fake TCS/Infosys job recruitment charging ₹15,000-₹50,000 registration fees. 200+ victims pan-India.", fraudType: "JOB_RECRUITMENT_FRAUD", severity: "CRITICAL", confidence: 0.98, location: "Delhi", redFlags: ["Fake company","Upfront fee","LinkedIn"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "ESCALATE_TO_NODAL", summary: "Fake TCS/Infosys recruitment. 200+ victims.", sourceType: "CYBERCRIME_PORTAL", sourceUrl: "https://cybercrime.gov.in" },
    { rawText: "Jaipur victim received call from fake CBI officer claiming Aadhaar used in money laundering. Transferred ₹3,20,000 to safe account to avoid arrest.", fraudType: "IMPERSONATION_KYC", severity: "CRITICAL", confidence: 0.96, location: "Rajasthan", redFlags: ["CBI impersonation","Digital arrest","Aadhaar misuse"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "ESCALATE_TO_NODAL", summary: "Digital arrest CBI scam. ₹3.2L lost.", sourceType: "MANUAL_REPORT" },
    { rawText: "Hyderabad OLX scam. Victim selling phone, scammer sent QR code claiming payment. Victim scanned and ₹25,000 debited instead.", fraudType: "UPI_PAYMENT_FRAUD", severity: "MEDIUM", confidence: 0.95, location: "Hyderabad", redFlags: ["QR reversal","OLX scam"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "MONITOR", summary: "OLX QR code UPI reversal fraud. ₹25K lost.", sourceType: "MANUAL_REPORT" },
    { rawText: "Chennai student sextortion via WhatsApp video call. Intimate content recorded, demanded ₹50,000. Victim paid ₹18,000 before reporting.", fraudType: "CYBER_BLACKMAIL", severity: "HIGH", confidence: 0.97, location: "Tamil Nadu", redFlags: ["Video blackmail","WhatsApp"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "INVESTIGATE_IMMEDIATELY", summary: "Sextortion WhatsApp video call. ₹18K paid.", sourceType: "MANUAL_REPORT" },
    { rawText: "Ahmedabad gang busted for KBC lottery SMS scam collecting ₹45 lakh from 300+ victims asking ₹5,000-15,000 GST and processing fees.", fraudType: "LOTTERY_PRIZE_FRAUD", severity: "CRITICAL", confidence: 0.99, location: "Gujarat", redFlags: ["KBC lottery","Advance fee","SMS"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "ESCALATE_TO_NODAL", summary: "KBC lottery gang busted. 300+ victims, ₹45L.", sourceType: "CYBERCRIME_PORTAL", sourceUrl: "https://cybercrime.gov.in" },
    { rawText: "Lucknow retired teacher lost ₹6.8 lakh to fake loan app. App accessed contacts and threatened morphed photos after multiple processing fees.", fraudType: "LOAN_FRAUD", severity: "HIGH", confidence: 0.96, location: "Uttar Pradesh", redFlags: ["Fake loan app","Photo threat","Contact access"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "INVESTIGATE_IMMEDIATELY", summary: "Fake loan app. ₹6.8L lost.", sourceType: "MANUAL_REPORT" },
    { rawText: "CERT-In: Phishing websites mimicking Income Tax, EPFO, Passport Seva portals detected. Harvesting Aadhaar, PAN, bank details.", fraudType: "IMPERSONATION_KYC", severity: "HIGH", confidence: 0.93, location: null, redFlags: ["Govt website phishing","Aadhaar/PAN harvest"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "INVESTIGATE_IMMEDIATELY", summary: "CERT-In: Phishing sites mimicking Govt portals.", sourceType: "CYBERCRIME_PORTAL", sourceUrl: "https://cert-in.org.in" },
    { rawText: "West Bengal FedEx customs officer impersonation. Victim told drugs found in package, pay ₹92,000 to avoid arrest. Money transferred via NEFT.", fraudType: "IMPERSONATION_KYC", severity: "HIGH", confidence: 0.94, location: "West Bengal", redFlags: ["Courier scam","Arrest threat"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "INVESTIGATE_IMMEDIATELY", summary: "FedEx customs impersonation. ₹92K lost.", sourceType: "MANUAL_REPORT" },
    { rawText: "Pune techie lost ₹14 lakh on fake crypto platform introduced via Telegram by fake NRI investor. Withdrawal blocked after tax payment demanded.", fraudType: "INVESTMENT_STOCK_SCAM", severity: "CRITICAL", confidence: 0.97, location: "Maharashtra", redFlags: ["Fake crypto","Telegram","Withdrawal tax"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "ESCALATE_TO_NODAL", summary: "Fake crypto platform. ₹14L lost.", sourceType: "MANUAL_REPORT" },
    { rawText: "Karnataka WFH task scam targeting students. Paid ₹500 for liking videos initially then asked ₹5,000-₹50,000 to unlock higher paying tasks.", fraudType: "JOB_RECRUITMENT_FRAUD", severity: "MEDIUM", confidence: 0.95, location: "Karnataka", redFlags: ["WFH task scam","Small initial payments"], suspiciousNumbers: [], suspiciousUrls: [], suggestedAction: "MONITOR", summary: "YouTube task WFH scam targeting students.", sourceType: "CYBERCRIME_PORTAL", sourceUrl: "https://cybercrime.gov.in" },
  ];

  try {
    let saved = 0;
    for (const c of realCases) {
      const exists = await prisma.fraudReport.findFirst({ where: { summary: c.summary } });
      if (exists) continue;
      await prisma.fraudReport.create({ data: { reportCode: generateReportCode(), sourceUrl: c.sourceUrl || null, ...c } });
      saved++;
    }
    res.json({ message: `Seeded ${saved} real Indian cybercrime cases`, saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const [reports, logs] = await Promise.all([
      prisma.fraudReport.count(),
      prisma.ingestionLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);
    res.json({ reports, recentIngestions: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
