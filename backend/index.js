import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

/* ======================
   TEMP STORAGE (NO DB)
====================== */
const subscribers = [];
const paidUsers = new Set();

/* ======================
   MIDDLEWARE
====================== */
app.use(cors({
  origin: "https://capable-ganache-f99392.netlify.app",
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
   SUBSCRIBE
====================== */
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  if (!subscribers.includes(email)) {
    subscribers.push(email);

    // notify YOU
    await sgMail.send({
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Phoenix Lead",
      html: `<p>${email}</p>`
    });
  }

  res.json({ success: true });
});

/* ======================
   CHECK ACCESS
====================== */
app.post("/access", (req, res) => {
  const { email } = req.body;
  if (paidUsers.has(email)) {
    res.json({ access: "granted" });
  } else {
    res.json({ access: "locked" });
  }
});

/* ======================
   ADMIN UNLOCK
====================== */
app.post("/admin/unlock", (req, res) => {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { email } = req.body;
  paidUsers.add(email);

  res.json({ unlocked: email });
});

/* ======================
   STATS
====================== */
app.get("/stats", (req, res) => {
  res.json({
    totalSubscribers: subscribers.length,
    paidUsers: paidUsers.size
  });
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🚀 Backend live"));
