import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/*
GET all reports
*/
router.get("/", async (req, res) => {
  try {
    const reports = await prisma.fraudReport.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/*
GET single report
*/
router.get("/:id", async (req, res) => {
  try {
    const report = await prisma.fraudReport.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!report) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/*
CREATE report
*/
router.post("/", async (req, res) => {
  try {
    const report = await prisma.fraudReport.create({
      data: req.body
    });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
