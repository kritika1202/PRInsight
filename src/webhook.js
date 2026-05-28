const crypto = require('crypto');
const { runReview } = require('./reviewer');

function verifySignature(req, secret) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(req.rawBody);
  const digest = `sha256=${hmac.digest('hex')}`;

  if (signature.length !== digest.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

async function handleWebhook(req, res) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (secret && !verifySignature(req, secret)) {
    console.warn('[PRInsight] Rejected webhook: invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  const payload = req.body;

  res.status(200).json({ status: 'received', event });

  try {
    if (
      event === 'pull_request' &&
      ['opened', 'synchronize', 'reopened'].includes(payload.action)
    ) {
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const pullNumber = payload.pull_request.number;
      await runReview(owner, repo, pullNumber);
    }

    if (event === 'issue_comment' && payload.action === 'created') {
      const commentBody = (payload.comment.body || '').toLowerCase();
      const isPR = Boolean(payload.issue.pull_request);
      if (isPR && commentBody.includes('prinsight-review')) {
        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const pullNumber = payload.issue.number;
        await runReview(owner, repo, pullNumber);
      }
    }
  } catch (err) {
    console.error('[PRInsight] Unhandled error in webhook handler:', err.message);
  }
}

module.exports = { handleWebhook };
