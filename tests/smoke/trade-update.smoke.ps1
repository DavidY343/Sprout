# Sprout - Trade Update Smoke Test
# Verifica que al editar un trade se actualicen correctamente:
# - La operación en sí
# - La transacción de cash asociada (categoría Inversión)
# - El cash_balance en portfolio
# - El invested_value en portfolio
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
    $hdrs = @{ 'Accept' = 'application/json' }
    if ($script:csrf) { $hdrs['X-CSRF-Token'] = $script:csrf }
    try {
        if ($Form) {
            $r = Invoke-WebRequest -Method POST -Uri $url -Headers $hdrs -ContentType 'application/x-www-form-urlencoded' -Body $Body -WebSession $script:session -UseBasicParsing
            return ($r.Content | ConvertFrom-Json)
        } elseif ($null -ne $Body) {
            $json = $Body | ConvertTo-Json -Depth 10
            $r = Invoke-WebRequest -Method $Method -Uri $url -Headers $hdrs -ContentType 'application/json' -Body $json -WebSession $script:session -UseBasicParsing
            return ($r.Content | ConvertFrom-Json)
        } else {
            $r = Invoke-WebRequest -Method $Method -Uri $url -Headers $hdrs -WebSession $script:session -UseBasicParsing
            return ($r.Content | ConvertFrom-Json)
        }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $detail = $_.ErrorDetails.Message
        throw "HTTP $status on $Method $Path - $detail"
    }
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$EMAIL = "smoke_trade_update_$stamp@example.com"
$UPASS = "SmokePass${stamp}X"
$DEPOSIT = 5000
$BUY_QTY = 10
$BUY_PRICE = 100
$UPDATED_QTY = 5
$UPDATED_PRICE = 120

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "  Trade Update Smoke Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Log-Info "Email: $EMAIL"
Log-Info "Deposit: $DEPOSIT | Buy: ${BUY_QTY}x@$BUY_PRICE | Update to: ${UPDATED_QTY}x@$UPDATED_PRICE"

$script:session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$script:csrf = ''
$token = ''

# ==========================================
Log-Step "1. Register + Login"
# ==========================================
try {
    $reg = Invoke-API -Method POST -Path '/auth/register' -Body @{ email = $EMAIL; password = $UPASS }
    $script:csrf = $reg.csrf_token
    $token = 'cookie-auth'
    Log-OK "Registered"
} catch { Log-FAIL "Register: $_"; exit 1 }

# ==========================================
Log-Step "2. Create account + asset"
# ==========================================
$acc = $null; $asset = $null
try {
    $acc = Invoke-API -Method POST -Path '/accounts/create' -Token $token `
        -Body @{ name = "TestAcc_$stamp"; type = "broker"; currency = "EUR" }
    Log-OK "Account id=$($acc.account_id)"
} catch { Log-FAIL "Account: $_"; exit 1 }

try {
    $asset = Invoke-API -Method POST -Path '/assets/create' -Token $token `
        -Body @{ name = "TestAsset_$stamp"; ticker = "TST_$stamp"; currency = "EUR"; type = "etf"; theme = "Test" }
    Log-OK "Asset id=$($asset.asset_id)"
} catch { Log-FAIL "Asset: $_"; exit 1 }

# ==========================================
Log-Step "3. Deposit cash"
# ==========================================
$today = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
try {
    Invoke-API -Method POST -Path '/transactions/create' -Token $token `
        -Body @{ account_id = $acc.account_id; date = $today; amount = $DEPOSIT; type = "income"; description = "Deposit"; category = "Deposito" } | Out-Null
    Log-OK "Deposited $DEPOSIT EUR"
} catch { Log-FAIL "Deposit: $_"; exit 1 }

# ==========================================
Log-Step "4. Buy trade (original)"
# ==========================================
$origCost = $BUY_QTY * $BUY_PRICE  # 1000
try {
    $trade = Invoke-API -Method POST -Path '/trades/create' -Token $token `
        -Body @{ asset_id = $asset.asset_id; account_id = $acc.account_id; date = $today; quantity = $BUY_QTY; price = $BUY_PRICE; fees = 0; operation_type = "buy" }
    Log-OK "Trade created id=$($trade.operation_id) cost=$origCost"
} catch { Log-FAIL "Trade create: $_"; exit 1 }

# ==========================================
Log-Step "5. Verify portfolio BEFORE update"
# ==========================================
try {
    $portBefore = Invoke-API -Method GET -Path '/portfolio/accounts' -Token $token
    $cashBefore = [math]::Round([double]$portBefore[0].cash_balance, 2)
    $investedBefore = [math]::Round([double]$portBefore[0].invested_value, 2)
    $expectedCash = $DEPOSIT - $origCost  # 4000
    Log-Info "cash_balance=$cashBefore (expected ~$expectedCash)"
    Log-Info "invested_value=$investedBefore (expected ~$origCost)"
    
    if ([math]::Abs($cashBefore - $expectedCash) -lt 5) { Log-OK "Cash before OK" }
    else { Log-FAIL "Cash before: got $cashBefore, expected ~$expectedCash" }
    
    if ([math]::Abs($investedBefore - $origCost) -lt 5) { Log-OK "Invested before OK" }
    else { Log-FAIL "Invested before: got $investedBefore, expected ~$origCost" }
} catch { Log-FAIL "Portfolio before: $_" }

# ==========================================
Log-Step "6. UPDATE trade (reduce qty, change price)"
# ==========================================
$updatedCost = $UPDATED_QTY * $UPDATED_PRICE  # 600
try {
    $updated = Invoke-API -Method PUT -Path "/trades/$($trade.operation_id)" -Token $token `
        -Body @{ quantity = $UPDATED_QTY; price = $UPDATED_PRICE }
    Log-OK "Trade updated: qty=$($updated.quantity) price=$($updated.price)"
} catch { Log-FAIL "Trade update: $_"; exit 1 }

# ==========================================
Log-Step "7. Verify portfolio AFTER update"
# ==========================================
try {
    $portAfter = Invoke-API -Method GET -Path '/portfolio/accounts' -Token $token
    $cashAfter = [math]::Round([double]$portAfter[0].cash_balance, 2)
    $investedAfter = [math]::Round([double]$portAfter[0].invested_value, 2)
    $totalAfter = [math]::Round([double]$portAfter[0].total_value, 2)
    $expectedCashAfter = $DEPOSIT - $updatedCost  # 4400
    
    # invested = qty * current_price (price_history keeps original price with ON CONFLICT DO NOTHING)
    $expectedInvested = $UPDATED_QTY * $BUY_PRICE
    $expectedTotal = $expectedCashAfter + $expectedInvested
    
    Log-Info "cash_balance=$cashAfter (expected ~$expectedCashAfter)"
    Log-Info "invested_value=$investedAfter (expected ~$expectedInvested)"
    Log-Info "total_value=$totalAfter (expected ~$expectedTotal)"
    
    # Cash should reflect the updated trade cost
    if ([math]::Abs($cashAfter - $expectedCashAfter) -lt 5) { Log-OK "Cash after update OK" }
    else { Log-FAIL "Cash after update: got $cashAfter, expected ~$expectedCashAfter (diff=$([math]::Abs($cashAfter - $expectedCashAfter)))" }
    
    # Invested should reflect updated qty * original price (DO NOTHING preserves original price)
    if ([math]::Abs($investedAfter - $expectedInvested) -lt 5) { Log-OK "Invested after update OK" }
    else { Log-FAIL "Invested after update: got $investedAfter, expected ~$expectedInvested (diff=$([math]::Abs($investedAfter - $expectedInvested)))" }
    
    # Total should be cash + invested
    if ([math]::Abs($totalAfter - $expectedTotal) -lt 5) { Log-OK "Total value consistent (~$expectedTotal)" }
    else { Log-FAIL "Total value: got $totalAfter, expected ~$expectedTotal (diff=$([math]::Abs($totalAfter - $expectedTotal)))" }
} catch { Log-FAIL "Portfolio after: $_" }

# ==========================================
Log-Step "8. Verify transactions reflect update"
# ==========================================
try {
    $txs = Invoke-API -Method GET -Path '/transactions/me' -Token $token
    $investTx = @($txs | Where-Object { $_.category -eq 'Inversión' })
    if ($investTx.Count -ge 1) {
        $txAmount = [math]::Round([double]$investTx[0].amount, 2)
        Log-Info "Investment transaction amount=$txAmount (expected ~$updatedCost)"
        if ([math]::Abs($txAmount - $updatedCost) -lt 5) { Log-OK "Transaction amount matches updated trade" }
        else { Log-FAIL "Transaction amount=$txAmount, expected ~$updatedCost" }
    } else {
        Log-FAIL "No investment transaction found"
    }
} catch { Log-FAIL "Transactions check: $_" }

# ==========================================
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Passed: $($script:Passed)" -ForegroundColor Green
if ($script:Failed -gt 0) {
    Write-Host "  Failed: $($script:Failed)" -ForegroundColor Red
    Write-Host "`nTRADE UPDATE TEST FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nTRADE UPDATE TEST PASSED" -ForegroundColor Green
    exit 0
}
