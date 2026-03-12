require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { PrismaClient } = require("@prisma/client");
const { classifyFraudReport } = require("../services/classifier");
const { detectNetworks } = require("../services/networkDetector");
const { generateReportCode } = require("../utils/helpers");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

// ─── Twitter/X Scraper ───────────────────────────────────────────────────────
// Searches for fraud-related tweets in India using Twitter API v2
async function ingestFromTwitter() {
  if (!process.env.TWITTER_BEARER_TOKEN) {
    logger.warn("TWITTER_BEARER_TOKEN not set, skipping Twitter ingestion");
    return { found: 0, saved: 0, errors: [] };
  }

  const queries = [
    "UPI fraud India -is:retweet lang:en",
    "online scam India money lost -is:retweet lang:en",
    "KYC fraud India -is:retweet lang:en",
    "investment scam India WhatsApp -is:retweet lang:en",
  ];

  let totalFound = 0, totalSaved = 0;
  const errors = [];

  for (const query of queries) {
    try {
      const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
        headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
        params: {
          query,
          max_results: 10,
          "tweet.fields": "created_at,geo,text",
        },
      });

      const tweets = response.data?.data || [];
      totalFound += tweets.length;

      for (const tweet of tweets) {
        try {
          // Skip very short tweets
          if (tweet.text.length < 50) continue;

          // Check not already ingested
          const existing = await prisma.fraudReport.findFirst({
            where: { sourceUrl: `twitter:${tweet.id}` },
          });
          if (existing) continue;

          const classification = await classifyFraudReport(tweet.text);

          // Only save if confidence is decent
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

          detectNetworks(report).catch(() => {});
          totalSaved++;
        } catch (err) {
          errors.push(`Tweet ${tweet.id}: ${err.message}`);
        }
      }
    } catch (err) {
      errors.push(`Query "${query}": ${err.message}`);
    }
  }

  return { found: totalFound, saved: totalSaved, errors };
}

// ─── Cybercrime Portal Scraper ───────────────────────────────────────────────
// Scrapes publicly available advisories from cybercrime.gov.in
async function ingestFromCybercrimePortal() {
  const found = [], errors = [];

  try {
    const response = await axios.get("https://cybercrime.gov.in/Webform/Crime_AuthWebsiteForm.aspx", {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0 FraudIntelBot/1.0 (Government Research)" },
    });

    const $ = cheerio.load(response.data);

    // Extract advisory text (adjust selectors based on actual page structure)
    $(".advisory-item, .news-item, article").each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 100) found.push(text);
    });
  } catch (err) {
    errors.push(`Cybercrime portal: ${err.message}`);
    logger.warn("Cybercrime portal scrape failed (may be blocked or offline)", { error: err.message });
  }

  let saved = 0;
  for (const text of found.slice(0, 20)) {
    try {
      const existing = await prisma.fraudReport.findFirst({ where: { rawText: text } });
      if (existing) continue;

      const classification = await classifyFraudReport(text);
      if (classification.confidence < 0.6) continue;

      const report = await prisma.fraudReport.create({
        data: {
          reportCode: generateReportCode(),
          rawText: text,
          sourceType: "CYBERCRIME_PORTAL",
          sourceUrl: "https://cybercrime.gov.in",
          ...classification,
        },
      });

      detectNetworks(report).catch(() => {});
      saved++;
    } catch (err) {
      errors.push(err.message);
    }
  }

  return { found: found.length, saved, errors };
}

// ─── Main ingestion runner ───────────────────────────────────────────────────
async function runIngestion() {
  logger.info("Starting data ingestion run");

  const results = {};

  // Twitter
  logger.info("Ingesting from Twitter...");
  results.twitter = await ingestFromTwitter();
  logger.info("Twitter ingestion complete", results.twitter);

  // Cybercrime Portal
  logger.info("Ingesting from Cybercrime portal...");
  results.cybercrimePortal = await ingestFromCybercrimePortal();
  logger.info("Cybercrime portal ingestion complete", results.cybercrimePortal);

  // Log run to DB
  for (const [source, result] of Object.entries(results)) {
    await prisma.ingestionLog.create({
      data: {
        source: source === "twitter" ? "TWITTER_SCRAPE" : "CYBERCRIME_PORTAL",
        itemsFound: result.found,
        itemsSaved: result.saved,
        errors: result.errors.slice(0, 10),
      },
    }).catch(() => {});
  }

  logger.info("Ingestion run complete", {
    totalSaved: Object.values(results).reduce((s, r) => s + r.saved, 0),
  });

  return results;
}

// Run directly if called as script
if (require.main === module) {
  runIngestion().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runIngestion };
