import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

app.use(cors({
  origin: "https://capable-ganache-f99392.netlify.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Distress Backend Live 🚀");
});

app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    // 1️⃣ Email to YOU (lead notification)
    await sgMail.send({
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Distress Lead",
      html: `<p>New subscriber: <b>${email}</b></p>`
    });

    // 2️⃣ Email to USER (confirmation)
    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL,
      subject: "✅ You’re In — Phoenix Hotlist",
      html: `
        <h2>Welcome 👋</h2>
        <p>You are now subscribed to <b>Phoenix Hotlist</b>.</p>
        <p>Sample deals coming soon.</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("SendGrid Error:", err.response?.body || err.message);

    // Never break frontend
    res.json({ success: true });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
