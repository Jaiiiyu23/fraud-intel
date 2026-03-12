const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { classifyFraudReport } = require("../services/classifier");

const router = express.Router();

// POST /api/v1/classify
router.post("/", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: "text must be at least 10 characters" });
    }
    const result = await classifyFraudReport(text);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
