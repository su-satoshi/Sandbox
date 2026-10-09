// Browser tool layer: a cloud browser on Browserbase, driven by Stagehand.
//
// Every method here is a plain async function with a clear input and output,
// so any agent framework (the loop in agent.ts, the Vercel AI SDK, LangChain,
// an MCP server, etc.) can expose them as tools without changes.

import { browserbase, Stagehand, type StagehandBrowser, type Page } from "@browserbasehq/stagehand";
import { z } from "zod";

export interface SearchHit {
  title: string;
  url: string;
}

export class BrowserTools {
  private constructor(
    private readonly apiKey: string,
    private readonly browser: StagehandBrowser,
    private readonly stagehand: Stagehand,
    private readonly page: Page,
  ) {}

  /** Start one cloud browser session. Only BROWSERBASE_API_KEY is needed. */
  static async start(apiKey: string): Promise<BrowserTools> {
    const browser = await browserbase.launch({ apiKey });
    // No `model` set: Stagehand routes LLM calls through Browserbase Model
    // Gateway on the same API key, so no separate OpenAI/Anthropic key is needed.
    const stagehand = await Stagehand.create({ browser });
    const [page] = await browser.context.pages();
    return new BrowserTools(apiKey, browser, stagehand, page);
  }

  /** Full link to watch this session live, or replay it afterwards. */
  get sessionUrl(): string {
    return `https://www.browserbase.com/sessions/${this.browser.sessionId}`;
  }

  /** Search the web (Browserbase Search API, no browser page used). */
  async search(query: string, numResults = 5): Promise<SearchHit[]> {
    const res = await browserbase.search({ apiKey: this.apiKey, query, numResults });
    return res.results.map((r) => ({ title: r.title, url: r.url }));
  }

  /** Open a URL in the cloud browser. */
  async goto(url: string): Promise<string> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    return `Opened ${await this.page.url()} - "${await this.page.title()}"`;
  }

  /** Do one atomic thing on the page, described in plain English. */
  async act(instruction: string): Promise<string> {
    const res = await this.stagehand.act(instruction);
    return res.data.success ? `Done: ${res.data.actionDescription}` : `Failed: ${res.data.message}`;
  }

  /** Pull information off the current page, shaped by a Zod schema. */
  async extract<S extends z.ZodType>(instruction: string, schema: S): Promise<z.infer<S>> {
    const res = await this.stagehand.extract(instruction, schema);
    return res.data;
  }

  /** List things on the page that can be interacted with. */
  async observe(instruction: string): Promise<string[]> {
    const res = await this.stagehand.observe(instruction);
    return res.data.map((a) => a.description);
  }

  async currentUrl(): Promise<string> {
    return this.page.url();
  }

  async close(): Promise<void> {
    try {
      await this.stagehand.close();
    } finally {
      await this.browser.close();
    }
  }
}
