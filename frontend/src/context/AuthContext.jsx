import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const user_id = localStorage.getItem("user_id");
    const name = localStorage.getItem("name");
    if (token && role) {
      setUser({ token, role, user_id: Number(user_id), name });
    }
    setLoading(false);
  }, []);

  const login = (token, role, user_id, name) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("user_id", user_id);
    localStorage.setItem("name", name || "");
    setUser({ token, role, user_id: Number(user_id), name });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);