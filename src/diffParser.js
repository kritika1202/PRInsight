const BINARY_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|otf|pdf|zip|tar|gz)$/i;
const GENERATED_FILES = /\.(lock|sum)$|package-lock\.json|yarn\.lock/i;

function parseDiff(diffText) {
  const files = [];
  let currentFile = null;
  let currentHunk = null;
  let newLineNumber = 0;

  for (const line of diffText.split('\n')) {
    if (line.startsWith('diff --git')) {
      if (currentFile) files.push(currentFile);
      currentFile = { filename: '', hunks: [], additions: 0, deletions: 0 };
      currentHunk = null;
    } else if (line.startsWith('+++ b/') && currentFile) {
      currentFile.filename = line.slice(6);
    } else if (line.startsWith('@@ ') && currentFile) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        newLineNumber = parseInt(match[1], 10);
        currentHunk = { header: line, lines: [] };
        currentFile.hunks.push(currentHunk);
      }
    } else if (currentHunk) {
      if (line.startsWith('+')) {
        currentHunk.lines.push({ type: 'add', content: line.slice(1), lineNumber: newLineNumber });
        newLineNumber++;
        currentFile.additions++;
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({ type: 'remove', content: line.slice(1), lineNumber: null });
        currentFile.deletions++;
      } else if (!line.startsWith('\\')) {
        currentHunk.lines.push({ type: 'context', content: line.slice(1), lineNumber: newLineNumber });
        newLineNumber++;
      }
    }
  }

  if (currentFile) files.push(currentFile);
  return files;
}

function filterReviewableFiles(parsedFiles) {
  return parsedFiles.filter(
    (f) => f.filename && !BINARY_EXTENSIONS.test(f.filename) && !GENERATED_FILES.test(f.filename)
  );
}

function formatDiffForAI(parsedFiles) {
  return parsedFiles
    .map((file) => {
      const hunks = file.hunks
        .map((hunk) => {
          const lines = hunk.lines
            .map((l) => {
              const prefix = l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' ';
              const lineTag = l.lineNumber ? `[L${l.lineNumber}]` : '[---]';
              return `${lineTag} ${prefix} ${l.content}`;
            })
            .join('\n');
          return `${hunk.header}\n${lines}`;
        })
        .join('\n');
      return `### File: ${file.filename}\n\`\`\`\n${hunks}\n\`\`\``;
    })
    .join('\n\n');
}

module.exports = { parseDiff, filterReviewableFiles, formatDiffForAI };
