import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

// ================= CONFIG =================
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;
const ADMIN_KEY = process.env.ADMIN_KEY || "phoenix-2025";

// ================= DB =================
let db;

MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db("distress");
    console.log("✅ MongoDB Connected");
  })
  .catch(err => {
    console.error("❌ MongoDB error", err);
  });

// ================= ROUTES =================

// Health check
app.get("/", (req, res) => {
  res.send("Phoenix backend running 🚀");
});

// -------- SUBSCRIBE --------
app.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const existing = await db
      .collection("subscribers")
      .findOne({ email });

    if (existing) {
      return res.json({ message: "Already subscribed" });
    }

    await db.collection("subscribers").insertOne({
      email,
      status: "FREE",
      createdAt: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// -------- STATS --------
app.get("/stats", async (req, res) => {
  const totalSubscribers = await db
    .collection("subscribers")
    .countDocuments();

  res.json({ totalSubscribers });
});

// ================= ADMIN =================

// Get all users
app.get("/admin/users", async (req, res) => {
  if (req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const users = await db
    .collection("subscribers")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  res.json(users);
});

// Approve user
app.post("/admin/approve", async (req, res) => {
  if (req.headers["x-admin-key"] !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { email } = req.body;

  await db.collection("subscribers").updateOne(
    { email },
    { $set: { status: "PAID", approvedAt: new Date() } }
  );

  res.json({ success: true });
});

// ================= START =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
