import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(express.json());

/* ================= HEALTH ================= */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ================= SUBSCRIBE ================= */
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    // ✅ Store email in SendGrid Contacts (acts as DB)
    await fetch("https://api.sendgrid.com/v3/marketing/contacts", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contacts: [{ email }]
      })
    });

    // ✅ Optional notification email to you
    await sgMail.send({
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Phoenix Hotlist Signup",
      text: `New subscriber: ${email}`
    });

    res.json({ success: true });

  } catch (err) {
    console.error("SendGrid error:", err);
    // never block frontend
    res.json({ success: true });
  }
});

/* ================= STATS ================= */
app.get("/stats", async (req, res) => {
  try {
    const r = await fetch(
      "https://api.sendgrid.com/v3/marketing/stats/contacts",
      {
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`
        }
      }
    );

    const d = await r.json();

    res.json({
      totalSubscribers: d.contact_count || 0
    });

  } catch {
    res.json({ totalSubscribers: 0 });
  }
});

/* ================= SERVER ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
