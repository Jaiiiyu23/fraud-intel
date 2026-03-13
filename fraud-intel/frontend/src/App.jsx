import { useEffect, useState } from "react";

function App() {

  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState(null);

  const API = "https://fraud-intel-production.up.railway.app";

  useEffect(() => {

    fetch(API + "/api/stats")
      .then(res => res.json())
      .then(data => setStats(data));

    fetch(API + "/api/threats")
      .then(res => res.json())
      .then(data => setThreats(data));

  }, []);

  return (

    <div style={{
      background:"#0f172a",
      minHeight:"100vh",
      color:"white",
      padding:"40px",
      fontFamily:"Arial"
    }}>

      <h1 style={{fontSize:"32px", marginBottom:"30px"}}>
        Fraud Intel Dashboard
      </h1>

      {stats && (
        <div style={{display:"flex", gap:"20px", marginBottom:"40px"}}>

          <div style={{background:"#1e293b", padding:"20px", borderRadius:"10px"}}>
            <h3>Total Reports</h3>
            <h2>{stats.totalReports}</h2>
          </div>

          <div style={{background:"#7f1d1d", padding:"20px", borderRadius:"10px"}}>
            <h3>High Severity</h3>
            <h2>{stats.highSeverity}</h2>
          </div>

          <div style={{background:"#854d0e", padding:"20px", borderRadius:"10px"}}>
            <h3>Medium Severity</h3>
            <h2>{stats.mediumSeverity}</h2>
          </div>

        </div>
      )}

      {threats && (
        <div style={{background:"#1e293b", padding:"20px", borderRadius:"10px"}}>

          <h2>Top Fraud Types</h2>

          {threats.topThreats.map(t => (
            <div key={t.fraudType} style={{display:"flex", justifyContent:"space-between", marginTop:"10px"}}>
              <span>{t.fraudType}</span>
              <span>{t.reports}</span>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default App;
