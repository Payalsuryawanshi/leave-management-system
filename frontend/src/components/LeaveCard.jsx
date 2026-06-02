export default function LeaveCard({ leave, onCancel }) {
  const statusColor = {
    Pending: "#f39c12",
    Approved: "#27ae60",
    Rejected: "#e74c3c",
    Cancelled: "#95a5a6",
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.type}>{leave.type_name}</span>
        <span style={{ color: statusColor[leave.status], fontWeight: 600 }}>
          {leave.status}
        </span>
      </div>
      <p style={styles.dates}>
        {String(leave.start_date)} → {String(leave.end_date)}
      </p>
      <p style={styles.days}>{leave.days_count} working days</p>
      <p style={styles.reason}>{leave.reason}</p>
      {leave.status === "Pending" && onCancel && (
        <button onClick={() => onCancel(leave.leave_id)} style={styles.cancelBtn}>
          Cancel Request
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: 16,
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: 12,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  type: { fontWeight: 700, color: "#1a1a2e" },
  dates: { margin: "4px 0", fontSize: 14, color: "#555" },
  days: { margin: "4px 0", fontSize: 13, color: "#888" },
  reason: { margin: "4px 0", fontSize: 14, color: "#333" },
  cancelBtn: {
    marginTop: 8,
    padding: "6px 14px",
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
};