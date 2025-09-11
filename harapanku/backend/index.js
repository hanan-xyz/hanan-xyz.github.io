import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  ALLOWED_ORIGIN,
  PORT = 3000
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || !ALLOWED_ORIGIN) {
  throw new Error('Env vars not set! Edit .env file.');
}

const app = express();

app.set('trust proxy', 'loopback');
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGIN, optionsSuccessStatus: 200 }));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({ windowMs: 3000, max: 1, standardHeaders: true, legacyHeaders: false });
app.use('/track-play', limiter);

async function sendTelegram(msg) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text: msg,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

app.post('/track-play', async (req, res) => {
  try {
    const { event, video_id, client_ts_iso, tz, offset_min, ua } = req.body;
    if (event !== 'video_play') return res.status(400).json({ error: 'Invalid event' });
    const ip = req.headers['x-forwarded-for']?.split(',').shift()
      || req.socket?.remoteAddress
      || req.ip;
    const nowIso = new Date().toISOString();
    const msg =
      `🎬 <b>Video Play</b> (${video_id || '-'})\n` +
      `🕒 <b>Client:</b> ${client_ts_iso || '-'} (${tz || '-'}, offset ${offset_min || '-'})\n` +
      `🕙 <b>Server:</b> ${nowIso}\n` +
      `🌏 <b>IP:</b> <code>${ip}</code>\n` +
      `📱 <b>UA:</b> ${ua?.slice(0,80) || '-'}`;
    sendTelegram(msg).catch(() => { });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }
});
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.listen(PORT, () => {
  console.log('Server ready at http://localhost:' + PORT);
});
