import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import fs from "fs";

dotenv.config();

const app = express();

/* ======================
   CONFIG
====================== */
const ADMIN_SECRET = process.env.ADMIN_SECRET || "supersecret123";
const DB_FILE = "leads.json";
const HOTLIST_FILE = "hotlist.csv";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ======================
   JSON DATABASE
====================== */
let leads = [];

if (fs.existsSync(DB_FILE)) {
  try {
    leads = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    console.error("DB parse error:", e.message);
    leads = [];
  }
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(leads, null, 2));
}

/* ======================
   MIDDLEWARE
====================== */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

app.use(express.json());

/* ======================
   HEALTH
====================== */
app.get("/health", (req, res) => {
  res.json({ status: "ok", phoenix: "active" });
});

/* ======================
   STATS (PUBLIC)
====================== */
app.get("/stats", (req, res) => {
  res.json({
    totalSubscribers: leads.length
  });
});

/* ======================
   SUBSCRIBE
====================== */
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }

  leads.push({
    email,
    time: new Date(),
    pro: false,
    source: "facebook"
  });

  saveDB();

  try {
    await sgMail.send({
      to: process.env.FROM_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: "🔥 New Phoenix Lead",
      html: `<p><b>Email:</b> ${email}</p>`
    });
  } catch (e) {
    console.error("SendGrid error:", e.message);
  }

  res.json({ success: true });
});

/* ======================
   CSV HOTLIST SENDER
====================== */
function loadHotlist() {
  if (!fs.existsSync(HOTLIST_FILE)) return "No deals yet.";

  return fs.readFileSync(HOTLIST_FILE, "utf-8");
}

async function emailHotlist(toEmail, csvText) {
  try {
    await sgMail.send({
      to: toEmail,
      from: process.env.FROM_EMAIL,
      subject: "🏠 Phoenix Property Hotlist",
      html: `
        <h2>Latest Distress Deals</h2>
        <pre>${csvText}</pre>
        <p>Reply YES to upgrade via Gumroad.</p>
      `
    });
  } catch (e) {
    console.error("Hotlist send error:", e.message);
  }
}

/* ======================
   MANUAL SEND ENDPOINT
====================== */
app.post("/send-hotlist", async (req, res) => {
  if (req.query.key !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const csv = loadHotlist();

  for (const lead of leads) {
    await emailHotlist(lead.email, csv);
  }

  res.json({
    sent: leads.length,
    status: "phoenix-delivered"
  });
});

/* ======================
   AUTOMATED SCHEDULER
====================== */

const SIX_DAYS = 6 * 24 * 60 * 60 * 1000;

setInterval(async () => {
  const csv = loadHotlist();

  console.log("📬 Phoenix scheduler running — sending to", leads.length);

  for (const lead of leads) {
    await emailHotlist(lead.email, csv);
  }

}, SIX_DAYS);

/* ======================
   ADMIN DASHBOARD API
====================== */
app.get("/admin/stats", (req, res) => {
  if (req.query.key !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({
    total: leads.length,
    contacts: leads
  });
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Phoenix server running on port", PORT);
});
