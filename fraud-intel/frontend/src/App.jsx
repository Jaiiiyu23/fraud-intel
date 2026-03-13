import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "https://fraud-intel-production.up.railway.app";

const COLORS = {
  bg: "#0a0c10", surface: "#111318", border: "#1e2330",
  accent: "#ff3b3b", accentDim: "#ff3b3b22", accentSoft: "#ff6b6b",
  gold: "#f5a623", goldDim: "#f5a62322",
  green: "#00d4aa", greenDim: "#00d4aa22",
  blue: "#4a9eff", blueDim: "#4a9eff22",
  text: "#e8eaf0", textDim: "#7a8099", textMuted: "#3d4460",
};

const FRAUD_TYPE_LABELS = {
  UPI_PAYMENT_FRAUD: "UPI / Payment Fraud",
  INVESTMENT_SCAM: "Investment / Stock Scam",
  JOB_RECRUITMENT_FRAUD: "Job / Recruitment Fraud",
  KYC_IMPERSONATION: "KYC / Bank Impersonation",
  CYBER_BLACKMAIL: "Cyber Blackmail / Sextortion",
  LOTTERY_FRAUD: "Lottery / Prize Fraud",
  PHISHING: "Phishing",
  OTHER: "Other",
};

const FRAUD_TYPE_COLORS = {
  UPI_PAYMENT_FRAUD: COLORS.accent,
  INVESTMENT_SCAM: COLORS.gold,
  JOB_RECRUITMENT_FRAUD: COLORS.blue,
  KYC_IMPERSONATION: COLORS.green,
  CYBER_BLACKMAIL: "#c084fc",
  LOTTERY_FRAUD: COLORS.textDim,
  PHISHING: "#fb923c",
  OTHER: COLORS.textMuted,
};

// ── API helper ────────────────────────────────────────────────
function api(path, opts = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  }).then(r => r.json());
}

// ── UI components ─────────────────────────────────────────────
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
    CRITICAL: { bg: "#ff3b3b22", color: "#ff3b3b" },
    HIGH: { bg: "#f5a62322", color: "#f5a623" },
    MEDIUM: { bg: "#4a9eff22", color: "#4a9eff" },
    LOW: { bg: "#00d4aa22", color: "#00d4aa" },
    critical: { bg: "#ff3b3b22", color: "#ff3b3b" },
    high: { bg: "#f5a62322", color: "#f5a623" },
    medium: { bg: "#4a9eff22", color: "#4a9eff" },
    low: { bg: "#00d4aa22", color: "#00d4aa" },
  };
  const s = map[level] || map.MEDIUM;
  return <span style={{ background: s.bg, color: s.color, fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, letterSpacing: 1, fontFamily: "monospace" }}>{String(level).toUpperCase()}</span>;
}

function RiskBar({ value, max, color }) {
  return (
    <div style={{ background: COLORS.border, borderRadius: 4, height: 4, flex: 1 }}>
      <div style={{ width: `${Math.min(100, (value / (max || 1)) * 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

function Input({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 600 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, padding: "10px 12px", fontSize: 13, outline: "none" }} />
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", style = {} }) {
  const bg = variant === "primary" ? COLORS.accent : variant === "success" ? COLORS.green : COLORS.surface;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? COLORS.border : bg, color: variant === "ghost" ? COLORS.text : "#fff", border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", ...style }}>
      {children}
    </button>
  );
}

// ── Login / Register screen ───────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", orgName: "", adminName: "", orgType: "GOVERNMENT" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setLoading(true); setError(null);
    try {
      if (mode === "login") {
        const res = await api("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email: form.email, password: form.password }) });
        if (res.token) { localStorage.setItem("token", res.token); onLogin(res); }
        else setError(res.error || "Login failed");
      } else {
        const res = await api("/api/v1/auth/register", { method: "POST", body: JSON.stringify({ email: form.email, password: form.password, orgName: form.orgName, adminName: form.adminName, orgType: form.orgType }) });
        if (res.token) { localStorage.setItem("token", res.token); onLogin(res); }
        else setError(res.error || "Registration failed");
      }
    } catch (e) { setError("Network error — is the backend running?"); }
    setLoading(false);
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", color: COLORS.text }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 36, width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 32, height: 32, background: COLORS.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚑</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>FRAUD INTEL INDIA</div>
            <div style={{ fontSize: 10, color: COLORS.textDim }}>NATIONAL SCAM INTELLIGENCE PLATFORM</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: COLORS.bg, borderRadius: 8, padding: 4 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, background: mode === m ? COLORS.surface : "none", border: mode === m ? `1px solid ${COLORS.border}` : "1px solid transparent", borderRadius: 6, color: mode === m ? COLORS.text : COLORS.textDim, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {m === "login" ? "Sign In" : "Register Org"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && <>
            <Input label="Organization Name" value={form.orgName} onChange={f("orgName")} placeholder="Ministry of Home Affairs" />
            <Input label="Your Name" value={form.adminName} onChange={f("adminName")} placeholder="Admin Name" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: COLORS.textDim, fontWeight: 600 }}>Organization Type</label>
              <select value={form.orgType} onChange={e => f("orgType")(e.target.value)}
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, padding: "10px 12px", fontSize: 13 }}>
                <option value="GOVERNMENT">Government</option>
                <option value="LAW_ENFORCEMENT">Law Enforcement</option>
                <option value="NGO">NGO</option>
                <option value="RESEARCH">Research</option>
              </select>
            </div>
          </>}
          <Input label="Email" type="email" value={form.email} onChange={f("email")} placeholder="admin@mha.gov.in" />
          <Input label="Password" type="password" value={form.password} onChange={f("password")} placeholder="Min 8 characters" />
          {error && <div style={{ color: COLORS.accent, fontSize: 12, padding: 10, background: COLORS.accentDim, borderRadius: 6 }}>⚠ {error}</div>}
          <Btn onClick={submit} disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Submit Report Modal ───────────────────────────────────────
function SubmitReportModal({ onClose, onSubmitted }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!text.trim() || text.length < 10) return;
    setLoading(true); setError(null);
    try {
      const res = await api("/api/v1/reports", { method: "POST", body: JSON.stringify({ rawText: text, sourceType: "API_SUBMISSION" }) });
      if (res.reportCode) { setResult(res); onSubmitted(); }
      else setError(res.error || "Submission failed");
    } catch (e) { setError("Network error"); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000bb", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Submit Fraud Report</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textDim, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {!result ? <>
          <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 12 }}>Describe the fraud incident. AI will automatically classify it, extract details, and add it to the database.</div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder={"e.g. I received a WhatsApp message from +91-98XX saying I won ₹25 lakh in KBC lottery. They asked ₹2,000 as processing fee. I'm from Mumbai..."}
            style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, padding: 14, fontSize: 13, fontFamily: "monospace", resize: "vertical", minHeight: 140, outline: "none", lineHeight: 1.6, boxSizing: "border-box" }} />
          {error && <div style={{ color: COLORS.accent, fontSize: 12, padding: 10, background: COLORS.accentDim, borderRadius: 6, marginTop: 10 }}>⚠ {error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn onClick={onClose} variant="ghost">Cancel</Btn>
            <Btn onClick={submit} disabled={loading || text.length < 10}>{loading ? "⚡ Classifying & Saving..." : "⚡ Submit & Classify"}</Btn>
          </div>
        </> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ color: COLORS.green, fontWeight: 800, fontSize: 15 }}>✓ Report Submitted!</div>
            <div style={{ background: COLORS.bg, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div style={{ fontSize: 10, color: COLORS.textDim }}>REPORT CODE</div><div style={{ fontFamily: "monospace", color: COLORS.blue, fontWeight: 700 }}>{result.reportCode}</div></div>
                <div><div style={{ fontSize: 10, color: COLORS.textDim }}>TYPE</div><div style={{ fontSize: 12, color: COLORS.text }}>{result.classification?.fraudType?.replace(/_/g, " ")}</div></div>
                <div><div style={{ fontSize: 10, color: COLORS.textDim }}>SEVERITY</div><SeverityBadge level={result.classification?.severity} /></div>
                <div><div style={{ fontSize: 10, color: COLORS.textDim }}>CONFIDENCE</div><div style={{ fontSize: 12, color: COLORS.green }}>{Math.round((result.classification?.confidence || 0) * 100)}%</div></div>
              </div>
              {result.classification?.suggestedAction && (
                <div style={{ marginTop: 12, padding: 10, background: COLORS.goldDim, borderRadius: 6, borderLeft: `3px solid ${COLORS.gold}` }}>
                  <div style={{ fontSize: 10, color: COLORS.gold, marginBottom: 4 }}>SUGGESTED ACTION</div>
                  <div style={{ fontSize: 12, color: COLORS.text }}>{result.classification.suggestedAction}</div>
                </div>
              )}
            </div>
            <Btn onClick={onClose} variant="success">Done</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Classify Panel ─────────────────────────────────────────
function ClassifyPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const classify = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await api("/api/v1/classify", { method: "POST", body: JSON.stringify({ text: input }) });
      if (res.fraudType) setResult(res);
      else setError(res.error || "Classification failed");
    } catch (e) { setError("Classification failed. Check your connection."); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <textarea value={input} onChange={e => setInput(e.target.value)}
        placeholder={"Paste fraud report, complaint, or suspicious message here...\n\ne.g. 'I received a call from someone claiming to be from SBI asking for my OTP to update KYC...'"}
        style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, padding: 14, fontSize: 13, fontFamily: "monospace", resize: "vertical", minHeight: 110, outline: "none", lineHeight: 1.6, width: "100%", boxSizing: "border-box" }} />
      <Btn onClick={classify} disabled={loading || !input.trim()}>{loading ? "⚡ Classifying..." : "⚡ Classify with AI"}</Btn>
      {error && <div style={{ color: COLORS.accent, fontSize: 12, padding: 10, background: COLORS.accentDim, borderRadius: 6 }}>{error}</div>}
      {result && (
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.green}33`, borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: COLORS.green, fontWeight: 800, fontSize: 13 }}>{result.fraudType?.replace(/_/g, " ")}</span>
            <SeverityBadge level={result.severity} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Confidence", `${Math.round((result.confidence || 0) * 100)}%`], ["Est. Loss", result.estimatedLossInr ? `₹${result.estimatedLossInr?.toLocaleString()}` : "Unknown"], ["Target", result.targetDemographic], ["Action", result.suggestedAction]].map(([k, v]) => (
              <div key={k}><div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 2 }}>{k}</div><div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600 }}>{v}</div></div>
            ))}
          </div>
          {result.redFlags?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 6 }}>RED FLAGS</div>
              {result.redFlags.map((f, i) => <div key={i} style={{ fontSize: 11, color: COLORS.accent, marginBottom: 3 }}>⚑ {f}</div>)}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: 12, background: COLORS.goldDim, border: `1px solid ${COLORS.gold}33`, borderRadius: 8 }}>
        <div style={{ fontSize: 10, color: COLORS.gold, fontWeight: 700, marginBottom: 3 }}>💡 TRY AN EXAMPLE</div>
        <div style={{ fontSize: 11, color: COLORS.textDim, fontStyle: "italic", cursor: "pointer" }}
          onClick={() => setInput("I got a WhatsApp message saying I won ₹25 lakh in a KBC lottery. They asked ₹2,000 as processing fee. The number was +91-9876543210. I am from Ahmedabad, Gujarat.")}>
          "I got a WhatsApp message saying I won ₹25 lakh in a KBC lottery. They asked ₹2,000 as processing fee." ← click to use
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setUser({ token });
    setLoading(false);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, reportsRes, networksRes] = await Promise.all([
        api("/api/v1/stats/overview"),
        api("/api/v1/reports?limit=10"),
        api("/api/v1/patterns/networks"),
      ]);
      if (statsRes.total !== undefined) setStats(statsRes);
      if (reportsRes.data) setReports(reportsRes.data);
      if (networksRes.networks) setNetworks(networksRes.networks);
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const logout = () => { localStorage.removeItem("token"); setUser(null); };

  if (loading) return <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textDim }}>Loading...</div>;
  if (!user) return <AuthScreen onLogin={u => setUser(u)} />;

  const tabs = [{ id: "dashboard", label: "📊 Dashboard" }, { id: "classify", label: "⚡ AI Classify" }, { id: "patterns", label: "🕸 Patterns" }, { id: "reports", label: "📋 Reports" }];

  // Build chart data from real stats
  const fraudTypeData = stats?.byType?.map(t => ({
    type: FRAUD_TYPE_LABELS[t.fraudType] || t.fraudType,
    count: t._count,
    color: FRAUD_TYPE_COLORS[t.fraudType] || COLORS.textDim,
  })) || [];

  const stateData = stats?.byState?.map(s => ({
    name: s.state,
    cases: s._count,
    risk: s._count > 100 ? "critical" : s._count > 50 ? "high" : "medium",
  })) || [];

  const maxFraudCount = Math.max(...fraudTypeData.map(f => f.count), 1);
  const maxStateCount = Math.max(...stateData.map(s => s.cases), 1);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: COLORS.text }}>
      {showSubmit && <SubmitReportModal onClose={() => setShowSubmit(false)} onSubmitted={() => { setShowSubmit(false); fetchData(); }} />}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, background: COLORS.bg, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: COLORS.accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>⚑</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.5 }}>FRAUD INTEL INDIA</div>
            <div style={{ fontSize: 9, color: COLORS.textDim, letterSpacing: 1 }}>NATIONAL SCAM INTELLIGENCE PLATFORM</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn onClick={() => setShowSubmit(true)} variant="primary" style={{ padding: "7px 14px", fontSize: 12 }}>+ Submit Report</Btn>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.green, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>LIVE</span>
          <button onClick={logout} style={{ background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.textDim, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "0 24px", display: "flex", gap: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ background: "none", border: "none", color: activeTab === t.id ? COLORS.text : COLORS.textDim, padding: "12px 16px", fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400, cursor: "pointer", borderBottom: activeTab === t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent", marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              <StatCard label="Total Reports" value={stats?.total?.toLocaleString() ?? "—"} sub={stats?.recentCount ? `↑ ${stats.recentCount} this week` : "Loading..."} color={COLORS.accent} icon="📋" />
              <StatCard label="Scam Networks" value={networks.length || "0"} sub="Detected networks" color={COLORS.gold} icon="🕸" />
              <StatCard label="Fraud Types" value={fraudTypeData.length || "0"} sub="Categories tracked" color={COLORS.green} icon="📊" />
              <StatCard label="States Affected" value={stateData.length || "0"} sub="Across India" color={COLORS.blue} icon="🗺" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: 1, marginBottom: 16 }}>FRAUD TYPES — BREAKDOWN</div>
                {fraudTypeData.length === 0 ? (
                  <div style={{ color: COLORS.textMuted, fontSize: 12, padding: 20, textAlign: "center" }}>
                    No data yet.<br />
                    <span style={{ color: COLORS.accent, cursor: "pointer" }} onClick={() => setShowSubmit(true)}>Submit your first report →</span>
                  </div>
                ) : fraudTypeData.map((f, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: COLORS.text }}>{f.type}</span>
                      <span style={{ fontSize: 12, color: COLORS.textDim, fontFamily: "monospace" }}>{f.count.toLocaleString()}</span>
                    </div>
                    <RiskBar value={f.count} max={maxFraudCount} color={f.color} />
                  </div>
                ))}
              </div>

              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: 1, marginBottom: 16 }}>STATE RISK MAP — TOP 10</div>
                {stateData.length === 0 ? (
                  <div style={{ color: COLORS.textMuted, fontSize: 12, padding: 20, textAlign: "center" }}>No location data yet.<br />Reports with state info will appear here.</div>
                ) : stateData.slice(0, 10).map((s, i) => {
                  const riskColor = s.risk === "critical" ? COLORS.accent : s.risk === "high" ? COLORS.gold : COLORS.blue;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: i % 2 === 0 ? "#ffffff05" : "transparent" }}>
                      <span style={{ fontSize: 11, color: COLORS.textDim, width: 20, textAlign: "right", fontFamily: "monospace" }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: COLORS.text, flex: 1 }}>{s.name}</span>
                      <RiskBar value={s.cases} max={maxStateCount} color={riskColor} />
                      <span style={{ fontSize: 11, color: COLORS.textDim, fontFamily: "monospace", width: 45, textAlign: "right" }}>{s.cases}</span>
                      <span style={{ fontSize: 9, color: riskColor, fontWeight: 700, width: 50, textAlign: "right", letterSpacing: 0.5 }}>{s.risk.toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live report feed */}
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: 1 }}>LIVE REPORT FEED</div>
                </div>
                <button onClick={fetchData} style={{ background: "none", border: `1px solid ${COLORS.border}`, color: COLORS.textDim, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>↻ Refresh</button>
              </div>
              {reports.length === 0 ? (
                <div style={{ color: COLORS.textMuted, fontSize: 12, padding: 20, textAlign: "center" }}>
                  No reports yet. <span style={{ color: COLORS.accent, cursor: "pointer" }} onClick={() => setShowSubmit(true)}>Submit the first one →</span>
                </div>
              ) : reports.map((r, i) => (
                <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: i < reports.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.textMuted, width: 80, flexShrink: 0 }}>{r.reportCode}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{FRAUD_TYPE_LABELS[r.fraudType] || r.fraudType}</span>
                      <SeverityBadge level={r.severity} />
                      {r.city && <span style={{ fontSize: 11, color: COLORS.textDim }}>📍 {r.city}{r.state ? `, ${r.state}` : ""}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textDim }}>{r.modusOperandi || "—"}</div>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLASSIFY TAB */}
        {activeTab === "classify" && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>AI Fraud Classifier</div>
              <div style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.6 }}>Paste any complaint, FIR text, or suspicious message. Claude AI classifies it instantly — type, severity, red flags, and recommended action.</div>
            </div>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <ClassifyPanel />
            </div>
          </div>
        )}

        {/* PATTERNS TAB */}
        {activeTab === "patterns" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Scam Network Patterns</div>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textDim, letterSpacing: 1, marginBottom: 14 }}>🕸 DETECTED SCAM NETWORKS</div>
              {networks.length === 0 ? (
                <div style={{ color: COLORS.textMuted, fontSize: 12, padding: 20, textAlign: "center" }}>No networks detected yet. Networks are auto-detected as reports come in.</div>
              ) : networks.map((n, i) => (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < networks.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.blue, width: 140 }}>{n.id.slice(0, 8)}...</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{n.name}</div>
                    {n.description && <div style={{ fontSize: 11, color: COLORS.textDim }}>{n.description}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.text }}>{n._count?.reports || 0}</div>
                    <div style={{ fontSize: 10, color: COLORS.textDim }}>linked cases</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>All Reports</div>
              <Btn onClick={() => setShowSubmit(true)}>+ Submit Report</Btn>
            </div>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
              {reports.length === 0 ? (
                <div style={{ color: COLORS.textMuted, fontSize: 12, padding: 40, textAlign: "center" }}>No reports yet.</div>
              ) : reports.map((r, i) => (
                <div key={r.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 16, padding: "14px 20px", borderBottom: i < reports.length - 1 ? `1px solid ${COLORS.border}` : "none", alignItems: "start" }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: COLORS.blue }}>{r.reportCode}</div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{FRAUD_TYPE_LABELS[r.fraudType] || r.fraudType}</span>
                      <SeverityBadge level={r.severity} />
                      {r.city && <span style={{ fontSize: 11, color: COLORS.textDim }}>📍 {r.city}{r.state ? `, ${r.state}` : ""}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textDim }}>{r.modusOperandi || "—"}</div>
                    {r.redFlags?.length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.redFlags.slice(0, 2).map((f, fi) => (
                          <span key={fi} style={{ fontSize: 10, color: COLORS.accent, background: COLORS.accentDim, padding: "2px 6px", borderRadius: 4 }}>⚑ {f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {r.estimatedLossInr && <div style={{ fontSize: 12, color: COLORS.gold, fontWeight: 700 }}>₹{r.estimatedLossInr.toLocaleString()}</div>}
                    <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>{r.sourceType?.replace(/_/g, " ")}</div>
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
