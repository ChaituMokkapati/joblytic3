# How to paste API keys (hackathon)

1. Open `backend/.env` (copy from `.env.example` if needed).
2. Paste:

```
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
RESEND_API_KEY=re_...
NOTIFY_MODE=live
```

3. Restart backend (`node server.js` in `backend/`).
4. Open dashboard → **Trace** → **Run Dual Agents**.

Without keys, demo mode still runs the full agent pipeline (dedupe + checklist + alert logs).
