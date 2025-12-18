import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

// ======================
// SENDGRID
// ======================
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ======================
// APP
// ======================
const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(cors({
  origin: "https://capable-ganache-f99392.netlify.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ======================
// HEALTH
// ======================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ======================
// ROOT
// ======================
app.get("/", (req, res) => {
  res.send("Distress Backend Live 🚀");
});

// ======================
// SUBSCRIBE
// ======================
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    // 1️⃣ EMAIL TO YOU (LEAD)
    await sgMail.send({
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Phoenix Hotlist Lead",
      html: `<p>New subscriber: <b>${email}</b></p>`
    });

    // 2️⃣ EMAIL TO USER (WELCOME)
    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL,
      subject: "Welcome to Phoenix Hotlist 🚀",
      html: `
        <h2>You're In 🔥</h2>
        <p>You'll now receive off-market & distress deals.</p>
        <p><b>Phoenix Hotlist Team</b></p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("SendGrid error:", err);

    // NEVER break frontend UX
    res.json({ success: true });
  }
});

// ======================
// SERVER
// ======================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
