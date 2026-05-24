Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$tests = @(
    Get-ChildItem -Path $scriptDir -Recurse -File -Filter '*.smoke.ps1' |
        Where-Object { $_.Name -ne 'run-smoke.ps1' } |
        Sort-Object FullName
)

if (-not $tests -or $tests.Count -eq 0) {
    Write-Host '[SMOKE] No smoke tests found under tests/smoke.' -ForegroundColor Yellow
    exit 0
}

$failed = @()

foreach ($test in $tests) {
    Write-Host ("[SMOKE] Running: {0}" -f $test.FullName) -ForegroundColor Cyan
    & $test.FullName
    if ($LASTEXITCODE -ne 0) {
        $failed += $test.FullName
    }
}

if ($failed.Count -gt 0) {
    Write-Host '[SMOKE] Failures:' -ForegroundColor Red
    foreach ($item in $failed) {
        Write-Host (" - {0}" -f $item) -ForegroundColor Red
    }
    exit 1
}

Write-Host '[SMOKE] All smoke tests passed.' -ForegroundColor Green
exit 0
