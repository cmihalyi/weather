#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const [owner, repo] = process.env.REPO.split('/');
const prNumber = parseInt(process.env.PR_NUMBER, 10);
const prTitle = process.env.PR_TITLE;
const prUrl = process.env.PR_URL;

/**
 * Fetch all comments on the PR and return the most recent
 * one posted by the github-actions bot that contains an AI review.
 */
async function getLatestAIReviewComment() {
  console.log(`Fetching comments for PR #${prNumber}...`);

  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  });

  const reviewComments = comments.filter(
    (comment) =>
      comment.user?.login === 'github-actions[bot]' &&
      comment.body?.includes('🤖 AI Code Review')
  );

  if (reviewComments.length === 0) {
    console.log('No AI review comments found on this PR. Skipping.');
    return null;
  }

  const latest = reviewComments.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  console.log(`Found ${reviewComments.length} AI review comment(s). Using most recent from ${latest.created_at}.`);
  return latest.body;
}

/**
 * Parse the "Issue Resolution Check" section from the review comment.
 * Looks for lines matching: ISSUE #<number>: ✅ RESOLVED | ❌ NOT RESOLVED — <reason>
 * Returns an array of { number, resolved, reason }
 */
function parseIssueResolutions(reviewText) {
  const pattern = /ISSUE\s+#(\d+):\s*(✅\s*RESOLVED|❌\s*NOT RESOLVED)\s*[—-]\s*(.+)/gi;
  const matches = [...reviewText.matchAll(pattern)];

  const resolutions = matches.map((m) => ({
    number: parseInt(m[1], 10),
    resolved: m[2].includes('✅'),
    reason: m[3].trim(),
  }));

  if (resolutions.length > 0) {
    console.log(`Found ${resolutions.length} issue resolution verdict(s) in review.`);
    resolutions.forEach((r) =>
      console.log(`  #${r.number}: ${r.resolved ? '✅ RESOLVED' : '❌ NOT RESOLVED'} — ${r.reason}`)
    );
  } else {
    console.log('No issue resolution verdicts found in review.');
  }

  return resolutions;
}

/**
 * Auto-close issues that Claude marked as resolved, posting a comment
 * explaining they were closed by the merged PR.
 */
async function closeResolvedIssues(resolutions, prNumber, prUrl) {
  const resolved = resolutions.filter((r) => r.resolved);
  if (resolved.length === 0) return;

  for (const issue of resolved) {
    try {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issue.number,
        body: `✅ This issue was marked as resolved by the AI code review in PR [#${prNumber}](${prUrl}).\n\n> ${issue.reason}`,
      });

      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: issue.number,
        state: 'closed',
        state_reason: 'completed',
      });

      console.log(`✅ Closed issue #${issue.number}`);
    } catch (err) {
      console.log(`Could not close issue #${issue.number}: ${err.message}`);
    }
  }
}

/**
 * Use Claude to parse the review comment and extract new recommendations,
 * excluding any issues that were already tracked and handled.
 */
async function parseReviewIntoIssues(reviewText, alreadyTrackedIssueNumbers) {
  console.log('Parsing review recommendations with Claude...');

  const exclusionNote =
    alreadyTrackedIssueNumbers.length > 0
      ? `Do NOT create issues for recommendations that relate to these already-tracked GitHub issues: ${alreadyTrackedIssueNumbers.map((n) => `#${n}`).join(', ')}. These were referenced in the PR and handled separately.`
      : '';

  const prompt = `You are parsing an AI code review comment to extract actionable recommendations as GitHub issues.

Here is the AI code review:

${reviewText}

Extract each distinct recommendation from the "Recommendations" section of this review.
${exclusionNote}

Return ONLY a valid JSON array with no other text, markdown, or explanation. Each item must have:
- "title": short, actionable issue title (max 80 chars)
- "body": detailed description including the problem, suggested fix, and any relevant code snippets from the review

Example format:
[
  {
    "title": "Add input validation for API query parameters",
    "body": "API endpoints currently accept query parameters without validation..."
  }
]

If there are no actionable recommendations, return an empty array: []`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].text.trim();

  try {
    const cleaned = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    console.log(`Claude extracted ${parsed.length} new recommendation(s).`);
    return parsed;
  } catch (err) {
    console.error('Failed to parse Claude response as JSON:', responseText);
    throw new Error('Claude did not return valid JSON');
  }
}

/**
 * Ensure the ai-review label exists in the repo.
 */
async function ensureLabelsExist() {
  const requiredLabels = [
    { name: 'ai-review', color: 'bfd4f2', description: 'Created from AI code review' },
  ];

  const { data: existingLabels } = await octokit.rest.issues.listLabelsForRepo({
    owner,
    repo,
    per_page: 100,
  });

  const existingNames = new Set(existingLabels.map((l) => l.name));

  for (const label of requiredLabels) {
    if (!existingNames.has(label.name)) {
      try {
        await octokit.rest.issues.createLabel({ owner, repo, ...label });
        console.log(`Created label: ${label.name}`);
      } catch (err) {
        console.log(`Label already exists or could not be created: ${label.name}`);
      }
    }
  }
}

/**
 * Create a single GitHub issue for a recommendation.
 */
async function createIssue(recommendation) {
  const { title, body } = recommendation;

  const issueBody = `## Overview

${body}

---

*Source PR: [#${prNumber} — ${prTitle}](${prUrl})*
*This issue was automatically created from an AI code review. Use your judgment when addressing these suggestions.*`;

  const { data: issue } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body: issueBody,
    labels: ['ai-review'],
  });

  console.log(`✅ Created issue #${issue.number}: ${title}`);
  return issue;
}

/**
 * Post a summary comment on the PR listing closed and newly created issues.
 */
async function postSummaryComment(closedIssues, createdIssues) {
  const sections = [];

  if (closedIssues.length > 0) {
    const closedList = closedIssues
      .map((i) => `- ✅ #${i.number} — ${i.reason}`)
      .join('\n');
    sections.push(`## ✅ Issues Resolved & Closed\n\n${closedList}`);
  }

  if (createdIssues.length > 0) {
    const createdList = createdIssues
      .map((issue) => `- [ ] #${issue.number} — ${issue.title}`)
      .join('\n');
    sections.push(
      `## 📋 New Issues Created from AI Review\n\nThe following issues were created for suggestions not resolved in this PR:\n\n${createdList}\n\nThese are non-blocking improvements to address in future work.`
    );
  }

  if (sections.length === 0) return;

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: sections.join('\n\n'),
  });

  console.log('Posted summary comment to PR.');
}

// --- Main ---

async function run() {
  try {
    const issueResolutionEnabled = process.env.ENABLE_ISSUE_RESOLUTION_CHECK === 'true';
    if (!issueResolutionEnabled) {
      console.log('Issue resolution check is disabled (ENABLE_ISSUE_RESOLUTION_CHECK != true). Skipping.');
      process.exit(0);
    }

    const reviewText = await getLatestAIReviewComment();
    if (!reviewText) process.exit(0);

    // 1. Parse and close any issues Claude marked as resolved
    const resolutions = parseIssueResolutions(reviewText);
    await closeResolvedIssues(resolutions, prNumber, prUrl);

    const resolvedNumbers = resolutions.map((r) => r.number);
    const closedIssues = resolutions
      .filter((r) => r.resolved)
      .map((r) => ({ number: r.number, reason: r.reason }));

    // 2. Parse new recommendations, skipping anything tied to already-tracked issues
    const recommendations = await parseReviewIntoIssues(reviewText, resolvedNumbers);

    if (recommendations.length === 0 && closedIssues.length === 0) {
      console.log('Nothing to do. Done.');
      process.exit(0);
    }

    await ensureLabelsExist();

    // 3. Create new issues for remaining recommendations
    const createdIssues = [];
    for (const recommendation of recommendations) {
      const issue = await createIssue(recommendation);
      createdIssues.push({ number: issue.number, title: recommendation.title });
    }

    // 4. Post a summary on the PR
    await postSummaryComment(closedIssues, createdIssues);

    console.log(`\n✅ Done. Closed ${closedIssues.length} issue(s), created ${createdIssues.length} issue(s).`);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

run();