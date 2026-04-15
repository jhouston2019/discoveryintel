# Build the Next.js app in a short, space-free path.
# Webpack on Windows can fail with readlink/EISDIR when the project lives under paths that contain spaces
# (e.g. "Axis Projects", "discovery intel"). Linux/macOS and CI are unaffected.
param(
  [string]$StagingRoot = $(Join-Path $env:TEMP "discoveryintel-next-build")
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host "Staging frontend build at: $StagingRoot"

Remove-Item -LiteralPath $StagingRoot -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path (Join-Path $StagingRoot "shared") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $StagingRoot "frontend") | Out-Null

$RobocopyArgs = @("/E", "/XD", "node_modules", "dist", ".next", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np")
& robocopy (Join-Path $RepoRoot "shared") (Join-Path $StagingRoot "shared") @RobocopyArgs
& robocopy (Join-Path $RepoRoot "frontend") (Join-Path $StagingRoot "frontend") @RobocopyArgs
if (Test-Path (Join-Path $RepoRoot ".npmrc")) {
  Copy-Item (Join-Path $RepoRoot ".npmrc") (Join-Path $StagingRoot ".npmrc") -Force
}

Push-Location (Join-Path $StagingRoot "shared")
try {
  npm install --no-fund --no-audit
  npm run build
} finally {
  Pop-Location
}

Push-Location (Join-Path $StagingRoot "frontend")
try {
  $env:DISCOVERYINTEL_BUILD_STAGING = "1"
  npm install --no-fund --no-audit
  npm run build
} finally {
  Remove-Item Env:DISCOVERYINTEL_BUILD_STAGING -ErrorAction SilentlyContinue
  Pop-Location
}

$DestNext = Join-Path $RepoRoot "frontend\.next"
Remove-Item -LiteralPath $DestNext -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Copying .next back to repo..."
& robocopy (Join-Path $StagingRoot "frontend\.next") $DestNext /E /NFL /NDL /NJH /NJS /nc /ns /np

Write-Host "Done. You can run: cd frontend && npm run start"
exit 0
