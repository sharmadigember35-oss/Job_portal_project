import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css"; // Reuse styling

function AdminPage() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    // If not logged in, or not an admin, redirect them away
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/"); // Redirect normal users back to home
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="home-wrapper">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <nav className="navbar">
        <div className="navbar-start">
          <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <span className="brand-dot" />
            <span className="brand-name">Job-portal Admin</span>
          </div>
        </div>
        <div className="nav-buttons">
          <button type="button" className="btn-secondary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </nav>
      <main className="hero" style={{ marginTop: "100px" }}>
        <h1 className="hero-title">Admin Dashboard</h1>
        <p className="hero-sub">Manage users, view analytics, and control the system.</p>
        
        <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "40px", borderRadius: "16px", marginTop: "40px", width: "100%", maxWidth: "800px", margin: "40px auto 0", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ color: "white", marginBottom: "20px" }}>Admin Controls</h2>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>This is a protected route. Only users with the 'admin' role can see this page.</p>
          <ul style={{ color: "white", textAlign: "left", marginTop: "20px", display: "inline-block", fontSize: "1.1rem" }}>
            <li style={{ margin: "10px 0" }}>✅ User Management</li>
            <li style={{ margin: "10px 0" }}>✅ System Settings</li>
            <li style={{ margin: "10px 0" }}>✅ Moderation Tools</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
