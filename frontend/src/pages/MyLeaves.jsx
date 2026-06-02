import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyHistory, cancelLeave } from "../services/leaveService";

const statusColor = {
  Pending: "#f39c12",
  Approved: "#27ae60",
  Rejected: "#e74c3c",
  Cancelled: "#95a5a6",
};

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);

  const load = () => getMyHistory().then((res) => setLeaves(res.data));
  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this leave?")) return;
    try {
      await cancelLeave(id);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Could not cancel leave");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Leave History</h2>
      {leaves.length === 0 ? (
        <p>No leave requests found.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>From</th>
              <th style={styles.th}>To</th>
              <th style={styles.th}>Days</th>
              <th style={styles.th}>Reason</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.leave_id} style={styles.tr}>
                <td style={styles.td}>{l.type_name}</td>
                <td style={styles.td}>{String(l.start_date)}</td>
                <td style={styles.td}>{String(l.end_date)}</td>
                <td style={styles.td}>{l.days_count}</td>
                <td style={styles.td}>{l.reason}</td>
                <td style={styles.td}>
                  <span style={{ color: statusColor[l.status], fontWeight: 600 }}>{l.status}</span>
                </td>
                <td style={styles.td}>
                  {l.status === "Pending" && (
                    <button onClick={() => handleCancel(l.leave_id)} style={styles.cancelBtn}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 24, maxWidth: 1000, margin: "0 auto" },
  title: { color: "#1a1a2e", marginBottom: 24 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  thead: { background: "#0070f3" },
  th: { padding: 12, color: "#fff", textAlign: "left", fontWeight: 600 },
  tr: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: 12, fontSize: 14 },
  cancelBtn: { padding: "4px 12px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" },
};