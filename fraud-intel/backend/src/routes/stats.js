import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {

    const totalReports = await prisma.fraudReport.count();

    res.json({
      totalReports
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: err.message });

  }
});

export default router;
