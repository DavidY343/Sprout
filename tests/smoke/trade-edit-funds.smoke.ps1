#!/usr/bin/env pwsh
# Smoke test: Trade edit insufficient funds & KPI consistency
# Verifies:
# 1. Editing a trade beyond available funds is rejected
# 2. After a valid trade edit, KPI profit == asset table profit (no discrepancy)
# 3. Transaction description updates on trade edit

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$API = "https://sprout-backend-production-3aff.up.railway.app/api/v1"

function Get-Token {
    param([string]$Email, [string]$Password)
    $body = "username=$Email&password=$Password"
    $r = Invoke-RestMethod "$API/auth/login" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"
    return $r.access_token
}

$pass = 0; $fail = 0

# --- Setup: create a test user ---
$uid = [guid]::NewGuid().ToString().Substring(0,8)
$email = "smoke-funds-$uid@test.com"
$password = "TestPass123!"

Write-Host "`n=== Trade Edit Funds & KPI Consistency Smoke Test ===" -ForegroundColor Cyan

# Register
try {
    $reg = Invoke-RestMethod "$API/auth/register" -Method POST -ContentType "application/json" `
        -Body (@{email=$email; password=$password} | ConvertTo-Json)
    Write-Host "[PASS] 1. User registered" -ForegroundColor Green; $pass++
} catch { Write-Host "[FAIL] 1. Register: $_" -ForegroundColor Red; $fail++; exit 1 }

$token = Get-Token -Email $email -Password $password
$headers = @{ Authorization = "Bearer $token" }

# Create account
try {
    $acct = Invoke-RestMethod "$API/accounts/create" -Method POST -Headers $headers -ContentType "application/json" `
        -Body (@{name="Test Account"; type="broker"; currency="EUR"} | ConvertTo-Json)
    Write-Host "[PASS] 2. Account created (id=$($acct.account_id))" -ForegroundColor Green; $pass++
} catch { Write-Host "[FAIL] 2. Account: $_" -ForegroundColor Red; $fail++; exit 1 }

# Deposit 500€
try {
    $dep = Invoke-RestMethod "$API/transactions/create" -Method POST -Headers $headers -ContentType "application/json" `
        -Body (@{account_id=$acct.account_id; amount=500; type="income"; category="Depósito"; description="Initial deposit"; date=(Get-Date -Format "yyyy-MM-dd")} | ConvertTo-Json)
    Write-Host "[PASS] 3. Deposit 500€" -ForegroundColor Green; $pass++
} catch { Write-Host "[FAIL] 3. Deposit: $_" -ForegroundColor Red; $fail++; exit 1 }

# Create asset
try {
    $asset = Invoke-RestMethod "$API/assets/create" -Method POST -Headers $headers -ContentType "application/json" `
        -Body (@{ticker="AAPL"; name="Apple Inc"; isin="US0378331005"; currency="EUR"; type="stock"} | ConvertTo-Json)
    Write-Host "[PASS] 4. Asset created (id=$($asset.asset_id))" -ForegroundColor Green; $pass++
} catch { Write-Host "[FAIL] 4. Asset: $_" -ForegroundColor Red; $fail++; exit 1 }

# Create trade: BUY 2 @ 100€ = 200€ (cash remains 300€)
try {
    $trade = Invoke-RestMethod "$API/trades/create" -Method POST -Headers $headers -ContentType "application/json" `
        -Body (@{asset_id=$asset.asset_id; account_id=$acct.account_id; date=(Get-Date -Format "yyyy-MM-dd"); quantity=2; price=100; fees=0; operation_type="buy"} | ConvertTo-Json)
    Write-Host "[PASS] 5. Trade created: BUY 2 @ 100€" -ForegroundColor Green; $pass++
} catch { Write-Host "[FAIL] 5. Trade: $_" -ForegroundColor Red; $fail++; exit 1 }

# --- Test 6: Edit trade to BUY 4 @ 100 = 400€ (cash would be 100€, OK) ---
try {
    $edited = Invoke-RestMethod "$API/trades/$($trade.operation_id)" -Method PUT -Headers $headers -ContentType "application/json" `
        -Body (@{quantity=4; price=100} | ConvertTo-Json)
    if ([math]::Abs($edited.quantity - 4) -lt 0.001) {
        Write-Host "[PASS] 6. Trade edited to qty=4 (valid, cash=100€)" -ForegroundColor Green; $pass++
    } else {
        Write-Host "[FAIL] 6. Unexpected qty: $($edited.quantity)" -ForegroundColor Red; $fail++
    }
} catch { Write-Host "[FAIL] 6. Edit trade: $_" -ForegroundColor Red; $fail++ }

# --- Test 7: Edit trade to BUY 6 @ 100 = 600€ (cash would be -100€, REJECTED) ---
try {
    $rejected = Invoke-RestMethod "$API/trades/$($trade.operation_id)" -Method PUT -Headers $headers -ContentType "application/json" `
        -Body (@{quantity=6; price=100} | ConvertTo-Json)
    Write-Host "[FAIL] 7. Should have been rejected (insufficient funds) but got 200" -ForegroundColor Red; $fail++
} catch {
    $errMsg = $_.Exception.Message
    if ($errMsg -match "400" -or $errMsg -match "[Ff]ondos" -or $errMsg -match "[Ii]nsuficien") {
        Write-Host "[PASS] 7. Trade edit rejected: insufficient funds" -ForegroundColor Green; $pass++
    } else {
        Write-Host "[FAIL] 7. Unexpected error: $errMsg" -ForegroundColor Red; $fail++
    }
}

# --- Test 8: Verify KPI profit == asset table profit ---
try {
    # Get accounts (has cash_balance and invested_value)
    $accounts = Invoke-RestMethod "$API/portfolio/accounts" -Method GET -Headers $headers
    $cashBalance = $accounts[0].cash_balance
    $investedValue = $accounts[0].invested_value

    # Get assets with prices (has market value)
    $assets = Invoke-RestMethod "$API/assets/with-prices" -Method GET -Headers $headers
    $assetRow = $assets | Where-Object { $_.asset_id -eq $asset.asset_id }
    
    # Asset table profit = (current_price - buy_price) * qty
    # Since we just created the asset with price=100 and no worker has run, current_price should be 100
    $currentPrice = $assetRow.current_price
    $qty = 4  # after the successful edit
    $assetProfit = ($currentPrice - 100) * $qty
    
    # KPI profit = total_portfolio - capital_deposited
    # total_portfolio = market_value_assets + cash
    $totalPortfolio = ($currentPrice * $qty) + $cashBalance
    $kpiProfit = $totalPortfolio - 500  # 500 was the deposit

    $diff = [Math]::Abs($assetProfit - $kpiProfit)
    if ($diff -lt 0.02) {
        Write-Host "[PASS] 8. KPI profit ($([Math]::Round($kpiProfit,2))) == Asset profit ($([Math]::Round($assetProfit,2)))" -ForegroundColor Green; $pass++
    } else {
        Write-Host "[FAIL] 8. KPI discrepancy: asset_profit=$([Math]::Round($assetProfit,2)) kpi_profit=$([Math]::Round($kpiProfit,2)) diff=$([Math]::Round($diff,2))" -ForegroundColor Red
        Write-Host "       cash=$cashBalance currentPrice=$currentPrice qty=$qty" -ForegroundColor Yellow
        $fail++
    }
} catch { Write-Host "[FAIL] 8. KPI check: $_" -ForegroundColor Red; $fail++ }

# --- Test 9: Verify transaction description was updated ---
try {
    $txns = Invoke-RestMethod "$API/transactions/me" -Method GET -Headers $headers
    $investTx = $txns | Where-Object { $_.category -eq "Inversión" } | Select-Object -First 1
    if ($investTx.description -match "BUY 4") {
        Write-Host "[PASS] 9. Transaction description updated to 'BUY 4...'" -ForegroundColor Green; $pass++
    } else {
        Write-Host "[FAIL] 9. Description not updated: '$($investTx.description)'" -ForegroundColor Red; $fail++
    }
} catch { Write-Host "[FAIL] 9. Tx check: $_" -ForegroundColor Red; $fail++ }

# --- Summary ---
Write-Host "`n=== Results: $pass passed, $fail failed ===" -ForegroundColor $(if ($fail -eq 0) { 'Green' } else { 'Red' })
exit $fail
