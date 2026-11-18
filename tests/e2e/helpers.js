import { chromium } from 'playwright';
import { startServer } from '../../scripts/serve.mjs';

export async function launch() {
  const { server, url } = await startServer(0);
  const browser = await chromium.launch();
  return { url, close: async () => { await browser.close(); server.close(); }, browser };
}

/** Fresh phone-sized context (390×844, touch) with its own storage; collects uncaught errors. */
export async function newApp(env, opts = {}) {
  const context = await env.browser.newContext({
    viewport: opts.desktop ? { width: 1280, height: 800 } : { width: 390, height: 844 }, deviceScaleFactor: 2,
    hasTouch: !opts.desktop, isMobile: !opts.desktop, locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires',
    reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference', acceptDownloads: true,
  });
  if (opts.initState) await context.addInitScript(s => { if (!localStorage.getItem('forge-state')) localStorage.setItem('forge-state', s); }, JSON.stringify(opts.initState));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(env.url);
  await page.waitForSelector('#main .title, #main h1');
  return { page, context, errors, url: env.url };
}

export async function onboard(page, name = 'Nico') {
  await page.fill('#ob-name', name); await page.click('[data-act=ob-next]');
  await page.fill('#ob-age', '30'); await page.fill('#ob-h', '178'); await page.fill('#ob-w', '80'); await page.click('[data-act=ob-next]');
  await page.click('[data-act=ob-next]');
  await page.waitForSelector('#nav:not(.hide)');
  await settle(page);
}
export const settle = (page, ms = 1300) => page.waitForTimeout(ms);          // entrance stagger lasts ~1.1 s
export const go = async (page, hash) => { await page.evaluate(h => { location.hash = h; }, hash); await page.waitForTimeout(400); };
export const stored = async page => { await page.waitForTimeout(450); return page.evaluate(() => JSON.parse(localStorage.getItem('forge-state'))); };
export const running = (page, name) => page.evaluate(n => document.getAnimations().filter(a => a.animationName === n).length, name);
