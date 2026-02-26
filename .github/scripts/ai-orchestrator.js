#!/usr/bin/env node
/**
 * CI Orchestrator
 *
 * Collects outputs from CodeRabbit, CodeQL, Vitest, ESLint, and TypeScript,
 * then asks an AI model to synthesize a single prioritized verdict for the PR.
 *
 * Delivers results to:
 *  - GitHub PR comment (replaces any previous orchestrator comment)
 *  - GitHub commit status check
 *  - Notification webhook (if NOTIFICATION_WEBHOOK_URL is set)
 *
 * AI provider: configured via AI_PROVIDER_API_KEY and AI_MODEL env vars.
 * Currently uses the Anthropic SDK — swap client init below to change provider.
 */

// import OpenAI from "openai";                        // OpenAI: swap the line above for this
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

// AI client — to switch providers, comment out the active line and uncomment the alternative
// const client = new OpenAI({ apiKey: process.env.AI_PROVIDER_API_KEY }); // OpenAI alternative
const client = new Anthropic({ apiKey: process.env.AI_PROVIDER_API_KEY });

// Set AI_MODEL as a GitHub repo variable (Settings → Variables → New variable).
// Falls back to Claude Sonnet if not configured.
const AI_MODEL = process.env.AI_MODEL || "claude-sonnet-4-20250514";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function githubApi(path, options = {}) {
  const base = "https://api.github.com";
  return fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

function readFileSafe(path) {
  try {
    return existsSync(path) ? readFileSync(path, "utf8") : null;
  } catch {
    return null;
  }
}

function truncate(str, maxChars = 6000) {
  if (!str || str.length <= maxChars) return str;
  return str.slice(0, maxChars) + `\n...[truncated, ${str.length - maxChars} chars omitted]`;
}

// ---------------------------------------------------------------------------
// 1. Collect tool outputs
// ---------------------------------------------------------------------------

function collectLintAndTypecheck() {
  const lintOutput = readFileSafe("lint-results.txt");
  const typecheckOutput = readFileSafe("typecheck-results.txt");
  return {
    lint: lintOutput ?? "(no lint output found — assume clean)",
    typecheck: typecheckOutput ?? "(no typecheck output found — assume clean)",
  };
}

function collectTestResults() {
  // Vitest outputs JSON when run with --reporter=json --outputFile=test-results.json
  const raw = readFileSafe("test-results.json");
  if (!raw) return "(no test results found)";
  try {
    const results = JSON.parse(raw);
    const { numTotalTests, numPassedTests, numFailedTests, testResults } = results;
    const failedSuites = (testResults ?? [])
      .filter((s) => s.status === "failed")
      .map((s) => `  • ${s.name}\n${s.message ?? ""}`)
      .join("\n");
    return `Tests: ${numPassedTests}/${numTotalTests} passed, ${numFailedTests} failed\n${failedSuites}`;
  } catch {
    return truncate(raw);
  }
}

function collectSecurityResults() {
  // CodeQL uploads SARIF; we read the downloaded SARIF artifact if present
  const sarifRaw = readFileSafe("codeql-results.sarif");
  if (!sarifRaw) return "(no CodeQL SARIF found — security scan may not have run yet)";
  try {
    const sarif = JSON.parse(sarifRaw);
    const results = sarif.runs?.flatMap((r) => r.results ?? []) ?? [];
    if (results.length === 0) return "CodeQL: no issues found ✅";
    const summary = results
      .slice(0, 20)
      .map((r) => {
        const loc = r.locations?.[0]?.physicalLocation;
        const file = loc?.artifactLocation?.uri ?? "unknown";
        const line = loc?.region?.startLine ?? "?";
        const level = r.level ?? "warning";
        return `  [${level.toUpperCase()}] ${file}:${line} — ${r.message?.text ?? ""}`;
      })
      .join("\n");
    return `CodeQL: ${results.length} issue(s)\n${summary}`;
  } catch {
    return truncate(sarifRaw);
  }
}

function collectCodeRabbitSummary() {
  // CodeRabbit posts a structured comment starting with "## Summary by CodeRabbit"
  // We scrape it from the PR comments via GitHub API response written to a file.
  const commentsRaw = readFileSafe("pr-comments.json");
  if (!commentsRaw) return "(CodeRabbit comment not found)";
  try {
    const comments = JSON.parse(commentsRaw);
    const cr = comments.find(
      (c) =>
        c.user?.login === "coderabbitai[bot]" &&
        c.body?.includes("## Summary by CodeRabbit")
    );
    if (!cr) return "(CodeRabbit has not commented yet)";
    return truncate(cr.body, 4000);
  } catch {
    return "(could not parse PR comments)";
  }
}

function collectChangedFiles() {
  try {
    return execSync("git diff --name-only origin/main HEAD", { encoding: "utf8" }).trim();
  } catch {
    return process.env.CHANGED_FILES ?? "(unknown)";
  }
}

// ---------------------------------------------------------------------------
// 2. Ask AI to synthesise a verdict
// ---------------------------------------------------------------------------

async function askAI({ lint, typecheck, tests, security, coderabbit, changedFiles }) {
  const prompt = `You are the CI brain for a React + TypeScript financial dashboard (Vite, Supabase auth, Vercel deployment, TanStack Query).

A pull request has been submitted. Below are the outputs from every automated tool. Your job is to synthesise them into one clear, prioritised verdict for the developer.

## Changed Files
${changedFiles}

## ESLint
${lint}

## TypeScript
${typecheck}

## Tests (Vitest)
${tests}

## Security (CodeQL)
${security}

## Code Review (CodeRabbit)
${coderabbit}

---

Respond in exactly this structure (use these exact markdown headings):

## 🔴 Blockers
List only issues that MUST be fixed before merging (security vulnerabilities, broken tests, type errors that would cause runtime failures). If none, write "None".

## 🟡 Warnings
Issues worth fixing but not merge-blocking (style, minor type looseness, test coverage gaps). If none, write "None".

## 🟢 Positives
What looks good — acknowledge solid work briefly.

## Verdict
One of: **APPROVE** | **REQUEST CHANGES** | **NEEDS REVIEW**
Followed by one sentence explaining why.

## Action Items
A numbered list of concrete next steps for the developer, ordered by priority. Maximum 5 items.

Be direct, specific, and brief. Do not repeat information already visible in the tool outputs — synthesise and prioritise instead.`;

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].text;
}

// ---------------------------------------------------------------------------
// 3. Deliver outputs
// ---------------------------------------------------------------------------

async function postPRComment(repo, prNumber, body) {
  // Delete previous orchestrator comment to avoid clutter
  const listRes = await githubApi(`/repos/${repo}/issues/${prNumber}/comments`);
  if (listRes.ok) {
    const comments = await listRes.json();
    for (const c of comments) {
      if (c.user?.type === "Bot" && c.body?.startsWith("## 🤖 CI Orchestrator")) {
        await githubApi(`/repos/${repo}/issues/comments/${c.id}`, { method: "DELETE" });
      }
    }
  }

  const commentBody = `## 🤖 CI Orchestrator — AI Synthesis

${body}

---
*Generated by AI · [View workflow run](https://github.com/${repo}/actions)*`;

  const res = await githubApi(`/repos/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    body: { body: commentBody },
  });

  if (res.ok) {
    console.log("✅ Posted PR comment");
  } else {
    console.error("❌ Failed to post PR comment:", await res.text());
  }
}

async function setCommitStatus(repo, sha, verdict, detailsUrl) {
  const stateMap = {
    APPROVE: "success",
    "REQUEST CHANGES": "failure",
    "NEEDS REVIEW": "pending",
  };
  const state = stateMap[verdict] ?? "pending";

  const res = await githubApi(`/repos/${repo}/statuses/${sha}`, {
    method: "POST",
    body: {
      state,
      description: `AI verdict: ${verdict}`,
      context: "ci/ai-orchestrator",
      target_url: detailsUrl,
    },
  });

  if (res.ok) {
    console.log(`✅ Set commit status: ${state}`);
  } else {
    console.error("❌ Failed to set commit status:", await res.text());
  }
}

async function notifyWebhook(webhookUrl, repo, prNumber, prTitle, verdict, summary) {
  // Discord embed colors (decimal) — convert hex via parseInt("36a64f", 16) etc.
  const color = { APPROVE: 3581519, "REQUEST CHANGES": 14689882, "NEEDS REVIEW": 15984452 };
  const emoji = { APPROVE: "✅", "REQUEST CHANGES": "🔴", "NEEDS REVIEW": "🟡" };

  // Discord webhook payload — uses the "embeds" format
  // If switching to Slack, replace with: { attachments: [{ color, blocks: [...] }] }
  const payload = {
    embeds: [
      {
        title: `${emoji[verdict] ?? "🤖"} CI Orchestrator: ${verdict}`,
        description: `**[PR #${prNumber}](https://github.com/${repo}/pull/${prNumber})** — ${prTitle}\n\n${summary}`,
        color: color[verdict] ?? 13421772,
        footer: {
          text: `View workflow run → https://github.com/${repo}/actions`,
        },
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    console.log("✅ Sent webhook notification");
  } else {
    console.error("❌ Failed to send webhook notification:", await res.text());
  }
}

// ---------------------------------------------------------------------------
// 4. Main
// ---------------------------------------------------------------------------

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER;
  const prTitle = process.env.PR_TITLE ?? "";
  const sha = process.env.GITHUB_SHA;
  const runUrl = `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;

  if (!repo || !prNumber || !sha) {
    console.error("Missing required env vars: GITHUB_REPOSITORY, PR_NUMBER, GITHUB_SHA");
    process.exit(1);
  }

  console.log("📦 Collecting tool outputs...");
  const { lint, typecheck } = collectLintAndTypecheck();
  const tests = collectTestResults();
  const security = collectSecurityResults();
  const coderabbit = collectCodeRabbitSummary();
  const changedFiles = collectChangedFiles();

  console.log("🧠 Asking AI to synthesise...");
  const synthesis = await askAI({ lint, typecheck, tests, security, coderabbit, changedFiles });
  console.log("\n--- AI Synthesis ---\n", synthesis, "\n---\n");

  // Extract verdict from response
  const verdictMatch = synthesis.match(/\*\*(APPROVE|REQUEST CHANGES|NEEDS REVIEW)\*\*/);
  const verdict = verdictMatch?.[1] ?? "NEEDS REVIEW";

  // Extract one-line summary for notification (the sentence after the verdict)
  const summaryMatch = synthesis.match(/## Action Items\n([\s\S]*?)(?:\n##|$)/);
  const actionItems = summaryMatch?.[1]?.trim() ?? "";

  await postPRComment(repo, prNumber, synthesis);
  await setCommitStatus(repo, sha, verdict, runUrl);

  const notificationWebhook = process.env.NOTIFICATION_WEBHOOK_URL;
  if (notificationWebhook) {
    await notifyWebhook(notificationWebhook, repo, prNumber, prTitle, verdict, actionItems);
  }

  // Exit non-zero if AI says REQUEST CHANGES — makes the status check fail (advisory mode: remove this)
  // Since you chose "start advisory, graduate to blocking later", we log but don't fail:
  if (verdict === "REQUEST CHANGES") {
    console.log("⚠️  AI review verdict: REQUEST CHANGES (advisory mode — not failing the build)");
    console.log("    To enable blocking mode, uncomment `process.exit(1)` in ai-orchestrator.js");
    // process.exit(1);  // <-- uncomment to graduate to blocking mode
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});