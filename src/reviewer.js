const { getPRDiff, getPRDetails, postPRComment, postReviewComments } = require('./github');
const { parseDiff, filterReviewableFiles, formatDiffForAI } = require('./diffParser');
const { generateSummary, generateReview } = require('./gemini');

const MAX_DIFF_LINES = 2000;

async function runReview(owner, repo, pullNumber) {
  console.log(`[PRInsight] Starting review: ${owner}/${repo}#${pullNumber}`);

  const [rawDiff, pr] = await Promise.all([
    getPRDiff(owner, repo, pullNumber),
    getPRDetails(owner, repo, pullNumber),
  ]);

  const diffLines = rawDiff.split('\n').length;
  if (diffLines > MAX_DIFF_LINES) {
    await postPRComment(
      owner, repo, pullNumber,
      `> **PRInsight Status: Review Skipped**\n> This PR has ${diffLines} diff lines which exceeds the ${MAX_DIFF_LINES}-line limit. Consider splitting it into smaller PRs.\n\n> *Available commands: comment \`prinsight-review\` to retry after splitting.*`
    );
    return;
  }

  const allFiles = parseDiff(rawDiff);
  const reviewableFiles = filterReviewableFiles(allFiles);

  if (!reviewableFiles.length) {
    await postPRComment(
      owner, repo, pullNumber,
      `> **PRInsight Status: Review Skipped**\n> No reviewable source files found in this PR (binary files, lockfiles, and generated files are excluded).`
    );
    return;
  }

  const formattedDiff = formatDiffForAI(reviewableFiles);

  const [summary, reviewComments] = await Promise.all([
    generateSummary(pr.title, pr.body, formattedDiff),
    generateReview(formattedDiff, reviewableFiles),
  ]);

  const summaryComment = `<!-- prinsight-summary -->\n## [Automated PR Analysis]\n\n${summary}`;
  await postPRComment(owner, repo, pullNumber, summaryComment);

  const validComments = reviewComments.filter(
    (c) => c.path && typeof c.line === 'number' && c.comment
  );

  if (validComments.length > 0) {
    await postReviewComments(owner, repo, pullNumber, pr.head.sha, validComments);

    const digest = validComments
      .map((c) => `**\`${c.path}\`** (L${c.line})\n${c.severity} ${c.comment}`)
      .join('\n\n');

    await postPRComment(
      owner, repo, pullNumber,
      `<details>\n<summary><strong>Review Digest</strong> — ${validComments.length} comment(s)</summary>\n\n${digest}\n\n</details>`
    );
  }

  console.log(
    `[PRInsight] Review complete for ${owner}/${repo}#${pullNumber}: ${validComments.length} inline comment(s)`
  );
}

module.exports = { runReview };
