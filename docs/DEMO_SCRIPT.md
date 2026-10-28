# ShipLog — 2-Minute Hackathon Video Demo Script

> **Hackathon Track:** Track 1: Builders (WeMakeDevs & Wispr Flow Hackathon)  
> **Total Target Duration:** 2 minutes (120 seconds)  
> **Video Style:** Fast-paced, high-energy developer demo with screen recording, voiceover, and webcam PIP (picture-in-picture) in bottom corner.

---

## 🎬 Pre-Recording Checklist & Environment Setup

Before clicking record, ensure the following is configured:
1. **Wispr Flow Desktop App**: Open, calibrated, and hotkey configured (e.g., hold `Ctrl` or `Fn` key). Microphone input active.
2. **Local Environment**:
   - Next.js development server running: `npm run dev` at `http://localhost:3000`.
   - Browser window zoomed to 110% or 125% for high readability on YouTube / judging screens.
   - Clean slate: textarea is empty or initialized.
3. **Audio Setup**: Clear microphone input without background noise.
4. **Terminal Window Ready**: Secondary terminal split with `npm run test` output showing all 64 passing tests.

---

## ⏱️ Video Script Timeline (120 Seconds)

### Act 1: The Hook & The Painful Problem (0:00 - 0:25) — 25 Seconds
- **Visual:** Facecam center-screen or bottom right PIP over a split screen of a blank portfolio website and an empty morning Slack standup message.
- **Audio Tone:** Relatable, energetic, pointing out a universal pain point.

```text
[0:00 - 0:10] (Screen shows empty portfolio and blank Slack message)
"Every single day, developers ship incredible features and solve complex architectural 
problems. But by the end of the day, three things happen: our portfolios stay completely 
out of date, our morning standups are painful guesswork, and our architectural decisions 
get lost forever."

[0:10 - 0:25] (Cut to ShipLog dashboard at localhost:3000)
"Why? Because after 8 hours of coding, nobody wants to type another markdown file or blog 
post. Typing is the bottleneck. That's why we built ShipLog: an autonomous agent that turns 
a 60-second voice recap into verified portfolio cards, standup updates, and architectural 
decision logs—completely hands-free."
```

---

### Act 2: Live "No Hands" Voice Dictation with Wispr Flow & Execution (0:25 - 1:15) — 50 Seconds
- **Visual:** Screen captures the ShipLog dashboard. The presenter holds the Wispr Flow hotkey. The "Wispr Flow Ready" indicator pulses as live speech streams into the textarea at lightning speed.
- **Action:** Speak the real recap naturally into Wispr Flow, or demonstrate with the 1-Click Judge Demo button if doing a hybrid recording.

```text
[0:25 - 0:45] (Hold Wispr Flow hotkey, speak naturally into the mic)
"Watch this. I'm not touching my keyboard. I hold my Wispr Flow hotkey and talk through my day:

'Today I shipped the resilient WebSocket reconnection mechanism using exponential backoff 
with full jitter in TypeScript. This prevents server reconnect storms on restart, improving 
client recovery during deployments.'"

[0:45 - 0:55] (Show textarea populated instantly with perfect punctuation and casing)
"Look at that speed. Wispr Flow caught technical terms like 'WebSocket', 'exponential backoff', 
'jitter', and 'TypeScript' flawlessly. Zero typos, zero friction."

[0:55 - 1:15] (Click "Ship Entry →" or "⚡ Try Sample Scenario")
"Now, we hit Ship Entry. The autonomous agent kicks off its 5-step loop:
First, it plans the run and scrubs secrets.
Second, it inspects changed git diffs.
Third, it synthesizes three distinct developer artifacts.
And fourth—the most critical part—it grounds the outputs against actual code."
```

---

### Act 3: Grounded Verification & The 5-Pillar Security Deep Dive (1:15 - 1:45) — 30 Seconds
- **Visual:** Click through the interactive tabs in `ArtifactsView`: Portfolio Card (showing green `ShieldCheck` verified badges), Standup Update, Decision Log with code evidence lines, and the Reasoning Trace tab. Then briefly show the Settings modal or terminal test run.

```text
[1:15 - 1:30] (Highlighting Portfolio Card and green verified pills)
"Notice these green verified shields? That's our anti-hallucination verification engine. 
If an LLM claims 'Kubernetes' or 'Redis' when those files weren't touched in the diff, 
ShipLog flags them as unverified hallucinations. Every decision in the Decision Log is tied 
to exact file paths and code evidence."

[1:30 - 1:45] (Open Settings modal showing Ollama and BYOK)
"Under the hood, we enforce a 5-Pillar Security Architecture:
One: Stateless in-memory proxy—no keys are ever saved to disk or database.
Two: 100% air-gapped local Ollama support by default.
Three: Pre-flight secret scrubber that strips API keys and PATs.
Four: Read-only GitHub access.
And five: DOMPurify XSS sanitization across all rendered outputs."
```

---

### Act 4: The Result, Wispr Usage Card, & Closing CTA (1:45 - 2:00) — 15 Seconds
- **Visual:** Show the terminal running `npm run test` (64/64 tests passing), briefly highlight the Wispr Usage Card on the README, and display the GitHub repo and live demo URL.

```text
[1:45 - 1:55] (Split view: Terminal showing 64/64 passing tests + Wispr Usage Card)
"ShipLog is fully tested with 64 passing tests across 9 test suites. Built hands-free 
with Wispr Flow, which accelerated our dev velocity by more than 3x."

[1:55 - 2:00] (Closing facecam with smile and sign-off)
"Stop letting your best engineering work stay invisible. Ship your log with your voice. 
Check out ShipLog on GitHub today. Thank you!"
```

---

## 📋 Hackathon Submission Checklist

Before submitting to the **WeMakeDevs & Wispr Flow Hackathon** portal, double-check all items:

- [x] **Project Name**: ShipLog — 60-Second Voice Daily Recap
- [x] **Track Selected**: Track 1: Builders
- [x] **GitHub Repository**: Clean branch with `README.md` and complete code
- [x] **Passing Test Suite**: `npm run test` verifies 64/64 tests passing
- [x] **Live Demo URL**: Deployed link (or reproducible local quickstart)
- [x] **2-Minute Demo Video**: Uploaded to YouTube or Loom (Unlisted/Public, 1080p, clear audio)
- [x] **Wispr Usage Card**: Included in `README.md` with word count, speed multiplier, and workflow description
- [x] **Write-up**: Highlighting problem, architecture, 5-step agent loop, and security pillars
