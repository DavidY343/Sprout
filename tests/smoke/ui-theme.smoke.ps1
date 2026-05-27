#!/usr/bin/env pwsh
# Smoke test — UI Theme (Le Corbusier palette)
# Validates theme files locally and frontend availability on Vercel.

$ErrorActionPreference = 'Stop'
$pass = 0; $fail = 0

function Assert($name, $condition) {
  if ($condition) { Write-Host "  PASS  $name" -ForegroundColor Green; $script:pass++ }
  else            { Write-Host "  FAIL  $name" -ForegroundColor Red;   $script:fail++ }
}

$frontendUrl = if ($env:SPROUT_FRONTEND_URL) { $env:SPROUT_FRONTEND_URL } else { 'https://sprout-bice.vercel.app' }

Write-Host "`n=== UI Theme Smoke Tests ===" -ForegroundColor Cyan

# 1. Frontend serves index.html (Vercel)
try {
  $response = Invoke-WebRequest -Uri "$frontendUrl/" -UseBasicParsing -TimeoutSec 15
  Assert "Frontend responds 200" ($response.StatusCode -eq 200)
} catch {
  Assert "Frontend responds 200" $false
}

# 3. theme.ts contains Le Corbusier palette (no purple-600, no #0B0F1A bg)
$themeFile = Get-Content "$PSScriptRoot/../../frontend/src/styles/theme.ts" -Raw
Assert "Theme has cream background (#F5F0E8)" ($themeFile -match '#F5F0E8')
Assert "Theme has terracotta (#C25B3F)"       ($themeFile -match '#C25B3F')
Assert "Theme has arch-blue (#4A6FA5)"        ($themeFile -match '#4A6FA5')
Assert "Theme has sage green (#6B8F71)"       ($themeFile -match '#6B8F71')
Assert "No neon purple gradient"              ($themeFile -notmatch 'from-purple-600 to-violet-600')
Assert "No dark bg #0B0F1A in theme"       ($themeFile -notmatch '#0B0F1A')

# 4. index.css has light base
$cssFile = Get-Content "$PSScriptRoot/../../frontend/src/index.css" -Raw
Assert "index.css sets cream background" ($cssFile -match '#F5F0E8')

# Summary
Write-Host "`n--- Results: $pass passed, $fail failed ---" -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Red' })
exit $fail
