import { useState, useEffect } from "react";

const API = "https://fraud-intel-production.up.railway.app";

const COLORS = {
  bg: "#0a0c10",
  surface: "#111318",
  border: "#1e2330",
  accent: "#ff3b3b",
  gold: "#f5a623",
  green: "#00d4aa",
  blue: "#4a9eff",
  text: "#e8eaf0",
  textDim: "#7a8099"
};

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: 20
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.textDim }}>{label}</div>
    </div>
  );
}

function ClassifyPanel() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const classify = async () => {
    if (!text) return;

    setLoading(true);

    try {
      const res = await fetch(API + "/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert("classification failed");
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste suspicious message or fraud report..."
        style={{
          padding: 12,
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bg,
          color: COLORS.text
        }}
      />

      <button
        onClick={classify}
        style={{
          background: COLORS.accent,
          color: "white",
          border: "none",
          padding: 10,
          borderRadius: 8,
          cursor: "pointer"
        }}
      >
        {loading ? "Analyzing..." : "AI Classify"}
      </button>

      {result && (
        <div
          style={{
            background: COLORS.surface,
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`
          }}
        >
          <div><b>Fraud Type:</b> {result.fraud_type}</div>
          <div><b>Severity:</b> {result.severity}</div>
          <div><b>Confidence:</b> {result.confidence}</div>
        </div>
      )}
    </div>
  );
}

export default function FraudIntelPlatform() {
  const [tab, setTab] = useState("dashboard");

  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    fetch(API + "/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => console.log("stats failed"));

    fetch(API + "/api/threats")
      .then((r) => r.json())
      .then((data) => setThreats(data))
      .catch(() => console.log("threats failed"));
  }, []);

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        padding: 30,
        color: COLORS.text,
        fontFamily: "Segoe UI"
      }}
    >
      <h2>Fraud Intel India</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("dashboard")}>Dashboard</button>
        <button onClick={() => setTab("classify")}>AI Classify</button>
      </div>

      {tab === "dashboard" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          <StatCard
            label="Total Reports"
            value={stats ? stats.total_reports : "..."}
          />

          <StatCard
            label="Active Networks"
            value={stats ? stats.active_networks : "..."}
          />

          <StatCard
            label="Estimated Loss"
            value={stats ? stats.estimated_losses : "..."}
          />

          <div style={{ gridColumn: "1 / span 3" }}>
            <h3>Top Fraud Types</h3>

            {threats.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: 10,
                  borderBottom: `1px solid ${COLORS.border}`
                }}
              >
                {t.type} — {t.count}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "classify" && <ClassifyPanel />}
    </div>
  );
}
