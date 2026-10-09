# Sandbox
Test ENV for Projects and Agents

## Browsing agent (Browserbase + Stagehand)

An open-ended agent that answers a question by searching and browsing the web in a real Chrome browser running in Browserbase's cloud.

- `src/tools.ts` - the browser tool layer: `search`, `goto`, `act`, `extract`, `observe`. Plain async functions, so any agent framework can wrap them as tools.
- `src/agent.ts` - a small decide-then-act loop (max 8 steps) that uses those tools.
- `src/index.ts` - command-line entry point.

### Setup

Requires Node.js 22.18+.

```bash
npm install
cp .env.example .env   # then paste your key after BROWSERBASE_API_KEY=
```

Only `BROWSERBASE_API_KEY` is needed. AI calls go through Browserbase Model Gateway on the same key (the Free plan includes $5 of tokens). Don't add a project id or a placeholder model key.

### Run

```bash
npm start -- "What is the latest stable version of Node.js?"
```

It prints a live-view link (watch the browser work), each step's decision, the answer, sources, and a session replay link.

### Notes

- Bot-protected sites (LinkedIn, Instagram, most big retailers) usually block Free-plan sessions. They need paid proxies or Verified mode.
- If AI calls suddenly fail on a run that was working, you've probably used up the $5 Model Gateway allowance. Upgrade, or pass your own provider key via `model` in `Stagehand.create()`.
- The agent is told to treat page text as untrusted data, but prompt injection from web pages is a real risk for any browsing agent. Don't give it credentials or actions with side effects without adding guardrails.
