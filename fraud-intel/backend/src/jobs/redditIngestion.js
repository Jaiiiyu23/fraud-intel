import axios from "axios";
import { PrismaClient } from "@prisma/client";
import classifyFraud from "../classify.js";

const prisma = new PrismaClient();

export async function ingestReddit() {

  try {

    const url = "https://www.reddit.com/search.json?q=scam%20india&limit=25";

    const res = await axios.get(url);

    const posts = res.data.data.children;

    for (const p of posts) {

      const title = p.data.title;
      const text = title + " " + (p.data.selftext || "");

      const fraudType = classifyFraud(text);

      await prisma.report.create({
        data: {
          title: title,
          description: text,
          source: "reddit",
          fraudType: fraudType
        }
      });

    }

    console.log("Reddit reports inserted");

  } catch (err) {

    console.error("Reddit ingestion failed", err);

  }

}
