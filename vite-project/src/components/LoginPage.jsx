import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import "./AuthPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(form.username, form.password);
      alert(data.message);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-blob blob-a" />
      <div className="auth-blob blob-b" />

      <div className="auth-card">
        <div className="auth-brand" onClick={() => navigate("/")}>
          <span className="brand-dot" />
          <span className="brand-name">job-portal</span>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Sign in with your username and password</p>

        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Your username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <span role="button" tabIndex={0} onClick={() => navigate("/register")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
