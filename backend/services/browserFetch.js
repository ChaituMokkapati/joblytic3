/**
 * Shared browser (Playwright) for JS-heavy / Cloudflare-protected portals.
 * Lazy singleton — only launches when needed.
 */
import { chromium } from 'playwright';

let browserPromise = null;
let useBrowser = process.env.SCRAPE_USE_PLAYWRIGHT !== '0';

export function isPlaywrightEnabled() {
  return useBrowser;
}

async function getBrowser() {
  if (!useBrowser) throw new Error('Playwright disabled (SCRAPE_USE_PLAYWRIGHT=0)');
  if (!browserPromise) {
    browserPromise = chromium
      .launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
      })
      .catch((err) => {
        browserPromise = null;
        useBrowser = false;
        throw err;
      });
  }
  return browserPromise;
}

/**
 * Fetch rendered HTML via Chromium. Waits for network idle / Cloudflare challenge.
 */
export async function fetchHtmlWithBrowser(url, { timeoutMs = 45000, waitUntil = 'domcontentloaded' } = {}) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-IN',
    viewport: { width: 1365, height: 900 },
    extraHTTPHeaders: {
      'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8'
    }
  });

  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil, timeout: timeoutMs });

    // Soft wait for Cloudflare "Just a moment..." to clear when possible
    try {
      await page.waitForFunction(
        () => !/just a moment|checking your browser|cf-browser-verification/i.test(document.title + document.body?.innerText?.slice(0, 200)),
        { timeout: 20000 }
      );
    } catch {
      /* proceed with whatever HTML we have */
    }

    await new Promise((r) => setTimeout(r, 800));
    const html = await page.content();
    const title = await page.title();
    if (/just a moment/i.test(title) && html.length < 8000) {
      throw new Error('Cloudflare challenge not cleared');
    }
    return html;
  } finally {
    await context.close().catch(() => {});
  }
}

export async function closeBrowser() {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    /* ignore */
  }
  browserPromise = null;
}

process.on('exit', () => {
  /* best-effort; async close may not finish */
});
