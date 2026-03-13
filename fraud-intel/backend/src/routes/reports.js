import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/*
POST /api/reports
Create a new fraud report
*/
router.post("/", async (req, res) => {
try {
const { text, sourceType } = req.body;

```
if (!text) {
  return res.status(400).json({ error: "Text is required" });
}

const report = await prisma.fraudReport.create({
  data: {
    text,
    sourceType: sourceType || "manual",
  },
});

res.json(report);
```

} catch (err) {
res.status(500).json({ error: err.message });
}
});

/*
GET /api/reports
List all reports
*/
router.get("/", async (req, res) => {
try {
const reports = await prisma.fraudReport.findMany({
orderBy: {
createdAt: "desc",
},
});

```
res.json(reports);
```

} catch (err) {
res.status(500).json({ error: err.message });
}
});

/*
GET /api/reports/:id
Get single report
*/
router.get("/:id", async (req, res) => {
try {
const report = await prisma.fraudReport.findUnique({
where: {
id: req.params.id,
},
});

```
if (!report) {
  return res.status(404).json({ error: "Report not found" });
}

res.json(report);
```

} catch (err) {
res.status(500).json({ error: err.message });
}
});

export default router;
