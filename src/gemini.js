const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
function getClient() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
}

function getModel() {
  return getClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
}

async function generateSummary(prTitle, prBody, formattedDiff) {
  const prompt = `You are an expert software engineer reviewing a pull request. Generate a concise, developer-friendly PR summary.

PR Title: ${prTitle}
PR Description: ${prBody || 'No description provided.'}

Code Changes:
${formattedDiff}

Write a PR summary in markdown with exactly these sections:
**Purpose**: One or two sentences describing what this PR achieves and why.
**Key Changes**: A bullet list of the most important code-level changes.
**Impact**: Potential risks, performance implications, or areas to watch out for.

Be specific and technical. Avoid vague statements.`;

  const result = await getModel().generateContent(prompt);
  return result.response.text().trim();
}

async function generateReview(formattedDiff, parsedFiles) {
  const fileList = parsedFiles.map((f) => f.filename).join(', ');

  const prompt = `You are a senior code reviewer. Analyze these code changes and identify concrete issues.

Files changed: ${fileList}

${formattedDiff}

Review the diff for:
1. Bugs and logical errors (off-by-one, incorrect conditions, wrong variable)
2. Time complexity issues (nested loops, repeated lookups that could be O(1), missing memoization)
3. Security vulnerabilities (injection, missing auth checks, hardcoded secrets, XSS)
4. Reliability issues (missing null checks, unhandled promise rejections, resource leaks)

Rules:
- Only comment on lines that are marked with a [L<n>] tag in the diff above (added or context lines)
- The "line" field must be the integer from [L<n>] (e.g. [L42] → 42)
- "path" must exactly match one of the filenames listed above
- "severity" must be "[critical]" for bugs/security issues or "[suggestion]" for improvements
- Write "comment" as 1-3 specific, actionable sentences — explain the problem and how to fix it
- Return at most 8 comments. Skip style preferences and nitpicks unless they cause real bugs.
- If there are no real issues, return an empty array.

Respond ONLY with a valid JSON array, no markdown fences, no explanation:
[{"path":"...","line":42,"severity":"[critical]","comment":"..."}]`;

  const result = await getModel().generateContent(prompt);
  const text = result.response.text().trim();

  const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[PRInsight] Gemini returned non-JSON review, skipping inline comments');
    return [];
  }
}

module.exports = { generateSummary, generateReview };
