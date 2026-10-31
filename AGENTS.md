# AGENTS.md — Autonomous Coding Agent Guidelines & Multi-Agent Specification

> **ShipLog: Autonomous Dev Memory & Career Engine**  
> *Track 1: Builders — WeMakeDevs & Wispr Flow Hackathon*

This document serves as the operational specification for autonomous coding agents (Claude Code, Cursor, Antigravity, Devin, Copilot Workspace) interacting with this repository, as well as the technical architectural specification of ShipLog's internal multi-agent runtime.

---

## ⚡ 1. Agent Operating Environment & Quick Commands

Autonomous agents working on this codebase must follow these exact commands for development, testing, and static analysis:

```bash
# 1. Start Development Server (Next.js 14 App Router on port 3000)
npm run dev

# 2. Execute Full Vitest Test Suite (20 suites, 96 tests)
npm run test

# 3. Run a Specific Test Suite
npx vitest run tests/api/agent-run.test.ts
npx vitest run tests/agent/orchestrator.test.ts
npx vitest run tests/ui/portfolio-view.test.tsx

# 4. Static TypeScript Typecheck (Must exit with code 0)
npx tsc --noEmit

# 5. Automated Headless Browser Demo Tour (Playwright Chromium)
node scripts/record-demo-e2e.mjs
```

---

## 🏛️ 2. Repository Structure & Map

```text
.
├── AGENTS.md                       # This agent operational specification
├── README.md                       # Public product showcase & quickstart
├── LICENSE                         # MIT License
├── package.json & tsconfig.json    # Project dependencies & strict TypeScript config
├── tailwind.config.js              # Dark-mode developer styling system
├── vitest.config.ts                # Vite-native test runner with @/ path aliases
├── app/
│   ├── api/agent/run/route.ts      # Stateless zero-persistence agent execution endpoint
│   ├── globals.css                 # Global styling directives & waveform keyframes
│   ├── layout.tsx                  # Root Next.js layout & metadata
│   └── page.tsx                    # Main interactive developer cockpit (4 unified views)
├── components/
│   ├── AgentExecutionHUD.tsx       # 5-step autonomous agent milestone stepper
│   ├── ArtifactsView.tsx           # Tabbed artifacts viewer with DOMPurify sanitization
│   ├── CaseStudyModal.tsx          # Slide-over architectural case study drawer
│   ├── DiffInspectorModal.tsx      # Ground truth git diff verification proof modal
│   ├── PortfolioView.tsx           # Modern Linear Bento Grid living developer portfolio
│   ├── ResumeSyncView.tsx          # Split-screen Google XYZ resume & brag doc studio
│   ├── SampleDataButton.tsx        # 1-Click judge evaluation trigger
│   ├── SettingsModal.tsx           # Session-only credential & model settings modal
│   ├── Toast.tsx                   # Accessible toast notifications
│   ├── VoiceInputArea.tsx          # Wispr Flow speech dictation cockpit with hotkeys
│   ├── WikiVaultView.tsx           # Obsidian split-pane engineering wiki vault
│   └── WisprPulse.tsx              # Interactive voice waveform visualizer
├── docs/
│   └── architecture.md             # Complete system architecture, Mermaid C4 & sequence specs
├── lib/
│   ├── agent/orchestrator.ts       # 5-step autonomous agent loop with anti-hallucination
│   ├── github/service.ts           # Read-only GitHub API service with commit diffs
│   ├── llm/client.ts               # Universal LLM client factory (Ollama, Gemini, OpenAI, Claude)
│   ├── portfolio/data.ts           # Bento portfolio dataset, telemetry & radar helpers
│   ├── resume/engine.ts            # Resume engine: Google XYZ bullets & Julia Evans brag doc
│   ├── security/scrubber.ts        # Pre-flight secret scrubber & sensitive file filter
│   ├── storage/engine.ts           # MemPalace + LLM Wiki local storage engine
│   └── wiki/data.ts                # Engineering wiki topic hubs & ADR catalog
├── scripts/
│   └── record-demo-e2e.mjs         # Headless browser demo recording automation
└── tests/                          # 20 automated Vitest test suites (96 tests)
```

---

## 🤖 3. ShipLog's Internal Multi-Agent Topology

ShipLog is an autonomous multi-agent system designed to convert voice recaps into grounded engineering deliverables. When modifying agent logic, respect the designated responsibilities:

```
                                  ┌────────────────────────┐
                                  │   Wispr Flow Voice     │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                                 [Deterministic Secret Scrubber]
                                 (lib/security/scrubber.ts)
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PRIMARY AGENT ORCHESTRATOR STATE MACHINE                        │
│                               (lib/agent/orchestrator.ts)                              │
│                                                                                        │
│   [Step 1: PLAN] ──> [Step 2: EXECUTE] ──> [Step 3: SYNTHESIZE] ──> [Step 4: VERIFY]  │
│   (Intent Detect)    (Git Diff Ingest)     (Provider Model)        (Code Grounding)    │
└─────────────────────────────────────────────┬──────────────────────────────────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
           [Resume Sync Sub-Agent]  [Wiki Compiler Sub-Agent] [Portfolio Curator Agent]
           (lib/resume/engine.ts)   (lib/wiki/data.ts)        (lib/portfolio/data.ts)
           - Google XYZ Bullets     - Bi-directional links    - Linear Bento Grid
           - Julia Evans Brag Doc   - Code-anchored ADRs      - Telemetry & Radar
           - ATS 95/100 Format      - MemPalace Voice Vault   - Slide-over Case Study
```

### Agent Roster & Contracts

1. **Primary Orchestrator Agent (`lib/agent/orchestrator.ts`)**
   - Implements the 5-step state machine: `PLAN` $\rightarrow$ `EXECUTE` $\rightarrow$ `SYNTHESIZE` $\rightarrow$ `VERIFY` $\rightarrow$ `DELIVER`.
   - Emits structured execution traces displayed in `AgentExecutionHUD.tsx`.
   - Never skips verification before delivery.

2. **Deterministic Secret Scrubber (`lib/security/scrubber.ts`)**
   - Intercepts all transcripts and file inputs *prior* to model inference.
   - Deterministic regex patterns strip GitHub PATs (`ghp_`, `github_pat_`), OpenAI/Anthropic keys (`sk-`), AWS keys (`AKIA`), Google keys (`AIza`), and RSA/PEM blocks.
   - Blacklists sensitive files (`.env`, `credentials.json`, `id_rsa`) from diff ingestion.

3. **Code Grounding & Anti-Hallucination Verifier (`lib/agent/orchestrator.ts`)**
   - Deterministically cross-references claimed technologies against touched file extensions and AST imports.
   - Validated claims receive a green `ShieldCheck` badge with code line anchors (`socketClient.ts:42`).
   - Unreferenced buzzwords are visually struck through with proof (`~Kubernetes~: 0 matching files in git commit tree`).

4. **Resume Sync Sub-Agent (`lib/resume/engine.ts`)**
   - Synthesizes achievement bullets using Google's XYZ formula: *"Accomplished [X] as measured by [Y] by doing [Z]"*.
   - Generates dual output: ATS-optimized resume markdown (target score 95/100) and Julia Evans Quarterly Brag Document.

5. **Engineering Wiki Compiler Sub-Agent (`lib/wiki/data.ts`)**
   - Maintains bi-directional topic nodes (`[[Networking & Real-Time]]`, `[[Security & Zero-Persistence]]`, `[[Database & Infrastructure]]`).
   - Pairs architectural decision records (ADRs) with verifiable code evidence links and verbatim MemPalace audio transcripts.

6. **Portfolio Curator Agent (`lib/portfolio/data.ts`)**
   - Aggregates code telemetry metrics (grounding rate, total verified shipments).
   - Computes language/framework distribution radar from actual git diffs.
   - Generates deep-dive architectural case studies for `CaseStudyModal.tsx`.

---

## 🔒 4. Strict Security & Architectural Invariants

Any agent contributing to this repository must uphold these non-negotiable rules:

1. **Zero-Persistence Rule (Pillar 1)**:
   - **NEVER** write API keys, GitHub PATs, or user credentials to disk, SQLite, local files, or server logs.
   - Credentials passed via headers (`x-provider-key`, `x-github-token`) exist strictly in transient request memory.
2. **Local-First Air-Gapped Inference (Pillar 2)**:
   - Default to local Ollama (`llama3.2`) with zero outbound network calls.
   - Cloud providers (Google Gemini, OpenAI, Claude) must remain strictly opt-in via ephemeral BYOK headers.
3. **Pre-Flight Scrubber Boundary (Pillar 3)**:
   - All voice transcripts and user text must pass through `scrubSecrets()` before LLM ingestion.
4. **Least-Privilege GitHub Ingestion (Pillar 4)**:
   - The GitHub client is read-only. Never add write, push, PR creation, or repo modification methods to `lib/github/service.ts`.
5. **DOMPurify Output Sanitization (Pillar 5)**:
   - All user transcripts, dynamic markdown, and model reasoning traces must pass through `isomorphic-dompurify` before being mounted to the DOM.

---

## 🧪 5. Testing & Verification Protocols

ShipLog enforces strict Test-Driven Development (TDD). 

### Golden Rules for Coding Agents
- **No Test Regressions**: All 20 test suites (96 tests) must pass at 100% before any branch merge or task completion.
- **Type Safety**: `npx tsc --noEmit` must return exit code 0 with zero type warnings or `any` compromises.
- **Unit Test Coverage**: If you introduce a new feature, component, or utility function, you **must write a corresponding unit test** in `tests/`:
  - API routes $\rightarrow$ `tests/api/`
  - Core libraries $\rightarrow$ `tests/<module>/`
  - React components $\rightarrow$ `tests/ui/`
- **Mocking**: Vitest mocks (`vi.fn()`, `vi.mock()`) should be used for external LLM endpoints and GitHub APIs. Never make live network requests inside test suites.

---

## 🚫 6. Git & File Hygiene Guidelines

The following files and patterns are strictly excluded from the public git tree via `.gitignore`:

| Pattern | Description |
| :--- | :--- |
| `demo-assets/` | Video recordings, audio wav files, screenshots |
| `*.webm`, `*.mp4`, `*.wav`, `*.bin`, `*.onnx` | Media binaries and ML weights |
| `docs/plans/` | Internal hackathon planning files and scratchpads |
| `docs/DEMO_SCRIPT.md` | Internal demo narration script |
| `data/` | Local runtime data (`data/raw/`, `data/entries/`, `data/index.json`) |
| `scripts/generate_voiceover.py` | Local TTS audio synthesis script |
| `.env*`, `*.pem` | Local environment variables and private certificates |

Before staging files, always run:
```bash
git status -uall
```
Verify that no temporary scratch files, media binaries, or plan artifacts are staged.

---

## 📝 7. Conventional Commit Standard

Follow Sentry-style conventional commits:
- `feat(<scope>): <Subject>` for new features
- `fix(<scope>): <Subject>` for bug fixes
- `docs(<scope>): <Subject>` for documentation updates
- `test(<scope>): <Subject>` for test additions or corrections
- `ref(<scope>): <Subject>` for refactoring without behavior change

Maintain branch synchronization: develop on `feat/shiplog-core` and fast-forward merge into `main`.
