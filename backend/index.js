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
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

    await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [
      email,
      password,
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
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
