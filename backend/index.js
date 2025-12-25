import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

const app = express();

/* ======================
   CONFIG
====================== */
const ADMIN_SECRET = process.env.ADMIN_SECRET || "supersecret123";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ======================
   TEMP DATABASE (MEMORY)
====================== */
const leads = [];

/* ======================
   MIDDLEWARE
====================== */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));
app.use(express.json());

/* ======================
   HEALTH
====================== */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ======================
   STATS (PUBLIC)
====================== */
app.get("/stats", (req, res) => {
  res.json({
    totalSubscribers: leads.length
  });
});

/* ======================
   SUBSCRIBE
====================== */
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  // store in memory
  leads.push({ email, time: new Date() });

  // notify you
  try {
    await sgMail.send({
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Phoenix Lead",
      html: `<p><b>Email:</b> ${email}</p>`
    });
  } catch (e) {
    console.error("SendGrid error:", e.message);
  }

  res.json({ success: true });
});

/* ======================
   ADMIN DASHBOARD API
====================== */
app.get("/admin/stats", (req, res) => {
  if (req.query.key !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({
    total: leads.length,
    contacts: leads
  });
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
