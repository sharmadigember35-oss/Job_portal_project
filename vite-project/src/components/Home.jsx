import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

function Home() {
  const navigate = useNavigate();

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
          <button type="button" className="btn-login" onClick={() => navigate("/login")}>
            Login
          </button>
          <button type="button" className="btn-register" onClick={() => navigate("/register")}>
            Register
          </button>
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
    </div>
  );
}

export default Home;