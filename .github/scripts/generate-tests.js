#!/usr/bin/env node
/**
 * AI Test Generator
 *
 * For each changed source file, asks an AI model to write a Vitest test file.
 * Skips files that already have tests, files that are pure types/constants,
 * and UI skeleton/error components (low value to unit test).
 *
 * AI provider: configured via AI_PROVIDER_API_KEY and AI_MODEL env vars.
 * Currently uses the Anthropic SDK — swap client init below to change provider.
 *
 * Usage: node generate-tests.js "src/foo.ts src/bar.tsx api/baz.ts"
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

// AI client — to switch providers, replace with the relevant SDK
const client = new Anthropic({ apiKey: process.env.AI_PROVIDER_API_KEY });

// Set AI_MODEL as a GitHub repo variable (Settings → Variables → New variable).
// Falls back to Claude Sonnet if not configured.
const AI_MODEL = process.env.AI_MODEL || "claude-sonnet-4-20250514";

// Files not worth generating tests for
const SKIP_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /skeleton/i,
  /error-boundary/i,
  /-error\./i,
  /index\.(ts|tsx)$/,
  /types\//,
  /\.d\.ts$/,
];

// Shared context files always included to help Claude understand the project
const CONTEXT_FILES = [
  "shared/types/api.ts",
  "src/lib/utils.ts",
];

function shouldSkip(filePath) {
  return SKIP_PATTERNS.some((p) => p.test(filePath));
}

function testPathFor(sourcePath) {
  const dir = path.dirname(sourcePath);
  const base = path.basename(sourcePath, path.extname(sourcePath));
  const ext = sourcePath.endsWith(".tsx") ? ".test.tsx" : ".test.ts";
  return path.join(dir, `${base}${ext}`);
}

function readFileSafe(filePath) {
  try {
    return existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
  } catch {
    return null;
  }
}

function buildContext() {
  return CONTEXT_FILES
    .map((f) => {
      const content = readFileSafe(f);
      return content ? `// ${f}\n${content}` : null;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");
}

async function generateTestForFile(sourcePath, context) {
  const sourceCode = readFileSafe(sourcePath);
  if (!sourceCode) {
    console.log(`  ⚠️  Could not read ${sourcePath}, skipping`);
    return null;
  }

  const isApiRoute = sourcePath.startsWith("api/");
  const isReactComponent = sourcePath.endsWith(".tsx");
  const isHook = path.basename(sourcePath).startsWith("use-");
  const isUtil = sourcePath.includes("/lib/");

  let testingGuidance = "";
  if (isApiRoute) {
    testingGuidance = `
This is a Vercel serverless API route. Write tests using vitest's mocking capabilities:
- Mock the \`withAuth\` wrapper to inject a test user
- Mock \`readJson\` from api-helpers to return fixture data
- Test happy path, auth failure (401), and invalid params (400)
- Do NOT make real HTTP calls or touch the filesystem`;
  } else if (isHook) {
    testingGuidance = `
This is a React custom hook. Write tests using @testing-library/react's renderHook:
- Mock \`fetchJson\` from @app/lib/api to return fixture data
- Test loading state, success state, and error state
- Wrap renders in a QueryClientProvider`;
  } else if (isReactComponent) {
    testingGuidance = `
This is a React component. Write tests using @testing-library/react:
- Test rendered output and key user interactions
- Mock any API calls via vi.mock on @app/lib/api or @app/hooks/use-api-query
- Focus on behaviour, not implementation details
- Use accessible queries (getByRole, getByText) over test IDs where possible`;
  } else if (isUtil) {
    testingGuidance = `
This is a utility/lib file. Write pure unit tests:
- Cover normal cases, edge cases, and error cases
- No mocking needed unless the file calls external services`;
  }

  const prompt = `You are writing Vitest tests for a React + TypeScript financial dashboard.

## Project context
${context}

---

## File to test: ${sourcePath}
\`\`\`typescript
${sourceCode}
\`\`\`

## Testing guidance
${testingGuidance}

## Requirements
- Use \`import { describe, it, expect, vi, beforeEach } from "vitest"\`
- Use path aliases (@app, @shared, @api) — they're configured in vite/tsconfig
- All mocks must be declared at the top of the file with \`vi.mock(...)\`
- Include at least 3 meaningful test cases
- Do NOT import from node_modules that aren't in package.json
- Do NOT add placeholder comments like "// Add more tests here"
- Output ONLY the TypeScript test file content, no explanation, no markdown fences`;

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].text.trim();
}

async function main() {
  const changedFilesArg = process.argv[2] ?? "";
  const changedFiles = changedFilesArg
    .split(/\s+/)
    .map((f) => f.trim())
    .filter(Boolean);

  if (changedFiles.length === 0) {
    console.log("No changed files provided.");
    return;
  }

  const filesToProcess = changedFiles.filter((f) => {
    if (shouldSkip(f)) {
      console.log(`  ⏭️  Skipping ${f}`);
      return false;
    }
    const testPath = testPathFor(f);
    if (existsSync(testPath)) {
      console.log(`  ✅ Test already exists for ${f} (${testPath})`);
      return false;
    }
    return true;
  });

  if (filesToProcess.length === 0) {
    console.log("All changed files already have tests or were skipped.");
    return;
  }

  console.log(`\n🧪 Generating tests for ${filesToProcess.length} file(s)...\n`);
  const context = buildContext();

  for (const filePath of filesToProcess) {
    console.log(`  🔨 ${filePath}`);
    try {
      const testCode = await generateTestForFile(filePath, context);
      if (!testCode) continue;

      const testPath = testPathFor(filePath);
      const testDir = path.dirname(testPath);
      mkdirSync(testDir, { recursive: true });
      writeFileSync(testPath, testCode, "utf8");
      console.log(`     → wrote ${testPath}`);
    } catch (err) {
      console.error(`     ❌ Failed for ${filePath}:`, err.message);
    }
  }

  console.log("\n✅ Test generation complete.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});