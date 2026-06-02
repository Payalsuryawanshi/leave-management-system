import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getBalance, getMyHistory, cancelLeave } from "../services/leaveService";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [pending, setPending] = useState([]);

  const loadData = () => {
    getBalance().then((r) => setBalances(r.data)).catch(() => {});
    getMyHistory().then((r) => {
      setPending(r.data.filter((l) => l.status === "Pending"));
    }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      await cancelLeave(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not cancel");
    }
  };

  const colors = ["#0070f3", "#00b894", "#e17055", "#6c5ce7"];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Welcome, {user?.name || "Employee"}</h2>

      {/* Balance Cards */}
      <div style={styles.cardGrid}>
        {balances.map((b, i) => (
          <div key={i} style={{ ...styles.balanceCard, borderTop: `4px solid ${colors[i % colors.length]}` }}>
            <p style={styles.balanceName}>{b.type_name}</p>
            <p style={styles.balanceNum}>{b.remaining}</p>
            <p style={styles.balanceLabel}>days remaining</p>
            <div style={styles.balanceStats}>
              <span>Total: {b.total}</span>
              <span>Used: {b.used}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Requests */}
      <div style={styles.pendingBox}>
        <div style={styles.pendingHeader}>
          <h3 style={styles.pendingTitle}>Pending Requests</h3>
          <span style={styles.pendingCount}>{pending.length} open</span>
        </div>
        {pending.length === 0 ? (
          <p style={styles.noPending}>No pending leave requests</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Dates</th>
                <th style={styles.th}>Days</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((l) => (
                <tr key={l.leave_id} style={styles.tr}>
                  <td style={styles.td}>{l.type_name}</td>
                  <td style={styles.td}>
                    {String(l.start_date).split("T")[0]} to {String(l.end_date).split("T")[0]}
                  </td>
                  <td style={styles.td}>{l.days_count}</td>
                  <td style={styles.td}>{l.reason}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleCancel(l.leave_id)} style={styles.cancelBtn}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 24, maxWidth: 1000, margin: "0 auto" },
  title: { color: "#1a1a2e", marginBottom: 24, fontSize: 24 },
  cardGrid: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 },
  balanceCard: {
    background: "#fff", padding: 20, borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)", minWidth: 160, flex: 1, textAlign: "center",
  },
  balanceName: { margin: "0 0 8px 0", fontWeight: 600, color: "#555", fontSize: 13 },
  balanceNum: { margin: 0, fontSize: 40, fontWeight: 700, color: "#1a1a2e" },
  balanceLabel: { margin: "4px 0 12px 0", fontSize: 12, color: "#888" },
  balanceStats: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", borderTop: "1px solid #f0f0f0", paddingTop: 8 },
  pendingBox: { background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: 24 },
  pendingHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pendingTitle: { margin: 0, color: "#1a1a2e" },
  pendingCount: { background: "#fff3e0", color: "#e65100", padding: "4px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600 },
  noPending: { color: "#888", textAlign: "center", padding: 16 },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f5f5f5" },
  th: { padding: 12, textAlign: "left", fontWeight: 600, color: "#333", fontSize: 13 },
  tr: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: 12, fontSize: 13, color: "#444" },
  cancelBtn: { padding: "5px 14px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 },
};