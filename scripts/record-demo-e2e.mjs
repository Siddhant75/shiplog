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
  console.log('🚀 ShipLog: Automated E2E Test & Demo Studio (v2 Overhaul)');
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

  // Pre-warm API route so Next.js compiles it before the browser tour begins
  console.log('🔥 Pre-warming /api/agent/run to compile route...');
  try {
    const warmupRes = await fetch(`${BASE_URL}/api/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceTranscript: 'warmup', isMockSample: true }),
    });
    console.log(`⚡ /api/agent/run pre-warmed! Status: ${warmupRes.status}`);
  } catch (err) {
    console.log('   Warmup note:', err.message);
  }

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
  page.on('response', (res) => console.log('   [Network Response]', res.status(), res.url()));

  try {
    // -------------------------------------------------------------
    // SCENE 1: HERO LANDING & WISPR PULSE WAVEFORM
    // -------------------------------------------------------------
    console.log(`\n📡 [Scene 1] Loading ShipLog at ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    console.log('📸 [Asset 1/9] Hero Landing View...');
    await page.waitForSelector('h1:has-text("ShipLog")');
    await page.waitForTimeout(1500);

    // Focus voice textarea to trigger Wispr Pulse waveform
    const voiceInput = page.locator('#voice-transcript-input');
    await voiceInput.focus();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(DEMO_DIR, '01-hero-landing.png') });

    // -------------------------------------------------------------
    // SCENE 2: 1-CLICK JUDGE DEMO & REAL-TIME AGENT STEPPER HUD
    // -------------------------------------------------------------
    console.log('\n⚡ [Scene 2] Triggering 1-Click Judge Demo (Sample Scenario)...');
    const sampleBtn = page.locator('button:has-text("Try Sample Scenario")');
    await sampleBtn.click();

    console.log('📸 [Asset 2/9] Capturing Real-Time Agent Stepper HUD...');
    await page.waitForSelector('h3:has-text("Autonomous Agent Execution Pipeline")', { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(DEMO_DIR, '02-agent-execution-hud.png') });

    // -------------------------------------------------------------
    // SCENE 3: VERIFIED DELIVERABLES & DIFF GROUNDING PROOF
    // -------------------------------------------------------------
    console.log('\n⏳ [Scene 3] Waiting for Verified Artifacts View...');
    await page.waitForSelector('#tab-portfolio', { timeout: 45000 });
    await page.waitForSelector('h3:has-text("Resilient WebSocket Reconnection Layer")', { timeout: 10000 });
    await page.waitForTimeout(1500);

    console.log('📸 [Asset 3/9] Verified Portfolio Card & Anti-Hallucination Tag...');
    await page.screenshot({ path: path.join(DEMO_DIR, '03-portfolio-verified-tags.png') });

    // Click verified tech tag to open DiffInspectorModal
    console.log('\n🔍 [Scene 3b] Opening Git Diff Verification Proof Popover...');
    const wsPill = page.locator('button:has-text("WebSockets")').first();
    await wsPill.click();
    await page.waitForSelector('h3:has-text("Git Diff Verification Proof")');
    await page.waitForTimeout(1500);

    console.log('📸 [Asset 4/9] Interactive Git Diff Proof Modal...');
    await page.screenshot({ path: path.join(DEMO_DIR, '04-diff-inspector-proof.png') });

    // Close diff modal with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);

    // Switch to Standup Tab & Click Copy for Slack
    console.log('\n📋 [Scene 3c] Switching to Standup Update Tab & Copying for Slack...');
    const standupTab = page.locator('#tab-standup');
    await standupTab.click();
    await page.waitForTimeout(800);

    const copySlackBtn = page.locator('button:has-text("Copy for Slack")');
    await copySlackBtn.click();
    await page.waitForSelector('div[role="status"]:has-text("Copied Slack Standup")');
    await page.waitForTimeout(1200);

    console.log('📸 [Asset 5/9] Standup Tab with Slack Copy Toast...');
    await page.screenshot({ path: path.join(DEMO_DIR, '05-standup-slack-copy.png') });

    // -------------------------------------------------------------
    // SCENE 4: LIVING DEVELOPER PORTFOLIO (LIFETIME BRAG SHEET)
    // -------------------------------------------------------------
    console.log('\n🌐 [Scene 4] Navigating to Living Developer Portfolio...');
    const portfolioNav = page.locator('button:has-text("Living Portfolio")');
    await portfolioNav.click();
    await page.waitForSelector('h2:has-text("Living Developer Portfolio")');
    await page.waitForTimeout(1200);

    // Click WebSockets filter chip
    const wsFilter = page.locator('button:has-text("WebSockets")').first();
    await wsFilter.click();
    await page.waitForTimeout(800);

    // Click Share Portfolio button
    const shareBtn = page.locator('button:has-text("Share Portfolio")');
    await shareBtn.click();
    await page.waitForTimeout(1200);

    console.log('📸 [Asset 6/9] Living Developer Portfolio Gallery...');
    await page.screenshot({ path: path.join(DEMO_DIR, '06-living-portfolio-gallery.png') });

    // -------------------------------------------------------------
    // SCENE 5: ENGINEERING WIKI VAULT (LLM WIKI PATTERN)
    // -------------------------------------------------------------
    console.log('\n🧠 [Scene 5] Navigating to Engineering Wiki Vault...');
    const wikiNav = page.locator('button:has-text("Wiki Vault")');
    await wikiNav.click();
    await page.waitForSelector('h2:has-text("Engineering Wiki Vault")');
    await page.waitForTimeout(1200);

    // Click Security topic hub
    const secHub = page.locator('button:has-text("[[Security & Zero-Persistence]]")');
    await secHub.click();
    await page.waitForTimeout(1200);

    console.log('📸 [Asset 7/9] Engineering Wiki Vault & Topic Hubs...');
    await page.screenshot({ path: path.join(DEMO_DIR, '07-wiki-vault-hubs.png') });

    // -------------------------------------------------------------
    // SCENE 6: RESUME SYNC SUB-AGENT (GOOGLE XYZ BULLETS)
    // -------------------------------------------------------------
    console.log('\n📄 [Scene 6] Navigating to Resume Sync Sub-Agent...');
    const resumeNav = page.locator('button:has-text("Resume Sync")');
    await resumeNav.click();
    await page.waitForSelector('h2:has-text("Resume Sync Sub-Agent")');
    await page.waitForTimeout(1200);

    // Click Copy Bullets
    const copyBulletsBtn = page.locator('button:has-text("Copy Bullets")');
    await copyBulletsBtn.click();
    await page.waitForTimeout(1200);

    console.log('📸 [Asset 8/9] Resume Sync with ATS 94 Score & Google XYZ Bullets...');
    await page.screenshot({ path: path.join(DEMO_DIR, '08-resume-sync-ats.png') });

    // -------------------------------------------------------------
    // SCENE 7: SECURITY & MODEL SETTINGS MODAL
    // -------------------------------------------------------------
    console.log('\n⚙️ [Scene 7] Opening 5-Pillar Security & Settings Modal...');
    const settingsBtn = page.locator('button[title="Configure Model & Security Settings"]');
    await settingsBtn.click();
    await page.waitForSelector('h2:has-text("Security & Model Settings")');
    await page.waitForTimeout(1500);

    console.log('📸 [Asset 9/9] 5-Pillar Security Settings Modal...');
    await page.screenshot({ path: path.join(DEMO_DIR, '09-security-settings-modal.png') });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

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
