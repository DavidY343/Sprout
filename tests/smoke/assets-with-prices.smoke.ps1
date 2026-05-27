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

    $auth = Invoke-RestMethod -Uri $registerUri -Method POST -ContentType 'application/json' -Body $registerBody
    if (-not $auth.access_token) {
        throw 'Register endpoint did not return access_token.'
    }

    $headers = @{ Authorization = "Bearer $($auth.access_token)" }
    $response = Invoke-RestMethod -Uri $assetsUri -Method GET -Headers $headers

    if ($null -eq $response) {
        throw 'API returned null response.'
    }

    if ($response -is [System.Array]) {
        Write-Host ("[SMOKE] assets-with-prices passed. Items: {0}" -f $response.Count) -ForegroundColor Green
        exit 0
    }

    if ($response.PSObject.Properties.Count -ge 1) {
        Write-Host '[SMOKE] assets-with-prices passed. Response object detected.' -ForegroundColor Green
        exit 0
    }

    throw 'Unexpected response shape.'
}
catch {
    Write-Host ("[SMOKE] assets-with-prices failed: {0}" -f $_.Exception.Message) -ForegroundColor Red
    exit 1
}
