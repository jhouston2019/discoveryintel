/**
 * Next.js webpack on Windows often fails with readlink/EISDIR when the project path contains spaces.
 * Staging builds (see build-frontend-windows.ps1) set DISCOVERYINTEL_BUILD_STAGING=1 to skip this check.
 */
const { platform, cwd, env, exit } = process;

if (platform !== 'win32' || env.DISCOVERYINTEL_BUILD_STAGING === '1' || env.DISCOVERYINTEL_ALLOW_SPACED_PATH === '1') {
  exit(0);
}

if (cwd().includes(' ')) {
  console.error('');
  console.error('Next.js production build does not reliably work when this folder path contains spaces.');
  console.error('Current directory:', cwd());
  console.error('');
  console.error('Fix one of:');
  console.error('  • Move or clone the repo to a path with no spaces (e.g. C:\\dev\\discoveryintel)');
  console.error('  • From the repo root run: npm run build:win');
  console.error('  • Advanced: set DISCOVERYINTEL_ALLOW_SPACED_PATH=1 to try anyway (often still fails).');
  console.error('');
  exit(1);
}

exit(0);
