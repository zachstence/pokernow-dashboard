import { preview } from 'vite';
import { chromium } from 'playwright';

const server = await preview();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'dark' });

await page.goto('http://localhost:4173/og');
await page.screenshot({ path: `./static/og/og.png` });

await browser.close();
server.httpServer.close();
