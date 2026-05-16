import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getJobs } from "../api/auth";
import "./HomePage.css";

function Home() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    async function fetchJobs() {
      try {
        const data = await getJobs();
        if (data.success) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div className="home-wrapper">
      {/* Background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <nav className="navbar">
        <div className="navbar-start">
          <div className="brand">
            <span className="brand-dot" />
            <span className="brand-name">Job-portal</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#about" className="nav-link">
              About
            </a>
          </div>
        </div>
        <div className="nav-buttons">
          {user ? (
            <>
              {user.role === "admin" && (
                <button type="button" className="btn-secondary" style={{ marginRight: "10px" }} onClick={() => navigate("/admin")}>
                  Admin Panel
                </button>
              )}
              <span style={{ marginRight: "15px", color: "white" }}>Hi, {user.email.split("@")[0]}</span>
              <button type="button" className="btn-login" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-login" onClick={() => navigate("/login")}>
                Login
              </button>
              <button type="button" className="btn-register" onClick={() => navigate("/register")}>
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero">
        <div className="hero-badge">✦ Welcome to the future</div>
        <h1 className="hero-title">
          Build <span className="gradient-text">something</span>
          <br /> extraordinary.
        </h1>
        <p className="hero-sub">
          A modern platform designed to help you create, collaborate,
          and launch with confidence.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn-cta" onClick={() => navigate("/register")}>
            Get Started Free →
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat">
            <span className="stat-num">50K+</span>
            <span className="stat-label">Users</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">99.9%</span>
            <span className="stat-label">Uptime</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">4.9★</span>
            <span className="stat-label">Rating</span>
          </div>
        </div>
      </main>

      {/* Features / Jobs Section */}
      <section id="features" style={{ padding: "80px 20px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <h2 style={{ color: "white", fontSize: "2.5rem", marginBottom: "20px" }}>Job Openings</h2>
        
        {user && (
          <button 
            onClick={() => navigate("/post-job")}
            style={{ padding: "12px 24px", borderRadius: "8px", background: "white", color: "black", fontWeight: "bold", border: "none", cursor: "pointer", marginBottom: "40px" }}
          >
            + Post a Job
          </button>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "30px", maxWidth: "1200px", margin: "0 auto" }}>
          {jobs.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.6)" }}>No job openings posted yet.</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", overflow: "hidden", width: "100%", maxWidth: "350px", textAlign: "left" }}>
                {job.image_data && (
                  <img src={job.image_data} alt={job.title} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                )}
                <div style={{ padding: "20px" }}>
                  <h3 style={{ color: "white", fontSize: "1.5rem", margin: "0 0 10px 0" }}>{job.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", marginBottom: "15px" }}>Posted by: {job.author_email}</p>
                  <p style={{ color: "white", lineHeight: "1.5" }}>{job.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;