import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

// ======================
// SENDGRID CONFIG
// ======================
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ======================
// APP INIT
// ======================
const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(
  cors({
    origin: "https://capable-ganache-f99392.netlify.app",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

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
// APPLY FOR ACCESS
// ======================
app.post("/apply", async (req, res) => {
  const { email, country, budget } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    // 📬 Email to YOU
    await sgMail.send({
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Early Access Application",
      html: `
        <h3>New Applicant</h3>
        <p><b>Email:</b> ${email}</p>
        <p><b>Country:</b> ${country || "N/A"}</p>
        <p><b>Investment Budget:</b> ${budget || "N/A"}</p>
      `
    });

    // 📩 Auto-reply to USER
    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL,
      subject: "You're on the Phoenix Hotlist 🏆",
      html: `
        <h2>Application Received</h2>
        <p>You're officially on the <b>Phoenix Hotlist</b>.</p>
        <p>We review applicants manually to maintain deal quality.</p>
        <p>If approved, you’ll receive access shortly.</p>
        <br/>
        <p>— Phoenix Team</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("SendGrid error:", err.message);

    // Do NOT break frontend
    res.json({ success: true });
  }
});

// ======================
// SERVER
// ======================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
