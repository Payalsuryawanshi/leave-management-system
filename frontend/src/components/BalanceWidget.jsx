export default function BalanceWidget({ balance }) {
  const colors = ["#0070f3", "#00b894", "#e17055", "#6c5ce7", "#fdcb6e"];

  return (
    <div style={styles.container}>
      {balance.map((b, i) => (
        <div
          key={i}
          style={{
            ...styles.card,
            borderTop: `4px solid ${colors[i % colors.length]}`,
          }}
        >
          <p style={styles.typeName}>{b.type_name}</p>
          <p style={styles.remaining}>{b.remaining}</p>
          <p style={styles.label}>days remaining</p>
          <div style={styles.stats}>
            <span>Total: {b.total}</span>
            <span>Used: {b.used}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    minWidth: 160,
    flex: 1,
    textAlign: "center",
  },
  typeName: { margin: "0 0 8px 0", fontWeight: 600, color: "#333", fontSize: 14 },
  remaining: { margin: 0, fontSize: 36, fontWeight: 700, color: "#1a1a2e" },
  label: { margin: "4px 0 12px 0", fontSize: 12, color: "#888" },
  stats: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#666",
    borderTop: "1px solid #f0f0f0",
    paddingTop: 8,
  },
};