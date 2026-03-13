import axios from "axios";
import { PrismaClient } from "@prisma/client";
import classifyFraud from "../classify.js";

const prisma = new PrismaClient();

export async function ingestReddit() {

  try {

    console.log("Starting Reddit ingestion...");

    const url = "https://www.reddit.com/search.json?q=scam%20india&limit=25";

    const res = await axios.get(url, {
      headers: {
        "User-Agent": "fraud-intel-app"
      }
    });

    const posts = res.data.data.children;

    for (const p of posts) {

      const title = p.data.title;
      const description = title + " " + (p.data.selftext || "");

      const fraudType = classifyFraud(description);

      await prisma.report.create({
        data: {
          title: title,
          description: description,
          source: "reddit",
          fraudType: fraudType
        }
      });

    }

    console.log("Reddit reports inserted successfully");

  } catch (err) {

    console.error("Reddit ingestion failed:", err.message);

  }

}
