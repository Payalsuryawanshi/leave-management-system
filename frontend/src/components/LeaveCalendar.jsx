export default function LeaveCalendar({ events }) {
  if (!events || events.length === 0) {
    return (
      <div style={styles.empty}>
        No upcoming approved leaves in your team.
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {events.map((e, i) => (
        <div key={i} style={styles.event}>
          <div style={styles.avatar}>
            {e.employee_name?.charAt(0).toUpperCase()}
          </div>
          <div style={styles.info}>
            <p style={styles.name}>{e.employee_name}</p>
            <p style={styles.details}>
              {e.leave_type} | {String(e.start_date)} → {String(e.end_date)} ({e.days_count} days)
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: 10 },
  empty: { color: "#888", padding: 16, textAlign: "center" },
  event: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    padding: 12,
    borderRadius: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#0070f3",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  info: { flex: 1 },
  name: { margin: 0, fontWeight: 600, fontSize: 14, color: "#1a1a2e" },
  details: { margin: "4px 0 0 0", fontSize: 13, color: "#666" },
};