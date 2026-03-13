import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  const { text } = req.body;

  const result = {
    fraudType: "UPI_PAYMENT_FRAUD",
    severity: "HIGH",
    confidence: 0.9,
    redFlags: ["Asked OTP", "Bank impersonation"],
    linkedKeywords: ["otp", "bank", "upi"]
  };

  res.json(result);
});

export default router;
