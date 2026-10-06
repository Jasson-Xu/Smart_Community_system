$ErrorActionPreference = 'Stop'
$repository = Split-Path -Parent $PSScriptRoot
$passwordLine = Get-Content -LiteralPath (Join-Path $repository '.env') |
  Where-Object { $_ -like 'POSTGRES_PASSWORD=*' } | Select-Object -First 1
if (-not $passwordLine) { throw 'Create the local .env file and start PostgreSQL first.' }

$databasePassword = $passwordLine.Substring('POSTGRES_PASSWORD='.Length)
$env:ConnectionStrings__Default = "Host=127.0.0.1;Port=5432;Database=smartcommunity;Username=smartcommunity;Password=$databasePassword"
$env:ASPNETCORE_ENVIRONMENT = 'Development'
Push-Location (Join-Path $repository 'backend/SmartCommunity.Api')
try {
  dotnet './bin/Debug/net10.0/SmartCommunity.Api.dll' --seed-demo
  if ($LASTEXITCODE -ne 0) { throw 'Demo account seeding failed.' }
} finally {
  Pop-Location
  Remove-Item Env:ConnectionStrings__Default -ErrorAction SilentlyContinue
}
