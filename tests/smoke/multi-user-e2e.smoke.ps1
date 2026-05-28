# Sprout - Multi-User E2E Smoke Test
# Tests the complete first-time user flow AND cross-user isolation:
# 1. User A: register, create accounts, create assets, deposit, buy trades, verify dashboard
# 2. User B: register, verify NO visibility of User A's assets
# 3. User B: create same asset (VWCE) → verify dedup (same asset_id)
# 4. User B: verify sees only VWCE (not User A's MSFT)
# 5. Verify accounts/trades isolation between users
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$BASE = if ($env:SPROUT_API_URL) { $env:SPROUT_API_URL } else { 'https://sprout-backend-production-3aff.up.railway.app/api/v1' }
$script:Passed = 0
$script:Failed = 0

function Log-Step([string]$msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Log-OK([string]$msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green; $script:Passed++ }
function Log-FAIL([string]$msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:Failed++ }
function Log-Info([string]$msg) { Write-Host "    -> $msg" -ForegroundColor Gray }

function Assert-Equal([string]$label, $actual, $expected) {
    if ("$actual" -eq "$expected") { Log-OK "$label = $actual" }
    else { Log-FAIL "$label expected=$expected actual=$actual" }
}
function Assert-GT([string]$label, [double]$actual, [double]$floor) {
    if ($actual -gt $floor) { Log-OK "$label = $actual (gt $floor)" }
    else { Log-FAIL "$label expected gt $floor, got $actual" }
}
function Assert-GTE([string]$label, [double]$actual, [double]$floor) {
    if ($actual -ge $floor) { Log-OK "$label = $actual (gte $floor)" }
    else { Log-FAIL "$label expected gte $floor, got $actual" }
}

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

# ---- Scenario data ----
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$EMAIL_A = "smoke_multiA_$stamp@example.com"
$EMAIL_B = "smoke_multiB_$stamp@example.com"
$PASS_A  = "PassA_${stamp}X!"
$PASS_B  = "PassB_${stamp}X!"

$DEPOSIT   = 5000
$PRICE_VWCE = 100
$PRICE_MSFT = 400
$QTY_VWCE   = 10
$QTY_MSFT   = 5

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Sprout Multi-User E2E Smoke Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Log-Info "User A: $EMAIL_A"
Log-Info "User B: $EMAIL_B"
Log-Info "Scenario: User A creates VWCE+MSFT, User B only sees what they create"

$tokenA = ''
$tokenB = ''
$accA   = $null
$vwceA  = $null
$msftA  = $null

# ==========================================
# PART 1: USER A - Full First-Time User Flow
# ==========================================

Log-Step "1. User A: Register"
try {
    $reg = Invoke-API -Method POST -Path '/auth/register' -Body @{ email=$EMAIL_A; password=$PASS_A }
    $tokenA = $reg.access_token
    Log-OK "User A registered"
} catch { Log-FAIL "User A register: $_"; exit 1 }

Log-Step "2. User A: Login (verify credentials work)"
try {
    $login = Invoke-API -Method POST -Path '/auth/login' -Body "username=$EMAIL_A&password=$PASS_A" -Form
    $tokenA = $login.access_token
    Log-OK "User A login OK"
} catch { Log-FAIL "User A login: $_"; exit 1 }

Log-Step "3. User A: Create account"
try {
    $accA = Invoke-API -Method POST -Path '/accounts/create' -Token $tokenA `
        -Body @{ name="Interactive Brokers E2E"; type="broker"; currency="EUR" }
    Log-OK "Account created: id=$($accA.account_id) name=$($accA.name)"
} catch { Log-FAIL "Account A: $_"; exit 1 }

Log-Step "4. User A: Create assets (VWCE + MSFT)"
try {
    $vwceA = Invoke-API -Method POST -Path '/assets/create' -Token $tokenA `
        -Body @{ name="Vanguard FTSE AllWorld"; ticker="VWCE"; isin="IE00BK5BQT80"; currency="EUR"; type="etf"; theme="Global" }
    Log-OK "Asset VWCE created: id=$($vwceA.asset_id) ticker=$($vwceA.ticker)"
} catch { Log-FAIL "Asset VWCE: $_"; exit 1 }

try {
    $msftA = Invoke-API -Method POST -Path '/assets/create' -Token $tokenA `
        -Body @{ name="Microsoft Corp"; ticker="MSFT"; currency="USD"; type="stock"; theme="Technology" }
    Log-OK "Asset MSFT created: id=$($msftA.asset_id) ticker=$($msftA.ticker)"
} catch { Log-FAIL "Asset MSFT: $_"; exit 1 }

Log-Step "5. User A: Verify /assets/with-prices shows both assets"
try {
    $assetsA = Invoke-API -Method GET -Path '/assets/with-prices' -Token $tokenA
    $assetsAList = @($assetsA)
    Assert-GTE "User A visible assets" $assetsAList.Count 2
    $vwceFound = @($assetsAList | Where-Object { $_.ticker -eq 'VWCE' })
    $msftFound = @($assetsAList | Where-Object { $_.ticker -eq 'MSFT' })
    if ($vwceFound.Count -gt 0) { Log-OK "User A sees VWCE" } else { Log-FAIL "User A missing VWCE in with-prices" }
    if ($msftFound.Count -gt 0) { Log-OK "User A sees MSFT" } else { Log-FAIL "User A missing MSFT in with-prices" }
} catch { Log-FAIL "User A assets/with-prices: $_" }

Log-Step "6. User A: Deposit cash"
$today = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
try {
    $txDeposit = Invoke-API -Method POST -Path '/transactions/create' -Token $tokenA `
        -Body @{ account_id=$accA.account_id; date=$today; amount=$DEPOSIT; type="income"; description="Deposito inicial"; category="Deposito" }
    Log-OK "Deposited $DEPOSIT EUR, tx_id=$($txDeposit.transaction_id)"
} catch { Log-FAIL "Deposit A: $_"; exit 1 }

Log-Step "7. User A: Buy trades (VWCE + MSFT)"
try {
    $trade1 = Invoke-API -Method POST -Path '/trades/create' -Token $tokenA `
        -Body @{ asset_id=$vwceA.asset_id; account_id=$accA.account_id; date=$today; quantity=$QTY_VWCE; price=$PRICE_VWCE; fees=1; operation_type="buy" }
    Log-OK "Trade: BUY ${QTY_VWCE}x VWCE @ $PRICE_VWCE op_id=$($trade1.operation_id)"
} catch { Log-FAIL "Trade VWCE: $_" }

try {
    $trade2 = Invoke-API -Method POST -Path '/trades/create' -Token $tokenA `
        -Body @{ asset_id=$msftA.asset_id; account_id=$accA.account_id; date=$today; quantity=$QTY_MSFT; price=$PRICE_MSFT; fees=1; operation_type="buy" }
    Log-OK "Trade: BUY ${QTY_MSFT}x MSFT @ $PRICE_MSFT op_id=$($trade2.operation_id)"
} catch { Log-FAIL "Trade MSFT: $_" }

Log-Step "8. User A: Verify portfolio/accounts (cash + invested)"
$expCash = $DEPOSIT - ($QTY_VWCE * $PRICE_VWCE + 1) - ($QTY_MSFT * $PRICE_MSFT + 1)
$expInvested = ($QTY_VWCE * $PRICE_VWCE) + ($QTY_MSFT * $PRICE_MSFT)
Log-Info "Expected: cash=$expCash invested=$expInvested"
try {
    $portA = Invoke-API -Method GET -Path '/portfolio/accounts' -Token $tokenA
    $portAList = @($portA)
    Assert-GTE "Portfolio accounts count" $portAList.Count 1
    $cashA = [math]::Round([double]$portAList[0].cash_balance, 2)
    $invA  = [math]::Round([double]$portAList[0].invested_value, 2)
    $totA  = [math]::Round([double]$portAList[0].total_value, 2)
    Log-Info "Actual: cash=$cashA invested=$invA total=$totA"
    Assert-GT "cash_balance" $cashA 0
    Assert-GT "invested_value" $invA 0
    Assert-GT "total_value" $totA 0
    # Cash should match deposit minus cost of trades (within tolerance for fees rounding)
    if ([math]::Abs($cashA - $expCash) -lt 5) { Log-OK "Cash balance matches expected ($cashA ~ $expCash)" }
    else { Log-FAIL "Cash mismatch: got=$cashA expected=$expCash" }
} catch { Log-FAIL "Portfolio accounts A: $_" }

Log-Step "9. User A: Verify portfolio/assets/all (positions)"
try {
    $posA = Invoke-API -Method GET -Path '/portfolio/assets/all' -Token $tokenA
    $posAList = @($posA)
    Assert-GTE "Asset positions count" $posAList.Count 2
    $vwcePos = @($posAList | Where-Object { $_.ticker -eq 'VWCE' })
    $msftPos = @($posAList | Where-Object { $_.ticker -eq 'MSFT' })
    if ($vwcePos.Count -gt 0) {
        Assert-Equal "VWCE quantity" ([math]::Round([double]$vwcePos[0].quantity, 0)) $QTY_VWCE
    } else { Log-FAIL "VWCE not in positions" }
    if ($msftPos.Count -gt 0) {
        Assert-Equal "MSFT quantity" ([math]::Round([double]$msftPos[0].quantity, 0)) $QTY_MSFT
    } else { Log-FAIL "MSFT not in positions" }
} catch { Log-FAIL "Portfolio assets/all A: $_" }

Log-Step "10. User A: Verify performance endpoint"
try {
    $perfA = Invoke-API -Method GET -Path '/portfolio/performance' -Token $tokenA
    $hasTotalPct = $null -ne $perfA.total.pct
    $hasTotalAbs = $null -ne $perfA.total.abs
    if ($hasTotalPct -and $hasTotalAbs) { Log-OK "Performance returns numeric values (total.pct=$($perfA.total.pct), total.abs=$($perfA.total.abs))" }
    else { Log-FAIL "Performance missing fields" }
} catch { Log-FAIL "Performance A: $_" }

Log-Step "11. User A: Verify trade history"
try {
    $histA = Invoke-API -Method GET -Path '/trades/history' -Token $tokenA
    $histAList = @($histA)
    Assert-GTE "Trade history count" $histAList.Count 2
    Log-OK "Trade history shows $($histAList.Count) trades"
} catch { Log-FAIL "Trade history A: $_" }

Log-Step "12. User A: Verify transactions list"
try {
    $txsA = Invoke-API -Method GET -Path '/transactions/me' -Token $tokenA
    $txsAList = @($txsA)
    # Should have deposit + 2 investment transactions
    Assert-GTE "Transactions count" $txsAList.Count 3
    Log-Info "Transactions: $($txsAList.Count) total"
} catch { Log-FAIL "Transactions A: $_" }

# ==========================================
# PART 2: USER B - Isolation Verification
# ==========================================

Log-Step "13. User B: Register"
try {
    $regB = Invoke-API -Method POST -Path '/auth/register' -Body @{ email=$EMAIL_B; password=$PASS_B }
    $tokenB = $regB.access_token
    Log-OK "User B registered"
} catch { Log-FAIL "User B register: $_"; exit 1 }

Log-Step "14. User B: /assets/with-prices should be EMPTY (no visibility yet)"
try {
    $assetsBEmpty = Invoke-API -Method GET -Path '/assets/with-prices' -Token $tokenB
    $assetsBList = @($assetsBEmpty)
    Assert-Equal "User B visible assets (before creating)" $assetsBList.Count 0
} catch { Log-FAIL "User B assets/with-prices empty check: $_" }

Log-Step "15. User B: /accounts/user-accounts should be empty"
try {
    $accsB = Invoke-API -Method GET -Path '/accounts/user-accounts' -Token $tokenB
    $accsBList = @($accsB)
    Assert-Equal "User B accounts" $accsBList.Count 0
} catch { Log-FAIL "User B accounts: $_" }

Log-Step "16. User B: /trades/history should be empty"
try {
    $histB = Invoke-API -Method GET -Path '/trades/history' -Token $tokenB
    $histBList = @($histB)
    Assert-Equal "User B trade history" $histBList.Count 0
} catch { Log-FAIL "User B trades: $_" }

Log-Step "17. User B: /transactions/me should be empty"
try {
    $txsB = Invoke-API -Method GET -Path '/transactions/me' -Token $tokenB
    $txsBList = @($txsB)
    Assert-Equal "User B transactions" $txsBList.Count 0
} catch { Log-FAIL "User B transactions: $_" }

Log-Step "18. User B: Create SAME asset VWCE (test dedup + visibility grant)"
try {
    $vwceB = Invoke-API -Method POST -Path '/assets/create' -Token $tokenB `
        -Body @{ name="Vanguard FTSE AllWorld"; ticker="VWCE"; isin="IE00BK5BQT80"; currency="EUR"; type="etf"; theme="Global" }
    # Should get same asset_id as User A's VWCE (dedup)
    Assert-Equal "VWCE dedup - same asset_id" $vwceB.asset_id $vwceA.asset_id
    Log-OK "Dedup works: User B got existing VWCE (id=$($vwceB.asset_id))"
} catch { Log-FAIL "User B create VWCE (dedup): $_" }

Log-Step "19. User B: /assets/with-prices now shows ONLY VWCE (not MSFT)"
try {
    $assetsBAfter = Invoke-API -Method GET -Path '/assets/with-prices' -Token $tokenB
    $assetsBAfterList = @($assetsBAfter)
    Assert-Equal "User B visible assets after creating VWCE" $assetsBAfterList.Count 1
    if ($assetsBAfterList.Count -gt 0) {
        Assert-Equal "User B sees ticker" $assetsBAfterList[0].ticker "VWCE"
    }
    # Verify MSFT is NOT visible
    $msftVisible = @($assetsBAfterList | Where-Object { $_.ticker -eq 'MSFT' })
    Assert-Equal "User B cannot see MSFT" $msftVisible.Count 0
} catch { Log-FAIL "User B assets isolation: $_" }

Log-Step "20. User A: Still sees both assets (unchanged)"
try {
    $assetsAFinal = Invoke-API -Method GET -Path '/assets/with-prices' -Token $tokenA
    $assetsAFinalList = @($assetsAFinal)
    Assert-GTE "User A still sees both" $assetsAFinalList.Count 2
} catch { Log-FAIL "User A final check: $_" }

# ==========================================
# PART 3: USER B - Full Flow (account + trade)
# ==========================================

Log-Step "21. User B: Create account + deposit + trade (using shared VWCE)"
try {
    $accB = Invoke-API -Method POST -Path '/accounts/create' -Token $tokenB `
        -Body @{ name="Degiro E2E"; type="broker"; currency="EUR" }
    Log-OK "User B account: id=$($accB.account_id)"
} catch { Log-FAIL "User B account: $_"; exit 1 }

try {
    Invoke-API -Method POST -Path '/transactions/create' -Token $tokenB `
        -Body @{ account_id=$accB.account_id; date=$today; amount=2000; type="income"; description="Deposito B"; category="Deposito" } | Out-Null
    Log-OK "User B deposited 2000 EUR"
} catch { Log-FAIL "User B deposit: $_" }

try {
    $tradeB = Invoke-API -Method POST -Path '/trades/create' -Token $tokenB `
        -Body @{ asset_id=$vwceB.asset_id; account_id=$accB.account_id; date=$today; quantity=3; price=$PRICE_VWCE; fees=0.5; operation_type="buy" }
    Log-OK "User B trade: BUY 3x VWCE op_id=$($tradeB.operation_id)"
} catch { Log-FAIL "User B trade: $_" }

Log-Step "22. User B: Verify portfolio shows only their data"
try {
    $portB = Invoke-API -Method GET -Path '/portfolio/accounts' -Token $tokenB
    $portBList = @($portB)
    Assert-Equal "User B portfolio accounts" $portBList.Count 1
    $cashB = [math]::Round([double]$portBList[0].cash_balance, 2)
    $invB  = [math]::Round([double]$portBList[0].invested_value, 2)
    Log-Info "User B: cash=$cashB invested=$invB"
    # Expected: 2000 - (3*100 + 0.5) = 1699.5 cash, 300 invested
    $expCashB = 2000 - (3 * $PRICE_VWCE + 0.5)
    if ([math]::Abs($cashB - $expCashB) -lt 2) { Log-OK "User B cash correct ($cashB ~ $expCashB)" }
    else { Log-FAIL "User B cash: got=$cashB expected=$expCashB" }
} catch { Log-FAIL "User B portfolio: $_" }

Log-Step "23. Cross-check: User A portfolio unchanged by User B activity"
try {
    $portAFinal = Invoke-API -Method GET -Path '/portfolio/accounts' -Token $tokenA
    $portAFinalList = @($portAFinal)
    $cashAFinal = [math]::Round([double]$portAFinalList[0].cash_balance, 2)
    $invAFinal  = [math]::Round([double]$portAFinalList[0].invested_value, 2)
    Log-Info "User A final: cash=$cashAFinal invested=$invAFinal"
    if ([math]::Abs($cashAFinal - $expCash) -lt 5) { Log-OK "User A cash unchanged" }
    else { Log-FAIL "User A cash changed: was=$expCash now=$cashAFinal" }
} catch { Log-FAIL "User A final portfolio: $_" }

# ==========================================
# RESULTS
# ==========================================
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Passed: $($script:Passed)" -ForegroundColor Green
if ($script:Failed -gt 0) {
    Write-Host "  Failed: $($script:Failed)" -ForegroundColor Red
    Write-Host ""
    Write-Host "MULTI-USER E2E FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "MULTI-USER E2E ALL PASSED" -ForegroundColor Green
    exit 0
}
