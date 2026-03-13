import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "https://fraud-intel-production.up.railway.app";

const C = {
  bg: "#0a0c10", surface: "#111318", border: "#1e2330",
  accent: "#ff3b3b", accentDim: "#ff3b3b22",
  gold: "#f5a623", goldDim: "#f5a62322",
  green: "#00d4aa", greenDim: "#00d4aa22",
  blue: "#4a9eff", blueDim: "#4a9eff22",
  purple: "#c084fc",
  text: "#e8eaf0", textDim: "#7a8099", textMuted: "#3d4460",
};

const FRAUD_TYPE_DISPLAY = {
  UPI_PAYMENT_FRAUD: { label: "UPI / Payment Fraud", icon: "₹", color: "#ff3b3b" },
  INVESTMENT_STOCK_SCAM: { label: "Investment / Stock Scam", icon: "📈", color: "#f5a623" },
  JOB_RECRUITMENT_FRAUD: { label: "Job / Recruitment Fraud", icon: "💼", color: "#4a9eff" },
  IMPERSONATION_KYC: { label: "Impersonation (KYC/Bank)", icon: "🪪", color: "#00d4aa" },
  CYBER_BLACKMAIL: { label: "Cyber Blackmail / Sextortion", icon: "⚠️", color: "#c084fc" },
  LOTTERY_PRIZE_FRAUD: { label: "Lottery / Prize Fraud", icon: "🎰", color: "#7a8099" },
  COURIER_SCAM: { label: "Courier / Parcel Scam", icon: "📦", color: "#f5a623" },
  LOAN_FRAUD: { label: "Loan / Finance Fraud", icon: "🏦", color: "#4a9eff" },
  OTHER_FRAUD: { label: "Other Fraud", icon: "🔍", color: "#7a8099" },
};

function api(path, opts = {}, token) {
  return fetch(`${API}/api/v1${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  }).then(r => r.json());
}

function SeverityBadge({ level }) {
  const map = {
    CRITICAL: { bg: "#ff3b3b22", color: "#ff3b3b" },
    HIGH: { bg: "#f5a62322", color: "#f5a623" },
    MEDIUM: { bg: "#4a9eff22", color: "#4a9eff" },
    LOW: { bg: "#00d4aa22", color: "#00d4aa" },
  };
  const s = map[level?.toUpperCase()] || map.MEDIUM;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, letterSpacing: 1, fontFamily: "monospace" }}>
      {level?.toUpperCase() || "MEDIUM"}
    </span>
  );
}

function RiskBar({ value, max, color }) {
  return (
    <div style={{ background: "#1e2330", borderRadius: 4, height: 4, flex: 1 }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", orgName: "", adminName: "", orgType: "GOVERNMENT" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true); setError("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, orgName: form.orgName, adminName: form.adminName, orgType: form.orgType };
      const data = await api(endpoint, { method: "POST", body: JSON.stringify(body) });
      if (data.token) {
        localStorage.setItem("fi_token", data.token);
        localStorage.setItem("fi_user", JSON.stringify(data.user || data));
        onLogin(data.token, data.user || data);
      } else {
        setError(data.error || data.message || "Failed. Check credentials.");
      }
    } catch (e) {
      setError("Network error — is backend running?");
    }
    setLoading(false);
  };

  const inp = (key, placeholder, type = "text") => (
    <input type={type} placeholder={placeholder} value={form[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      onKeyDown={e => e.key === "Enter" && submit()}
      style={{ background: "#0a0c10", border: "1px solid #1e2330", borderRadius: 8, color: "#e8eaf0", padding: "11px 14px", fontSize: 13, width: "100%", outline: "none" }}
    />
  );

  return (
    <div style={{ background: "#0a0c10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ background: "#111318", border: "1px solid #1e2330", borderRadius: 16, padding: 36, width: 400, maxWidth: "90vw" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, background: "#ff3b3b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚑</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#e8eaf0" }}>FRAUD INTEL INDIA</div>
            <div style={{ fontSize: 10, color: "#7a8099", letterSpacing: 1 }}>NATIONAL SCAM INTELLIGENCE PLATFORM</div>
          </div>
        </div>
        <div style={{ display: "flex", background: "#0a0c10", borderRadius: 8, padding: 3, marginBottom: 20 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px", background: mode === m ? "#111318" : "none", border: mode === m ? "1px solid #1e2330" : "none", borderRadius: 6, color: mode === m ? "#e8eaf0" : "#7a8099", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {m === "login" ? "Sign In" : "Register Org"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mode === "register" && inp("orgName", "Organization Name")}
          {mode === "register" && inp("adminName", "Your Name")}
          {mode === "register" && (
            <select value={form.orgType} onChange={e => setForm(f => ({ ...f, orgType: e.target.value }))}
              style={{ background: "#0a0c10", border: "1px solid #1e2330", borderRadius: 8, color: "#e8eaf0", padding: "11px 14px", fontSize: 13, outline: "none" }}>
              <option value="GOVERNMENT">Government</option>
              <option value="POLICE">Police</option>
              <option value="BANK">Bank / NBFC</option>
              <option value="RESEARCH">Research</option>
              <option value="NGO">NGO</option>
            </select>
          )}
          {inp("email", "Email", "email")}
          {inp("password", "Password", "password")}
          {error && <div style={{ color: "#ff3b3b", fontSize: 12, padding: "8px 12px", background: "#ff3b3b22", borderRadius: 6 }}>⚠ {error}</div>}
          <button onClick={submit} disabled={loading} style={{ background: loading ? "#1e2330" : "#ff3b3b", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmitReportModal({ token, onClose, onSuccess }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true); setError("");
    try {
      const data = await api("/reports", { method: "POST", body: JSON.stringify({ rawText: text, sourceType: "MANUAL_SUBMISSION" }) }, token);
      if (data.id || data.reportCode) { setResult(data); onSuccess(); }
      else setError(data.error || data.message || "Submission failed");
    } catch (e) { setError("Network error"); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#111318", border: "1px solid #1e2330", borderRadius: 16, padding: 28, width: 560, maxWidth: "92vw", maxHeight: "85vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#e8eaf0" }}>Submit Fraud Report</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7a8099", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        {!result ? (
          <>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder={"Describe the fraud in detail...\n\ne.g. 'A person from Mumbai received a WhatsApp message from someone claiming to be SBI Bank asking to update KYC. They clicked a link and ₹85,000 was debited from their account.'"}
              style={{ background: "#0a0c10", border: "1px solid #1e2330", borderRadius: 8, color: "#e8eaf0", padding: 14, fontSize: 13, fontFamily: "monospace", resize: "vertical", minHeight: 130, width: "100%", outline: "none", lineHeight: 1.6 }}
            />
            {error && <div style={{ color: "#ff3b3b", fontSize: 12, padding: "8px 12px", background: "#ff3b3b22", borderRadius: 6, marginTop: 8 }}>⚠ {error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={onClose} style={{ flex: 1, background: "#0a0c10", border: "1px solid #1e2330", color: "#7a8099", borderRadius: 8, padding: "10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={submit} disabled={loading || !text.trim()} style={{ flex: 2, background: loading ? "#1e2330" : "#ff3b3b", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "⚡ Classifying with AI..." : "⚡ Submit & Classify"}
              </button>
            </div>
          </>
        ) : (
          <div>
            <div style={{ padding: 14, background: "#00d4aa22", border: "1px solid #00d4aa44", borderRadius: 8, marginBottom: 14 }}>
              <div style={{ color: "#00d4aa", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>✓ Report submitted successfully</div>
              <div style={{ color: "#7a8099", fontSize: 12 }}>Report ID: {result.reportCode || result.id}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[["Fraud Type", (result.fraudType || "").replace(/_/g, " ")], ["Severity", result.severity], ["Confidence", result.confidence ? `${Math.round(result.confidence * 100)}%` : "N/A"], ["Location", result.location || "Unknown"]].map(([k, v]) => (
                <div key={k} style={{ background: "#0a0c10", padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "#7a8099", marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13, color: "#e8eaf0", fontWeight: 600 }}>{v || "—"}</div>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ width: "100%", background: "#ff3b3b", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardTab({ token, refresh }) {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r, n] = await Promise.all([
        api("/stats/overview", {}, token),
        api("/reports?limit=10", {}, token),
        api("/patterns/networks?limit=6", {}, token),
      ]);
      setStats(s);
      setReports(Array.isArray(r) ? r : r.reports || r.data || []);
      setNetworks(Array.isArray(n) ? n : n.networks || n.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load, refresh]);

  const seedData = async () => {
    setSeeding(true); setSeedMsg("");
    try {
      const data = await api("/admin/seed", { method: "POST" }, token);
      setSeedMsg(data.message || `✓ Seeded ${data.count || ""} real fraud cases!`);
      setTimeout(() => { setSeedMsg(""); load(); }, 3000);
    } catch (e) { setSeedMsg("Seed failed — check Railway logs"); }
    setSeeding(false);
  };

  const fraudTypeCounts = {};
  reports.forEach(r => { if (r.fraudType) fraudTypeCounts[r.fraudType] = (fraudTypeCounts[r.fraudType] || 0) + 1; });
  const stateCounts = {};
  reports.forEach(r => { if (r.location) stateCounts[r.location] = (stateCounts[r.location] || 0) + 1; });
  const topStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxState = topStates[0]?.[1] || 1;
  const totalReports = stats?.totalReports || reports.length || 0;

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, color: "#7a8099", fontSize: 13 }}>Loading real data from backend...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {totalReports === 0 && (
        <div style={{ background: "#f5a62322", border: "1px solid #f5a62344", borderRadius: 12, padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f5a623", marginBottom: 3 }}>📦 No reports yet</div>
            <div style={{ fontSize: 12, color: "#7a8099" }}>Seed the database with real Indian cybercrime cases to see the dashboard in action.</div>
          </div>
          <button onClick={seedData} disabled={seeding} style={{ background: "#f5a623", color: "#000", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 12, fontWeight: 800, cursor: seeding ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
            {seeding ? "Seeding..." : "🌱 Seed Real Cases"}
          </button>
        </div>
      )}
      {seedMsg && <div style={{ padding: 12, background: "#00d4aa22", border: "1px solid #00d4aa44", borderRadius: 8, color: "#00d4aa", fontSize: 13 }}>{seedMsg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {[
          { label: "Total Reports", value: totalReports.toLocaleString(), sub: "In database", color: "#ff3b3b", icon: "📋" },
          { label: "Scam Networks", value: (stats?.totalNetworks || networks.length || 0).toString(), sub: "Detected networks", color: "#f5a623", icon: "🕸" },
          { label: "Fraud Types", value: Object.keys(fraudTypeCounts).length.toString(), sub: "Categories tracked", color: "#00d4aa", icon: "📊" },
          { label: "States Affected", value: (stats?.statesAffected || topStates.length || 0).toString(), sub: "Across India", color: "#4a9eff", icon: "🗺" },
        ].map(s => (
          <div key={s.label} style={{ background: "#111318", border: "1px solid #1e2330", borderRadius: 12, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#e8eaf0", fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#7a8099", marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.color, marginTop: 6, fontWeight: 600 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#111318", border: "1px solid #1e2330", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7a8099", letterSpacing: 1, marginBottom: 16 }}>FRAUD TYPES — BREAKDOWN</div>
          {Object.keys(fraudTypeCounts).length === 0 ? (
            <div style={{ color: "#3d4460", fontSize: 12, textAlign: "center", padding: 30 }}>No data yet.<br /><span style={{ color: "#ff3b3b" }}>Submit your first report →</span></div>
          ) : Object.entries(fraudTypeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
            const d = FRAUD_TYPE_DISPLAY[type] || { label: type.replace(/_/g, " "), icon: "🔍", color: "#7a8099" };
            return (
              <div key={type} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span>{d.icon}</span>
                    <span style={{ fontSize: 12, color: "#e8eaf0" }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#7a8099", fontFamily: "monospace" }}>{count}</span>
                </div>
                <RiskBar value={count} max={Math.max(...Object.values(fraudTypeCounts))} color={d.color} />
              </div>
            );
          })}
        </div>

        <div style={{ background: "#111318", border: "1px solid #1e2330", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7a8099", letterSpacing: 1, marginBottom: 16 }}>STATE RISK MAP — TOP {topStates.length || 0}</div>
          {topStates.length === 0 ? (
            <div style={{ color: "#3d4460", fontSize: 12, textAlign: "center", padding: 30 }}>No location data yet.<br />Reports with state info will appear here.</div>
          ) : topStates.map(([state, count], i) => {
            const pct = count / maxState;
            const riskColor = pct > 0.7 ? "#ff3b3b" : pct > 0.4 ? "#f5a623" : "#4a9eff";
            const riskLabel = pct > 0.7 ? "CRITICAL" : pct > 0.4 ? "HIGH" : "MEDIUM";
            return (
              <div key={state} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 6, marginBottom: 3, background: i % 2 === 0 ? "#ffffff05" : "transparent" }}>
                <span style={{ fontSize: 11, color: "#3d4460", width: 18, textAlign: "right", fontFamily: "monospace" }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: "#e8eaf0", flex: 1 }}>{state}</span>
                <RiskBar value={count} max={maxState} color={riskColor} />
                <span style={{ fontSize: 11, color: "#7a8099", fontFamily: "monospace", width: 32, textAlign: "right" }}>{count}</span>
                <span style={{ fontSize: 9, color: riskColor, fontWeight: 700, width: 48, textAlign: "right", letterSpacing: 0.5 }}>{riskLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: "#111318", border: "1px solid #1e2330", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4aa" }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: "#7a8099", letterSpacing: 1 }}>LIVE REPORT FEED</div>
          </div>
          <button onClick={load} style={{ background: "none", border: "1px solid #1e2330", color: "#7a8099", fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>↻ Refresh</button>
        </div>
        {reports.length === 0 ? (
          <div style={{ color: "#3d4460", fontSize: 12, textAlign: "center", padding: 30 }}>No reports yet. Submit the first one using "+ Submit Report".</div>
        ) : reports.slice(0, 10).map((r, i) => {
          const d = FRAUD_TYPE_DISPLAY[r.fraudType] || { label: r.fraudType?.replace(/_/g, " ") || "Unknown", icon: "🔍" };
          return (
            <div key={r.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "11px 0", borderBottom: i < reports.length - 1 ? "1px solid #1e2330" : "none" }}>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: "#3d4460", width: 72, flexShrink: 0 }}>{r.reportCode || `RPT-${i+1}`}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#e8eaf0" }}>{d.icon} {d.label}</span>
                  <SeverityBadge level={r.severity} />
                  {r.location && <span style={{ fontSize: 11, color: "#7a8099" }}>📍 {r.location}</span>}
                  {r.sourceType && <span style={{ fontSize: 9, color: "#3d4460", fontFamily: "monospace", background: "#1e2330", padding: "2px 5px", borderRadius: 3 }}>{r.sourceType?.replace(/_/g, " ")}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#7a8099", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 }}>
                  {r.summary || r.rawText?.substring(0, 120) || "No summary"}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#3d4460", flexShrink: 0 }}>
                {r.createdAt ? new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClassifyTab({ token }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const classify = async () => {
    setLoading(true); setResult(null); setError(""); setSaved(false);
    try {
      const data = await api("/classify", { method: "POST", body: JSON.stringify({ text }) }, token);
      if (data.fraudType || data.fraud_type) setResult(data);
      else setError(data.error || data.message || "Classification failed");
    } catch (e) { setError("Network error"); }
    setLoading(false);
  };

  const saveToDb = async () => {
    try {
      await api("/reports", { method: "POST", body: JSON.stringify({ rawText: text, sourceType: "MANUAL_SUBMISSION", ...result }) }, token);
      setSaved(true);
    } catch (e) {}
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>AI Fraud Classifier</div>
        <div style={{ fontSize: 13, color: "#7a8099", lineHeight: 1.6 }}>Paste any complaint, FIR text, or suspicious message. The system classifies it instantly.</div>
      </div>
      <div style={{ background: "#111318", border: "1px solid #1e2330", borderRadius: 12, padding: 20 }}>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder={"Paste fraud report or suspicious message...\n\ne.g. 'I received a call from someone claiming to be from SBI asking for my OTP to update KYC...'"}
          style={{ background: "#0a0c10", border: "1px solid #1e2330", borderRadius: 8, color: "#e8eaf0", padding: 14, fontSize: 13, fontFamily: "monospace", resize: "vertical", minHeight: 120, width: "100%", outline: "none", lineHeight: 1.6 }}
        />
        <button onClick={classify} disabled={loading || !text.trim()} style={{ width: "100%", marginTop: 10, background: loading ? "#1e2330" : "#ff3b3b", color: "#fff", border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "⚡ Classifying..." : "⚡ Classify with AI"}
        </button>
        {error && <div style={{ color: "#ff3b3b", fontSize: 12, padding: 10, background: "#ff3b3b22", borderRadius: 6, marginTop: 10 }}>⚠ {error}</div>}
        {result && (
          <div style={{ background: "#0a0c10", border: "1px solid #00d4aa33", borderRadius: 8, padding: 16, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <span style={{ color: "#00d4aa", fontWeight: 800, fontSize: 13 }}>{(result.fraudType || result.fraud_type || "").replace(/_/g, " ")}</span>
              <SeverityBadge level={result.severity} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[["Confidence", result.confidence ? `${Math.round(result.confidence * 100)}%` : "N/A"], ["Location", result.location || "Unknown"], ["Action", result.suggestedAction || "Monitor"], ["Source", "Manual Input"]].map(([k, v]) => (
                <div key={k}><div style={{ fontSize: 10, color: "#7a8099", marginBottom: 2 }}>{k}</div><div style={{ fontSize: 12, color: "#e8eaf0", fontWeight: 600 }}>{v}</div></div>
              ))}
            </div>
            {result.redFlags?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#7a8099", marginBottom: 6 }}>RED FLAGS</div>
                {result.redFlags.map((f, i) => <div key={i} style={{ fontSize: 11, color: "#ff3b3b", marginBottom: 3 }}>⚑ {f}</div>)}
              </div>
            )}
            <button onClick={saveToDb} disabled={saved} style={{ width: "100%", background: saved ? "#00d4aa" : "#111318", border: `1px solid ${saved ? "#00d4aa" : "#1e2330"}`, color: saved ? "#000" : "#e8eaf0", borderRadius: 6, padding: "8px", fontSize: 12, cursor: saved ? "default" : "pointer", fontWeight: 600 }}>
              {saved ? "✓ Saved to database" : "💾 Save to database"}
            </button>
          </div>
        )}
        <div style={{ padding: 12, background: "#f5a62322", border: "1px solid #f5a62333", borderRadius: 8, marginTop: 14 }}>
          <div style={{ fontSize: 10, color: "#f5a623", fontWeight: 700, marginBottom: 3 }}>💡 TRY AN EXAMPLE</div>
          <div style={{ fontSize: 11, color: "#7a8099", fontStyle: "italic", cursor: "pointer" }} onClick={() => setText("I got a WhatsApp message saying I won ₹25 lakh in KBC lottery. They asked for ₹2,000 as processing fee and said RBI officer will call to verify.")}>"I got a WhatsApp message saying I won ₹25 lakh in KBC lottery..."</div>
        </div>
      </div>
    </div>
  );
}

function ReportsTab({ token }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api(`/reports?limit=20&page=${page}`, {}, token)
      .then(d => setReports(Array.isArray(d) ? d : d.reports || d.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [token, page]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>All Reports</div>
      <div style={{ background: "#111318", border: "1px solid #1e2330", borderRadius: 12, padding: 20 }}>
        {loading ? <div style={{ color: "#7a8099", fontSize: 13, padding: 20 }}>Loading...</div> :
         reports.length === 0 ? <div style={{ color: "#3d4460", fontSize: 12, textAlign: "center", padding: 40 }}>No reports yet.</div> :
         reports.map((r, i) => {
           const d = FRAUD_TYPE_DISPLAY[r.fraudType] || { label: r.fraudType?.replace(/_/g, " ") || "Unknown", icon: "🔍" };
           return (
             <div key={r.id || i} style={{ padding: "14px 0", borderBottom: i < reports.length - 1 ? "1px solid #1e2330" : "none" }}>
               <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                 <div style={{ fontFamily: "monospace", fontSize: 10, color: "#3d4460", width: 80, flexShrink: 0, paddingTop: 2 }}>{r.reportCode || `RPT-${i+1}`}</div>
                 <div style={{ flex: 1 }}>
                   <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                     <span style={{ fontSize: 13, fontWeight: 700, color: "#e8eaf0" }}>{d.icon} {d.label}</span>
                     <SeverityBadge level={r.severity} />
                     {r.location && <span style={{ fontSize: 11, color: "#7a8099" }}>📍 {r.location}</span>}
                   </div>
                   <div style={{ fontSize: 12, color: "#7a8099", lineHeight: 1.5 }}>{r.summary || r.rawText?.substring(0, 180)}</div>
                   {r.redFlags?.length > 0 && (
                     <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                       {r.redFlags.slice(0, 3).map((f, j) => <span key={j} style={{ fontSize: 10, color: "#ff3b3b", background: "#ff3b3b22", padding: "2px 7px", borderRadius: 4 }}>⚑ {f}</span>)}
                     </div>
                   )}
                 </div>
                 <div style={{ fontSize: 11, color: "#3d4460", flexShrink: 0 }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : ""}</div>
               </div>
             </div>
           );
         })}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{ background: "#111318", border: "1px solid #1e2330", color: page === 1 ? "#3d4460" : "#e8eaf0", borderRadius: 6, padding: "7px 16px", fontSize: 12, cursor: page === 1 ? "not-allowed" : "pointer" }}>← Prev</button>
        <span style={{ color: "#7a8099", fontSize: 12, lineHeight: "30px" }}>Page {page}</span>
        <button onClick={() => setPage(p => p+1)} disabled={reports.length < 20} style={{ background: "#111318", border: "1px solid #1e2330", color: reports.length < 20 ? "#3d4460" : "#e8eaf0", borderRadius: 6, padding: "7px 16px", fontSize: 12, cursor: reports.length < 20 ? "not-allowed" : "pointer" }}>Next →</button>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("fi_token"));
  const [tab, setTab] = useState("dashboard");
  const [showSubmit, setShowSubmit] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const logout = () => { localStorage.removeItem("fi_token"); localStorage.removeItem("fi_user"); setToken(null); };
  const onLogin = (t) => setToken(t);
  const onReportSuccess = () => { setShowSubmit(false); setRefreshKey(k => k + 1); };

  if (!token) return <AuthScreen onLogin={onLogin} />;

  const tabs = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "classify", label: "⚡ AI Classify" },
    { id: "reports", label: "📋 Reports" },
  ];

  return (
    <div style={{ background: "#0a0c10", minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e8eaf0" }}>
      <div style={{ borderBottom: "1px solid #1e2330", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, background: "#0a0c10", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#ff3b3b", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900 }}>⚑</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.5 }}>FRAUD INTEL INDIA</div>
            <div style={{ fontSize: 9, color: "#7a8099", letterSpacing: 1 }}>NATIONAL SCAM INTELLIGENCE PLATFORM</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowSubmit(true)} style={{ background: "#ff3b3b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Submit Report</button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00d4aa" }} />
            <span style={{ fontSize: 11, color: "#00d4aa", fontWeight: 600 }}>LIVE</span>
          </div>
          <button onClick={logout} style={{ background: "none", border: "1px solid #1e2330", color: "#7a8099", borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>Logout</button>
        </div>
      </div>
      <div style={{ borderBottom: "1px solid #1e2330", padding: "0 24px", display: "flex", gap: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", color: tab === t.id ? "#e8eaf0" : "#7a8099", padding: "12px 16px", fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", borderBottom: tab === t.id ? "2px solid #ff3b3b" : "2px solid transparent", marginBottom: -1 }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        {tab === "dashboard" && <DashboardTab token={token} refresh={refreshKey} />}
        {tab === "classify" && <ClassifyTab token={token} />}
        {tab === "reports" && <ReportsTab token={token} />}
      </div>
      {showSubmit && <SubmitReportModal token={token} onClose={() => setShowSubmit(false)} onSuccess={onReportSuccess} />}
      <style>{`* { box-sizing: border-box; }`}</style>
    </div>
  );
}
