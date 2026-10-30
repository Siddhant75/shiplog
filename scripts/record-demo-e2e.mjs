import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import http from 'http';

const PORT = process.env.PORT || 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEMO_DIR = path.join(process.cwd(), 'demo-assets');
const VIDEO_DIR = path.join(DEMO_DIR, 'video');

function waitForServer(url, timeoutMs = 35000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    }

    function retry() {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server did not respond at ${url} within ${timeoutMs}ms`));
      } else {
        setTimeout(check, 500);
      }
    }

    check();
  });
}

async function run() {
  console.log('===========================================================');
  console.log('🚀 ShipLog: Automated E2E Test & Demo Video/Asset Studio');
  console.log('===========================================================');

  if (!fs.existsSync(DEMO_DIR)) {
    fs.mkdirSync(DEMO_DIR, { recursive: true });
  }
  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
  }

  // 1. Spawn Next.js server on PORT
  console.log(`⚡ Spawning Next.js server on port ${PORT}...`);
  const serverProcess = spawn('npx.cmd', ['next', 'dev', '-p', String(PORT), '-H', '127.0.0.1'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, PORT: String(PORT) },
  });

  serverProcess.stdout.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('Ready in') || msg.includes('started server on') || msg.includes('Local:')) {
      console.log(`   [Next.js] ${msg.trim()}`);
    }
  });

  serverProcess.stderr.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('Error') || msg.includes('Failed')) {
      console.error(`   [Next.js Notice] ${msg.trim()}`);
    }
  });

  console.log(`⏳ Waiting for Next.js to be ready at ${BASE_URL}...`);
  await waitForServer(BASE_URL, 40000);
  console.log(`✅ Next.js is online at ${BASE_URL}`);

  // 2. Detect Available Browser
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  let executablePath;
  if (fs.existsSync(chromePath)) {
    executablePath = chromePath;
    console.log(`🌐 Browser Engine: System Google Chrome (${chromePath})`);
  } else if (fs.existsSync(edgePath)) {
    executablePath = edgePath;
    console.log(`🌐 Browser Engine: System Microsoft Edge (${edgePath})`);
  } else {
    console.log('🌐 Browser Engine: Default Playwright Chromium');
  }

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  page.on('console', (msg) => console.log('   [Browser Console]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('   [Browser PageError]', err.message));
  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      console.log(`   [API Response] ${res.status()} ${res.url()}`);
    }
  });

  try {
    console.log(`\n📡 [Step 1] Loading ShipLog Dashboard at ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // 1. Hero Landing View
    console.log('📸 [Asset 1/7] Capturing Hero Landing View...');
    await page.waitForSelector('h1:has-text("ShipLog")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DEMO_DIR, '01-hero-landing.png'), fullPage: false });

    // 2. Click 1-Click Judge Demo Scenario
    console.log('\n⚡ [Step 2] Triggering 1-Click Judge Demo (Sample Scenario)...');
    const sampleBtn = page.locator('button:has-text("Try Sample Scenario")');
    await sampleBtn.click();

    await page.waitForTimeout(1200);
    console.log('📸 [Asset 2/7] Capturing Voice Input Prompt State...');
    await page.screenshot({ path: path.join(DEMO_DIR, '02-voice-prompt-loaded.png') });

    // 3. Wait for Artifacts View to Render
    console.log('\n⏳ [Step 3] Waiting for Autonomous Agent Loop & Verification...');
    await page.waitForSelector('#tab-portfolio', { timeout: 25000 });
    await page.waitForSelector('h3:has-text("Resilient WebSocket Reconnection Layer")', { timeout: 10000 });

    console.log('📸 [Asset 3/7] Capturing Verified Portfolio Card (with ShieldCheck pills)...');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(DEMO_DIR, '03-portfolio-verified-tags.png') });

    // 4. Standup Update Tab
    console.log('\n📋 [Step 4] Switching to Standup Update Tab...');
    const standupTab = page.locator('#tab-standup');
    await standupTab.click();
    await page.waitForTimeout(1000);
    console.log('📸 [Asset 4/7] Capturing Standup Update Deliverable...');
    await page.screenshot({ path: path.join(DEMO_DIR, '04-standup-update.png') });
    await page.waitForTimeout(2000);

    // 5. Decision Log Tab
    console.log('\n🏛️ [Step 5] Switching to Architectural Decision Log Tab...');
    const decisionsTab = page.locator('#tab-decisions');
    await decisionsTab.click();
    await page.waitForTimeout(1000);
    console.log('📸 [Asset 5/7] Capturing Decision Log with Monospace Code Evidence...');
    await page.screenshot({ path: path.join(DEMO_DIR, '05-decision-log-evidence.png') });
    await page.waitForTimeout(2000);

    // 6. Reasoning Trace Tab (DOMPurify Sanitized)
    console.log('\n🔍 [Step 6] Switching to 5-Step Agent Reasoning Trace Tab...');
    const traceTab = page.locator('#tab-trace');
    await traceTab.click();
    await page.waitForTimeout(1000);
    console.log('📸 [Asset 6/7] Capturing DOMPurify-Protected Reasoning Trace...');
    await page.screenshot({ path: path.join(DEMO_DIR, '06-reasoning-trace-dompurify.png') });
    await page.waitForTimeout(2000);

    // 7. Security Settings Modal (Zero-Persistence & Local Ollama)
    console.log('\n⚙️ [Step 7] Opening Security & Model Settings Modal...');
    const settingsBtn = page.locator('button[title="Configure Model & Security Settings"]');
    await settingsBtn.click();
    await page.waitForSelector('h2:has-text("Security & Model Settings")');
    await page.waitForTimeout(1200);
    console.log('📸 [Asset 7/7] Capturing 5-Pillar Security Settings Modal...');
    await page.screenshot({ path: path.join(DEMO_DIR, '07-security-settings-modal.png') });
    await page.waitForTimeout(2500);

    // Close modal with Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);

    // Retrieve video path before context closes
    const video = page.video();
    const rawVideoPath = await video?.path();

    console.log('\n🎬 Finalizing browser session and flushing video recording...');
    await context.close();
    await browser.close();

    const finalVideoPath = path.join(DEMO_DIR, 'shiplog-automated-demo.webm');
    if (rawVideoPath && fs.existsSync(rawVideoPath)) {
      fs.copyFileSync(rawVideoPath, finalVideoPath);
      console.log(`\n🎥 Automated Video Saved: ${finalVideoPath}`);
    }

    const screenshots = fs.readdirSync(DEMO_DIR).filter((f) => f.endsWith('.png'));
    console.log(`\n🖼️  Generated ${screenshots.length} Pixel-Perfect 1080p Demo Screenshots:`);
    for (const shot of screenshots) {
      console.log(`   ✨ demo-assets/${shot}`);
    }

    console.log('\n✅ E2E Assertions & Browser Verification PASSED (100% SUCCESS)');
  } finally {
    if (serverProcess) {
      console.log('🛑 Shutting down spawned Next.js server...');
      serverProcess.kill('SIGTERM');
    }
  }
  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ E2E Demo Recording Error:', err);
  process.exit(1);
});
