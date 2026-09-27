const { execFileSync } = require('node:child_process');

// Inspect the index: ignore rules alone do not protect files that are already tracked.
const files = execFileSync('git', ['ls-files', '--cached', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const privatePaths = [
  /(^|\/)\.env(?!\.example$)/,
  /(^|\/)(?:node_modules|\.next|out|coverage|\.claude|\.codex|\.agents)\//,
  /^data\/\.ledger\//,
  /(^|\/)(?:\.npmrc|\.netrc|credentials\.json|service-account[^/]*\.json|\.DS_Store)$/,
  /\.(?:pem|key|p12|pfx|sqlite3?|db|db-journal|db-wal|db-shm|log|tsbuildinfo)$/,
  /(^|\/)costlens[^/]*usage\.csv$/,
  /(^|\/)gitleaks-report[^/]*\.json$/,
];
const blocked = files.filter(file => privatePaths.some(pattern => pattern.test(file)));
if (blocked.length) {
  console.error('Private or generated files are tracked. Remove them from the Git index before publishing:');
  blocked.forEach(file => console.error(`- ${file}`));
  process.exitCode = 1;
} else {
  console.log(`Publication check passed: ${files.length} tracked files, no private paths.`);
}
