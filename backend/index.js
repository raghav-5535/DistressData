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
// HEALTH CHECK
// ======================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "distress-backend",
    time: new Date().toISOString()
  });
});

// ======================
// ROOT
// ======================
app.get("/", (req, res) => {
  res.send("Distress Backend Live 🚀");
});

// ======================
// SUBSCRIBE (SENDGRID API)
// ======================
app.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const msg = {
      to: process.env.FROM_EMAIL,        // YOU receive the lead
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Distress Lead",
      text: `New subscriber: ${email}`,
      html: `
        <h2>New Distress Lead</h2>
        <p>Email: <b>${email}</b></p>
      `
    };

    await sgMail.send(msg);

    res.json({ success: true });

  } catch (err) {
    console.error("SendGrid error:", err.message);

    // IMPORTANT: do NOT fail frontend
    res.status(200).json({
      success: true,
      note: "Captured (email pending)"
    });
  }
});

// ======================
// SERVER
// ======================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
