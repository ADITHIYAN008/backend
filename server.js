require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // frontend
    credentials: true,
  })
);

app.use(express.json());

// DUMMY USERS
const users = new Map([
  [
    "admin",
    {
      password: "12345",
      username: "Adithiyan R",
      role: "Admin",
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "user",
    {
      password: "password",
      username: "Karthikeyan K",
      role: "Employee",
      createdAt: new Date().toISOString(),
    },
  ],
  [
    "facilitator",
    {
      password: "password",
      username: "Kishore K",
      role: "Facilitator",
      createdAt: new Date().toISOString(),
    },
  ],
]);

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const JWT_EXPIRES_IN = "2h";

// SIGN A TOKEN
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// VERIFY TOKEN MIDDLEWARE
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ error: "Missing Authorization header" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.get(username);

  if (!user || user.password !== password)
    return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({
    id: username,
    name: user.username,
    role: user.role,
  });

  return res.json({ token, expiresIn: JWT_EXPIRES_IN });
});

// ⛳ NEW: TOKEN VALIDATION ENDPOINT
app.get("/auth/validate", verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// EXAMPLE PROTECTED ROUTE
app.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Protected route working!", user: req.user });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
