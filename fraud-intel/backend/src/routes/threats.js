import express from "express"
import prisma from "../prisma.js"

const router = express.Router()

router.get("/", async (req, res) => {

  try {

    const threats = await prisma.fraudReport.groupBy({
      by: ["fraudType"],
      _count: {
        fraudType: true
      },
      orderBy: {
        _count: {
          fraudType: "desc"
        }
      }
    })

    const formatted = threats.map(t => ({
      fraudType: t.fraudType,
      reports: t._count.fraudType
    }))

    res.json({
      topThreats: formatted
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "Failed to load threats"
    })

  }

})

export default router
