import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DATABASE || "secrate",
  password: process.env.PG_PASSWORD || "Monu@Sharma26",
  port: Number(process.env.PG_PORT) || 5432,
});

db.connect().catch((err) => {
  console.error("Database connection failed:", err.message);
});

app.use(
  cors({
    origin: "*", // allow all origins since frontend is on Vercel
    methods: ["GET", "POST"],
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
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Try logging in.",
      });
    }

    // Determine role based on email domain safely
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
  const email = req.body.username;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required.",
    });
  }

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

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

    return res.json({
      success: true,
      message: "Login successful.",
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
    // Check if user already applied
    const existing = await db.query("SELECT * FROM applications WHERE job_id = $1 AND user_id = $2", [job_id, user_id]);
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

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
