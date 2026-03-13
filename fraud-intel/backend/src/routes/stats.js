import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/*
GET /api/stats
Return dashboard statistics
*/
router.get("/", async (req, res) => {
try {
const totalReports = await prisma.fraudReport.count();

```
const reports = await prisma.fraudReport.findMany({
  select: {
    id: true,
    text: true,
    sourceType: true,
    createdAt: true
  },
  orderBy: {
    createdAt: "desc"
  },
  take: 20
});

res.json({
  totalReports,
  reports
});
```

} catch (error) {
console.error(error);
res.status(500).json({
error: error.message
});
}
});

export default router;
