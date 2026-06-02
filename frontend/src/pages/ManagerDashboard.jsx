import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPending, approveLeave, rejectLeave } from "../services/leaveService";

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [pending, setPending] = useState([]);
  const [comments, setComments] = useState({});
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const load = () => getPending().then((res) => setPending(res.data));
  useEffect(() => { load(); }, []);

  const handleLogout = () => { logout(); navigate("/"); };

  const handleApprove = async (id) => {
    try {
      await approveLeave(id, { comment: comments[id] || "" });
      setMsg("Leave approved successfully");
      load();
    } catch (err) {
      setMsg(err.response?.data?.detail || "Could not approve");
    }
  };

  const handleReject = async (id) => {
    if (!comments[id]?.trim()) {
      setMsg("Please add a comment before rejecting");
      return;
    }
    try {
      await rejectLeave(id, { comment: comments[id] });
      setMsg("Leave rejected");
      load();
    } catch (err) {
      setMsg(err.response?.data?.detail || "Could not reject");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Manager Dashboard — {user?.name}</h2>
      </div>
      {msg && <p style={styles.msg}>{msg}</p>}
      <h3>Pending Leave Requests ({pending.length})</h3>
      {pending.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        pending.map((l) => (
          <div key={l.leave_id} style={styles.card}>
            <div style={styles.cardHeader}>
              <strong>{l.employee_name}</strong>
              <span style={styles.badge}>{l.leave_type}</span>
            </div>
            <p style={styles.info}>
              {String(l.start_date)} → {String(l.end_date)} ({l.days_count} days)
            </p>
            <p style={styles.info}>Reason: {l.reason}</p>
            <input
              placeholder="Add comment (required for rejection)"
              value={comments[l.leave_id] || ""}
              onChange={(e) => setComments({ ...comments, [l.leave_id]: e.target.value })}
              style={styles.input}
            />
            <div style={styles.actions}>
              <button onClick={() => handleApprove(l.leave_id)} style={styles.approveBtn}>Approve</button>
              <button onClick={() => handleReject(l.leave_id)} style={styles.rejectBtn}>Reject</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: { padding: 24, maxWidth: 800, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { margin: 0, color: "#1a1a2e" },
  logoutBtn: { padding: "8px 16px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  msg: { padding: 12, background: "#e8f5e9", borderRadius: 6, color: "#2e7d32" },
  card: { background: "#fff", padding: 20, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: 16 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badge: { background: "#0070f3", color: "#fff", padding: "4px 10px", borderRadius: 12, fontSize: 12 },
  info: { margin: "4px 0", fontSize: 14, color: "#555" },
  input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", marginTop: 8, boxSizing: "border-box" },
  actions: { display: "flex", gap: 12, marginTop: 12 },
  approveBtn: { padding: "8px 20px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  rejectBtn: { padding: "8px 20px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  link: { display: "inline-block", marginTop: 16, color: "#0070f3" },
};