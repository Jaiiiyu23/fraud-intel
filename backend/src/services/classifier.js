const Anthropic = require("@anthropic-ai/sdk");
const logger = require("../utils/logger");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert fraud intelligence analyst for India with deep knowledge of cybercrime patterns, scam tactics, and financial fraud across all Indian states. 

Analyze the provided fraud report/complaint and return ONLY a valid JSON object with no markdown, no preamble.

Required JSON structure:
{
  "fraud_type": "UPI_PAYMENT_FRAUD" | "INVESTMENT_SCAM" | "JOB_RECRUITMENT_FRAUD" | "KYC_IMPERSONATION" | "CYBER_BLACKMAIL" | "LOTTERY_FRAUD" | "PHISHING" | "OTHER",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "confidence": <float 0.0-1.0>,
  "modus_operandi": "<brief description of the method used>",
  "estimated_loss_inr": <number or null>,
  "target_demographic": "<age group, profession, region if determinable>",
  "suggested_action": "<recommended action for investigators>",
  "red_flags": ["<flag 1>", "<flag 2>", "<flag 3>"],
  "state": "<Indian state name or null>",
  "city": "<city name or null>",
  "linked_keywords": ["<keyword1>", "<keyword2>"]
}

Severity guidelines:
- CRITICAL: Loss > ₹1L, organized network, vulnerable victims
- HIGH: Loss ₹10K-₹1L, clear fraud attempt
- MEDIUM: Loss < ₹10K, attempted but unclear outcome
- LOW: Suspicious but unconfirmed`;

async function classifyFraudReport(text) {
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const responseText = message.content[0].text;
    const parsed = JSON.parse(responseText.replace(/```json|```/g, "").trim());

    // Normalize to match DB enums
    return {
      fraudType: parsed.fraud_type,
      severity: parsed.severity,
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
      modusOperandi: parsed.modus_operandi,
      estimatedLossInr: parsed.estimated_loss_inr || null,
      targetDemographic: parsed.target_demographic,
      suggestedAction: parsed.suggested_action,
      redFlags: parsed.red_flags || [],
      state: parsed.state || null,
      city: parsed.city || null,
      linkedKeywords: parsed.linked_keywords || [],
    };
  } catch (err) {
    logger.error("Classification error", { error: err.message });
    throw new Error("AI classification failed: " + err.message);
  }
}

module.exports = { classifyFraudReport };
