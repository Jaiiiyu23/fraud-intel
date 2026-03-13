export function classifyFraud(text) {

const t = text.toLowerCase()

if (t.includes("upi") || t.includes("qr")) {
  return "UPI Scam"
}

if (t.includes("telegram") || t.includes("crypto")) {
  return "Investment Scam"
}

if (t.includes("job") || t.includes("work from home")) {
  return "Job Scam"
}

if (t.includes("otp") || t.includes("bank")) {
  return "Banking Fraud"
}

return "Other Fraud"

}
