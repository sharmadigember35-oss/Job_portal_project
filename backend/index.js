import express from "express";
import cors from "cors";
import pg from "pg";
import { createRequire } from "module";
import { createServer } from "http";           // NEW
import { Server } from "socket.io";            // NEW
import jwt from "jsonwebtoken";                // NEW

const require = createRequire(import.meta.url);

const JWT_SECRET = "your_secret_key"; // use same key everywhere

// ─── verifyToken middleware ───────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // decoded has id, email, role
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

async function parsePdfText(buffer) {
  const pdfModule = require("pdf-parse");
  
  if (pdfModule && pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text || "";
    } finally {
      await parser.destroy().catch(() => {});
    }
  }
  
  if (typeof pdfModule === "function") {
    const data = await pdfModule(buffer);
    return data.text || "";
  }
  
  if (pdfModule && typeof pdfModule.default === "function") {
    const data = await pdfModule.default(buffer);
    return data.text || "";
  }

  throw new Error("Unable to locate a valid PDF parsing function or class in 'pdf-parse' module.");
}

const app = express();
const port = 3000;

// ─── HTTP server + socket.io setup ───────────────────────
const server = createServer(app);             // NEW
const io = new Server(server, {              // NEW
  cors: { origin: "*" }
});
const activeUsers = new Map();               // NEW

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    activeUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  }
  socket.on("disconnect", () => {
    if (userId) {
      activeUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  });
});

const db = new pg.Client({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "secrate",
  password: process.env.PG_PASSWORD || "Monu@Sharma26",
  port: Number(process.env.PG_PORT) || 5432,
});

db.connect()
  .then(async () => {
    console.log("Connected to database successfully");
    try {
      await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_text TEXT;");
      await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_skills TEXT;");
      await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_filename VARCHAR(255);");
      console.log("Database schema checked and verified (resume columns present)");
    } catch (e) {
      console.error("Failed to run database migrations:", e.message);
    }
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT"],         // added PUT
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  console.log(email);

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required.",
    });
  }

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Try logging in.",
      });
    }

    const emailString = String(email || "");
    const role = emailString.endsWith("@admin.com") ? "admin" : "user";

    await db.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3)", [
      email,
      password,
      role,
    ]);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.username || req.body.email;
const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required.",
    });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = result.rows[0];
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    // ─── Generate JWT token on login ─────────────────────
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,                                  // NEW — send token to frontend
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

// GET all jobs
app.get("/jobs", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT jobs.*, users.email as author_email FROM jobs JOIN users ON jobs.user_id = users.id ORDER BY jobs.created_at DESC"
    );
    res.json({ success: true, jobs: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching jobs" });
  }
});

// POST a new job
app.post("/jobs", async (req, res) => {
  const { title, description, image_data, user_id } = req.body;
  if (!title || !description || !user_id) {
    return res.status(400).json({ success: false, message: "Title, description, and user ID are required" });
  }

  try {
    await db.query(
      "INSERT INTO jobs (title, description, image_data, user_id) VALUES ($1, $2, $3, $4)",
      [title, description, image_data, user_id]
    );
    res.status(201).json({ success: true, message: "Job posted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error posting job" });
  }
});

// POST to apply for a job
app.post("/apply", async (req, res) => {
  const { job_id, user_id } = req.body;
  if (!job_id || !user_id) {
    return res.status(400).json({ success: false, message: "Job ID and User ID are required" });
  }

  try {
    const existing = await db.query(
      "SELECT * FROM applications WHERE job_id = $1 AND user_id = $2",
      [job_id, user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "You have already applied for this job." });
    }

    await db.query(
      "INSERT INTO applications (job_id, user_id) VALUES ($1, $2)",
      [job_id, user_id]
    );
    res.status(201).json({ success: true, message: "Applied successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error applying for job" });
  }
});

const SKILLS_LIST = [
  "javascript", "typescript", "python", "java", "c++", "c#", "php", "ruby", "rust", "go", "swift", "kotlin", "scala", "r", "matlab",
  "html", "css", "react", "angular", "vue", "next.js", "nextjs", "nuxt", "svelte", "tailwind", "bootstrap", "sass", "less", "jquery", "flutter", "react native",
  "node.js", "nodejs", "express", "django", "flask", "fastapi", "spring boot", "springboot", "laravel", "rails", "asp.net", "nest.js", "nestjs",
  "mongodb", "postgresql", "postgres", "mysql", "sqlite", "redis", "firebase", "cassandra", "mariadb", "oracle", "sql server",
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins", "git", "github", "gitlab", "ci/cd", "terraform", "ansible", "nginx",
  "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "keras", "pandas", "numpy", "scikit-learn", "data analysis", "tableau", "power bi",
  "ui/ux", "figma", "photoshop", "illustrator", "agile", "scrum", "project management", "product management", "system design", "rest api", "graphql", "grpc", "microservices", "testing", "jest", "cypress", "selenium"
];

function extractSkills(text) {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const foundSkills = [];
  for (const skill of SKILLS_LIST) {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    let match = false;
    if (skill.includes("+") || skill.includes(".") || skill.includes("#") || skill.includes(" ")) {
      const idx = lowerText.indexOf(skill);
      if (idx !== -1) {
        const charBefore = idx > 0 ? lowerText[idx - 1] : " ";
        const charAfter = idx + skill.length < lowerText.length ? lowerText[idx + skill.length] : " ";
        const isBeforeBound = /[^a-z0-9+#.]/.test(charBefore);
        const isAfterBound = /[^a-z0-9+#.]/.test(charAfter);
        if (isBeforeBound && isAfterBound) match = true;
      }
    } else {
      const regex = new RegExp('\\b' + escaped + '\\b', 'i');
      match = regex.test(lowerText);
    }
    if (match) foundSkills.push(skill);
  }
  return foundSkills;
}

// POST upload resume
app.post("/upload-resume", async (req, res) => {
  const { user_id, filename, file_data } = req.body;
  if (!user_id || !filename || !file_data) {
    return res.status(400).json({ success: false, message: "User ID, filename, and file data are required" });
  }

  try {
    let resumeText = "";
    if (filename.toLowerCase().endsWith(".txt")) {
      resumeText = Buffer.from(file_data, "base64").toString("utf-8");
    } else if (filename.toLowerCase().endsWith(".pdf")) {
      const pdfBuffer = Buffer.from(file_data, "base64");
      resumeText = await parsePdfText(pdfBuffer);
    } else {
      return res.status(400).json({ success: false, message: "Unsupported file type. Only PDF and TXT are supported." });
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ success: false, message: "The resume contains no readable text." });
    }

    const skills = extractSkills(resumeText);

    await db.query(
      "UPDATE users SET resume_text = $1, resume_skills = $2, resume_filename = $3 WHERE id = $4",
      [resumeText, JSON.stringify(skills), filename, user_id]
    );

    res.status(200).json({
      success: true,
      message: "Resume processed and saved successfully",
      resume: { filename, skills, text_length: resumeText.length }
    });
  } catch (err) {
    console.error("Error processing resume:", err);
    res.status(500).json({ success: false, message: "Error processing resume: " + err.message });
  }
});

// GET user resume
app.get("/user-resume/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await db.query(
      "SELECT resume_filename, resume_skills, resume_text FROM users WHERE id = $1",
      [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const row = result.rows[0];
    if (!row.resume_filename) {
      return res.json({ success: true, has_resume: false });
    }

    res.json({
      success: true,
      has_resume: true,
      resume: {
        filename: row.resume_filename,
        skills: row.resume_skills ? JSON.parse(row.resume_skills) : [],
        text_length: row.resume_text ? row.resume_text.length : 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching user resume" });
  }
});

// GET job matches for a user
app.get("/job-matches/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const userResult = await db.query(
      "SELECT resume_skills, resume_text FROM users WHERE id = $1",
      [user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userRow = userResult.rows[0];
    if (!userRow.resume_skills) {
      return res.json({ success: true, has_resume: false, matches: [] });
    }

    const userSkills = JSON.parse(userRow.resume_skills);

    const jobsResult = await db.query(
      "SELECT jobs.*, users.email as author_email FROM jobs JOIN users ON jobs.user_id = users.id ORDER BY jobs.created_at DESC"
    );
    const jobs = jobsResult.rows;

    const appliedResult = await db.query(
      "SELECT job_id FROM applications WHERE user_id = $1",
      [user_id]
    );
    const appliedJobIds = new Set(appliedResult.rows.map(row => row.job_id));

    const matches = jobs.map(job => {
      const jobSkills = extractSkills(job.title + " " + job.description);
      let matchScore = 0;
      let matchedSkills = [];
      let missingSkills = [];

      if (jobSkills.length > 0) {
        matchedSkills = userSkills.filter(skill => jobSkills.includes(skill));
        missingSkills = jobSkills.filter(skill => !userSkills.includes(skill));
        matchScore = Math.round((matchedSkills.length / jobSkills.length) * 100);
      } else {
        const jobWords = new Set(
          (job.title + " " + job.description)
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .split(/\s+/)
            .filter(w => w.length > 3)
        );
        const resumeWords = (userRow.resume_text || "")
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          .split(/\s+/)
          .filter(w => w.length > 3);

        const resumeWordsSet = new Set(resumeWords);
        const overlap = [...jobWords].filter(w => resumeWordsSet.has(w));
        if (jobWords.size > 0) {
          matchScore = Math.min(Math.round((overlap.length / jobWords.size) * 100), 75);
        }
      }

      return {
        ...job,
        match_score: matchScore,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
        required_skills: jobSkills,
        already_applied: appliedJobIds.has(job.id)
      };
    });

    matches.sort((a, b) => b.match_score - a.match_score);

    res.json({
      success: true,
      has_resume: true,
      user_skills: userSkills,
      matches
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error generating job matches" });
  }
});

// Toggle Bookmark (Add/Remove)
app.post("/api/jobs/bookmark/:jobId", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const jobId = req.params.jobId;

  try {
    const checkResult = await db.query(
      "SELECT * FROM bookmarks WHERE user_id = $1 AND job_id = $2",
      [userId, jobId]
    );

    if (checkResult.rows.length > 0) {
      await db.query(
        "DELETE FROM bookmarks WHERE user_id = $1 AND job_id = $2",
        [userId, jobId]
      );
      return res.json({ bookmarked: false, message: "Bookmark removed" });
    } else {
      await db.query(
        "INSERT INTO bookmarks (user_id, job_id) VALUES ($1, $2)",
        [userId, jobId]
      );
      return res.json({ bookmarked: true, message: "Job bookmarked successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error toggling bookmark" });
  }
});

// Update application status + emit socket alert
app.put("/api/applications/:applicationId/status", verifyToken, async (req, res) => {
  const { status } = req.body;
  const appId = req.params.applicationId;

  try {
    // ⚠️ uses user_id not candidate_id (matching your applications table)
    const updateQuery = "UPDATE applications SET status = $1 WHERE id = $2 RETURNING user_id, job_id";
    const result = await db.query(updateQuery, [status, appId]);
    const application = result.rows[0];

    const jobResult = await db.query("SELECT title FROM jobs WHERE id = $1", [application.job_id]);
    const jobTitle = jobResult.rows[0].title;

    const candidateSocketId = activeUsers.get(application.user_id.toString());
    if (candidateSocketId) {
      io.to(candidateSocketId).emit("statusAlert", {
        message: `Congratulations! Your application status for "${jobTitle}" has been updated to "${status}".`,
      });
    }

    res.json({ message: "Status updated successfully", status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error updating status" });
  }
});

// ─── server.listen instead of app.listen ─────────────────
server.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});