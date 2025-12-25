import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";


dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

/* ======================
   MIDDLEWARE
====================== */
app.use(cors({
  origin: "https://capable-ganache-f99392.netlify.app",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

/* ======================
   HEALTH CHECK
====================== */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ======================
   ROOT
====================== */
app.get("/", (req, res) => {
  res.send("Distress Backend Live 🚀");
});

/* ======================
   SUBSCRIBE
====================== */
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    await sgMail.send({
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Distress Lead",
      html: `<p>New signup: <b>${email}</b></p>`
    });

    res.json({ success: true });
  } catch (err) {
    console.error("SendGrid error:", err.message);
    res.json({ success: true });
  }
});

/* ======================
   ADMIN STATS (PRIVATE)
====================== */
app.get("/admin/stats", async (req, res) => {
  const key = req.query.key;

  if (key !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`
      }
    });

    const data = await response.json();

    res.json({
      total: data.contact_count || 0,
      contacts: data.result?.slice(0, 20) || []
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Admin fetch failed" });
  }
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
