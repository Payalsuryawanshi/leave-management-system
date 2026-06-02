import { useEffect, useState } from "react";
import { registerUser } from "../services/authService";
import {
  getLeaveTypes, createLeaveType, updateLeaveType,
  getHolidays, createHoliday
} from "../services/leaveService";
import api from "../services/api";

export default function HRDashboard() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [msg, setMsg] = useState("");

  // New user form
  const [newUser, setNewUser] = useState({
    name: "", email: "", password: "", role: "employee", department: "", manager_id: ""
  });

  // Leave type form
  const [ltForm, setLtForm] = useState({ name: "", description: "", quota_per_year: 0 });
  const [editingLt, setEditingLt] = useState(null);

  // Holiday form
  const [holForm, setHolForm] = useState({ name: "", date: "", is_optional: false });
  const [editingHol, setEditingHol] = useState(null);

  const loadLeaveTypes = () => getLeaveTypes().then((r) => setLeaveTypes(r.data));
  const loadHolidays = () => getHolidays().then((r) => setHolidays(r.data));

  useEffect(() => {
    loadLeaveTypes();
    loadHolidays();
  }, []);

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  // ── User ──────────────────────────────────────────
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await registerUser({
        ...newUser,
        manager_id: newUser.manager_id ? Number(newUser.manager_id) : null,
      });
      showMsg("User created successfully");
      setNewUser({ name: "", email: "", password: "", role: "employee", department: "", manager_id: "" });
    } catch (err) {
      showMsg(err.response?.data?.detail || "Failed to create user");
    }
  };

  // ── Leave Types ───────────────────────────────────
  const handleAddLeaveType = async (e) => {
    e.preventDefault();
    try {
      if (editingLt) {
        await updateLeaveType(editingLt, { quota_per_year: Number(ltForm.quota_per_year) });
        showMsg("Leave type updated");
        setEditingLt(null);
      } else {
        await createLeaveType({
          name: ltForm.name,
          description: ltForm.description,
          quota_per_year: Number(ltForm.quota_per_year)
        });
        showMsg("Leave type added");
      }
      setLtForm({ name: "", description: "", quota_per_year: 0 });
      loadLeaveTypes();
    } catch (err) {
      showMsg("Failed to save leave type");
    }
  };

  const handleEditLt = (lt) => {
    setEditingLt(lt.type_id);
    setLtForm({ name: lt.name, description: lt.description, quota_per_year: lt.quota_per_year });
  };

  const handleDeleteLt = async (id) => {
    if (!window.confirm("Delete this leave type?")) return;
    try {
      await api.delete(`/admin/leave-types/${id}`);
      showMsg("Leave type deleted");
      loadLeaveTypes();
    } catch {
      showMsg("Cannot delete — it may be in use");
    }
  };

  // ── Holidays ──────────────────────────────────────
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      // The optional flag is part of the holiday payload for both create and update.
      // Mandatory holidays affect working-day counts; optional holidays remain visible to HR.
      if (editingHol) {
        await api.put(`/admin/holidays/${editingHol}`, holForm);
        showMsg("Holiday updated");
        setEditingHol(null);
      } else {
        await createHoliday(holForm);
        showMsg("Holiday added");
      }
      setHolForm({ name: "", date: "", is_optional: false });
      loadHolidays();
    } catch {
      showMsg("Failed to save holiday");
    }
  };

  const handleEditHol = (h) => {
    setEditingHol(h.holiday_id);
    setHolForm({ name: h.name, date: String(h.date_col).split("T")[0], is_optional: h.is_optional });
  };

  const handleDeleteHol = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await api.delete(`/admin/holidays/${id}`);
      showMsg("Holiday deleted");
      loadHolidays();
    } catch {
      showMsg("Failed to delete holiday");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>HR Admin Dashboard</h2>
      {msg && <div style={styles.msg}>{msg}</div>}

      {/* ── Add Employee ── */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Add New Employee</h3>
        <form onSubmit={handleAddUser} style={styles.formGrid}>
          <input placeholder="Full Name" value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            style={styles.input} required />
          <input type="email" placeholder="Email" value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            style={styles.input} required />
          <input type="password" placeholder="Password" value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            style={styles.input} required />
          <input placeholder="Department" value={newUser.department}
            onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
            style={styles.input} required />
          <select value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            style={styles.input}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
          <input type="number" placeholder="Manager ID (optional)" value={newUser.manager_id}
            onChange={(e) => setNewUser({ ...newUser, manager_id: e.target.value })}
            style={styles.input} />
          <button type="submit" style={styles.addBtn}>Create User</button>
        </form>
      </div>

      {/* ── Leave Types + Holidays side by side ── */}
      <div style={styles.twoCol}>

        {/* Leave Types */}
        <div style={{ ...styles.section, ...styles.halfSection }}>
          <h3 style={styles.sectionTitle}>Leave Types</h3>
          <form onSubmit={handleAddLeaveType} style={styles.colForm}>
            <input placeholder="Name" value={ltForm.name}
              onChange={(e) => setLtForm({ ...ltForm, name: e.target.value })}
              style={styles.input} required={!editingLt} />
            <input placeholder="Description" value={ltForm.description}
              onChange={(e) => setLtForm({ ...ltForm, description: e.target.value })}
              style={styles.input} />
            <input type="number" placeholder="Days per year" value={ltForm.quota_per_year}
              onChange={(e) => setLtForm({ ...ltForm, quota_per_year: e.target.value })}
              style={styles.input} required />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={styles.addBtn}>
                {editingLt ? "Update Type" : "Add Type"}
              </button>
              {editingLt && (
                <button type="button" onClick={() => { setEditingLt(null); setLtForm({ name: "", description: "", quota_per_year: 0 }); }}
                  style={styles.cancelBtn}>Cancel</button>
              )}
            </div>
          </form>
          <div style={styles.listBox}>
            {leaveTypes.map((lt) => (
              <div key={lt.type_id} style={styles.listItem}>
                <div>
                  <p style={styles.listName}>{lt.name}</p>
                  <p style={styles.listSub}>{lt.quota_per_year} days</p>
                </div>
                <div style={styles.listActions}>
                  <button onClick={() => handleEditLt(lt)} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleDeleteLt(lt.type_id)} style={styles.deleteBtn}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Holidays */}
        <div style={{ ...styles.section, ...styles.halfSection }}>
          <h3 style={styles.sectionTitle}>Holidays</h3>
          <form onSubmit={handleAddHoliday} style={styles.colForm}>
            <input placeholder="Holiday Name" value={holForm.name}
              onChange={(e) => setHolForm({ ...holForm, name: e.target.value })}
              style={styles.input} required />
            <input type="date" value={holForm.date}
              onChange={(e) => setHolForm({ ...holForm, date: e.target.value })}
              style={styles.input} required />
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={holForm.is_optional}
                onChange={(e) => setHolForm({ ...holForm, is_optional: e.target.checked })}
                style={styles.checkbox} />
              Optional Holiday
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={styles.addBtn}>
                {editingHol ? "Update Holiday" : "Add Holiday"}
              </button>
              {editingHol && (
                <button type="button" onClick={() => { setEditingHol(null); setHolForm({ name: "", date: "", is_optional: false }); }}
                  style={styles.cancelBtn}>Cancel</button>
              )}
            </div>
          </form>
          <div style={styles.listBox}>
            {holidays.map((h) => (
              <div key={h.holiday_id} style={styles.listItem}>
                <div>
                  <p style={styles.listName}>{h.name}</p>
                  <p style={styles.listSub}>{String(h.date_col).split("T")[0]}</p>
                  <span style={h.is_optional ? styles.optionalBadge : styles.mandatoryBadge}>
                    {h.is_optional ? "Optional" : "Mandatory"}
                  </span>
                </div>
                <div style={styles.listActions}>
                  <button onClick={() => handleEditHol(h)} style={styles.editBtn}>Edit</button>
                  <button onClick={() => handleDeleteHol(h.holiday_id)} style={styles.deleteBtn}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { padding: 28, maxWidth: 1120, margin: "0 auto", background: "#f4f7fb", minHeight: "100vh" },
  title: { color: "#102a43", marginBottom: 8 },
  msg: { padding: 14, background: "#e0f2fe", borderRadius: 10, color: "#1d4ed8", marginBottom: 18, fontWeight: 600, border: "1px solid #93c5fd" },
  section: { background: "#ffffff", padding: 24, borderRadius: 14, boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)", marginBottom: 26, border: "1px solid #e2e8f0" },
  halfSection: { flex: 1, minWidth: 320 },
  sectionTitle: { margin: "0 0 18px 0", color: "#1f2937", fontSize: 18 },
  twoCol: { display: "flex", gap: 24, flexWrap: "wrap" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, width: "100%" },
  colForm: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 18, width: "100%" },
  input: { padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 14, minWidth: 180, background: "#f8fafc", color: "#0f172a" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#334155", fontWeight: 600 },
  checkbox: { width: 16, height: 16, accentColor: "#0275d8" },
  addBtn: { padding: "12px 22px", background: "#0275d8", color: "#ffffff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, boxShadow: "0 8px 16px rgba(2, 117, 216, 0.18)" },
  cancelBtn: { padding: "12px 18px", background: "#6b7280", color: "#f8fafc", border: "none", borderRadius: 10, cursor: "pointer" },
  listBox: { display: "flex", flexDirection: "column", gap: 10 },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #e2e8f0" },
  listName: { margin: 0, fontWeight: 700, fontSize: 15, color: "#0f172a" },
  listSub: { margin: "4px 0 0 0", fontSize: 13, color: "#475569" },
  optionalBadge: { display: "inline-block", marginTop: 6, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#ede9fe" },
  mandatoryBadge: { display: "inline-block", marginTop: 6, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#0369a1", background: "#e0f2fe" },
  listActions: { display: "flex", gap: 10 },
  editBtn: { padding: "8px 16px", background: "#0ea5e9", color: "#ffffff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  deleteBtn: { padding: "8px 16px", background: "#ef4444", color: "#ffffff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
};
