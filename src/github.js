const { Octokit } = require('@octokit/rest');

function createClient() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

async function getPRDiff(owner, repo, pullNumber) {
  const octokit = createClient();
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner,
    repo,
    pull_number: pullNumber,
    headers: { accept: 'application/vnd.github.v3.diff' },
  });
  return data;
}

async function getPRDetails(owner, repo, pullNumber) {
  const octokit = createClient();
  const { data } = await octokit.pulls.get({ owner, repo, pull_number: pullNumber });
  return data;
}

async function postPRComment(owner, repo, pullNumber, body) {
  const octokit = createClient();
  await octokit.issues.createComment({ owner, repo, issue_number: pullNumber, body });
}

async function postReviewComments(owner, repo, pullNumber, commitSha, comments) {
  if (!comments.length) return;

  const octokit = createClient();

  const reviewComments = comments
    .filter((c) => c.path && c.line && c.comment)
    .map((c) => ({
      path: c.path,
      line: parseInt(c.line, 10),
      side: 'RIGHT',
      body: `${c.severity} ${c.comment}`,
    }));

  if (!reviewComments.length) return;

  try {
    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitSha,
      event: 'COMMENT',
      comments: reviewComments,
    });
  } catch (err) {
    console.warn('[PRInsight] Inline review failed, falling back to single comment:', err.message);
    const fallback = reviewComments
      .map((c) => `**\`${c.path}\` L${c.line}**\n${c.body}`)
      .join('\n\n---\n\n');
    await postPRComment(owner, repo, pullNumber, `**PRInsight Code Review**\n\n${fallback}`);
  }
}

module.exports = { getPRDiff, getPRDetails, postPRComment, postReviewComments };
