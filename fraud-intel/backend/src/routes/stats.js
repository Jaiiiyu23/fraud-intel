import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/*
GET /api/stats
Return basic dashboard statistics
*/
router.get("/", async (req, res) => {
try {

```
const totalReports = await prisma.fraudReport.count();

res.json({
  totalReports,
  status: "ok"
});
```

} catch (error) {

```
console.error("Stats route error:", error);

res.status(500).json({
  error: error.message
});
```

}
});

export default router;
