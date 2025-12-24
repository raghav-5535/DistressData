import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import sgMail from '@sendgrid/mail';

const app = express();
const PORT = process.env.PORT || 10000;

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json());

/* ---------- SENDGRID ---------- */
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/* ---------- MONGODB ---------- */
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI missing');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error', err);
    process.exit(1);
  });

/* ---------- MODEL ---------- */
const emailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const Email = mongoose.model('Email', emailSchema);

/* ---------- ROUTES ---------- */

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    await Email.create({ email });

    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL,
      subject: 'Welcome to Phoenix Hotlist',
      text: 'You are subscribed. Deals coming soon.',
    });

    res.json({ success: true });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already subscribed' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
