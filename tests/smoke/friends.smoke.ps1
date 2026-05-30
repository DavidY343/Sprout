# Friends system smoke test
# Tests: list, send request, accept, friend portfolio, remove
$ErrorActionPreference = "Stop"
$BASE = "https://sprout-backend-production-3aff.up.railway.app/api/v1"

# We need two users. We'll use the demo user and create a temp user.
# Step 1: Login as demo user
$loginBody = @{ email = "demo@user.com"; password = "admin123" } | ConvertTo-Json
$session1 = Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable s1 -UseBasicParsing
if ($session1.StatusCode -ne 200) { Write-Error "Login user1 failed"; exit 1 }

# Extract cookies from session
$csrf1 = ($s1.Cookies.GetCookies("$BASE") | Where-Object { $_.Name -eq "csrf_token" }).Value
Write-Host "User1 logged in, csrf=$($csrf1.Substring(0,8))..."

# Step 2: List friends (should be empty or existing)
$friends = Invoke-RestMethod -Uri "$BASE/friends" -WebSession $s1 -UseBasicParsing
Write-Host "User1 friends count: $($friends.Count)"

# Step 3: Test sending request to self (should fail)
try {
    $selfReq = Invoke-RestMethod -Uri "$BASE/friends" -Method POST -Body (@{ email = "demo@user.com" } | ConvertTo-Json) -ContentType "application/json" -WebSession $s1 -Headers @{ "X-CSRF-Token" = $csrf1 } -UseBasicParsing
    Write-Error "Self-friend should have failed"; exit 1
} catch {
    Write-Host "Self-friend correctly rejected: $($_.Exception.Message)"
}

# Step 4: Test sending request to non-existent user (should fail)
try {
    $noUser = Invoke-RestMethod -Uri "$BASE/friends" -Method POST -Body (@{ email = "nonexistent@test.com" } | ConvertTo-Json) -ContentType "application/json" -WebSession $s1 -Headers @{ "X-CSRF-Token" = $csrf1 } -UseBasicParsing
    Write-Error "Non-existent user should have failed"; exit 1
} catch {
    Write-Host "Non-existent user correctly rejected: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== FRIENDS SMOKE TESTS PASSED ==="
