import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/*
GET stats
*/
router.get("/", async (req, res) => {
  try {
    const totalReports = await prisma.fraudReport.count();

    const fraudTypes = await prisma.fraudReport.groupBy({
      by: ["type"],
      _count: true
    });

    res.json({
      totalReports,
      fraudTypes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
