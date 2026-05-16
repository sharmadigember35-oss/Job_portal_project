import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import "./AuthPage.css";

function RegisterPage() {
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
      const data = await registerUser(form.username, form.password);
      alert(data.message);
      navigate("/login");
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
          <span className="brand-name">Job-portal</span>
        </div>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Choose your username and password</p>

        {error && <p className="auth-error">{error}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
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
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <span role="button" tabIndex={0} onClick={() => navigate("/login")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
