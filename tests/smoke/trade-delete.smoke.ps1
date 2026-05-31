# Sprout - Trade Delete Smoke Test
# Tests: register, create account, create asset, create trade, delete trade, verify deletion
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
Write-Host "== Trade Delete Smoke Test ==" -ForegroundColor Cyan

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$EMAIL = "smoke_trade_del_$stamp@example.com"
$PASS  = "SmokeDel${stamp}X"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# ── 1. Register ──
try {
    $body = @{ email = $EMAIL; password = $PASS } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/auth/register" -Method POST `
        -ContentType 'application/json' -Body $body -WebSession $session -UseBasicParsing
    $json = $r.Content | ConvertFrom-Json
    $csrf = $json.csrf_token
    if ($csrf) { Log-OK "Register OK" }
    else { Log-FAIL "Register: no csrf_token" }
} catch {
    Log-FAIL "Register: $($_.Exception.Message)"
    Write-Host ("[SMOKE] trade-delete: {0} passed, {1} failed" -f $script:Passed, $script:Failed)
    exit 1
}

$headers = @{ 'X-CSRF-Token' = $csrf }

# ── 2. Create account ──
$accountId = $null
try {
    $accBody = @{ name = "SmokeAcc_$stamp"; type = "broker"; currency = "EUR" } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/accounts/create" -Method POST `
        -ContentType 'application/json' -Body $accBody -Headers $headers `
        -WebSession $session -UseBasicParsing
    $acc = $r.Content | ConvertFrom-Json
    $accountId = $acc.account_id
    if ($accountId) { Log-OK "Create account OK (id=$accountId)" }
    else { Log-FAIL "Create account: no id" }
} catch {
    Log-FAIL "Create account: $($_.Exception.Message)"
    Write-Host ("[SMOKE] trade-delete: {0} passed, {1} failed" -f $script:Passed, $script:Failed)
    exit 1
}

# ── 3. Create asset ──
$assetId = $null
try {
    $assetBody = @{ name = "SmokeDelAsset_$stamp"; ticker = "SMDL$stamp"; currency = "EUR"; type = "etf" } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/assets/create" -Method POST `
        -ContentType 'application/json' -Body $assetBody -Headers $headers `
        -WebSession $session -UseBasicParsing
    $asset = $r.Content | ConvertFrom-Json
    $assetId = $asset.asset_id
    if ($assetId) { Log-OK "Create asset OK (id=$assetId)" }
    else { Log-FAIL "Create asset: no id" }
} catch {
    Log-FAIL "Create asset: $($_.Exception.Message)"
    Write-Host ("[SMOKE] trade-delete: {0} passed, {1} failed" -f $script:Passed, $script:Failed)
    exit 1
}

# ── 4. Add cash transaction so account has funds ──
try {
    $txBody = @{
        account_id = $accountId
        amount = 10000
        type = "income"
        category = "Depósito"
        description = "Initial deposit"
        date = "2025-01-01"
    } | ConvertTo-Json
    $null = Invoke-WebRequest -Uri "$BASE/transactions/create" -Method POST `
        -ContentType 'application/json' -Body $txBody -Headers $headers `
        -WebSession $session -UseBasicParsing
    Log-OK "Cash deposit OK"
} catch {
    Log-FAIL "Cash deposit: $($_.Exception.Message)"
}

# ── 5. Create trade ──
$tradeId = $null
try {
    $tradeBody = @{
        asset_id = $assetId
        account_id = $accountId
        date = "2025-06-01"
        quantity = 10
        price = 50.00
        fees = 5.00
        operation_type = "buy"
    } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BASE/trades/create" -Method POST `
        -ContentType 'application/json' -Body $tradeBody -Headers $headers `
        -WebSession $session -UseBasicParsing
    $trade = $r.Content | ConvertFrom-Json
    $tradeId = $trade.operation_id
    if ($tradeId) { Log-OK "Create trade OK (id=$tradeId)" }
    else { Log-FAIL "Create trade: no id" }
} catch {
    Log-FAIL "Create trade: $($_.Exception.Message)"
    Write-Host ("[SMOKE] trade-delete: {0} passed, {1} failed" -f $script:Passed, $script:Failed)
    exit 1
}

# ── 6. Verify trade in history ──
try {
    $r = Invoke-WebRequest -Uri "$BASE/trades/history" -Method GET `
        -WebSession $session -UseBasicParsing
    $history = @($r.Content | ConvertFrom-Json)
    $found = @($history | Where-Object { $_.operation_id -eq $tradeId })
    if ($found.Count -eq 1 -and $found[0].account_name -eq "SmokeAcc_$stamp") {
        Log-OK "Trade in history with account_name"
    } else {
        Log-FAIL "Trade not found in history or missing account_name"
    }
} catch {
    Log-FAIL "History check: $($_.Exception.Message)"
}

# ── 7. Delete trade ──
try {
    $r = Invoke-WebRequest -Uri "$BASE/trades/$tradeId" -Method DELETE `
        -Headers $headers -WebSession $session -UseBasicParsing
    if ($r.StatusCode -eq 204) { Log-OK "Delete trade OK (204)" }
    else { Log-FAIL "Delete trade: status=$($r.StatusCode)" }
} catch {
    Log-FAIL "Delete trade: $($_.Exception.Message)"
}

# ── 8. Verify trade gone from history ──
try {
    $r = Invoke-WebRequest -Uri "$BASE/trades/history" -Method GET `
        -WebSession $session -UseBasicParsing
    $history = @($r.Content | ConvertFrom-Json)
    if ($history.Count -eq 0) {
        Log-OK "Trade removed from history"
    } else {
        $found = @($history | Where-Object { $_.operation_id -eq $tradeId })
        if ($found.Count -eq 0) { Log-OK "Trade removed from history" }
        else { Log-FAIL "Trade still in history after delete" }
    }
} catch {
    Log-FAIL "Post-delete check: $($_.Exception.Message)"
}

# ── 9. Delete non-existent trade should fail ──
try {
    $null = Invoke-WebRequest -Uri "$BASE/trades/999999" -Method DELETE `
        -Headers $headers -WebSession $session -UseBasicParsing
    Log-FAIL "Delete non-existent: should have failed"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 400) { Log-OK "Delete non-existent rejected (400)" }
    else { Log-FAIL "Delete non-existent: expected 400, got $status" }
}

Write-Host ""
Write-Host ("[SMOKE] trade-delete: {0} passed, {1} failed" -f $script:Passed, $script:Failed)
if ($script:Failed -gt 0) { exit 1 }
