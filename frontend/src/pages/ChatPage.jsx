import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { askChatbot } from "../services/chatService";

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I am your AI assistant. Ask me anything about leave policies or your balance." },
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
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, the chatbot is unavailable right now." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") send();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>AI Leave Policy Chatbot</h2>
      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
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
          onKeyDown={handleKey}
          placeholder="Ask about leave policies or your balance..."
          style={styles.input}
        />
        <button onClick={send} style={styles.sendBtn} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 24, maxWidth: 700, margin: "0 auto" },
  title: { color: "#1a1a2e", marginBottom: 16 },
  chatBox: {
    background: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 16,
    height: 420,
    overflowY: "auto",
    marginBottom: 16,
  },
  userBubble: {
    background: "#0070f3",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "18px 18px 4px 18px",
    maxWidth: "75%",
    fontSize: 14,
  },
  botBubble: {
    background: "#fff",
    color: "#333",
    padding: "10px 16px",
    borderRadius: "18px 18px 18px 4px",
    maxWidth: "75%",
    fontSize: 14,
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  inputRow: { display: "flex", gap: 12 },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
  },
  sendBtn: {
    padding: "12px 24px",
    background: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
};