const express = require("express")
const router = express.Router()

const { detectFraud } = require("../services/aiEngine")

router.post("/", async (req, res) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: "Text is required" })
    }

    const result = detectFraud(text)

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "AI detection failed" })
  }
})

export default router
