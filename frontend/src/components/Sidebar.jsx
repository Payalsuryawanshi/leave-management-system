import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();

  const getLinks = () => {
    if (!user) return [];

    if (user.role === "hr") {
      return [
        { to: "/hr",          label: "🏠 Dashboard"     },
        { to: "/hr/reports",  label: "📊 Leave Reports"  },
      ];
    }

    if (user.role === "manager") {
      return [
        { to: "/manager",       label: "🏠 Dashboard"      },
        { to: "/team-calendar", label: "📅 Team Calendar" },
        { to: "/chat",          label: "🤖 AI Chatbot"    },
      ];
    }

    // employee
    return [
      { to: "/dashboard",     label: "🏠 Dashboard"     },
      { to: "/apply-leave",   label: "📝 Apply Leave"   },
      { to: "/my-leaves",     label: "📋 My Leaves"     },
      { to: "/team-calendar", label: "📅 Team Calendar" },
      { to: "/chat",          label: "🤖 AI Chatbot"    },
    ];
  };

  return (
    <div style={styles.sidebar}>
      <p style={styles.menuLabel}>MENU</p>
      {getLinks().map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/hr" || link.to === "/dashboard" || link.to === "/manager"}
          style={({ isActive }) => ({
            ...styles.link,
            background: isActive ? "#0070f3" : "transparent",
            color: isActive ? "#fff" : "#ccc",
            fontWeight: isActive ? 700 : 400,
          })}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}

const styles = {
  sidebar: {
    width: 220,
    background: "#1a1a2e",
    minHeight: "100%",
    padding: "24px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flexShrink: 0,
  },
  menuLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    marginBottom: 8,
    paddingLeft: 12,
    textTransform: "uppercase",
  },
  link: {
    padding: "10px 14px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    display: "block",
    transition: "background 0.2s",
  },
};