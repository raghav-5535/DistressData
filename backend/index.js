import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import axios from "axios";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();

app.use(cors({
  origin: "https://capable-ganache-f99392.netlify.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
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

  try {
    // 1️⃣ Store in SendGrid Contacts (DB replacement)
    await axios.put(
      "https://api.sendgrid.com/v3/marketing/contacts",
      {
        contacts: [{ email }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // 2️⃣ Send confirmation email
    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL,
      subject: "You're in 🔥 Phoenix Hotlist",
      html: `
        <h2>Welcome 👋</h2>
        <p>You’re subscribed to <b>Phoenix Hotlist</b>.</p>
        <p>Exclusive distressed deals coming soon.</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("SendGrid error:", err.response?.data || err.message);

    // Do NOT block frontend
    res.status(200).json({ success: true });
  }
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
