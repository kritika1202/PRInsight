# PRInsight

> AI-powered GitHub Pull Request reviewer — auto-posts summaries and inline code review comments using **Gemini API**.

PRInsight works in **three modes**:

| Mode | How | Best for |
|---|---|---|
| **GitHub Action** | Workflow in your repo — runs on GitHub's servers | Any repo, zero infra needed |
| **Webhook Server** | Express.js server receives GitHub events | Self-hosted / always-on setups |
| **Web UI** | Paste any PR URL, get instant analysis in browser | Demos, one-off reviews |

---

## How It Works

```
PR opened on GitHub
        │
        ▼
Fetch raw unified diff  (GitHub API / Octokit)
        │
        ▼
Parse diff → file / hunk / line objects  (diffParser.js)
        │
        ├──▶  Gemini: PR Summary          (Purpose · Key Changes · Impact)
        │
        └──▶  Gemini: Inline Review       (JSON → path · line · severity · comment)
                        │
                        ▼
             Post summary comment on PR
             Post inline review comments (line-level)
             Post collapsible Review Digest
```

---

## Features

- **Zero-touch auto-review** — triggers on every new PR automatically
- **On-demand re-review** — comment `prinsight-review` on any PR to re-run
- **PR Summary** — structured AI summary: Purpose, Key Changes, and Impact
- **Inline code review** — flags bugs, O(n²) complexity, security issues, missing null-checks
- **Severity labels** — every comment tagged `[critical]` or `[suggestion]`
- **Review Digest** — collapsible copy-paste block of all findings
- **Skip transparency** — oversized diffs or binary-only PRs get a clear skip reason comment
- **Web UI** — paste any public PR URL for instant browser-based analysis

---

## Mode 1 — GitHub Action (Recommended)

No server, no webhook registration. PRInsight runs directly inside GitHub Actions on every PR.

### Setup (2 steps)

**Step 1 — Add the workflow file to your repo**

Copy `.github/workflows/prinsight.yml` into your repository:

```yaml
name: PRInsight AI Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    name: AI Code Review
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: node src/action.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          REPO_OWNER: ${{ github.repository_owner }}
          REPO_NAME: ${{ github.event.repository.name }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
```

**Step 2 — Add your Gemini API key as a repository secret**

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `GEMINI_API_KEY`
4. Value: your key from [Google AI Studio](https://aistudio.google.com)

`GITHUB_TOKEN` is provided automatically by GitHub — no action needed.

### What happens next

Open any Pull Request → the Action triggers → PRInsight posts a summary comment and inline review comments directly on the PR.

---

## Mode 2 — Webhook Server

Run PRInsight as a persistent Express.js server that listens for GitHub webhook events.

### Prerequisites

- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com) API key
- A GitHub Personal Access Token (PAT) with `repo`, `pull_requests`, `issues` scopes
- A public URL (use [ngrok](https://ngrok.com) for local development)

### Installation

```bash
git clone https://github.com/<your-username>/PRInsight.git
cd PRInsight
npm install
cp .env.example .env
```

Fill in `.env`:

```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### Register the GitHub Webhook

1. Go to your repository → **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL**: `https://<your-server>/webhook`
3. **Content type**: `application/json`
4. **Secret**: same value as `GITHUB_WEBHOOK_SECRET` in `.env`
5. **Events**: select **Pull requests** and **Issue comments**

### Run the server

```bash
# Development — auto-restarts on file changes
npm run dev

# Production
npm start
```

For local development, expose the server with ngrok:

```bash
ngrok http 3000
# Use the printed https URL as the Payload URL in the webhook settings above
```

Verify the server is running:

```bash
curl http://localhost:3000/health
# → {"status":"ok","service":"PRInsight","version":"1.0.0"}
```

### Manual re-trigger

Post a comment on any PR with:

```
prinsight-review
```

PRInsight re-runs the full review cycle (summary + inline comments) on the current diff.

---

## Mode 3 — Web UI

A React interface where anyone can paste a public GitHub PR URL and get an instant AI-powered analysis in the browser — no setup, no tokens needed on the user's side.

### Run locally

```bash
# Install all dependencies (root + client)
npm run setup

# Terminal 1 — backend API server
npm run dev

# Terminal 2 — React dev server
npm run dev:client
```

Open **http://localhost:5173**, paste a PR URL, and click **Analyze PR**.

### Build for production

```bash
npm run build:client   # outputs to client/dist/
npm start              # Express serves the built UI + API from port 3000
```

In production, the Express server serves the built React files as static assets — a single process handles both the UI and the `/api/analyze` endpoint.

---

## Environment Variables

| Variable | Required for | Description |
|---|---|---|
| `GITHUB_TOKEN` | Webhook · Web UI | PAT with `repo`, `pull_requests`, `issues` scopes |
| `GITHUB_WEBHOOK_SECRET` | Webhook | Secret for HMAC-SHA256 signature validation |
| `GEMINI_API_KEY` | All modes | API key from [Google AI Studio](https://aistudio.google.com) |
| `PORT` | Webhook · Web UI | Server port (default: `3000`) |

> The GitHub Action uses `secrets.GITHUB_TOKEN` (auto-provided) and `secrets.GEMINI_API_KEY` (you add this once per repo).

---

## Project Structure

```
PRInsight/
├── .github/
│   └── workflows/
│       └── prinsight.yml     # GitHub Actions workflow
├── client/                   # React + Vite web UI
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── PRInput.jsx   # URL input with validation
│   │   │   ├── Summary.jsx   # PR metadata + AI summary
│   │   │   ├── ReviewComments.jsx  # Inline findings grouped by file
│   │   │   └── Loader.jsx    # Animated analysis progress
│   │   └── main.jsx
│   ├── vite.config.js        # Dev proxy: /api → localhost:3000
│   └── package.json
├── src/
│   ├── index.js              # Express server entry point
│   ├── webhook.js            # HMAC validation + event routing
│   ├── github.js             # Octokit: fetch diffs, post comments/reviews
│   ├── diffParser.js         # Unified diff → structured file/hunk/line objects
│   ├── gemini.js             # Gemini API: summary + JSON review generation
│   ├── reviewer.js           # Orchestration: diff → AI → GitHub PR comments
│   ├── action.js             # Entry point for GitHub Actions runs
│   └── routes/
│       └── analyze.js        # POST /api/analyze — powers the Web UI
├── .env.example
├── .gitignore
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Server | Express.js |
| Frontend | React 18 + Vite |
| GitHub API | `@octokit/rest` |
| AI Model | Gemini 1.5 Flash (`@google/generative-ai`) |
| CI/CD | GitHub Actions |
| Security | HMAC-SHA256 webhook signature verification |

---

## Choosing a Mode

```
Want zero infra and auto-reviews on every PR?
  → Use the GitHub Action

Have a server and want to support multiple repos from one place?
  → Use the Webhook Server

Want to review a one-off PR without any setup?
  → Use the Web UI
```

---

## License

MIT
