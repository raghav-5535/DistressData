import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Distress Backend Live 🚀");
});

// Subscribe route
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
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
      subject: "Welcome to Distress Deals",
      html: `
        <h2>Welcome 👋</h2>
        <p>You’re now subscribed to <b>Distress Deals</b>.</p>
        <p>We share off-market real estate opportunities with serious investors only.</p>
        <p><b>Watch your inbox.</b></p>
      `
    });

    res.json({ success: true, message: "Subscription successful" });

  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Server
const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Phoenix Hotlist Backend",
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
