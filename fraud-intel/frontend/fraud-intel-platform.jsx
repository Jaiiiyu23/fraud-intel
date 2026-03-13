import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Shield,
  BarChart3,
  Activity,
  Brain,
} from "lucide-react";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const API = "https://fraud-intel-production.up.railway.app";

const chartData = [
  { day: "Mon", cases: 120 },
  { day: "Tue", cases: 180 },
  { day: "Wed", cases: 240 },
  { day: "Thu", cases: 200 },
  { day: "Fri", cases: 260 },
  { day: "Sat", cases: 300 },
  { day: "Sun", cases: 280 },
];

function StatCard({ icon, title, value }) {
  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ color: "#94a3b8", fontSize: 13 }}>{title}</div>
    </div>
  );
}

const cardStyle = {
  background: "#111827",
  padding: 24,
  borderRadius: 12,
  border: "1px solid #1f2937",
};

export default function FraudIntelPlatform() {
  const [stats, setStats] = useState({
    total_reports: 0,
    high_severity: 0,
    medium_severity: 0,
  });

  const [frauds, setFrauds] = useState([]);

  useEffect(() => {
    fetch(API + "/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});

    fetch(API + "/fraud-types")
      .then((r) => r.json())
      .then((d) => setFrauds(d))
      .catch(() => {});
  }, []);

  return (
    <div style={container}>
      {/* Navbar */}

      <div style={navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={24} color="#22c55e" />
          <b>Fraud Intel</b>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <span>Dashboard</span>
          <span>AI Classify</span>
          <span>Reports</span>
        </div>
      </div>

      {/* Cards */}

      <div style={grid}>
        <StatCard
          icon={<Activity size={22} />}
          title="Total Reports"
          value={stats.total_reports}
        />

        <StatCard
          icon={<AlertTriangle size={22} color="#ef4444" />}
          title="High Severity"
          value={stats.high_severity}
        />

        <StatCard
          icon={<BarChart3 size={22} color="#f59e0b" />}
          title="Medium Severity"
          value={stats.medium_severity}
        />

        <StatCard
          icon={<Brain size={22} color="#3b82f6" />}
          title="AI Detections"
          value="42"
        />
      </div>

      {/* Chart */}

      <div style={{ ...cardStyle, marginTop: 30 }}>
        <h3>Fraud Reports Trend</h3>

        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="cases"
                stroke="#22c55e"
                strokeWidth={2}
              />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fraud Types */}

      <div style={{ ...cardStyle, marginTop: 30 }}>
        <h3>Top Fraud Types</h3>

        {frauds.map((f, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: "1px solid #1f2937",
            }}
          >
            <span>{f.type}</span>
            <b>{f.count}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

const container = {
  background: "#0b0f19",
  minHeight: "100vh",
  padding: 40,
  color: "#e2e8f0",
  fontFamily: "Inter, sans-serif",
};

const navbar = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 30,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: 20,
};
