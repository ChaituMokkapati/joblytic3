# AMB Joblytic - Run Guide

Stack: **Vite + React** (port `3000`) / **Express** (port `5000`) / **MongoDB**

---

## 1) First time after pull from GitHub (install once)

Needs: **Node.js 18+**, **npm**, and **MongoDB** running locally.

```bash
# Clone (replace with your repo URL after push)
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# Install frontend dependencies
npm install

# Install backend dependencies (+ Playwright Chromium via postinstall)
cd backend
npm install

# Create env file from example
copy .env.example .env
# On Mac/Linux: cp .env.example .env

# Start backend (keep this terminal open)
npm start
```

Open a **second** terminal:

```bash
# From project root
cd <your-repo>
npm run dev
```

Then open:
- App -> http://localhost:3000
- API -> http://localhost:5000

Optional keys (OpenAI / Twilio / Resend) can be pasted later into `backend/.env`. Scraping works without any API keys.

---

## 2) Later / normal run (already installed)

Start MongoDB if it is not running, then:

**Terminal 1 - backend**

```bash
cd backend
npm start
```

**Terminal 2 - frontend**

```bash
npm run dev
```

App: http://localhost:3000

---

## Scraping (stronger)

- Strategy: **RSS -> HTTP -> Playwright** for JS-heavy / Cloudflare portals
- **13 portals** including FreeJobAlert, SarkariResult, SarkariExam, SarkariJobFind, RojgarResult, GovtJobsBlog, SSC, IBPS, UPSC, RRB, Employment News, NCS, TNPSC
- **Scheduled cron** (default every 6 hours): set in `backend/.env`
  - `SCRAPE_CRON_ENABLED=1`
  - `SCRAPE_CRON=0 */6 * * *`
  - `SCRAPE_USE_PLAYWRIGHT=1` (set `0` to disable browser fallback)
- Manual: Dashboard -> **Scrape** tab, or Deadlines -> **Refresh & scrape portals**
- First install needs Chromium: `cd backend && npx playwright install chromium`

---

## Quick tips

| Action | Where |
|--------|--------|
| Live scrape portals | Dashboard -> **Scrape** tab, or Deadlines -> **Refresh & scrape portals** |
| Login | Any new email/password auto-creates account, or use **Demo Access** |
| Alerts demo mode | `NOTIFY_MODE=demo` in `backend/.env` (default) |
