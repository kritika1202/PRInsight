# PRInsight

An AI-powered GitHub PR review bot built with **Express.js** and **Gemini API**. PRInsight intercepts GitHub pull request webhooks, parses code diffs in real time, and automatically posts structured review comments — covering bugs, time-complexity issues, and security vulnerabilities — directly on the PR.

## How It Works

```
GitHub PR opened
      │
      ▼
Express.js webhook server  ──► Validate HMAC-SHA256 signature
      │
      ▼
Fetch raw unified diff (GitHub API)
      │
      ▼
Parse diff into file/hunk/line objects
      │
      ├──► Gemini: Generate PR Summary (Purpose / Key Changes / Impact)
      │
      └──► Gemini: Generate inline review comments (JSON: path, line, severity, comment)
                │
                ▼
           Post summary comment + inline code review on GitHub PR
                │
                ▼
           Post collapsible Review Digest
```

## Features

- **Zero-touch auto-review** — triggers on every new PR (`pull_request.opened/synchronize`)
- **On-demand re-review** — comment `prinsight-review` on any PR to trigger a fresh run
- **PR Summary** — structured AI summary with Purpose, Key Changes, and Impact sections
- **Inline code review** — Gemini reviews for bugs, O(n²) complexity, security issues, null-check gaps
- **Severity labels** — each comment is marked `[critical]` or `[suggestion]`
- **Review Digest** — collapsible summary of all inline findings for easy copy-paste
- **Safe skipping** — oversized diffs (>2000 lines) and binary-only PRs get a clear skip message

## Setup

### Prerequisites

- Node.js 18+
- A GitHub account and a repository to test with
- [Google AI Studio](https://aistudio.google.com) API key (free tier available)
- A public URL for the webhook (use [ngrok](https://ngrok.com) for local dev)

### Installation

```bash
git clone https://github.com/<your-username>/PRInsight.git
cd PRInsight
npm install
cp .env.example .env
# fill in your tokens in .env
```

### Environment Variables

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | Personal access token with `repo`, `pull_requests`, `issues` scopes |
| `GITHUB_WEBHOOK_SECRET` | Secret string set when registering the webhook on GitHub |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `PORT` | Server port (default: `3000`) |

### Register the GitHub Webhook

1. Go to your repository → **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL**: `https://<your-server>/webhook`
3. **Content type**: `application/json`
4. **Secret**: same value as `GITHUB_WEBHOOK_SECRET` in `.env`
5. **Events**: select `Pull requests` and `Issue comments`

### Run the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

For local development, expose port 3000 with ngrok:

```bash
ngrok http 3000
# copy the https URL → use as Payload URL in GitHub webhook settings
```

## Usage

### Automatic Review

Open a PR on any repository where PRInsight is installed. The bot will:
1. Post an AI-generated PR summary comment
2. Add inline review comments on specific lines
3. Post a Review Digest with all findings

### Manual Re-trigger

Post a comment on any PR containing:

```
prinsight-review
```

The bot re-runs the full review cycle on the current diff state.

## Project Structure

```
PRInsight/
├── src/
│   ├── index.js        # Express server, raw body capture for HMAC
│   ├── webhook.js      # Webhook validation and event routing
│   ├── github.js       # Octokit wrapper — fetch diffs, post comments/reviews
│   ├── diffParser.js   # Unified diff → file/hunk/line objects with line numbers
│   ├── gemini.js       # Gemini API — PR summary and JSON review generation
│   └── reviewer.js     # Orchestration: diff → AI → GitHub review comments
├── .env.example
├── .gitignore
└── package.json
```

## Tech Stack

| Layer | Technology |
|---|---|
| Server | Express.js |
| GitHub API | Octokit (`@octokit/rest`) |
| AI Model | Gemini 1.5 Flash (`@google/generative-ai`) |
| Security | HMAC-SHA256 webhook signature verification |

## License

MIT
