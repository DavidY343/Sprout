Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$baseUri = if ($env:SPROUT_API_URL) { $env:SPROUT_API_URL } else { 'https://sprout-backend-production-3aff.up.railway.app/api/v1' }
$assetsUri = "$baseUri/assets/with-prices"
$registerUri = "$baseUri/auth/register"

try {
    $seed = Get-Date -Format 'yyyyMMddHHmmssfff'
    $email = "smoke-$seed@example.com"
    $password = "SmokeTest123!$seed"

    $registerBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $r = Invoke-WebRequest -Uri $registerUri -Method POST -ContentType 'application/json' `
        -Body $registerBody -WebSession $session -UseBasicParsing
    $json = $r.Content | ConvertFrom-Json
    if (-not $json.csrf_token) {
        throw 'Register endpoint did not return csrf_token.'
    }
    $headers = @{ 'X-CSRF-Token' = $json.csrf_token }

    $r2 = Invoke-WebRequest -Uri $assetsUri -Method GET -Headers $headers `
        -WebSession $session -UseBasicParsing
    $response = $r2.Content | ConvertFrom-Json

    if ($null -eq $response) {
        throw 'API returned null response.'
    }

    $items = @($response)
    Write-Host ("[SMOKE] assets-with-prices passed. Items: {0}" -f $items.Count) -ForegroundColor Green
    exit 0
}
catch {
    Write-Host ("[SMOKE] assets-with-prices failed: {0}" -f $_.Exception.Message) -ForegroundColor Red
    exit 1
}
