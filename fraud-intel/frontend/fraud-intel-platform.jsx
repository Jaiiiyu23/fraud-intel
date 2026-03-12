import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0a0c10", surface: "#111318", border: "#1e2330",
  accent: "#ff3b3b", accentDim: "#ff3b3b22", accentSoft: "#ff6b6b",
  gold: "#f5a623", goldDim: "#f5a62322",
  green: "#00d4aa", greenDim: "#00d4aa22",
  blue: "#4a9eff", blueDim: "#4a9eff22",
  text: "#e8eaf0", textDim: "#7a8099", textMuted: "#3d4460",
};

const FRAUD_TYPES = [
  { type: "UPI / Payment Fraud", count: 4821, trend: "+18%", color: COLORS.accent, icon: "₹" },
  { type: "Investment / Stock Scam", count: 3204, trend: "+31%", color: COLORS.gold, icon: "📈" },
  { type: "Job / Recruitment Fraud", count: 2891, trend: "+12%", color: COLORS.blue, icon: "💼" },
  { type: "Impersonation (KYC/Bank)", count: 2103, trend: "+9%", color: COLORS.green, icon: "🪪" },
  { type: "Cyber Blackmail / Sextortion", count: 1456, trend: "+44%", color: "#c084fc", icon: "⚠️" },
  { type: "Lottery / Prize Fraud", count: 987, trend: "-3%", color: COLORS.textDim, icon: "🎰" },
];

const INDIA_STATES = [
  { name: "Maharashtra", cases: 3241, risk: "critical" },
  { name: "Uttar Pradesh", cases: 2890, risk: "critical" },
  { name: "Rajasthan", cases: 2103, risk: "high" },
  { name: "Delhi NCR", cases: 1987, risk: "high" },
  { name: "Karnataka", cases: 1654, risk: "high" },
  { name: "Tamil Nadu", cases: 1203, risk: "medium" },
  { name: "Gujarat", cases: 987, risk: "medium" },
  { name: "West Bengal", cases: 876, risk: "medium" },
];

const RECENT_REPORTS = [
  { id: "IFI-7821", time: "2m ago", type: "UPI Fraud", location: "Mumbai, MH", severity: "critical", summary: "Victim paid ₹2.4L to fake investment app" },
  { id: "IFI-7820", time: "8m ago", type: "Job Scam", location: "Noida, UP", severity: "high", summary: "Fake Google job offer, ₹45K lost in 'training fees'" },
  { id: "IFI-7819", time: "15m ago", type: "KYC Fraud", location: "Jaipur, RJ", severity: "high", summary: "SBI impersonation call, account OTP compromised" },
  { id: "IFI-7818", time: "23m ago", type: "Investment Scam", location: "Pune, MH", severity: "critical", summary: "Fake Zerodha WhatsApp group, ₹8.2L defrauded" },
  { id: "IFI-7817", time: "31m ago", type: "Sextortion", location: "Bengaluru, KA", severity: "medium", summary: "Nude video call recorded, ₹50K demanded" },
];

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, fontFamily: "monospace" }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, marginTop: 6, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function SeverityBadge({ level }) {
  const map = {
    critical: { bg: "#ff3b3b22", color: "#ff3b3b", label: "CRITICAL" },
    high: { bg: "#f5a62322", color: "#f5a623", label: "HIGH" },
    medium: { bg: "#4a9eff22", color: "#4a9eff", label: "MEDIUM" },
  };
  const s = map[level] || map.medium;
  return <span style={{ background: s.bg, color: s.color, fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, letterSpacing: 1, fontFamily: "monospace" }}>{s.label}</span>;
}

function RiskBar({ value, max, color }) {
  return (
    <div style={{ background: COLORS.border, borderRadius: 4, height: 4, flex: 1 }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

function Counter({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}

function ClassifyPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const classify = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are an expert fraud intelligence analyst for India. Analyze fraud report text and return ONLY valid JSON:
{
  "fraud_type": string (UPI_PAYMENT_FRAUD|INVESTMENT_SCAM|JOB_RECRUITMENT_FRAUD|KYC_IMPERSONATION|CYBER_BLACKMAIL|LOTTERY_FRAUD|PHISHING|OTHER),
  "severity": string (CRITICAL|HIGH|MEDIUM|LOW),
  "confidence": number (0.0-1.0),
  "modus_operandi": string,
  "estimated_loss_inr": number or null,
  "target_demographic": string,
  "suggested_action": string,
  "red_flags": string[] (max 3)
}
Return ONLY JSON, no markdown.`,
          messages: [{ role: "user", content: input }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (e) {
      setError("Classification failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <textarea value={input} onChange={e => setInput(e.target.value)}
        placeholder={"Paste fraud report, complaint, or suspicious message here...\n\ne.g. 'I received a call from someone claiming to be from SBI asking for my OTP to update KYC...'"}
        style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, padding: 14, fontSize: 13, fontFamily: "monospace", resize: "vertical", minHeight: 110, outline: "none", lineHeight: 1.6 }}
      />
      <button onClick={classify} disabled={loading || !input.trim()} style={{ background: loading ? COLORS.border : COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "⚡ Classifying..." : "⚡ Classify with AI"}
      </button>
      {error && <div style={{ color: COLORS.accent, fontSize: 12, padding: 10, background: COLORS.accentDim, borderRadius: 6 }}>{error}</div>}
      {result && (
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.green}33`, borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: COLORS.green, fontWeight: 800, fontSize: 13 }}>{result.fraud_type?.replace(/_/g, " ")}</span>
            <SeverityBadge level={result.severity?.toLowerCase()} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Confidence", `${Math.round((result.confidence || 0) * 100)}%`], ["Est. Loss", result.estimated_loss_inr ? `₹${result.estimated_loss_inr?.toLocaleString()}` : "Unknown"], ["Target", result.target_demographic], ["Action", result.suggested_action]].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 2 }}>{k}</div><div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600 }}>{v}</div></div>
            ))}
          </div>
          {result.red_flags?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 6 }}>RED FLAGS</div>
              {result.red_flags.map((f, i) => <div key={i} style={{ fontSize: 11, color: COLORS.accent, marginBottom: 3 }}>⚑ {f}</div>)}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: 12, background: COLORS.goldDim, border: `1px solid ${COLORS.gold}33`, borderRadius: 8 }}>
        <div style={{ fontSize: 10, color: COLORS.gold, fontWeight: 700, marginBottom: 3 }}>💡 TRY AN EXAMPLE</div>
        <div style={{ fontSize: 11, color: COLORS.textDim, fontStyle: "italic" }}>"I got a WhatsApp message saying I won ₹25 lakh in a KBC lottery. They asked ₹2,000 as processing fee."</div>
      </div>
    </div>
  );
}

export default function FraudIntelPlatform() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const tabs = [{ id: "dashboard", label: "📊 Dashboard" }, { id: "classify", label: "⚡ AI Classify" }, { id: "patterns", label: "🕸 Patterns" }];

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: COLORS.text }}>
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, background: COLORS.bg, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: COLORS.accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>⚑</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.5 }}>FRAUD INTEL INDIA</div>
            <div style={{ fontSize: 9, color: COLORS.textDim, letterSpacing: 1 }}>NATIONAL SCAM INTELLIGENCE PLATFORM</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.green, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", display: "flex", gap: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", color: activeTab === t.id ? COLORS.text : COLORS.textDim, padding: "12px 16px", fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400, cursor: "pointer", borderBottom: activeTab === t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent", marginBottom: -1 }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <StatCard label="Total Reports (30d)" value={<Counter target={15462} />} sub="↑ 22% vs last month" color={COLORS.accent} icon="📋" />
              <StatCard label="Active Scam Networks" value={<Counter target={312} />} sub="↑ 8 new this week" color={COLORS.gold} icon="🕸" />
              <StatCard label="Est. Losses (₹ Cr)" value={<Counter target={847} />} sub="Reported this month" color={COLORS.green} icon="₹" />
              <StatCard label="States Affected" value="28" sub="All major states active" color={COLORS.blue} icon="🗺" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: 1, marginBottom: 16 }}>FRAUD TYPES — 30 DAY BREAKDOWN</div>
                {FRAUD_TYPES.map((f, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 14 }}>{f.icon}</span>
                        <span style={{ fontSize: 12, color: COLORS.text }}>{f.type}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: COLORS.textDim, fontFamily: "monospace" }}>{f.count.toLocaleString()}</span>
                        <span style={{ fontSize: 10, color: f.trend.startsWith("+") ? COLORS.accent : COLORS.green, fontWeight: 700 }}>{f.trend}</span>
                      </div>
                    </div>
                    <RiskBar value={f.count} max={5000} color={f.color} />
                  </div>
                ))}
              </div>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: 1, marginBottom: 16 }}>STATE RISK MAP — TOP 8</div>
                {INDIA_STATES.map((s, i) => {
                  const riskColor = s.risk === "critical" ? COLORS.accent : s.risk === "high" ? COLORS.gold : COLORS.blue;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: i % 2 === 0 ? "#ffffff05" : "transparent" }}>
                      <span style={{ fontSize: 11, color: COLORS.textDim, width: 20, textAlign: "right", fontFamily: "monospace" }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: COLORS.text, flex: 1 }}>{s.name}</span>
                      <RiskBar value={s.cases} max={3500} color={riskColor} />
                      <span style={{ fontSize: 11, color: COLORS.textDim, fontFamily: "monospace", width: 45, textAlign: "right" }}>{s.cases.toLocaleString()}</span>
                      <span style={{ fontSize: 9, color: riskColor, fontWeight: 700, width: 50, textAlign: "right", letterSpacing: 0.5 }}>{s.risk.toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: 1 }}>LIVE REPORT FEED</div>
              </div>
              {RECENT_REPORTS.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: i < RECENT_REPORTS.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.textMuted, width: 65, flexShrink: 0 }}>{r.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{r.type}</span>
                      <SeverityBadge level={r.severity} />
                      <span style={{ fontSize: 11, color: COLORS.textDim }}>📍 {r.location}</span>
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textDim }}>{r.summary}</div>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>{r.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "classify" && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>AI Fraud Classifier</div>
              <div style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.6 }}>Paste any complaint, FIR text, or suspicious message. Claude classifies it instantly — type, severity, red flags, and recommended action.</div>
            </div>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <ClassifyPanel />
            </div>
          </div>
        )}

        {activeTab === "patterns" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Scam Network Patterns</div>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.accent}44`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.accent, letterSpacing: 1, marginBottom: 14 }}>⚡ SURGE ALERTS — ACTIVE</div>
              {[
                { title: "Fake Investment Apps surge — Maharashtra", detail: "312% spike in last 48 hours. 6 linked phone numbers flagged.", time: "2h ago" },
                { title: "WhatsApp stock tip groups — Pan India", detail: "New network detected: 47 groups, 18,000+ victims targeted.", time: "5h ago" },
                { title: "Fake job portals — UP & Bihar", detail: "Pattern matches Jamtara network. CERT-In alerted.", time: "1d ago" },
              ].map((a, i) => (
                <div key={i} style={{ padding: "12px 14px", background: COLORS.accentDim, borderRadius: 8, marginBottom: 10, borderLeft: `3px solid ${COLORS.accent}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.textDim }}>{a.detail}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 6 }}>{a.time}</div>
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: 1, marginBottom: 14 }}>🕸 DETECTED SCAM NETWORKS</div>
              {[
                { id: "NET-UPI-MH-0041", cases: 234, states: "MH, GJ, RJ", type: "UPI Fraud", confidence: 94 },
                { id: "NET-JOB-UP-0017", cases: 189, states: "UP, BR, JH", type: "Job Recruitment", confidence: 88 },
                { id: "NET-INV-KA-0029", cases: 156, states: "KA, TN, AP", type: "Investment Scam", confidence: 91 },
                { id: "NET-KYC-DL-0008", cases: 98, states: "DL, HR, PB", type: "KYC Impersonation", confidence: 79 },
              ].map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < 3 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.blue, width: 140 }}>{n.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{n.type}</div>
                    <div style={{ fontSize: 11, color: COLORS.textDim }}>States: {n.states}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{n.cases}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim }}>linked cases</div>
                  </div>
                  <div style={{ width: 50, textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.green }}>{n.confidence}%</div>
                    <div style={{ fontSize: 9, color: COLORS.textDim }}>confidence</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} } *{box-sizing:border-box}`}</style>
    </div>
  );
}
