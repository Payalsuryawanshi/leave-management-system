import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getHome = () => {
    if (user?.role === "hr") return "/hr";
    if (user?.role === "manager") return "/manager";
    return "/dashboard";
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand} onClick={() => navigate(getHome())}>
        Leave Management System
      </div>
      {user && (
        <div style={styles.userSection}>
          <span style={styles.userName}>{user.name}</span>
          <span style={styles.roleBadge}>{user.role}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#1a1a2e",
    padding: "14px 24px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  brand: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 18,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  userName: {
    color: "#ccc",
    fontSize: 14,
  },
  roleBadge: {
    background: "#0070f3",
    color: "#fff",
    padding: "3px 12px",
    borderRadius: 12,
    fontSize: 12,
    textTransform: "capitalize",
    fontWeight: 600,
  },
  logoutBtn: {
    padding: "7px 16px",
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
};