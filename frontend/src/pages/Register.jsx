import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
    manager_id: "",
  });
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        manager_id: form.manager_id ? Number(form.manager_id) : null,
      };
      await registerUser(payload);
      setMsg("Registered successfully! Redirecting to login...");
      setIsError(false);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMsg(err.response?.data?.detail || "Registration failed");
      setIsError(true);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        {msg && (
          <p style={{ color: isError ? "red" : "green", textAlign: "center" }}>
            {msg}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={styles.input}
              placeholder="Enter full name"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={styles.input}
              placeholder="Enter work email"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={styles.input}
              placeholder="Enter password"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={styles.input}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR Admin</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Department</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              style={styles.input}
              placeholder="e.g. IT, HR, Finance"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Manager ID (optional)</label>
            <input
              type="number"
              value={form.manager_id}
              onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
              style={styles.input}
              placeholder="Enter manager user ID"
            />
          </div>
          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16 }}>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f2f5",
  },
  card: {
    background: "#fff",
    padding: 40,
    borderRadius: 12,
    boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
    width: 440,
  },
  title: { textAlign: "center", marginBottom: 24, color: "#1a1a2e" },
  field: { marginBottom: 16 },
  label: { display: "block", marginBottom: 6, fontWeight: 600, color: "#333" },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 14,
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 16,
    cursor: "pointer",
    marginTop: 8,
  },
};