import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ChatWidget from "./components/ChatWidget";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ApplyLeave from "./pages/ApplyLeave";
import MyLeaves from "./pages/MyLeaves";
import TeamCalendar from "./pages/TeamCalendar";
import ManagerDashboard from "./pages/ManagerDashboard";
import HRDashboard from "./pages/HRDashboard";
import LeaveReports from "./pages/LeaveReports";
import ChatPage from "./pages/ChatPage";

// Pages where sidebar and navbar should NOT appear
const PUBLIC_ROUTES = ["/", "/register"];

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
}

function Layout({ children }) {
  const { user } = useAuth();
  const isHR = user?.role !== "hr";
  const location = useLocation();
  const isPublic = PUBLIC_ROUTES.includes(location.pathname);

  if (isPublic || !user) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top Navbar */}
      <Navbar />
      {/* Body = Sidebar + Main Content */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <div style={{ flex: 1, background: "#f0f2f5", padding: 24, overflowY: "auto" }}>
          {children}
        </div>
      </div>
      {/* Floating Chat Widget */}
      {isHR && <ChatWidget />}
    </div>
  );
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute roles={["employee"]}><EmployeeDashboard /></ProtectedRoute>}
        />
        <Route
          path="/apply-leave"
          element={<ProtectedRoute roles={["employee"]}><ApplyLeave /></ProtectedRoute>}
        />
        <Route
          path="/my-leaves"
          element={<ProtectedRoute roles={["employee"]}><MyLeaves /></ProtectedRoute>}
        />
        <Route
          path="/team-calendar"
          element={<ProtectedRoute roles={["employee", "manager"]}><TeamCalendar /></ProtectedRoute>}
        />
        <Route
          path="/manager"
          element={<ProtectedRoute roles={["manager"]}><ManagerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/hr"
          element={<ProtectedRoute roles={["hr"]}><HRDashboard /></ProtectedRoute>}
        />
        <Route
          path="/hr/reports"
          element={<ProtectedRoute roles={["hr"]}><LeaveReports /></ProtectedRoute>}
        />
        <Route
          path="/chat"
          element={<ProtectedRoute roles={["employee", "manager"]}><ChatPage /></ProtectedRoute>}
        />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}