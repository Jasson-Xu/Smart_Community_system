param([string]$BaseUrl = 'http://localhost:5079')

$ErrorActionPreference = 'Stop'
$headers = @{ 'X-Requested-With' = 'XMLHttpRequest' }

function Invoke-Checked([int]$Expected, [scriptblock]$Request) {
  $response = & $Request
  if ([int]$response.StatusCode -ne $Expected) {
    throw "Expected HTTP $Expected, got $([int]$response.StatusCode): $($response.Content)"
  }
  return $response
}

$categories = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/categories" -SkipHttpErrorCheck }).Content | ConvertFrom-Json
$resident = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$residentBody = @{ name = 'Week Eight Resident'; email = "week8-$([guid]::NewGuid().ToString('N'))@example.test"; password = 'TestPassword123' } | ConvertTo-Json
Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/auth/register" -Method Post -Headers $headers -ContentType 'application/json' -Body $residentBody -WebSession $resident -SkipHttpErrorCheck } | Out-Null

$reportBody = @{ categoryId = $categories[0].id; location = 'Week Eight Test Street'; description = 'A synthetic issue used to verify the complete staff operations workflow.' } | ConvertTo-Json
$first = (Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -Method Post -Headers $headers -ContentType 'application/json' -Body $reportBody -WebSession $resident -SkipHttpErrorCheck }).Content | ConvertFrom-Json
$second = (Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -Method Post -Headers $headers -ContentType 'application/json' -Body $reportBody -WebSession $resident -SkipHttpErrorCheck }).Content | ConvertFrom-Json
Invoke-Checked 403 { Invoke-WebRequest "$BaseUrl/api/v1/staff/dashboard" -WebSession $resident -SkipHttpErrorCheck } | Out-Null

$staff = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$staffLogin = @{ email = 'staff.demo@example.test'; password = 'DemoPass123!' } | ConvertTo-Json
Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/auth/login" -Method Post -Headers $headers -ContentType 'application/json' -Body $staffLogin -WebSession $staff -SkipHttpErrorCheck } | Out-Null
$dashboard = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/dashboard" -WebSession $staff -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($dashboard.totalReports -lt 2) { throw 'Staff dashboard totals are incomplete.' }
$staffUsers = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/users" -WebSession $staff -SkipHttpErrorCheck }).Content | ConvertFrom-Json
$staffUser = $staffUsers | Where-Object { $_.email -eq 'staff.demo@example.test' } | Select-Object -First 1
if (-not $staffUser) { throw 'Assignable staff account is missing.' }

$search = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports?q=$($first.reference)&status=SUBMITTED&priority=Normal" -WebSession $staff -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($search.Count -ne 1 -or $search[0].reference -ne $first.reference) { throw 'Staff search and filtering failed.' }
$invalidStatus = @{ statusCode = 'IN_PROGRESS'; note = 'Invalid transition test' } | ConvertTo-Json
Invoke-Checked 400 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports/$($first.reference)/status" -Method Post -Headers $headers -ContentType 'application/json' -Body $invalidStatus -WebSession $staff -SkipHttpErrorCheck } | Out-Null

$priority = @{ priority = 'Urgent' } | ConvertTo-Json
Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports/$($first.reference)/priority" -Method Patch -Headers $headers -ContentType 'application/json' -Body $priority -WebSession $staff -SkipHttpErrorCheck } | Out-Null
$assignment = @{ assignedToUserId = $staffUser.id } | ConvertTo-Json
Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports/$($first.reference)/assignments" -Method Post -Headers $headers -ContentType 'application/json' -Body $assignment -WebSession $staff -SkipHttpErrorCheck } | Out-Null

foreach ($transition in @(
  @{ statusCode = 'UNDER_REVIEW'; note = 'Initial staff review started.' },
  @{ statusCode = 'ASSIGNED'; note = 'Assigned to the test staff account.' },
  @{ statusCode = 'IN_PROGRESS'; note = 'Synthetic work has started.' }
)) {
  $transitionBody = $transition | ConvertTo-Json
  Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports/$($first.reference)/status" -Method Post -Headers $headers -ContentType 'application/json' -Body $transitionBody -WebSession $staff -SkipHttpErrorCheck } | Out-Null
}

$commentBody = @{ body = 'Council staff have reviewed this synthetic report.' } | ConvertTo-Json
Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports/$($first.reference)/comments" -Method Post -Headers $headers -ContentType 'application/json' -Body $commentBody -WebSession $staff -SkipHttpErrorCheck } | Out-Null
$duplicateBody = @{ potentialDuplicateReference = $second.reference; note = 'Same synthetic location and description.' } | ConvertTo-Json
Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports/$($first.reference)/duplicates" -Method Post -Headers $headers -ContentType 'application/json' -Body $duplicateBody -WebSession $staff -SkipHttpErrorCheck } | Out-Null

$staffDetail = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports/$($first.reference)" -WebSession $staff -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($staffDetail.priority -ne 'Urgent' -or $staffDetail.statusCode -ne 'IN_PROGRESS' -or $staffDetail.history.Count -ne 4 -or $staffDetail.assignments.Count -ne 1 -or $staffDetail.comments.Count -ne 1 -or $staffDetail.duplicates.Count -ne 1) {
  throw 'Staff report detail does not contain the completed workflow changes.'
}
$residentDetail = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$($first.reference)" -WebSession $resident -SkipHttpErrorCheck }).Content | ConvertFrom-Json
$residentComments = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$($first.reference)/comments" -WebSession $resident -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($residentDetail.statusCode -ne 'IN_PROGRESS' -or $residentDetail.priority -ne 'Urgent' -or $residentDetail.history.Count -ne 4 -or $residentComments.Count -ne 1) {
  throw 'Resident view does not reflect staff updates.'
}

Write-Output "Staff workflow smoke test passed for $($first.reference)."
