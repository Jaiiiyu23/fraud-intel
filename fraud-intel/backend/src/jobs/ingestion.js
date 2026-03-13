require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { PrismaClient } = require("@prisma/client");
const { generateReportCode } = require("../utils/helpers");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

// ─── Rule-based classifier (no AI credits needed) ───────────────────────────
function ruleBasedClassify(text) {
  const t = text.toLowerCase();

  let fraudType = "OTHER_FRAUD";
  let severity = "MEDIUM";
  let confidence = 0.7;
  let location = null;
  const redFlags = [];
  const suspiciousNumbers = [];
  const suspiciousUrls = [];

  // Detect fraud type
  if (t.match(/upi|gpay|phonepe|paytm|bhim|payment|transaction/))
    fraudType = "UPI_PAYMENT_FRAUD";
  else if (t.match(/kyc|aadhar|pan|bank account|otp|verify/))
    fraudType = "IMPERSONATION_KYC";
  else if (t.match(/investment|stock|trading|sebi|mutual fund|return|profit|scheme/))
    fraudType = "INVESTMENT_STOCK_SCAM";
  else if (t.match(/job|recruitment|offer letter|salary|work from home|wfh/))
    fraudType = "JOB_RECRUITMENT_FRAUD";
  else if (t.match(/sextortion|blackmail|video|nude|intimate|threat/))
    fraudType = "CYBER_BLACKMAIL";
  else if (t.match(/lottery|prize|winner|claim|reward/))
    fraudType = "LOTTERY_PRIZE_FRAUD";
  else if (t.match(/courier|parcel|customs|fedex|dhl|package/))
    fraudType = "COURIER_SCAM";
  else if (t.match(/loan|credit|emi|finance|borrow/))
    fraudType = "LOAN_FRAUD";

  // Detect severity
  const amountMatch = t.match(/(?:rs|₹|inr)\.?\s*([0-9,]+)/);
  if (amountMatch) {
    const amount = parseInt(amountMatch[1].replace(/,/g, ""));
    if (amount >= 1000000) severity = "CRITICAL";
    else if (amount >= 100000) severity = "HIGH";
    else if (amount >= 10000) severity = "MEDIUM";
    else severity = "LOW";
  }

  // Extract location
  const states = ["maharashtra","mumbai","delhi","bangalore","bengaluru","hyderabad",
    "chennai","kolkata","rajasthan","gujarat","ahmedabad","pune","lucknow",
    "uttar pradesh","karnataka","tamil nadu","kerala","bihar","haryana",
    "madhya pradesh","west bengal","goa","assam","punjab"];
  for (const state of states) {
    if (t.includes(state)) {
      location = state.charAt(0).toUpperCase() + state.slice(1);
      break;
    }
  }

  // Extract red flags
  if (t.match(/whatsapp|telegram/)) redFlags.push("Contact via messaging app");
  if (t.match(/otp|one.time/)) redFlags.push("OTP requested");
  if (t.match(/urgent|immediately|now|fast/)) redFlags.push("Urgency pressure");
  if (t.match(/click.*link|link.*click/)) redFlags.push("Suspicious link shared");
  if (t.match(/remote|anydesk|teamviewer|screen/)) redFlags.push("Remote access requested");
  if (t.match(/gift card|itunes|amazon card/)) redFlags.push("Gift card payment requested");

  // Extract phone numbers
  const phones = text.match(/(?:\+91|0)?[6-9]\d{9}/g);
  if (phones) suspiciousNumbers.push(...phones.slice(0, 3));

  // Extract URLs
  const urls = text.match(/https?:\/\/[^\s]+/g);
  if (urls) suspiciousUrls.push(...urls.slice(0, 3));

  return {
    fraudType,
    severity,
    confidence,
    location,
    redFlags,
    suspiciousNumbers,
    suspiciousUrls,
    suggestedAction: severity === "CRITICAL" ? "ESCALATE_TO_NODAL" :
                     severity === "HIGH" ? "INVESTIGATE_IMMEDIATELY" : "MONITOR",
    summary: text.substring(0, 200),
  };
}

// Try AI classification, fall back to rule-based
async function classifyReport(text) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = require("@anthropic-ai/sdk");
      const client = new Anthropic();
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Classify this Indian cybercrime report as JSON only. Fields: fraudType (UPI_PAYMENT_FRAUD|INVESTMENT_STOCK_SCAM|JOB_RECRUITMENT_FRAUD|IMPERSONATION_KYC|CYBER_BLACKMAIL|LOTTERY_PRIZE_FRAUD|OTHER_FRAUD), severity (LOW|MEDIUM|HIGH|CRITICAL), confidence (0-1), location (Indian state/city or null), redFlags (array), suspiciousNumbers (array), suspiciousUrls (array), suggestedAction (string), summary (max 150 chars). Text: "${text.substring(0, 500)}"`
        }]
      });
      const raw = response.content[0].text.replace(/```json|```/g, "").trim();
      return JSON.parse(raw);
    } catch (e) {
      // Fall back to rule-based
    }
  }
  return ruleBasedClassify(text);
}

// ─── Twitter/X Ingestion ─────────────────────────────────────────────────────
async function ingestFromTwitter() {
  if (!process.env.TWITTER_BEARER_TOKEN) {
    logger.warn("TWITTER_BEARER_TOKEN not set, skipping");
    return { found: 0, saved: 0, errors: [] };
  }

  const queries = [
    "UPI fraud scam India -is:retweet lang:en min_faves:2",
    "cyber fraud India money lost -is:retweet lang:en min_faves:2",
    "online scam India arrested -is:retweet lang:en",
    "phishing KYC fraud India -is:retweet lang:en",
    "investment scam India SEBI -is:retweet lang:en",
  ];

  let totalFound = 0, totalSaved = 0;
  const errors = [];

  for (const query of queries) {
    try {
      const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
        headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
        params: { query, max_results: 10, "tweet.fields": "created_at,text" },
        timeout: 10000,
      });

      const tweets = response.data?.data || [];
      totalFound += tweets.length;

      for (const tweet of tweets) {
        if (tweet.text.length < 60) continue;
        const existing = await prisma.fraudReport.findFirst({
          where: { sourceUrl: `twitter:${tweet.id}` },
        });
        if (existing) continue;

        const classification = await classifyReport(tweet.text);
        if (classification.confidence < 0.5) continue;

        const report = await prisma.fraudReport.create({
          data: {
            reportCode: generateReportCode(),
            rawText: tweet.text,
            sourceType: "TWITTER_SCRAPE",
            sourceUrl: `twitter:${tweet.id}`,
            ...classification,
          },
        });
        totalSaved++;
        logger.info(`Saved tweet report: ${report.reportCode}`);
      }
    } catch (err) {
      errors.push(`Query "${query}": ${err.message}`);
      logger.warn("Twitter query failed", { query, error: err.message });
    }
  }

  return { found: totalFound, saved: totalSaved, errors };
}

// ─── Cybercrime.gov.in Scraper ────────────────────────────────────────────────
async function ingestFromCybercrimePortal() {
  const found = [], errors = [];
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml",
  };

  // Try public advisory pages
  const urls = [
    "https://cybercrime.gov.in/Webform/Cybercrime_AdvisoryForm.aspx",
    "https://www.cybercrime.gov.in",
    "https://www.cert-in.org.in/s2cMainServlet?pageid=PUBADVLIST",
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, { timeout: 15000, headers });
      const $ = cheerio.load(response.data);

      // Try multiple selectors for different page structures
      const selectors = [
        ".advisory-item", ".news-item", "article", ".content-box",
        "p", ".alert-text", ".advisory", "li"
      ];

      for (const sel of selectors) {
        $(sel).each((i, el) => {
          const text = $(el).text().trim().replace(/\s+/g, " ");
          if (text.length > 100 && text.length < 2000) {
            if (text.match(/fraud|scam|cyber|phishing|fake|cheating|debit|loss/i)) {
              found.push({ text, sourceUrl: url });
            }
          }
        });
      }

      if (found.length > 0) break; // Got data, stop trying other URLs
    } catch (err) {
      errors.push(`${url}: ${err.message}`);
    }
  }

  let saved = 0;
  for (const item of found.slice(0, 15)) {
    try {
      const existing = await prisma.fraudReport.findFirst({
        where: { rawText: { contains: item.text.substring(0, 100) } }
      });
      if (existing) continue;

      const classification = await classifyReport(item.text);
      if (classification.confidence < 0.5) continue;

      await prisma.fraudReport.create({
        data: {
          reportCode: generateReportCode(),
          rawText: item.text,
          sourceType: "CYBERCRIME_PORTAL",
          sourceUrl: item.sourceUrl,
          ...classification,
        },
      });
      saved++;
    } catch (err) {
      errors.push(err.message);
    }
  }

  return { found: found.length, saved, errors };
}

// ─── CERT-In Alerts ──────────────────────────────────────────────────────────
async function ingestFromCertIn() {
  const found = [], errors = [];

  try {
    const response = await axios.get(
      "https://www.cert-in.org.in/s2cMainServlet?pageid=PUBADVLIST",
      {
        timeout: 15000,
        headers: { "User-Agent": "Mozilla/5.0 FraudIntelBot/1.0 Research" },
      }
    );

    const $ = cheerio.load(response.data);
    $("table tr, .advisory-row, li").each((i, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (text.length > 80 && text.match(/phishing|malware|fraud|vulnerability|alert/i)) {
        found.push(text);
      }
    });
  } catch (err) {
    errors.push(`CERT-In: ${err.message}`);
  }

  let saved = 0;
  for (const text of found.slice(0, 10)) {
    try {
      const existing = await prisma.fraudReport.findFirst({
        where: { rawText: { contains: text.substring(0, 80) } }
      });
      if (existing) continue;

      const classification = await classifyReport(text);
      await prisma.fraudReport.create({
        data: {
          reportCode: generateReportCode(),
          rawText: text,
          sourceType: "CYBERCRIME_PORTAL",
          sourceUrl: "https://cert-in.org.in",
          ...classification,
        },
      });
      saved++;
    } catch (err) {
      errors.push(err.message);
    }
  }

  return { found: found.length, saved, errors };
}

// ─── Main Runner ─────────────────────────────────────────────────────────────
async function runIngestion() {
  logger.info("=== Starting ingestion run ===");
  const results = {};

  logger.info("Ingesting from Twitter/X...");
  results.twitter = await ingestFromTwitter();
  logger.info("Twitter done", results.twitter);

  logger.info("Ingesting from Cybercrime portal...");
  results.cybercrimePortal = await ingestFromCybercrimePortal();
  logger.info("Cybercrime portal done", results.cybercrimePortal);

  logger.info("Ingesting from CERT-In...");
  results.certIn = await ingestFromCertIn();
  logger.info("CERT-In done", results.certIn);

  // Log to DB
  for (const [source, result] of Object.entries(results)) {
    const sourceMap = {
      twitter: "TWITTER_SCRAPE",
      cybercrimePortal: "CYBERCRIME_PORTAL",
      certIn: "CYBERCRIME_PORTAL",
    };
    await prisma.ingestionLog.create({
      data: {
        source: sourceMap[source] || "CYBERCRIME_PORTAL",
        itemsFound: result.found,
        itemsSaved: result.saved,
        errors: result.errors.slice(0, 5),
      },
    }).catch(() => {});
  }

  const totalSaved = Object.values(results).reduce((s, r) => s + r.saved, 0);
  logger.info(`=== Ingestion complete. Total saved: ${totalSaved} ===`);
  return results;
}

if (require.main === module) {
  runIngestion().then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runIngestion };
