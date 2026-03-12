const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function detectNetworks(report) {
  // Simple keyword-based network detection
  if (!report.linkedKeywords || report.linkedKeywords.length === 0) return;

  try {
    // Find existing network with matching keywords
    const existing = await prisma.scamNetwork.findFirst({
      where: { name: { contains: report.fraudType } },
    });

    if (existing) {
      await prisma.fraudReport.update({
        where: { id: report.id },
        data: { networkId: existing.id },
      });
    } else if (report.confidence > 0.8) {
      const network = await prisma.scamNetwork.create({
        data: {
          name: `${report.fraudType} Network`,
          description: report.modusOperandi,
        },
      });
      await prisma.fraudReport.update({
        where: { id: report.id },
        data: { networkId: network.id },
      });
    }
  } catch (err) {
    // Non-critical, ignore
  }
}

module.exports = { detectNetworks };
