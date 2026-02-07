#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function reviewCode() {
  const changedFiles = process.argv[2].split(' ');
  
  // Get PR details from GitHub environment
  const prNumber = process.env.GITHUB_REF?.split('/')[2];
  const repo = process.env.GITHUB_REPOSITORY;
  
  console.log(`Reviewing ${changedFiles.length} changed files...`);
  
  // Get the diff for each file
  let fullDiff = '';
  let fileContents = [];
  
  for (const file of changedFiles) {
    try {
      // Get the git diff for this file
      const diff = execSync(`git diff origin/main HEAD -- ${file}`, { 
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      if (diff) {
        fullDiff += `\n\n--- File: ${file} ---\n${diff}`;
        
        // Also get the full file content for context
        try {
          const content = readFileSync(file, 'utf-8');
          fileContents.push({
            path: file,
            content: content.slice(0, 5000) // Limit to first 5000 chars per file
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
  
  // Prepare the prompt for Claude
  const prompt = `You are an expert code reviewer for a React + TypeScript financial dashboard application. 

Review the following code changes and provide constructive feedback focusing on:

1. **Code Quality**: Best practices, potential bugs, edge cases
2. **Security**: Any security concerns, especially around financial data
3. **Performance**: Potential performance issues or optimizations
4. **Accessibility**: A11y concerns for a financial dashboard
5. **TypeScript**: Type safety improvements
6. **React Best Practices**: Hooks usage, component structure, state management

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

Keep the tone constructive and educational. Focus on the most impactful improvements.`;

  try {
    console.log('Calling Claude API for code review...');
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const review = message.content[0].text;
    
    console.log('\n--- AI Code Review ---\n');
    console.log(review);
    
    // Post the review as a PR comment
    if (prNumber && repo) {
      await postPRComment(repo, prNumber, review);
    }
    
  } catch (error) {
    console.error('Error calling Claude API:', error);
    process.exit(1);
  }
}

async function postPRComment(repo, prNumber, review) {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log('No GitHub token available, skipping PR comment');
    return;
  }
  
  const commentBody = `## 🤖 AI Code Review (Claude Sonnet 4)

${review}

---
*This review was automatically generated using Claude AI. Please use your judgment when addressing these suggestions.*`;
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
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

// Run the review
reviewCode().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});