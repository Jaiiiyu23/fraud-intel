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

      const reportCode = `RED-${data.id}`;
      const rawText = `${data.title} ${data.selftext}`;

      // 🔎 check if already saved
      const exists = await prisma.fraudReport.findUnique({
        where: { reportCode }
      });

      if (exists) {
        console.log("Skipping duplicate:", reportCode);
        continue;
      }

      await prisma.fraudReport.create({
        data: {
          reportCode,
          rawText,
          sourceType: "REDDIT",
          fraudType: "OTHER",
          severity: "MEDIUM",
          confidence: 0.5,
          redFlags: [],
          linkedKeywords: [],
          state: null,
          city: null
        }
      });

      console.log("Saved Reddit report:", reportCode);
    }

    console.log("Reddit ingestion completed");
  } catch (err) {
    console.error("Reddit ingestion error:", err);
  }
}
