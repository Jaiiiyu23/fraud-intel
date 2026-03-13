const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

function ruleBasedClassify(text) {
  const t = text.toLowerCase();
  let fraudType = "OTHER_FRAUD";
  let severity = "MEDIUM";
  let confidence = 0.72;
  const redFlags = [];

  if (t.match(/upi|gpay|phonepe|paytm|bhim|payment|transaction/)) fraudType = "UPI_PAYMENT_FRAUD";
  else if (t.match(/kyc|aadhar|pan|bank account|otp/)) fraudType = "IMPERSONATION_KYC";
  else if (t.match(/investment|stock|trading|sebi|mutual fund|return|profit/)) fraudType = "INVESTMENT_STOCK_SCAM";
  else if (t.match(/job|recruitment|offer letter|work from home/)) fraudType = "JOB_RECRUITMENT_FRAUD";
  else if (t.match(/sextortion|blackmail|video|nude/)) fraudType = "CYBER_BLACKMAIL";
  else if (t.match(/lottery|prize|winner|kbc/)) fraudType = "LOTTERY_PRIZE_FRAUD";

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
  if (t.match(/processing fee|registration fee/)) redFlags.push("Upfront fee demanded");

  const phones = text.match(/(?:\+91|0)?[6-9]\d{9}/g) || [];

  return { fraudType, severity, confidence, location, redFlags, suspiciousNumbers: phones.slice(0, 3), suggestedAction: severity === "CRITICAL" ? "ESCALATE_TO_NODAL" : severity === "HIGH" ? "INVESTIGATE_IMMEDIATELY" : "MONITOR", summary: text.substring(0, 200) };
}

router.post("/", requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: "Text too short" });
  }

  // Try AI first, fall back to rule-based
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = require("@anthropic-ai/sdk");
      const client = new Anthropic();
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: `Classify this Indian cybercrime report as JSON only (no markdown). Fields: fraudType, severity, confidence, location, redFlags, suspiciousNumbers, suggestedAction, summary. Text: "${text.substring(0, 500)}"` }],
      });
      const raw = response.content[0].text.replace(/```json|```/g, "").trim();
      return res.json(JSON.parse(raw));
    } catch (e) {
      // Fall through to rule-based
    }
  }

  return res.json(ruleBasedClassify(text));
});

module.exports = router;
