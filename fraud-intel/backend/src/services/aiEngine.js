function detectFraud(text) {
  const lower = text.toLowerCase()

  let fraudType = "OTHER"
  let severity = "LOW"
  let confidence = 0.5
  let redFlags = []
  let keywords = []

  if (lower.includes("otp")) {
    redFlags.push("Asked for OTP")
    keywords.push("otp")
  }

  if (lower.includes("bank") || lower.includes("sbi") || lower.includes("account")) {
    redFlags.push("Bank impersonation")
    keywords.push("bank")
  }

  if (lower.includes("upi") || lower.includes("payment") || lower.includes("transaction")) {
    fraudType = "UPI_PAYMENT_FRAUD"
    severity = "HIGH"
    confidence = 0.9
    keywords.push("upi")
  }

  if (lower.includes("investment") || lower.includes("double money")) {
    fraudType = "INVESTMENT_SCAM"
    severity = "HIGH"
    confidence = 0.85
    keywords.push("investment")
  }

  if (lower.includes("job") || lower.includes("registration fee")) {
    fraudType = "JOB_RECRUITMENT_FRAUD"
    severity = "MEDIUM"
    confidence = 0.8
    keywords.push("job")
  }

  if (lower.includes("kyc") || lower.includes("verify account")) {
    fraudType = "KYC_IMPERSONATION"
    severity = "HIGH"
    confidence = 0.9
    keywords.push("kyc")
  }

  return {
    fraudType,
    severity,
    confidence,
    redFlags,
    linkedKeywords: keywords
  }
}

export { detectFraud }
