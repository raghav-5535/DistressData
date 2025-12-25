import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

/* ======================
   TEMP STORAGE (NO DB)
   NOTE: resets on redeploy
====================== */
const subscribers = [];
const paidUsers = new Set();

/* ======================
   MIDDLEWARE
====================== */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
}));
app.use(express.json());

/* ======================
   HEALTH
====================== */
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "distress-backend" });
});

/* ======================
   SUBSCRIBE (LEAD CAPTURE)
====================== */
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  if (!subscribers.includes(email)) {
    subscribers.push(email);

    // Notify YOU
    try {
      await sgMail.send({
        to: process.env.FROM_EMAIL,
        from: process.env.FROM_EMAIL,
        subject: "🔥 New Phoenix Lead",
        html: `<p><b>${email}</b> just subscribed.</p>`
      });
    } catch (err) {
      console.error("SendGrid error:", err.message);
    }
  }

  res.json({ success: true });
});

/* ======================
   ACCESS CHECK
====================== */
app.post("/access", (req, res) => {
  const { email } = req.body;

  if (paidUsers.has(email)) {
    return res.json({ access: "granted" });
  }

  res.json({ access: "locked" });
});

/* ======================
   ADMIN: UNLOCK PAID USER
====================== */
app.post("/admin/unlock", (req, res) => {
  const key = req.headers["x-admin-key"];
  const { email } = req.body;

  if (key !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
