import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

/* ======================
   MIDDLEWARE (TOP)
====================== */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ======================
   HEALTH CHECK
====================== */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "distress-backend",
    time: new Date().toISOString()
  });
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
        <p>Off-market opportunities coming soon.</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email failed" });
  }
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
