# Sprout - Trade Edit Consistency Smoke Test
# Verifica que al editar un trade, el cash flow, KPIs y portfolio se actualizan correctamente.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$BASE = if ($env:SPROUT_API_URL) { $env:SPROUT_API_URL } else { 'https://sprout-backend-production-3aff.up.railway.app/api/v1' }
$script:Passed = 0
$script:Failed = 0

function Log-Step([string]$msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Log-OK([string]$msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green; $script:Passed++ }
function Log-FAIL([string]$msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:Failed++ }
function Log-Info([string]$msg) { Write-Host "    -> $msg" -ForegroundColor Gray }

function Invoke-API {
    param([string]$Method, [string]$Path, [object]$Body = $null, [string]$Token = '', [switch]$Form)
    $url = "$BASE$Path"
    $headers = @{ 'Accept' = 'application/json' }
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }
    try {
        if ($Form) {
            return Invoke-RestMethod -Method POST -Uri $url -Headers $headers -ContentType 'application/x-www-form-urlencoded' -Body $Body
        } elseif ($null -ne $Body) {
            $json = $Body | ConvertTo-Json -Depth 10
            return Invoke-RestMethod -Method $Method -Uri $url -Headers $headers -ContentType 'application/json' -Body $json
        } else {
            return Invoke-RestMethod -Method $Method -Uri $url -Headers $headers
        }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $detail = $_.ErrorDetails.Message
        throw "HTTP $status on $Method $Path - $detail"
    }
}

# ---- Scenario ----
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$EMAIL = "smoke_edit_$stamp@example.com"
$UPASS = "SmokeEdit${stamp}X"
$DEPOSIT = 5000
$PRICE_ORIGINAL = 100
$QTY_ORIGINAL = 10
$PRICE_EDITED = 120
$QTY_EDITED = 8

$originalCost = $QTY_ORIGINAL * $PRICE_ORIGINAL   # 1000
$editedCost   = $QTY_EDITED * $PRICE_EDITED        # 960

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Trade Edit Consistency Smoke Test" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Log-Info "Original trade: ${QTY_ORIGINAL}x @ $PRICE_ORIGINAL = $originalCost"
Log-Info "Edited trade:   ${QTY_EDITED}x @ $PRICE_EDITED = $editedCost"
Log-Info "Expected cash after edit: $($DEPOSIT - $editedCost)"

$token = ''

# ---- 1. Setup: Register + Account + Asset + Deposit ----
Log-Step "1. Setup (register, account, asset, deposit)"
try {
    $reg = Invoke-API -Method POST -Path '/auth/register' -Body @{ email=$EMAIL; password=$UPASS }
    $token = $reg.access_token
    Log-OK "Registered $EMAIL"
} catch { Log-FAIL "Register: $_"; exit 1 }

try {
    $acc = Invoke-API -Method POST -Path '/accounts/create' -Token $token -Body @{ name="TestAcc_$stamp"; type="broker"; currency="EUR" }
    Log-OK "Account created id=$($acc.account_id)"
} catch { Log-FAIL "Account: $_"; exit 1 }

try {
    $asset = Invoke-API -Method POST -Path '/assets/create' -Token $token -Body @{ name="TestAsset_$stamp"; ticker="TST_$stamp"; currency="EUR"; type="etf"; theme="Test" }
    Log-OK "Asset created id=$($asset.asset_id)"
} catch { Log-FAIL "Asset: $_"; exit 1 }

$today = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
try {
    Invoke-API -Method POST -Path '/transactions/create' -Token $token -Body @{ account_id=$acc.account_id; date=$today; amount=$DEPOSIT; type="income"; description="Deposito"; category="Deposito" } | Out-Null
    Log-OK "Deposited $DEPOSIT EUR"
} catch { Log-FAIL "Deposit: $_"; exit 1 }

# ---- 2. Create original trade ----
Log-Step "2. Create original trade (${QTY_ORIGINAL}x @ $PRICE_ORIGINAL)"
try {
    $trade = Invoke-API -Method POST -Path '/trades/create' -Token $token -Body @{
        asset_id=$asset.asset_id; account_id=$acc.account_id; date=$today;
        quantity=$QTY_ORIGINAL; price=$PRICE_ORIGINAL; fees=0; operation_type="buy"
    }
    $opId = $trade.operation_id
    Log-OK "Trade created operation_id=$opId"
} catch { Log-FAIL "Create trade: $_"; exit 1 }

# ---- 3. Verify cash after original trade ----
Log-Step "3. Verify cash after original trade"
try {
    $portfolio = Invoke-API -Method GET -Path '/portfolio/accounts' -Token $token
    $cashAfterOriginal = [double]$portfolio[0].cash_balance
    $expectedCashOriginal = $DEPOSIT - $originalCost
    Log-Info "Cash: $cashAfterOriginal (expected: $expectedCashOriginal)"
    if ([math]::Abs($cashAfterOriginal - $expectedCashOriginal) -lt 1) { Log-OK "Cash correct after original trade" }
    else { Log-FAIL "Cash mismatch after original: got=$cashAfterOriginal expected=$expectedCashOriginal" }
} catch { Log-FAIL "Portfolio check: $_" }

# ---- 4. Edit the trade (change price and quantity) ----
Log-Step "4. Edit trade -> ${QTY_EDITED}x @ $PRICE_EDITED"
try {
    Invoke-API -Method PUT -Path "/trades/$opId" -Token $token -Body @{
        quantity=$QTY_EDITED; price=$PRICE_EDITED
    } | Out-Null
    Log-OK "Trade updated"
} catch { Log-FAIL "Update trade: $_" }

# ---- 5. Verify cash after edit (THE BUG) ----
Log-Step "5. Verify cash after edit"
$expectedCashEdited = $DEPOSIT - $editedCost
try {
    $portfolio2 = Invoke-API -Method GET -Path '/portfolio/accounts' -Token $token
    $cashAfterEdit = [double]$portfolio2[0].cash_balance
    Log-Info "Cash: $cashAfterEdit (expected: $expectedCashEdited)"
    if ([math]::Abs($cashAfterEdit - $expectedCashEdited) -lt 1) { Log-OK "Cash correct after edit" }
    else { Log-FAIL "Cash NOT updated after edit: got=$cashAfterEdit expected=$expectedCashEdited (diff=$([math]::Round($cashAfterEdit - $expectedCashEdited,2)))" }
} catch { Log-FAIL "Portfolio check after edit: $_" }

# ---- 6. Verify invested_value after edit ----
Log-Step "6. Verify invested_value after edit"
try {
    $invested = [double]$portfolio2[0].invested_value
    # invested = qty_edited * latest_price (which should be PRICE_EDITED after upsert)
    $expectedInvested = $QTY_EDITED * $PRICE_EDITED
    Log-Info "Invested: $invested (expected: $expectedInvested)"
    if ([math]::Abs($invested - $expectedInvested) -lt 1) { Log-OK "Invested value correct after edit" }
    else { Log-FAIL "Invested mismatch: got=$invested expected=$expectedInvested" }
} catch { Log-FAIL "Invested check: $_" }

# ---- 7. Verify total_value consistency ----
Log-Step "7. Verify total_value = cash + invested"
try {
    $totalVal = [double]$portfolio2[0].total_value
    $expectedTotal = $expectedCashEdited + $expectedInvested
    Log-Info "Total: $totalVal (expected: $expectedTotal)"
    if ([math]::Abs($totalVal - $expectedTotal) -lt 2) { Log-OK "Total value consistent" }
    else { Log-FAIL "Total mismatch: got=$totalVal expected=$expectedTotal" }
} catch { Log-FAIL "Total check: $_" }

# ---- 8. Verify trade history reflects edit ----
Log-Step "8. Verify trade history reflects edit"
try {
    $history = Invoke-API -Method GET -Path '/trades/history' -Token $token
    $myTrade = $history | Where-Object { $_.operation_id -eq $opId }
    if ($myTrade) {
        $hQty = [double]$myTrade.quantity
        $hPrice = [double]$myTrade.price
        if ($hQty -eq $QTY_EDITED -and $hPrice -eq $PRICE_EDITED) { Log-OK "History shows edited values qty=$hQty price=$hPrice" }
        else { Log-FAIL "History shows old values qty=$hQty price=$hPrice (expected qty=$QTY_EDITED price=$PRICE_EDITED)" }
    } else { Log-FAIL "Trade $opId not found in history" }
} catch { Log-FAIL "History check: $_" }

# ---- Results ----
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Passed: $($script:Passed)" -ForegroundColor Green
if ($script:Failed -gt 0) {
    Write-Host "  Failed: $($script:Failed)" -ForegroundColor Red
    Write-Host ""
    Write-Host "TRADE EDIT CONSISTENCY FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "TRADE EDIT CONSISTENCY ALL PASSED" -ForegroundColor Green
    exit 0
}
