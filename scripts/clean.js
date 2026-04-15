/**
 * Removes install/build artifacts so a fresh `npm run install:all` can succeed.
 * On Windows, prefers PowerShell Remove-Item (handles AV locks and deep trees better than rd alone).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const dirs = [
  'node_modules',
  'shared/node_modules',
  'backend/node_modules',
  'frontend/node_modules',
  'shared/dist',
  'backend/dist',
  path.join('frontend', '.next'),
  'frontend/out',
];

function removeDir(target) {
  if (!fs.existsSync(target)) {
    return;
  }
  if (process.platform === 'win32') {
    const escaped = target.replace(/'/g, "''");
    try {
      execSync(
        `powershell -NoProfile -Command "Remove-Item -LiteralPath '${escaped}' -Recurse -Force -ErrorAction Stop"`,
        { stdio: 'inherit', windowsHide: true }
      );
      return;
    } catch {
      try {
        execSync(`cmd /c rd /s /q "${target}"`, { stdio: 'pipe', windowsHide: true });
        return;
      } catch {
        // fall through
      }
    }
  }
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

let failed = false;
for (const rel of dirs) {
  const target = path.join(root, rel);
  try {
    removeDir(target);
    console.log('removed:', rel);
  } catch (e) {
    console.error('failed:', rel, e.message);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
