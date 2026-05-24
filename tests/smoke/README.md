# Smoke Tests

Use this folder for lightweight end-to-end checks that confirm core behavior after changes.

## Rules
- Keep tests small and fast.
- Create one file per topic: `<topic>.smoke.ps1`.
- Each test must exit with code `0` on success and non-zero on failure.
- Reuse and rerun existing topic tests whenever that topic is touched again.

## Run all smoke tests
```powershell
pwsh -File tests/smoke/run-smoke.ps1
# or on Windows PowerShell 5.1
powershell -ExecutionPolicy Bypass -File tests/smoke/run-smoke.ps1
```

## Example test skeleton
```powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

try {
    # Arrange / Act
    # Example: $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/assets/with-prices" -Method GET

    # Assert
    # Example: if ($null -eq $response) { throw 'Empty response' }

    Write-Host '[SMOKE] <topic> passed.' -ForegroundColor Green
    exit 0
}
catch {
    Write-Host ("[SMOKE] <topic> failed: {0}" -f $_.Exception.Message) -ForegroundColor Red
    exit 1
}
```
