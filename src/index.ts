// Usage: npm start -- "your question here"

import { runAgent } from "./agent.js";

const apiKey = process.env.BROWSERBASE_API_KEY;
if (!apiKey) {
  console.error("Missing BROWSERBASE_API_KEY. Copy .env.example to .env and paste your key in.");
  process.exit(1);
}

const goal = process.argv.slice(2).join(" ").trim() || "What is the latest stable version of Node.js, and when was it released?";
console.log(`Goal: ${goal}\n`);

try {
  const result = await runAgent(apiKey, goal);
  console.log(`\nAnswer (${result.steps} steps):\n${result.answer}`);
  console.log(`\nSources:\n${result.sources.map((s) => `- ${s}`).join("\n")}`);
  console.log(`\nSession replay: ${result.sessionUrl}`);
} catch (err) {
  console.error("\nAgent failed:", err instanceof Error ? err.message : err);
  console.error(
    "If this mentions an API key or quota and the run was working before, you may have used the $5 of free Model Gateway tokens on the Free plan.",
  );
  process.exit(1);
}
