import { useEffect, useState } from "react";
import { getReports } from "../services/leaveService";

const statusColor = {
  Pending: "#f39c12",
  Approved: "#27ae60",
  Rejected: "#e74c3c",
  Cancelled: "#95a5a6",
};

const normalizeStatus = (status) => {
  const normalized = String(status || "Pending").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export default function LeaveReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => { getReports().then((r) => setReports(r.data)); }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Leave Reports</h2>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Department</th>
            <th style={styles.th}>Leave Type</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Requests</th>
            <th style={styles.th}>Total Days</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r, i) => {
            // Backend groups report rows by leave status; normalize here for labels/colors.
            const status = normalizeStatus(r.status);
            const color = statusColor[status] || "#7f8c8d";

            return (
              <tr key={i} style={styles.tr}>
                <td style={styles.td}>{r.department}</td>
                <td style={styles.td}>{r.leave_type}</td>
                <td style={styles.td}>
                  <span style={{
                    color,
                    fontWeight: 600,
                    background: `${color}18`,
                    padding: "3px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                  }}>
                    {status}
                  </span>
                </td>
                <td style={styles.td}>{r.requests}</td>
                <td style={styles.td}>{r.total_days}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: 24, maxWidth: 900, margin: "0 auto" },
  title: { color: "#1a1a2e", marginBottom: 24 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" },
  thead: { background: "#3030ae" },
  th: { padding: 14, color: "#fff", textAlign: "left", fontSize: 15, fontWeight: 600 },
  tr: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: 14, fontSize: 15, color: "#090909" },
};
