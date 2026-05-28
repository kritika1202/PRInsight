require('dotenv').config();
const { runReview } = require('./reviewer');

const owner = process.env.REPO_OWNER;
const repo = process.env.REPO_NAME;
const pullNumber = parseInt(process.env.PR_NUMBER, 10);

if (!owner || !repo || !pullNumber) {
  console.error('[PRInsight Action] Missing required env: REPO_OWNER, REPO_NAME, PR_NUMBER');
  process.exit(1);
}

runReview(owner, repo, pullNumber)
  .then(() => {
    console.log('[PRInsight Action] Review complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[PRInsight Action] Failed:', err.message);
    process.exit(1);
  });
