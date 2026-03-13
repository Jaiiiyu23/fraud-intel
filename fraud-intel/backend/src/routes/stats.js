import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/*
GET /api/stats
Return simple statistics about reports
*/
router.get("/", async (req, res) => {
try {
const totalReports = await prisma.fraudReport.count();

```
const latestReports = await prisma.fraudReport.findMany({
  orderBy: {
    createdAt: "desc"
  },
  take: 10
});

res.json({
  totalReports,
  latestReports
});
```

} catch (err) {
res.status(500).json({
error: err.message
});
}
});

export default router;
