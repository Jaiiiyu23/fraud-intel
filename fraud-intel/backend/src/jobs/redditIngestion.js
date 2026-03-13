import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function ingestReddit() {
  try {
    console.log("Fetching Reddit scam posts...");

    const response = await axios.get(
      "https://www.reddit.com/r/Scams/new.json?limit=10",
      {
        headers: {
          "User-Agent": "fraud-intel-bot"
        }
      }
    );

    const posts = response.data.data.children;

    for (const post of posts) {
      const data = post.data;

      const rawText = `${data.title} ${data.selftext}`;

      await prisma.fraudReport.create({
        data: {
          reportCode: `RED-${data.id}`,
          rawText,
          sourceType: "TWITTER_SCRAPE", // temporary source
          fraudType: "OTHER",
          severity: "MEDIUM",
          confidence: 0.5,
          redFlags: [],
          linkedKeywords: [],
          state: null,
          city: null
        }
      });

      console.log("Saved Reddit report:", data.id);
    }

    console.log("Reddit ingestion completed");
  } catch (err) {
    console.error("Reddit ingestion error:", err);
  }
}
