import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserResume, uploadResume, getJobMatches, applyJob } from "../api/auth";

function ResumeMatcher() {
  const navigate = useNavigate();
  const [hasResume, setHasResume] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [applyingId, setApplyingId] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role === "admin") {
      navigate("/");
      return;
    }
    fetchResumeAndMatches();
  }, [user, navigate]);

  const fetchResumeAndMatches = async () => {
    setLoading(true);
    setError("");
    try {
      const resumeRes = await getUserResume(user.id);
      if (resumeRes.success && resumeRes.has_resume) {
        setHasResume(true);
        setResumeInfo(resumeRes.resume);
        
        // Fetch matches if they have a resume
        const matchesRes = await getJobMatches(user.id);
        if (matchesRes.success) {
          setMatches(matchesRes.matches);
        }
      } else {
        setHasResume(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const matchesRes = await getJobMatches(user.id);
      if (matchesRes.success) {
        setMatches(matchesRes.matches);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    }
  };

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const fileExt = file.name.split(".").pop().toLowerCase();
    if (fileExt !== "pdf" && fileExt !== "txt") {
      setError("Invalid file type. Only PDF and TXT files are supported.");
      return;
    }

    setUploading(true);
    setError("");
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(",")[1];
        const res = await uploadResume(user.id, file.name, base64Data);
        if (res.success) {
          setHasResume(true);
          setResumeInfo(res.resume);
          await fetchMatches();
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to process and upload resume.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = async (jobId) => {
    setApplyingId(jobId);
    try {
      await applyJob(jobId, user.id);
      
      // Update applied status locally
      setMatches(prevMatches => 
        prevMatches.map(m => m.id === jobId ? { ...m, already_applied: true } : m)
      );
      alert("Application submitted successfully!");
    } catch (err) {
      alert(err.message || "Failed to apply for job.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleDeleteResume = async () => {
    // We can clear resume columns by sending an empty payload or a delete request.
    // For simplicity, we can let them re-upload which replaces the current resume,
    // or reset locally to prompt a fresh upload.
    setHasResume(false);
    setResumeInfo(null);
    setMatches([]);
  };

  // Helper to determine score color
  const getScoreColor = (score) => {
    if (score >= 75) return "#10b981"; // Emerald Green
    if (score >= 40) return "#f59e0b"; // Amber Yellow
    return "#ef4444"; // Red
  };

  return (
    <div className="matcher-wrapper">
      {/* CSS Stylesheet Injector to match HomePage premium aesthetics */}
      <style>{`
        .matcher-wrapper {
          min-height: 100vh;
          background: #080b14;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 80px;
        }
        .matcher-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.2;
          pointer-events: none;
          z-index: 1; /* Keep strictly in background context */
        }
        .blob-red {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #f472b6, #8b5cf6);
          top: -100px; right: -50px;
        }
        .blob-blue {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #6c63ff, #3b82f6);
          bottom: -150px; left: -150px;
        }
        .matcher-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          position: relative;
          z-index: 10; /* Bring container forward above blobs */
        }
        .matcher-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 24px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.25s;
        }
        .back-link:hover {
          color: #fff;
        }
        .title-gradient {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 2.2rem;
          background: linear-gradient(135deg, #6c63ff, #3b82f6, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-top: 8px;
        }
        .glass-card {
          background: rgba(10, 15, 30, 0.7); /* Premium slightly dark-tinted glass for maximum readability */
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translate3d(0, 0, 0); /* Forces GPU hardware acceleration to keep text razor-sharp */
          backface-visibility: hidden;
          will-change: transform;
        }
        .upload-zone {
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 50px 30px;
          text-align: center;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.01);
          transition: all 0.25s ease;
          position: relative;
        }
        .upload-zone:hover, .upload-zone.drag-active {
          border-color: #6c63ff;
          background: rgba(108, 99, 255, 0.05);
          box-shadow: 0 0 25px rgba(108, 99, 255, 0.15);
        }
        .upload-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          display: inline-block;
          animation: pulseGlow 2s infinite alternate;
        }
        @keyframes pulseGlow {
          from { transform: scale(1); filter: drop-shadow(0 0 2px rgba(108,99,255,0.2)); }
          to { transform: scale(1.08); filter: drop-shadow(0 0 10px rgba(108,99,255,0.6)); }
        }
        .btn-glow {
          padding: 12px 28px;
          background: linear-gradient(135deg, #6c63ff, #3b82f6);
          border: none;
          color: #fff;
          border-radius: 50px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 15px rgba(108, 99, 255, 0.4);
        }
        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(108, 99, 255, 0.6);
        }
        .skills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 15px;
        }
        .skill-tag {
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 500;
          text-transform: capitalize;
          background: rgba(108, 99, 255, 0.12);
          border: 1px solid rgba(108, 99, 255, 0.3);
          color: #a5b4fc;
          box-shadow: 0 2px 10px rgba(108, 99, 255, 0.1);
        }
        .skill-tag.matched {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.35);
          color: #a7f3d0;
        }
        .skill-tag.missing {
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.5);
        }
        .dashboard-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        @media (min-width: 800px) {
          .dashboard-layout {
            grid-template-columns: 350px 1fr;
          }
        }
        .job-card {
          margin-bottom: 24px;
          border-left: 4px solid #6c63ff;
          position: relative;
        }
        .job-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 16px;
        }
        .score-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.95rem;
          background: rgba(255,255,255,0.05);
          box-shadow: inset 0 0 10px rgba(255,255,255,0.05);
        }
        .pulse-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 14px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 0.95rem;
        }
        .info-pill {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .info-pill-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          font-family: 'Syne', sans-serif;
        }
        .btn-apply {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: bold;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-apply.active {
          background: #10b981;
          color: white;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .btn-apply.active:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
        }
        .btn-apply.applied {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.4);
          cursor: not-allowed;
        }
        /* Loading skeleton pulsing */
        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: loadingSkeleton 1.5s infinite;
        }
        @keyframes loadingSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Blobs */}
      <div className="matcher-blob blob-red" />
      <div className="matcher-blob blob-blue" />

      <div className="matcher-container">
        {/* Navigation / Header */}
        <header className="matcher-header">
          <div>
            <div className="back-link" onClick={() => navigate("/")}>
              ← Back to Dashboard
            </div>
            <h1 className="title-gradient">AI Resume Matcher</h1>
          </div>
          <div className="nav-buttons">
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem" }}>
              Logged in as: <strong>{user?.email}</strong>
            </span>
          </div>
        </header>

        {error && <div className="error-message">⚠️ {error}</div>}

        {loading ? (
          // Loading dashboard state
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="skeleton" style={{ height: "40px", width: "40%", borderRadius: "8px" }} />
            <div className="skeleton" style={{ height: "150px", borderRadius: "16px" }} />
            <div className="skeleton" style={{ height: "80px", borderRadius: "12px" }} />
          </div>
        ) : !hasResume ? (
          // Empty State: Needs Upload
          <div className="glass-card" style={{ maxWidth: "700px", margin: "0 auto" }}>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.7rem", marginBottom: "15px", textAlign: "center" }}>
              Upload Your Resume
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: "30px", fontSize: "0.95rem" }}>
              Upload your resume in <strong>PDF</strong> or <strong>TXT</strong> format. Our matching engine will analyze your skills and automatically find the best fit openings.
            </p>

            <div 
              className={`upload-zone ${dragActive ? "drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                id="file-upload" 
                style={{ display: "none" }} 
                accept=".pdf,.txt"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" style={{ cursor: "pointer", width: "100%", height: "100%", display: "block" }}>
                <span className="upload-icon">📄</span>
                {uploading ? (
                  <div>
                    <h3 style={{ color: "#a5b4fc", marginBottom: "10px" }}>Parsing & Extracting Skills...</h3>
                    <div className="skeleton" style={{ height: "8px", width: "60%", margin: "0 auto", borderRadius: "10px" }} />
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "10px" }}>
                      Drag & Drop your resume here
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem", marginBottom: "20px" }}>
                      or click to browse from files
                    </p>
                    <button type="button" className="btn-glow" style={{ pointerEvents: "none" }}>
                      Select File
                    </button>
                  </>
                )}
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "25px", marginTop: "30px", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
              <span>✓ Pure-JS Parsing</span>
              <span>✓ Supports PDF/TXT</span>
              <span>✓ Immediate Matching</span>
            </div>
          </div>
        ) : (
          // Dashboard State: Has resume and matches
          <div className="dashboard-layout">
            
            {/* Left sidebar: Resume Details & Skills */}
            <aside style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="glass-card">
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.4rem", marginBottom: "20px" }}>Your Resume</h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="info-pill">
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Active File</span>
                    <span className="info-pill-value" style={{ fontSize: "1.05rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      📄 {resumeInfo?.filename}
                    </span>
                  </div>

                  <div className="info-pill">
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Extracted Skills</span>
                    <span className="info-pill-value">{resumeInfo?.skills?.length || 0}</span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)" }}>Extracted Keywords:</span>
                    <div className="skills-grid">
                      {resumeInfo?.skills?.length === 0 ? (
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>No matching skills found in file text.</p>
                      ) : (
                        resumeInfo?.skills?.map((skill, i) => (
                          <span key={i} className="skill-tag">{skill}</span>
                        ))
                      )}
                    </div>
                  </div>

                  <hr style={{ borderColor: "rgba(255,255,255,0.06)", margin: "10px 0" }} />

                  {/* Reupload area */}
                  <div>
                    {uploading ? (
                      <p style={{ color: "#a5b4fc", fontSize: "0.9rem", textAlign: "center" }}>Updating resume...</p>
                    ) : (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input 
                          type="file" 
                          id="reupload-file" 
                          style={{ display: "none" }} 
                          accept=".pdf,.txt"
                          onChange={handleFileChange}
                        />
                        <label htmlFor="reupload-file" className="btn-secondary" style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                          Update Resume
                        </label>
                        <button onClick={handleDeleteResume} className="btn-secondary" style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#fca5a5", fontSize: "0.85rem", cursor: "pointer" }}>
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </aside>

            {/* Right Main area: Matched Jobs list */}
            <main>
              <div className="glass-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "10px" }}>
                  <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "1.6rem" }}>
                    AI Matched Job Openings
                  </h2>
                  <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
                    Sorted by match relevancy
                  </span>
                </div>

                {matches.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>
                      No jobs have been posted in the system yet.
                    </p>
                    <button className="btn-secondary" onClick={() => navigate("/")} style={{ fontSize: "0.9rem" }}>
                      Go to Home
                    </button>
                  </div>
                ) : (
                  <div>
                    {matches.map((job) => {
                      const cardBorderColor = getScoreColor(job.match_score);
                      return (
                        <div key={job.id} className="glass-card job-card" style={{ borderLeftColor: cardBorderColor, background: "rgba(255,255,255,0.01)", marginBottom: "24px" }}>
                          
                          <div className="job-card-header">
                            <div>
                              <h3 style={{ fontSize: "1.4rem", fontFamily: "Syne, sans-serif", fontWeight: "700", color: "#fff", marginBottom: "4px" }}>
                                {job.title}
                              </h3>
                              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                                Posted by: {job.author_email}
                              </span>
                            </div>

                            {/* Glowing Match Score Pill */}
                            <div className="score-badge">
                              <span className="pulse-dot" style={{ background: cardBorderColor, boxShadow: `0 0 10px ${cardBorderColor}` }} />
                              <span style={{ color: cardBorderColor }}>{job.match_score}% Match</span>
                            </div>
                          </div>

                          <p style={{ lineHeight: "1.6", color: "rgba(255,255,255,0.75)", marginBottom: "20px", fontSize: "0.95rem" }}>
                            {job.description}
                          </p>

                          {/* Skill mapping comparison */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "25px" }}>
                            {job.required_skills?.length > 0 ? (
                              <>
                                {job.matched_skills?.length > 0 && (
                                  <div>
                                    <span style={{ fontSize: "0.8rem", color: "#10b981", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>Matched Skills:</span>
                                    <div className="skills-grid" style={{ marginTop: "6px" }}>
                                      {job.matched_skills.map((skill, i) => (
                                        <span key={i} className="skill-tag matched">{skill}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {job.missing_skills?.length > 0 && (
                                  <div>
                                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>Missing Skills:</span>
                                    <div className="skills-grid" style={{ marginTop: "6px" }}>
                                      {job.missing_skills.map((skill, i) => (
                                        <span key={i} className="skill-tag missing">{skill}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                                💡 General Job Match (Matches broad keywords & contents)
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            {job.already_applied ? (
                              <button className="btn-apply applied" disabled>
                                Applied ✓
                              </button>
                            ) : (
                              <button 
                                className="btn-apply active"
                                onClick={() => handleApply(job.id)}
                                disabled={applyingId === job.id}
                              >
                                {applyingId === job.id ? "Applying..." : "Apply Instantly →"}
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </main>

          </div>
        )}

      </div>
    </div>
  );
}

export default ResumeMatcher;
