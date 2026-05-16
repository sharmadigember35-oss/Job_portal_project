import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { postJob } from "../api/auth";
import "./HomePage.css"; // Reuse styling

function PostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "" });
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Convert image to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError("Please upload an image.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const data = await postJob(form.title, form.description, image, user.id);
      alert(data.message);
      navigate("/"); // Redirect back to home
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="home-wrapper" style={{ minHeight: "100vh" }}>
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <nav className="navbar">
        <div className="navbar-start">
          <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <span className="brand-dot" />
            <span className="brand-name">Job-portal</span>
          </div>
        </div>
        <div className="nav-buttons">
          <button type="button" className="btn-secondary" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </nav>

      <main className="hero" style={{ marginTop: "80px", textAlign: "center" }}>
        <h1 className="hero-title">Post a <span className="gradient-text">Job</span></h1>
        <p className="hero-sub">Add an opening and let candidates see it in the features section.</p>

        {error && <p style={{ color: "#ff6b6b", marginBottom: "20px" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ background: "rgba(255, 255, 255, 0.05)", padding: "40px", borderRadius: "16px", margin: "0 auto", maxWidth: "500px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "white", display: "block", marginBottom: "8px" }}>Job Title</label>
            <input 
              type="text" 
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white" }} 
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "white", display: "block", marginBottom: "8px" }}>Description</label>
            <textarea 
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows="4"
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", resize: "vertical" }} 
              placeholder="Describe the job opening..."
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{ color: "white", display: "block", marginBottom: "8px" }}>Job Photo</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              required
              style={{ color: "white" }} 
            />
            {image && (
              <div style={{ marginTop: "15px" }}>
                <img src={image} alt="Preview" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }} />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "none", background: "white", color: "black", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Posting..." : "Post Job"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default PostJob;
