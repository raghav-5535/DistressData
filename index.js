import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// --------------------
// MAIN DOOR
// --------------------
app.get("/", (req, res) => {
  res.send("Distress Backend Live 🚀");
});

// --------------------
// HEALTH DOOR
// --------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "distress-backend",
    time: new Date().toISOString()
  });
});

// --------------------
// EMAIL SIGNUP DOOR
// --------------------
app.post("/api/v1/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY
      }
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Welcome to Phoenix Hotlist",
      html: `<h3>You’re subscribed 🎉</h3>`
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Email failed" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
