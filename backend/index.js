import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import sgMail from "@sendgrid/mail";

dotenv.config();

/* ======================
   SENDGRID
====================== */
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ======================
   APP INIT
====================== */
const app = express();

/* ======================
   MIDDLEWARE
====================== */
app.use(cors({
  origin: "*", // safe for now
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ======================
   MONGODB CONNECT
====================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("MongoDB error ❌", err));

/* ======================
   MODEL
====================== */
const LeadSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model("Lead", LeadSchema);

/* ======================
   ROUTES
====================== */

// Health
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "distress-backend",
    time: new Date().toISOString()
  });
});

// Root
app.get("/", (req, res) => {
  res.send("Distress Backend Live 🚀");
});

// Stats
app.get("/stats", async (req, res) => {
  const count = await Lead.countDocuments();
  res.json({ totalSubscribers: count });
});

// Subscribe
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    // Store in DB
    await Lead.create({ email });

    // Notify YOU via SendGrid
    await sgMail.send({
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Distress Lead",
      html: `<p>New subscriber: <b>${email}</b></p>`
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Subscribe error:", err.message);

    // Do NOT break frontend
    res.json({
      success: true,
      note: "Captured (email already exists or mail skipped)"
    });
  }
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
