# Sprout - Asset Edit Smoke Test
# Tests: register, create asset, update type/theme via PATCH, verify changes, money_market type
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$BASE = if ($env:SPROUT_API_URL) { $env:SPROUT_API_URL } else { 'https://sprout-backend-production-3aff.up.railway.app/api/v1' }
$script:Passed = 0
$script:Failed = 0

function Log-OK([string]$msg) {
    Write-Host "  [PASS] $msg" -ForegroundColor Green
    $script:Passed++
}
function Log-FAIL([string]$msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
    $script:Failed++
}

Write-Host ""
Write-Host "== Asset Edit Smoke Test ==" -ForegroundColor Cyan

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$EMAIL = "smoke_asset_edit_$stamp@example.com"
$PASS  = "SmokeEdit${stamp}X"

# Use WebRequestSession to capture Set-Cookie headers
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# ── 1. Register ──
try {
    $body = @{ email = $EMAIL; password = $PASS } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/auth/register" -Method POST `
        -ContentType 'application/json' -Body $body -WebSession $session -UseBasicParsing
    $json = $r.Content | ConvertFrom-Json
    $csrf = $json.csrf_token
    if ($csrf) { Log-OK "Register OK (csrf received)" }
    else { Log-FAIL "Register: no csrf_token" }
} catch {
    Log-FAIL "Register: $($_.Exception.Message)"
    Write-Host ("[SMOKE] asset-edit: {0} passed, {1} failed" -f $script:Passed, $script:Failed)
    exit 1
}

$headers = @{ 'X-CSRF-Token' = $csrf }

# ── 2. Create asset (type=etf) ──
$assetId = $null
try {
    $assetBody = @{
        name = "SmokeTestAsset_$stamp"
        ticker = "SMOKE$stamp"
        currency = 'EUR'
        type = 'etf'
        theme = 'Tecnologia'
    } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/assets/create" -Method POST `
        -ContentType 'application/json' -Body $assetBody -Headers $headers `
        -WebSession $session -UseBasicParsing
    $asset = $r.Content | ConvertFrom-Json
    $assetId = $asset.asset_id
    if ($assetId -and $asset.type -eq 'etf') { Log-OK "Create asset OK (id=$assetId, type=etf)" }
    else { Log-FAIL "Create asset: unexpected response" }
} catch {
    Log-FAIL "Create asset: $($_.Exception.Message)"
    Write-Host ("[SMOKE] asset-edit: {0} passed, {1} failed" -f $script:Passed, $script:Failed)
    exit 1
}

# ── 3. PATCH: update type to money_market and theme ──
try {
    $updateBody = @{
        type = 'money_market'
        theme = 'Liquidez'
    } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/assets/$assetId" -Method PATCH `
        -ContentType 'application/json' -Body $updateBody -Headers $headers `
        -WebSession $session -UseBasicParsing
    $updated = $r.Content | ConvertFrom-Json
    if ($updated.type -eq 'money_market' -and $updated.theme -eq 'Liquidez') {
        Log-OK "PATCH type=money_market, theme=Liquidez"
    } else {
        Log-FAIL "PATCH: type=$($updated.type), theme=$($updated.theme)"
    }
} catch {
    Log-FAIL "PATCH asset: $($_.Exception.Message)"
}

# ── 4. PATCH: update only theme ──
try {
    $updateBody = @{ theme = 'Monetario' } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/assets/$assetId" -Method PATCH `
        -ContentType 'application/json' -Body $updateBody -Headers $headers `
        -WebSession $session -UseBasicParsing
    $updated = $r.Content | ConvertFrom-Json
    if ($updated.theme -eq 'Monetario' -and $updated.type -eq 'money_market') {
        Log-OK "PATCH theme only (type preserved)"
    } else {
        Log-FAIL "PATCH theme only: type=$($updated.type), theme=$($updated.theme)"
    }
} catch {
    Log-FAIL "PATCH theme only: $($_.Exception.Message)"
}

# ── 5. Verify via with-prices endpoint ──
try {
    $r = Invoke-WebRequest -Uri "$BASE/assets/with-prices" -Method GET `
        -WebSession $session -UseBasicParsing
    $assets = $r.Content | ConvertFrom-Json
    $found = @($assets | Where-Object { $_.asset_id -eq $assetId })
    if ($found.Count -eq 1 -and $found[0].type -eq 'money_market' -and $found[0].theme -eq 'Monetario') {
        Log-OK "with-prices confirms updated asset"
    } else {
        Log-FAIL "with-prices: asset not found or fields wrong"
    }
} catch {
    Log-FAIL "with-prices: $($_.Exception.Message)"
}

# ── 6. PATCH with invalid type should fail ──
try {
    $badBody = @{ type = 'invalid_type' } | ConvertTo-Json
    $null = Invoke-WebRequest -Uri "$BASE/assets/$assetId" -Method PATCH `
        -ContentType 'application/json' -Body $badBody -Headers $headers `
        -WebSession $session -UseBasicParsing
    Log-FAIL "PATCH invalid type: should have returned error"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 422) { Log-OK "PATCH invalid type rejected (422)" }
    else { Log-FAIL "PATCH invalid type: expected 422, got $status" }
}

# ── Summary ──
Write-Host ""
Write-Host ("[SMOKE] asset-edit: {0} passed, {1} failed" -f $script:Passed, $script:Failed) -ForegroundColor $(if ($script:Failed -gt 0) { 'Red' } else { 'Green' })
if ($script:Failed -gt 0) { exit 1 }
exit 0
