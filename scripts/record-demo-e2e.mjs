import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, execSync } from 'child_process';
import http from 'http';

const PORT = process.env.PORT || 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DEMO_DIR = path.join(process.cwd(), 'demo-assets');
const VIDEO_DIR = path.join(DEMO_DIR, 'video');
const SCENES_DIR = path.join(DEMO_DIR, 'scenes');

function waitForServer(url, timeoutMs = 45000) {
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
  console.log('🚀 ShipLog: Automated Demo Studio & Kokoro TTS Sync Engine');
  console.log('   Target Duration: ~110-115s (Full Hackathon Narrative)');
  console.log('===========================================================');

  if (!fs.existsSync(DEMO_DIR)) fs.mkdirSync(DEMO_DIR, { recursive: true });
  if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });
  if (!fs.existsSync(SCENES_DIR)) fs.mkdirSync(SCENES_DIR, { recursive: true });

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

  console.log(`⏳ Waiting for Next.js to be ready at ${BASE_URL}...`);
  await waitForServer(BASE_URL, 45000);
  console.log(`✅ Next.js is online at ${BASE_URL}`);

  // Pre-warm API route
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
    console.log(`🌐 Browser Engine: System Google Chrome`);
  } else if (fs.existsSync(edgePath)) {
    executablePath = edgePath;
    console.log(`🌐 Browser Engine: System Microsoft Edge`);
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
  const timecodes = [];
  const recordingStartTime = Date.now();

  function markScene(name) {
    const elapsed = (Date.now() - recordingStartTime) / 1000;
    timecodes.push({ name, startSec: elapsed });
    console.log(`⏱️  [${elapsed.toFixed(1)}s] Starting ${name}`);
  }

  try {
    // -------------------------------------------------------------
    // SCENE 1: HERO LANDING & WISPR PULSE WAVEFORM (~24s)
    // -------------------------------------------------------------
    markScene('Scene 1: Hero Landing & Wispr Pulse');
    console.log(`\n📡 [Scene 1] Loading ShipLog at ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await page.waitForSelector('h1:has-text("ShipLog")');
    await page.waitForTimeout(3000);

    // Focus voice textarea to trigger Wispr Pulse waveform
    const voiceInput = page.locator('#voice-transcript-input');
    await voiceInput.focus();
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(DEMO_DIR, '01-hero-landing.png') });

    // Simulate typing or speech streaming with Wispr Flow
    const sampleText = "Today I shipped the resilient WebSocket reconnection mechanism using exponential backoff with full jitter in TypeScript. Also looked into Kubernetes ingress.";
    await voiceInput.fill(sampleText);
    await page.waitForTimeout(10000);

    // -------------------------------------------------------------
    // SCENE 2: 1-CLICK JUDGE DEMO & AGENT STEPPER HUD (~8s)
    // -------------------------------------------------------------
    markScene('Scene 2: Agent Stepper HUD');
    console.log('\n⚡ [Scene 2] Triggering 1-Click Judge Demo (Sample Scenario)...');
    const sampleBtn = page.locator('button:has-text("Try Sample Scenario")');
    await sampleBtn.click();

    await page.waitForSelector('h3:has-text("Autonomous Agent Execution Pipeline")', { timeout: 10000 });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(DEMO_DIR, '02-agent-execution-hud.png') });

    // -------------------------------------------------------------
    // SCENE 3: VERIFIED ARTIFACTS & DIFF GROUNDING PROOF (~22s)
    // -------------------------------------------------------------
    markScene('Scene 3: Artifacts & Git Diff Grounding Proof');
    console.log('\n⏳ [Scene 3] Waiting for Verified Artifacts View...');
    await page.waitForSelector('#tab-portfolio', { timeout: 45000 });
    await page.waitForSelector('h3:has-text("Resilient WebSocket Reconnection Layer")', { timeout: 10000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(DEMO_DIR, '03-portfolio-verified-tags.png') });

    // Click verified tech tag to open DiffInspectorModal
    console.log('\n🔍 [Scene 3b] Opening Git Diff Verification Proof Popover...');
    const wsPill = page.locator('button:has-text("WebSockets")').first();
    await wsPill.click();
    await page.waitForSelector('h3:has-text("Git Diff Verification Proof")');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(DEMO_DIR, '04-diff-inspector-proof.png') });

    // Close diff modal with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);

    // Switch to Standup Tab & Click Copy for Slack
    console.log('\n📋 [Scene 3c] Switching to Standup Update Tab & Copying for Slack...');
    const standupTab = page.locator('#tab-standup');
    await standupTab.click();
    await page.waitForTimeout(2000);

    const copySlackBtn = page.locator('button:has-text("Copy for Slack")');
    await copySlackBtn.click();
    await page.waitForSelector('div[role="status"]:has-text("Copied Slack Standup")');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(DEMO_DIR, '05-standup-slack-copy.png') });

    // -------------------------------------------------------------
    // SCENE 4: LIVING DEVELOPER PORTFOLIO BENTO & CASE STUDY DRAWER (~23s)
    // -------------------------------------------------------------
    markScene('Scene 4: Bento Living Portfolio & Case Study Drawer');
    console.log('\n🌐 [Scene 4] Navigating to Modern Bento Living Developer Portfolio...');
    const portfolioNav = page.locator('button:has-text("Living Portfolio")');
    await portfolioNav.click();
    await page.waitForSelector('h2:has-text("Living Developer Portfolio")');
    await page.waitForTimeout(4000);

    // Click WebSockets filter chip
    console.log('🔍 Filtering by WebSockets...');
    const wsFilter = page.locator('button:has-text("WebSockets")').first();
    await wsFilter.click();
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(DEMO_DIR, '06-living-portfolio-gallery.png') });

    // Click Open Project Case Study
    console.log('\n📖 [Scene 4b] Opening Deep-Dive Project Case Study Drawer...');
    const openCaseStudyBtn = page.locator('button:has-text("Open Project Case Study")').first();
    await openCaseStudyBtn.click();
    await page.waitForSelector('div[role="dialog"]');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(DEMO_DIR, '07-project-case-study-drawer.png') });

    // Close case study drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);

    // Share Portfolio
    const shareBtn = page.locator('button:has-text("Share Portfolio")');
    await shareBtn.click();
    await page.waitForTimeout(3000);

    // -------------------------------------------------------------
    // SCENE 5: ENGINEERING WIKI VAULT (OBSIDIAN SPLIT-PANE) (~13s)
    // -------------------------------------------------------------
    markScene('Scene 5: Obsidian Split-Pane Wiki Vault');
    console.log('\n🧠 [Scene 5] Navigating to Obsidian Split-Pane Wiki Vault...');
    const wikiNav = page.locator('button:has-text("Wiki Vault")');
    await wikiNav.click();
    await page.waitForSelector('h2:has-text("Engineering Wiki Vault")');
    await page.waitForTimeout(4000);

    // Click Security & Zero-Persistence topic hub
    console.log('🖱️ Switching topic hub to [[Security & Zero-Persistence]]...');
    const secHub = page.locator('button:has-text("[[Security & Zero-Persistence]]")');
    await secHub.click();
    await page.waitForTimeout(6500);
    await page.screenshot({ path: path.join(DEMO_DIR, '08-wiki-vault-hubs.png') });

    // -------------------------------------------------------------
    // SCENE 6: RESUME SYNC SUB-AGENT (SPLIT-SCREEN STUDIO) (~16s)
    // -------------------------------------------------------------
    markScene('Scene 6: Resume Sync Studio & Brag Doc');
    console.log('\n📄 [Scene 6] Navigating to Split-Screen Resume Sync Studio...');
    const resumeNav = page.locator('button:has-text("Resume Sync")');
    await resumeNav.click();
    await page.waitForSelector('h2:has-text("Resume Sync Sub-Agent")');
    await page.waitForTimeout(4500);

    // Switch to Quarterly Brag Document tab
    console.log('📑 Switching to Quarterly Brag Document tab...');
    const bragTab = page.locator('button:has-text("Quarterly Brag Document")');
    await bragTab.click();
    await page.waitForTimeout(5500);
    await page.screenshot({ path: path.join(DEMO_DIR, '09-resume-sync-ats.png') });

    // Copy bullets
    const resumeTab = page.locator('button:has-text("ATS Resume Revision")');
    await resumeTab.click();
    await page.waitForTimeout(1000);
    const copyBulletsBtn = page.locator('button:has-text("Copy Bullets")');
    await copyBulletsBtn.click();
    await page.waitForTimeout(3000);

    // -------------------------------------------------------------
    // SCENE 7: 5-PILLAR SECURITY & OLLAMA MODEL SETTINGS (~11s)
    // -------------------------------------------------------------
    markScene('Scene 7: 5-Pillar Security & Settings Modal');
    console.log('\n⚙️ [Scene 7] Opening 5-Pillar Security & Settings Modal...');
    const settingsBtn = page.locator('button[title="Configure Model & Security Settings"]');
    await settingsBtn.click();
    await page.waitForSelector('h2:has-text("Security & Model Settings")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(DEMO_DIR, '10-security-settings-modal.png') });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(3500);

    const totalDurationSec = (Date.now() - recordingStartTime) / 1000;
    console.log(`\n⏱️ Total Recorded Tour Duration: ${totalDurationSec.toFixed(1)}s`);

    // Complete timecodes end time
    for (let i = 0; i < timecodes.length; i++) {
      timecodes[i].endSec = (i + 1 < timecodes.length) ? timecodes[i + 1].startSec : totalDurationSec;
      timecodes[i].durationSec = Number((timecodes[i].endSec - timecodes[i].startSec).toFixed(1));
    }

    // Retrieve video path before context closes
    const video = page.video();
    const rawVideoPath = await video?.path();

    console.log('\n🎬 Finalizing browser session and flushing video recording...');
    await context.close();
    await browser.close();

    const masterVideoPath = path.join(DEMO_DIR, 'shiplog-automated-demo.webm');
    if (rawVideoPath && fs.existsSync(rawVideoPath)) {
      fs.copyFileSync(rawVideoPath, masterVideoPath);
      console.log(`\n🎥 Master Demo Video Saved: ${masterVideoPath}`);
    }

    // Save Timecodes JSON
    const timecodesPath = path.join(DEMO_DIR, 'TIMECODES.json');
    fs.writeFileSync(timecodesPath, JSON.stringify(timecodes, null, 2));
    console.log(`📋 Timecodes Saved: ${timecodesPath}`);

    // Slice Modular Scenes via FFmpeg
    console.log('\n✂️  Slicing Modular Scene Videos via FFmpeg into demo-assets/scenes/...');
    const sceneFiles = [
      '01-hero-wispr-pulse.webm',
      '02-execution-hud.webm',
      '03-artifacts-diff-inspector.webm',
      '04-bento-portfolio-case-study.webm',
      '05-wiki-vault-splitpane.webm',
      '06-resume-sync-studio.webm',
      '07-security-settings.webm',
    ];

    for (let i = 0; i < timecodes.length; i++) {
      const tc = timecodes[i];
      const filename = sceneFiles[i] || `scene-${i + 1}.webm`;
      const outPath = path.join(SCENES_DIR, filename);
      const cmd = `ffmpeg -y -ss ${tc.startSec.toFixed(2)} -to ${tc.endSec.toFixed(2)} -i "${masterVideoPath}" -c copy "${outPath}"`;
      try {
        execSync(cmd, { stdio: 'ignore' });
        console.log(`   ✨ [Scene ${i + 1}] ${filename} (${tc.durationSec}s): ${tc.name}`);
      } catch (e) {
        console.log(`   ⚠️ Could not slice ${filename}: ${e.message}`);
      }
    }

    console.log('\n✅ Automated Demo & Scene Slicing Completed (100% SUCCESS)');
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
