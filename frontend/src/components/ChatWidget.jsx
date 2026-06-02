import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { askChatbot } from "../services/chatService";

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Ask me anything about leave policies or your balance." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages((prev) => [...prev, { from: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await askChatbot(question, user?.user_id, user?.role);
      setMessages((prev) => [...prev, { from: "bot", text: res.data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, chatbot is unavailable right now." },
      ]);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div style={styles.wrapper}>
      {open && (
        <div style={styles.chatBox}>
          <div style={styles.chatHeader}>
            <span>AI Assistant</span>
            <button onClick={() => setOpen(false)} style={styles.closeBtn}>✕</button>
          </div>
          <div style={styles.messages}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div style={m.from === "user" ? styles.userBubble : styles.botBubble}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={styles.botBubble}>Typing...</div>
              </div>
            )}
          </div>
          <div style={styles.inputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask something..."
              style={styles.input}
            />
            <button onClick={send} style={styles.sendBtn}>Send</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={styles.fab}>
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 12,
  },
  chatBox: {
    width: 340,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatHeader: {
    background: "#1a1a2e",
    color: "#fff",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 600,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: 16,
  },
  messages: {
    padding: 16,
    height: 280,
    overflowY: "auto",
    background: "#f9f9f9",
  },
  userBubble: {
    background: "#0070f3",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "16px 16px 4px 16px",
    maxWidth: "80%",
    fontSize: 13,
  },
  botBubble: {
    background: "#fff",
    color: "#333",
    padding: "8px 12px",
    borderRadius: "16px 16px 16px 4px",
    maxWidth: "80%",
    fontSize: 13,
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  inputRow: {
    display: "flex",
    padding: 12,
    gap: 8,
    borderTop: "1px solid #eee",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 13,
  },
  sendBtn: {
    padding: "8px 14px",
    background: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#0070f3",
    color: "#fff",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,112,243,0.4)",
  },
};