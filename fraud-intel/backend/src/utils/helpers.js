const { v4: uuidv4 } = require("uuid");

function generateReportCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `FR-${timestamp}-${random}`;
}

module.exports = { generateReportCode };
