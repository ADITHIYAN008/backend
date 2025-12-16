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

// =========================
// BATCH MANAGEMENT STORE
// =========================
let batches = [
  {
    code: "IGNITE-2025-A",
    name: "Full Stack January 2025",
    domain: "Not Specified",
    startDate: "2025-01-15",
    endDate: "2025-05-15",
    trainees: 30,
    status: "Upcoming",
  },
];

// USER MANAGEMENT STORE
let employeeUsers = [
  {
    id: "EMP001",
    name: "Karthikeyan K",
    email: "karthikeyan@tcs.com",
    role: "Developer",
    team: "Development",
    status: "Active",
  },
  {
    id: "EMP002",
    name: "Adithiyan R",
    email: "adithiyan@tcs.com",
    role: "Manager",
    team: "Architecture",
    status: "Active",
  },
];

// GET ALL USERS
app.get("/users", verifyToken, (req, res) => {
  res.json(employeeUsers);
});

// GET ALL BATCHES
app.get("/batches", verifyToken, (req, res) => {
  res.json(batches);
});

// CREATE BATCH
app.post("/batches", verifyToken, (req, res) => {
  const batch = req.body;

  if (!batch.name || !batch.startDate || !batch.endDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const exists = batches.find((b) => b.code === batch.code);
  if (exists) {
    return res.status(409).json({ error: "Batch already exists" });
  }

  batches.push(batch);
  res.status(201).json(batch);
});

// UPDATE BATCH
app.put("/batches/:code", verifyToken, (req, res) => {
  const { code } = req.params;

  const index = batches.findIndex((b) => b.code === code);
  if (index === -1) {
    return res.status(404).json({ error: "Batch not found" });
  }

  batches[index] = {
    ...batches[index],
    ...req.body,
  };

  res.json(batches[index]);
});

// CREATE SINGLE USER
app.post("/users", verifyToken, (req, res) => {
  const { id, name, email, role, status } = req.body;

  if (!id || !name || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const exists = employeeUsers.find((u) => u.id === id);
  if (exists) {
    return res.status(409).json({ error: "User already exists" });
  }

  const newUser = {
    id,
    name,
    email,
    role,
    team: "Development", // default
    status,
  };

  employeeUsers.push(newUser);

  res.status(201).json(newUser);
});

// UPDATE USER
app.put("/users/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;

  const index = employeeUsers.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  employeeUsers[index] = {
    ...employeeUsers[index],
    name,
    email,
    role,
    status,
  };

  res.json(employeeUsers[index]);
});

// BULK USER UPLOAD
app.post("/users/bulk", verifyToken, (req, res) => {
  const users = req.body; // expect array

  if (!Array.isArray(users)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  users.forEach((u) => {
    if (!employeeUsers.find((e) => e.id === u.id)) {
      employeeUsers.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || "Developer",
        team: u.team || "Development",
        status: u.status || "Active",
      });
    }
  });

  res.json({ message: "Bulk users uploaded", count: users.length });
});

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
