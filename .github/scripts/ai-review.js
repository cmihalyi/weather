#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { Octokit } from '@octokit/rest';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Parse issue numbers referenced in the PR description.
 * Matches patterns like: Fixes #12, Closes #15, Resolves #8, or plain #12
 */
function parseReferencedIssues(prBody) {
  if (!prBody) return [];
  const pattern = /(?:fixes|closes|resolves|fix|close|resolve)?\s*#(\d+)/gi;
  const matches = [...prBody.matchAll(pattern)];
  const issueNumbers = [...new Set(matches.map((m) => parseInt(m[1], 10)))];
  console.log(
    issueNumbers.length > 0
      ? `Found referenced issues: ${issueNumbers.map((n) => `#${n}`).join(', ')}`
      : 'No issue references found in PR description.'
  );
  return issueNumbers;
}

/**
 * Fetch issue details from GitHub for each referenced issue number.
 * Returns an array of { number, title, body } objects.
 */
async function fetchReferencedIssues(issueNumbers, repo) {
  if (issueNumbers.length === 0) return [];

  const [owner, repoName] = repo.split('/');
  const issues = [];

  for (const number of issueNumbers) {
    try {
      const { data } = await octokit.rest.issues.get({
        owner,
        repo: repoName,
        issue_number: number,
      });
      issues.push({
        number: data.number,
        title: data.title,
        body: data.body || '(no description)',
      });
      console.log(`Fetched issue #${number}: ${data.title}`);
    } catch (err) {
      console.log(`Could not fetch issue #${number}: ${err.message}`);
    }
  }

  return issues;
}

async function reviewCode() {
  const changedFiles = process.argv[2].split(' ');

  const prNumber = process.env.GITHUB_REF?.split('/')[2];
  const repo = process.env.GITHUB_REPOSITORY;
  const prBody = process.env.PR_BODY || '';
  const issueResolutionEnabled = process.env.ENABLE_ISSUE_RESOLUTION_CHECK === 'true';

  console.log(`Reviewing ${changedFiles.length} changed files...`);
  console.log(`Issue resolution check: ${issueResolutionEnabled ? 'enabled' : 'disabled'}`);

  // Fetch any issues referenced in the PR description (only when feature is enabled)
  const referencedIssueNumbers = issueResolutionEnabled ? parseReferencedIssues(prBody) : [];
  const referencedIssues = issueResolutionEnabled
    ? await fetchReferencedIssues(referencedIssueNumbers, repo)
    : [];

  // Get the diff for each changed file
  let fullDiff = '';
  let fileContents = [];

  for (const file of changedFiles) {
    try {
      const diff = execSync(`git diff origin/main HEAD -- ${file}`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      if (diff) {
        fullDiff += `\n\n--- File: ${file} ---\n${diff}`;

        try {
          const content = readFileSync(file, 'utf-8');
          fileContents.push({
            path: file,
            content: content.slice(0, 5000),
          });
        } catch (err) {
          console.log(`Could not read file ${file}: ${err.message}`);
        }
      }
    } catch (err) {
      console.log(`Could not get diff for ${file}: ${err.message}`);
    }
  }

  if (!fullDiff) {
    console.log('No substantive changes to review');
    return;
  }

  // Build the referenced issues section of the prompt if any exist
  const referencedIssuesSection =
    referencedIssues.length > 0
      ? `
## Referenced Issues to Verify

This PR claims to fix the following GitHub issues. For each one, explicitly check whether
the changes in the diff address it, and include your verdict in the "Issue Resolution Check"
section of your review.

${referencedIssues
  .map(
    (issue) => `### Issue #${issue.number}: ${issue.title}
${issue.body}`
  )
  .join('\n\n')}
`
      : '';

  const issueResolutionSection =
    referencedIssues.length > 0
      ? `
## Issue Resolution Check
For each referenced issue, state clearly:
- The issue number and title
- ✅ RESOLVED or ❌ NOT RESOLVED
- A brief explanation of why

Use this exact format for each issue so it can be parsed automatically:
ISSUE #<number>: <✅ RESOLVED | ❌ NOT RESOLVED> — <one line explanation>
`
      : '';

  const prompt = `You are an expert code reviewer for a React + TypeScript financial dashboard application.

Review the following code changes and provide constructive feedback focusing on:

1. **Code Quality**: Best practices, potential bugs, edge cases
2. **Security**: Any security concerns, especially around financial data
3. **Performance**: Potential performance issues or optimizations
4. **Accessibility**: A11y concerns for a financial dashboard
5. **TypeScript**: Type safety improvements
6. **React Best Practices**: Hooks usage, component structure, state management
${referencedIssuesSection}
Here are the file changes:

${fullDiff}

Please provide your review in the following format:

## Summary
[Brief overview of the changes and overall assessment]

## Key Findings
[List 3-5 most important issues or suggestions]

## Detailed Review
[Detailed feedback organized by file, if needed]

## Recommendations
[Specific actionable recommendations]
${issueResolutionSection}
Keep the tone constructive and educational. Focus on the most impactful improvements.`;

  try {
    console.log('Calling Claude API for code review...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const review = message.content[0].text;

    console.log('\n--- AI Code Review ---\n');
    console.log(review);

    if (prNumber && repo) {
      await postPRComment(repo, prNumber, review, referencedIssues.length > 0);
    }
  } catch (error) {
    console.error('Error calling Claude API:', error);
    process.exit(1);
  }
}

async function postPRComment(repo, prNumber, review, hasReferencedIssues) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.log('No GitHub token available, skipping PR comment');
    return;
  }

  const issueCheckNote = hasReferencedIssues
    ? '\n> 🔍 This review includes an **Issue Resolution Check** for issues referenced in the PR description.\n'
    : '';

  const commentBody = `## 🤖 AI Code Review (Claude Sonnet 4)
${issueCheckNote}
${review}

---
*This review was automatically generated using Claude AI. Please use your judgment when addressing these suggestions.*`;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({ body: commentBody }),
      }
    );

    if (response.ok) {
      console.log('✅ Posted review as PR comment');
    } else {
      const error = await response.text();
      console.log('Failed to post PR comment:', error);
    }
  } catch (error) {
    console.log('Error posting PR comment:', error);
  }
}

reviewCode().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});