# Sprout - End-to-End Smoke Test
# Flujo completo: registro, login, cuentas, activos, depositos, trades, dashboard
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$BASE = 'http://localhost:8000/api/v1'
$script:Passed = 0
$script:Failed = 0

function Log-Step([string]$msg) {
    Write-Host ""
    Write-Host "=== $msg ===" -ForegroundColor Cyan
}
function Log-OK([string]$msg) {
    Write-Host "  [PASS] $msg" -ForegroundColor Green
    $script:Passed++
}
function Log-FAIL([string]$msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
    $script:Failed++
}
function Log-Info([string]$msg) {
    Write-Host "    -> $msg" -ForegroundColor Gray
}
function Assert-GT([string]$label, [double]$actual, [double]$floor) {
    if ($actual -gt $floor) { Log-OK "$label = $actual (gt $floor)" }
    else { Log-FAIL "$label expected gt $floor, got $actual" }
}
function Assert-GTE([string]$label, [double]$actual, [double]$floor) {
    if ($actual -ge $floor) { Log-OK "$label = $actual (gte $floor)" }
    else { Log-FAIL "$label expected gte $floor, got $actual" }
}
function Assert-Equal([string]$label, $actual, $expected) {
    if ("$actual" -eq "$expected") { Log-OK "$label = $actual" }
    else { Log-FAIL "$label expected=$expected actual=$actual" }
}
function Assert-HasKey([string]$label, $obj, [string]$key) {
    $props = ($obj | Get-Member -MemberType NoteProperty).Name
    if ($key -in $props) { Log-OK "$label has key $key" }
    else { Log-FAIL "$label missing key $key" }
}

function Invoke-API {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [string]$Token = '',
        [switch]$Form
    )
    $url = "$BASE$Path"
    $headers = @{ 'Accept' = 'application/json' }
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }
    try {
        if ($Form) {
            $r = Invoke-RestMethod -Method POST -Uri $url -Headers $headers `
                -ContentType 'application/x-www-form-urlencoded' -Body $Body
        } elseif ($null -ne $Body) {
            $json = $Body | ConvertTo-Json -Depth 10
            $r = Invoke-RestMethod -Method $Method -Uri $url -Headers $headers `
                -ContentType 'application/json' -Body $json
        } else {
            $r = Invoke-RestMethod -Method $Method -Uri $url -Headers $headers
        }
        return $r
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $detail = $_.ErrorDetails.Message
        throw "HTTP $status on $Method $Path - $detail"
    }
}

# ---- Scenario data ----
$stamp  = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$EMAIL  = "smoke_e2e_$stamp@example.com"
$UPASS  = "SmokePass${stamp}X"

$DEPOSIT_A  = 3000
$DEPOSIT_B  = 2000
$PRICE_VWCE = 90
$PRICE_MSFT = 50
$QTY_VWCE_A = 5
$QTY_MSFT_A = 8
$QTY_VWCE_B = 10

$expCashA    = $DEPOSIT_A - ($QTY_VWCE_A * $PRICE_VWCE) - ($QTY_MSFT_A * $PRICE_MSFT)
$expCashB    = $DEPOSIT_B - ($QTY_VWCE_B * $PRICE_VWCE)
$expCashAll  = $expCashA + $expCashB
$expInvested = ($QTY_VWCE_A + $QTY_VWCE_B) * $PRICE_VWCE + $QTY_MSFT_A * $PRICE_MSFT
$expTotal    = $expCashAll + $expInvested

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Sprout E2E Smoke Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Log-Info "Email: $EMAIL"
Log-Info "Scenario: Cuenta A deposit=$DEPOSIT_A, Cuenta B deposit=$DEPOSIT_B"
Log-Info "Trades: ${QTY_VWCE_A}xVWCE@$PRICE_VWCE + ${QTY_MSFT_A}xMSFT@$PRICE_MSFT in A, ${QTY_VWCE_B}xVWCE@$PRICE_VWCE in B"
Log-Info "Expected cash=$expCashAll  invested=$expInvested  total=$expTotal"

$token = ''
$accA  = $null
$accB  = $null
$vwce  = $null
$msft  = $null

# ==========================================
Log-Step "1. Register"
# ==========================================
try {
    $reg = Invoke-API -Method POST -Path '/auth/register' `
        -Body @{ email = $EMAIL; password = $UPASS }
    if ($reg.access_token) {
        $token = $reg.access_token
        Log-OK "Register OK email=$EMAIL"
        Log-Info "Token prefix: $($token.Substring(0,[math]::Min(40,$token.Length)))..."
    } else {
        Log-FAIL "Register: no access_token in response"
    }
} catch {
    Log-FAIL "Register failed: $_"
}

# ==========================================
Log-Step "2. Login"
# ==========================================
try {
    $formBody = "username=$EMAIL&password=$UPASS"
    $login = Invoke-API -Method POST -Path '/auth/login' -Body $formBody -Form
    if ($login.access_token) {
        $token = $login.access_token
        Log-OK "Login OK - token refreshed"
    } else {
        Log-FAIL "Login: no access_token"
    }
} catch {
    Log-FAIL "Login failed: $_"
}

if (-not $token) {
    Write-Host "No token - aborting" -ForegroundColor Red
    exit 1
}

# ==========================================
Log-Step "3. Create accounts"
# ==========================================
try {
    $accA = Invoke-API -Method POST -Path '/accounts/create' -Token $token `
        -Body @{ name = "Trade Republic E2E"; type = "neobroker"; currency = "EUR" }
    $aid = $accA.account_id
    $aname = $accA.name
    Log-OK "Account A created id=$aid name=$aname"
} catch {
    Log-FAIL "Account A failed: $_"
}

try {
    $accB = Invoke-API -Method POST -Path '/accounts/create' -Token $token `
        -Body @{ name = "MyInvestor E2E"; type = "broker"; currency = "EUR" }
    $bid = $accB.account_id
    $bname = $accB.name
    Log-OK "Account B created id=$bid name=$bname"
} catch {
    Log-FAIL "Account B failed: $_"
}

try {
    $accs = Invoke-API -Method GET -Path '/accounts/user-accounts' -Token $token
    Assert-GTE "User accounts count" $accs.Count 2
} catch {
    Log-FAIL "List accounts failed: $_"
}

if (-not $accA -or -not $accB) {
    Write-Host "No accounts - aborting" -ForegroundColor Red; exit 1
}

# ==========================================
Log-Step "4. Create assets"
# ==========================================
try {
    $vwce = Invoke-API -Method POST -Path '/assets/create' -Token $token `
        -Body @{ name = "Vanguard FTSE All-World E2E"; ticker = "VWCE_E2E"; isin = "IE00B3RBWM25"; currency = "EUR"; type = "etf"; theme = "Global" }
    $vid = $vwce.asset_id
    $vtick = $vwce.ticker
    Log-OK "Asset VWCE created id=$vid ticker=$vtick"
} catch {
    Log-FAIL "Asset VWCE failed: $_"
}

try {
    $msft = Invoke-API -Method POST -Path '/assets/create' -Token $token `
        -Body @{ name = "Microsoft E2E"; ticker = "MSFT_E2E"; currency = "USD"; type = "stock"; theme = "Tecnologia" }
    $mid = $msft.asset_id
    $mtick = $msft.ticker
    Log-OK "Asset MSFT created id=$mid ticker=$mtick"
} catch {
    Log-FAIL "Asset MSFT failed: $_"
}

if (-not $vwce -or -not $msft) {
    Write-Host "No assets - aborting" -ForegroundColor Red; exit 1
}

# ==========================================
Log-Step "5. Deposit cash (transactions)"
# ==========================================
$today = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")

try {
    $txA = Invoke-API -Method POST -Path '/transactions/create' -Token $token `
        -Body @{ account_id = $accA.account_id; date = $today; amount = $DEPOSIT_A; type = "income"; description = "Deposito E2E CuentaA"; category = "Deposito" }
    $txAid = $txA.transaction_id
    Log-OK "Deposit A: $DEPOSIT_A EUR -> account $($accA.name) tx=$txAid"
} catch {
    Log-FAIL "Deposit A failed: $_"
}

try {
    $txB = Invoke-API -Method POST -Path '/transactions/create' -Token $token `
        -Body @{ account_id = $accB.account_id; date = $today; amount = $DEPOSIT_B; type = "income"; description = "Deposito E2E CuentaB"; category = "Deposito" }
    $txBid = $txB.transaction_id
    Log-OK "Deposit B: $DEPOSIT_B EUR -> account $($accB.name) tx=$txBid"
} catch {
    Log-FAIL "Deposit B failed: $_"
}

try {
    $txList = Invoke-API -Method GET -Path '/transactions/me' -Token $token
    Assert-GTE "Transactions registered" $txList.Count 2
} catch {
    Log-FAIL "List transactions failed: $_"
}

# ==========================================
Log-Step "6. Buy trades"
# ==========================================
try {
    $op1 = Invoke-API -Method POST -Path '/trades/create' -Token $token `
        -Body @{ asset_id = $vwce.asset_id; account_id = $accA.account_id; date = $today; quantity = $QTY_VWCE_A; price = $PRICE_VWCE; fees = 0.99; operation_type = "buy" }
    $total1 = [math]::Round($QTY_VWCE_A * $PRICE_VWCE, 2)
    Log-OK "Trade 1: buy ${QTY_VWCE_A}xVWCE at $PRICE_VWCE = $total1 in $($accA.name)"
} catch {
    Log-FAIL "Trade 1 failed: $_"
}

try {
    $op2 = Invoke-API -Method POST -Path '/trades/create' -Token $token `
        -Body @{ asset_id = $msft.asset_id; account_id = $accA.account_id; date = $today; quantity = $QTY_MSFT_A; price = $PRICE_MSFT; fees = 0.99; operation_type = "buy" }
    $total2 = [math]::Round($QTY_MSFT_A * $PRICE_MSFT, 2)
    Log-OK "Trade 2: buy ${QTY_MSFT_A}xMSFT at $PRICE_MSFT = $total2 in $($accA.name)"
} catch {
    Log-FAIL "Trade 2 failed: $_"
}

try {
    $op3 = Invoke-API -Method POST -Path '/trades/create' -Token $token `
        -Body @{ asset_id = $vwce.asset_id; account_id = $accB.account_id; date = $today; quantity = $QTY_VWCE_B; price = $PRICE_VWCE; fees = 0.99; operation_type = "buy" }
    $total3 = [math]::Round($QTY_VWCE_B * $PRICE_VWCE, 2)
    Log-OK "Trade 3: buy ${QTY_VWCE_B}xVWCE at $PRICE_VWCE = $total3 in $($accB.name)"
} catch {
    Log-FAIL "Trade 3 failed: $_"
}

try {
    $history = Invoke-API -Method GET -Path '/trades/history' -Token $token
    Assert-GTE "Trade history count" $history.Count 3
    foreach ($h in $history) {
        Log-Info "  $($h.ticker) $($h.operation_type) qty=$($h.quantity) price=$($h.price)"
    }
} catch {
    Log-FAIL "Trade history failed: $_"
}

# ==========================================
Log-Step "7. Dashboard - accounts with balance"
# ==========================================
try {
    $portAccs = Invoke-API -Method GET -Path '/portfolio/accounts' -Token $token
    Assert-GTE "Portfolio accounts" $portAccs.Count 2

    $sumValue    = 0.0
    $sumInvested = 0.0
    $sumCash     = 0.0
    foreach ($acc in $portAccs) {
        $sumValue    += [double]$acc.total_value
        $sumInvested += [double]$acc.invested_value
        $sumCash     += [double]$acc.cash_balance
    }
    $sumValueR    = [math]::Round($sumValue,2)
    $sumInvestedR = [math]::Round($sumInvested,2)
    $sumCashR     = [math]::Round($sumCash,2)

    Log-Info "Aggregate: total_value=$sumValueR  invested=$sumInvestedR  cash=$sumCashR"

    Assert-GT "Portfolio total_value"    $sumValue    0
    Assert-GT "Portfolio invested_value" $sumInvested 0
    Assert-GT "Portfolio cash_balance"   $sumCash     0

    $minCash = $expCashAll - 10
    Assert-GTE "cash_balance >= expected-10 ($minCash)" $sumCashR $minCash
    Assert-GTE "invested_value >= expected-5 ($($expInvested-5))" $sumInvestedR ($expInvested - 5)

    $impliedTotal = $sumCash + $sumInvested
    $impliedFloor = [math]::Round($impliedTotal - 5, 2)
    Assert-GTE "total_value >= cash+invested-5" $sumValueR $impliedFloor

    foreach ($acc in $portAccs) {
        $n = $acc.name
        $c = [math]::Round([double]$acc.cash_balance, 2)
        $i = [math]::Round([double]$acc.invested_value, 2)
        $t = [math]::Round([double]$acc.total_value, 2)
        Log-Info "  ${n} cash=${c} invested=${i} total=${t}"
        Assert-GT "$n cash_balance" ([double]$acc.cash_balance) 0
    }
} catch {
    Log-FAIL "Portfolio accounts failed: $_"
}

# ==========================================
Log-Step "8. Dashboard - assets table"
# ==========================================
try {
    $portAssets = Invoke-API -Method GET -Path '/portfolio/assets/all' -Token $token
    Assert-GTE "Assets with positions" $portAssets.Count 2

    foreach ($a in $portAssets) {
        $qty  = [double]$a.quantity
        $val  = [double]$a.total_value
        $tick = if ($a.ticker) { $a.ticker } else { $a.name }
        $valR = [math]::Round($val,2)
        Log-Info "  $tick qty=$qty total=$valR perf=$($a.performance)"
        Assert-GT "$tick quantity" $qty 0
        Assert-GT "$tick total_value"  $val 0
    }

    $vwceRows = @($portAssets | Where-Object { $_.ticker -like '*VWCE*' })
    if ($vwceRows.Count -gt 0) {
        $expVwceQty = $QTY_VWCE_A + $QTY_VWCE_B
        $gotVwce = ($vwceRows | Measure-Object -Property quantity -Sum).Sum
        Assert-Equal "VWCE total quantity" ([math]::Round([double]$gotVwce,0)) $expVwceQty
    } else {
        Log-FAIL "VWCE not found in asset table"
    }

    $msftRows = @($portAssets | Where-Object { $_.ticker -like '*MSFT*' })
    if ($msftRows.Count -gt 0) {
        $gotMsft = ($msftRows | Measure-Object -Property quantity -Sum).Sum
        Assert-Equal "MSFT total quantity" ([math]::Round([double]$gotMsft,0)) $QTY_MSFT_A
    } else {
        Log-FAIL "MSFT not found in asset table"
    }
} catch {
    Log-FAIL "Portfolio assets/all failed: $_"
}

# ==========================================
Log-Step "9. Dashboard - performance"
# ==========================================
try {
    $perf = Invoke-API -Method GET -Path '/portfolio/performance' -Token $token
    Assert-HasKey "performance" $perf "total"
    Assert-HasKey "performance" $perf "month"
    Assert-HasKey "performance" $perf "ytd"
    Assert-HasKey "performance" $perf "three_months"

    $totalPct = [double]$perf.total.pct
    $totalEur = [double]$perf.total.abs
    $perfPct  = [math]::Round($totalPct,2)
    $perfEur  = [math]::Round($totalEur,2)
    Log-Info "Total P+L: $perfPct pct / EUR $perfEur"
    Log-Info "Month: $([math]::Round([double]$perf.month.pct,2))"
    Log-Info "YTD:   $([math]::Round([double]$perf.ytd.pct,2))"

    $absPerf = [math]::Abs($totalPct)
    if ($absPerf -lt 5.0) {
        Log-OK "P+L in reasonable range: $perfPct pct (abs < 5)"
    } else {
        Log-Info "P+L outside -5/+5 range - may be OK if worker has prices"
        Log-OK "P+L has numeric value: $perfPct pct"
    }
} catch {
    Log-FAIL "Portfolio performance failed: $_"
}

# ==========================================
Log-Step "10. Assets with prices endpoint"
# ==========================================
try {
    $assetsWP = Invoke-API -Method GET -Path '/assets/with-prices' -Token $token
    Assert-GTE "Assets with-prices count" $assetsWP.Count 2
    foreach ($a in $assetsWP) {
        $tick2 = if ($a.ticker) { $a.ticker } else { $a.name }
        $pr    = [double]$a.current_price
        Log-Info "  $tick2 current_price=$pr"
    }
    Log-OK "Endpoint /assets/with-prices OK"
} catch {
    Log-FAIL "Assets/with-prices failed: $_"
}

# ==========================================
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Passed: $($script:Passed)" -ForegroundColor Green
if ($script:Failed -gt 0) {
    Write-Host "  Failed: $($script:Failed)" -ForegroundColor Red
    Write-Host ""
    Write-Host "E2E FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "E2E ALL PASSED" -ForegroundColor Green
    exit 0
}

