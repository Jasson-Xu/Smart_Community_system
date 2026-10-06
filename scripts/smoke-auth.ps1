param([string]$BaseUrl = 'http://localhost:5079')

$ErrorActionPreference = 'Stop'
$email = "resident-$([guid]::NewGuid().ToString('N'))@example.test"
$body = @{ name = 'Test Resident'; email = $email; password = 'TestPassword123' } | ConvertTo-Json
$headers = @{ 'X-Requested-With' = 'XMLHttpRequest' }
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Assert-Status([int]$Expected, [scriptblock]$Request) {
  try {
    $response = & $Request
    $actual = [int]$response.StatusCode
  } catch {
    if ($_.Exception.Response) { $actual = [int]$_.Exception.Response.StatusCode }
    else { throw }
  }
  if ($actual -ne $Expected) { throw "Expected HTTP $Expected, got $actual" }
}

Assert-Status 401 { Invoke-WebRequest "$BaseUrl/api/v1/auth/me" -SkipHttpErrorCheck }
Assert-Status 201 { Invoke-WebRequest "$BaseUrl/api/v1/auth/register" -Method Post -Headers $headers -ContentType 'application/json' -Body $body -WebSession $session -SkipHttpErrorCheck }
Assert-Status 409 { Invoke-WebRequest "$BaseUrl/api/v1/auth/register" -Method Post -Headers $headers -ContentType 'application/json' -Body $body -WebSession $session -SkipHttpErrorCheck }
Assert-Status 200 { Invoke-WebRequest "$BaseUrl/api/v1/auth/me" -WebSession $session -SkipHttpErrorCheck }
Assert-Status 403 { Invoke-WebRequest "$BaseUrl/api/v1/staff/me" -WebSession $session -SkipHttpErrorCheck }
Assert-Status 403 { Invoke-WebRequest "$BaseUrl/api/v1/admin/me" -WebSession $session -SkipHttpErrorCheck }
Assert-Status 403 { Invoke-WebRequest "$BaseUrl/api/v1/auth/logout" -Method Post -SkipHttpErrorCheck }
Assert-Status 403 { Invoke-WebRequest "$BaseUrl/api/v1/auth/logout" -Method Post -Headers @{ 'X-Requested-With' = 'XMLHttpRequest'; Origin = 'https://untrusted.example' } -SkipHttpErrorCheck }
Assert-Status 204 { Invoke-WebRequest "$BaseUrl/api/v1/auth/logout" -Method Post -Headers $headers -WebSession $session -SkipHttpErrorCheck }
Assert-Status 401 { Invoke-WebRequest "$BaseUrl/api/v1/auth/me" -WebSession $session -SkipHttpErrorCheck }
Assert-Status 200 { Invoke-WebRequest "$BaseUrl/api/v1/auth/login" -Method Post -Headers $headers -ContentType 'application/json' -Body (@{ email = $email; password = 'TestPassword123' } | ConvertTo-Json) -WebSession $session -SkipHttpErrorCheck }
Assert-Status 200 { Invoke-WebRequest "$BaseUrl/api/v1/auth/me" -WebSession $session -SkipHttpErrorCheck }
Write-Output 'Authentication smoke test passed.'
