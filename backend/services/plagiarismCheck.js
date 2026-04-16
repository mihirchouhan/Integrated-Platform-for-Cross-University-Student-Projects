/**
 * Plagiarism Check Service
 *
 * By default uses a MOCK implementation that returns a random similarity score.
 * Set COPYLEAKS_API_KEY in .env to switch to the real Copyleaks API.
 *
 * Public API:
 *   checkPlagiarism(text: string) → Promise<{ similarityScore, flagged, details }>
 */

async function mockCheck(text) {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300));
  const similarityScore = Math.round(Math.random() * 40); // 0-40%
  return {
    similarityScore,
    flagged: similarityScore > 30,
    details: `Mock plagiarism check: ${similarityScore}% similarity detected.`,
  };
}

async function copyleaksCheck(text) {
  // Placeholder for real Copyleaks integration
  // Requires: npm install axios, COPYLEAKS_API_KEY, COPYLEAKS_EMAIL in .env
  // const axios = require("axios");
  // 1. Login to Copyleaks API to get access token
  // 2. Submit scan
  // 3. Poll for results
  // For now, fall back to mock
  console.warn("[Plagiarism] Copyleaks API key set but integration not fully configured – using mock.");
  return mockCheck(text);
}

async function checkPlagiarism(text) {
  if (!text || text.trim().length < 20) {
    return { similarityScore: 0, flagged: false, details: "Text too short to check." };
  }

  if (process.env.COPYLEAKS_API_KEY) {
    return copyleaksCheck(text);
  }

  return mockCheck(text);
}

module.exports = { checkPlagiarism };
