# BIMcred - one-command local start (Windows PowerShell)
#
# Usage:
#   .\run.ps1                 # generate client, push schema, seed, then start dev server
#   .\run.ps1 -SkipSetup      # start dev server only (database already prepared)
#
# If PowerShell blocks the script, run:
#   powershell -ExecutionPolicy Bypass -File .\run.ps1

param([switch]$SkipSetup)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
  throw "Missing .env. Run: Copy-Item .env.example .env  (then fill in your Neon URLs)."
}

$envFile = Get-Content ".env" -Raw
if ($envFile -notmatch 'DATABASE_URL\s*=\s*"postgresql') {
  throw "DATABASE_URL must be the Neon POOLED PostgreSQL URL. See README.md."
}
if ($envFile -notmatch 'DIRECT_URL\s*=\s*"postgresql') {
  throw "DIRECT_URL must be the Neon DIRECT PostgreSQL URL. See README.md."
}

if (-not $SkipSetup) {
  Write-Host "`n[bimcred] Generating Prisma client, pushing schema, seeding demo data...`n" -ForegroundColor Cyan
  npm run setup
  if ($LASTEXITCODE -ne 0) { throw "Setup failed. Check your Neon URLs and network." }
}

Write-Host "`n[bimcred] Starting at http://localhost:3000`n" -ForegroundColor Green
npm run dev
