import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { applyLeave } from "../services/leaveService";

const LEAVE_TYPES = [
  { id: 1, name: "Casual Leave" },
  { id: 2, name: "Sick Leave" },
  { id: 3, name: "Earned Leave" },
  { id: 4, name: "Comp-off" },
];

export default function ApplyLeave() {
  const [form, setForm] = useState({ type_id: 1, start_date: "", end_date: "", reason: "" });
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

  // Frontend validation BEFORE sending to API
    if (form.reason.trim().length < 10) {
      setMsg("Reason must be at least 10 characters long");
      setIsError(true);
        return;  // stop here, don't call API
    }

    if (form.start_date > form.end_date) {
      setMsg("End date cannot be before start date");
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await applyLeave({ ...form, type_id: Number(form.type_id) });
      setMsg(res.data.message);
      setIsError(false);
      setTimeout(() => navigate("/dashboard"), 2000);
     } catch (err) {
    // This catches API errors like insufficient balance
    const detail = err.response?.data?.detail;
    setMsg(detail || "Failed to apply leave. Please try again.");
    setIsError(true);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Apply for Leave</h2>
        {msg && <p style={{ color: isError ? "red" : "green", textAlign: "center", padding: "10px", background: isError ? "#ffeaea" : "#eaffea", borderRadius: 6, marginBottom: 12 }}>{msg}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Leave Type</label>
            <select
              value={form.type_id}
              onChange={(e) => setForm({ ...form, type_id: e.target.value })}
              style={styles.input}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              style={{ ...styles.input, height: 80, resize: "vertical" }}
              placeholder="Enter reason for leave"
              required
            />
          </div>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Submitting..." : "Apply Leave"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" },
  card: { background: "#fff", padding: 40, borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.1)", width: 460 },
  title: { textAlign: "center", marginBottom: 24, color: "#1a1a2e" },
  field: { marginBottom: 16 },
  label: { display: "block", marginBottom: 6, fontWeight: 600, color: "#333" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" },
  button: { width: "100%", padding: 12, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, fontSize: 16, cursor: "pointer" },
};