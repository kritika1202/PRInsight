const express = require('express');
const { getPRDiff, getPRDetails } = require('../github');
const { parseDiff, filterReviewableFiles, formatDiffForAI } = require('../diffParser');
const { generateSummary, generateReview } = require('../gemini');

const router = express.Router();

function parsePRUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], pullNumber: parseInt(match[3], 10) };
}

router.post('/analyze', async (req, res) => {
  const { prUrl } = req.body;

  if (!prUrl) {
    return res.status(400).json({ error: 'prUrl is required' });
  }

  const parsed = parsePRUrl(prUrl.trim());
  if (!parsed) {
    return res.status(400).json({
      error: 'Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123',
    });
  }

  const { owner, repo, pullNumber } = parsed;

  try {
    const [rawDiff, pr] = await Promise.all([
      getPRDiff(owner, repo, pullNumber),
      getPRDetails(owner, repo, pullNumber),
    ]);

    const diffLines = rawDiff.split('\n').length;
    if (diffLines > 2000) {
      return res.status(400).json({
        error: `This PR has ${diffLines.toLocaleString()} diff lines which is too large to analyze (limit: 2,000). Try a smaller PR.`,
      });
    }

    const allFiles = parseDiff(rawDiff);
    const reviewableFiles = filterReviewableFiles(allFiles);

    const prMeta = {
      title: pr.title,
      author: pr.user.login,
      authorAvatar: pr.user.avatar_url,
      url: pr.html_url,
      state: pr.state,
      filesChanged: reviewableFiles.length,
      additions: reviewableFiles.reduce((a, f) => a + f.additions, 0),
      deletions: reviewableFiles.reduce((a, f) => a + f.deletions, 0),
    };

    if (!reviewableFiles.length) {
      return res.json({
        summary: 'No reviewable source files found in this PR (binary files, lockfiles, and generated files are excluded).',
        comments: [],
        pr: prMeta,
      });
    }

    const formattedDiff = formatDiffForAI(reviewableFiles);

    const [summary, comments] = await Promise.all([
      generateSummary(pr.title, pr.body, formattedDiff),
      generateReview(formattedDiff, reviewableFiles),
    ]);

    res.json({ summary, comments, pr: prMeta });
  } catch (err) {
    console.error('[PRInsight] /api/analyze error:', err.message);
    const status = err.status === 404 ? 404 : 500;
    res.status(status).json({
      error: status === 404 ? 'PR not found. Make sure the URL is correct and the repo is public.' : err.message,
    });
  }
});

module.exports = router;
