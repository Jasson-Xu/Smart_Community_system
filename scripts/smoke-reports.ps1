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

function New-TestResident([string]$Label) {
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $email = "$Label-$([guid]::NewGuid().ToString('N'))@example.test"
  $body = @{ name = "Report $Label"; email = $email; password = 'TestPassword123' } | ConvertTo-Json
  Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/auth/register" -Method Post -Headers $headers -ContentType 'application/json' -Body $body -WebSession $session -SkipHttpErrorCheck } | Out-Null
  return $session
}

$categoriesResponse = Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/categories" -SkipHttpErrorCheck }
$categories = $categoriesResponse.Content | ConvertFrom-Json
if ($categories.Count -lt 4) { throw 'Expected at least four active issue categories.' }

$categoryId = $categories[0].id
$validReport = @{
  categoryId = $categoryId
  location = 'Hyde Park, Elizabeth Street, Sydney NSW 2000, Australia'
  latitude = -33.873138
  longitude = 151.211275
  googlePlaceId = 'ChIJ5UHvz0GuEmsR5rN_H74uZZs'
  description = 'A synthetic test issue is blocking the accessible path near the entrance.'
} | ConvertTo-Json
Invoke-Checked 401 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -Method Post -Headers $headers -ContentType 'application/json' -Body $validReport -SkipHttpErrorCheck } | Out-Null

$owner = New-TestResident 'owner'
$otherResident = New-TestResident 'other'
$invalidReport = @{ categoryId = $categoryId; location = 'X'; description = 'Too short' } | ConvertTo-Json
Invoke-Checked 400 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -Method Post -Headers $headers -ContentType 'application/json' -Body $invalidReport -WebSession $owner -SkipHttpErrorCheck } | Out-Null
$invalidCoordinates = @{
  categoryId = $categoryId
  location = 'Invalid map point'
  latitude = 91
  longitude = 151.211275
  description = 'A synthetic test issue with a latitude outside the valid coordinate range.'
} | ConvertTo-Json
Invoke-Checked 400 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -Method Post -Headers $headers -ContentType 'application/json' -Body $invalidCoordinates -WebSession $owner -SkipHttpErrorCheck } | Out-Null

$createResponse = Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -Method Post -Headers $headers -ContentType 'application/json' -Body $validReport -WebSession $owner -SkipHttpErrorCheck }
$created = $createResponse.Content | ConvertFrom-Json
if ($created.reference -notmatch '^SC-\d{4}-[A-F0-9]{12}$') { throw "Unexpected reference format: $($created.reference)" }
if ($created.status -ne 'Submitted' -or $created.history.Count -ne 1) { throw 'Initial status or history is missing.' }
if ($created.latitude -ne -33.873138 -or $created.longitude -ne 151.211275 -or $created.googlePlaceId -ne 'ChIJ5UHvz0GuEmsR5rN_H74uZZs') {
  throw 'Google Maps location metadata was not returned after report creation.'
}

$secondResponse = Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -Method Post -Headers $headers -ContentType 'application/json' -Body $validReport -WebSession $owner -SkipHttpErrorCheck }
$second = $secondResponse.Content | ConvertFrom-Json
if ($second.reference -eq $created.reference) { throw 'Report references are not unique.' }

$listResponse = Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -WebSession $owner -SkipHttpErrorCheck }
$reports = $listResponse.Content | ConvertFrom-Json
if ($reports.Count -ne 2 -or $reports.reference -notcontains $created.reference) { throw 'Resident report list is incomplete.' }
$dashboardResponse = Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/resident/dashboard" -WebSession $owner -SkipHttpErrorCheck }
$dashboard = $dashboardResponse.Content | ConvertFrom-Json
$submittedCount = ($dashboard.statusCounts | Where-Object { $_.code -eq 'SUBMITTED' }).count
if ($dashboard.totalReports -ne 2 -or $dashboard.recentReports.Count -ne 2 -or $submittedCount -ne 2) {
  throw 'Resident dashboard totals are incorrect.'
}
$filteredResponse = Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/reports?status=SUBMITTED&sort=oldest" -WebSession $owner -SkipHttpErrorCheck }
$filtered = $filteredResponse.Content | ConvertFrom-Json
if ($filtered.Count -ne 2 -or $filtered[0].statusCode -ne 'SUBMITTED') { throw 'Report filtering or sorting failed.' }
$detailResponse = Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$($created.reference)" -WebSession $owner -SkipHttpErrorCheck }
$detail = $detailResponse.Content | ConvertFrom-Json
if ($detail.latitude -ne -33.873138 -or $detail.longitude -ne 151.211275 -or $detail.googlePlaceId -ne 'ChIJ5UHvz0GuEmsR5rN_H74uZZs') {
  throw 'Google Maps location metadata was not persisted in report detail.'
}
Invoke-Checked 404 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$($created.reference)" -WebSession $otherResident -SkipHttpErrorCheck } | Out-Null
$invalidComment = @{ body = ' ' } | ConvertTo-Json
Invoke-Checked 400 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$($created.reference)/comments" -Method Post -Headers $headers -ContentType 'application/json' -Body $invalidComment -WebSession $owner -SkipHttpErrorCheck } | Out-Null
$validComment = @{ body = 'The obstruction is still present near the accessible entrance.' } | ConvertTo-Json
$commentResponse = Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$($created.reference)/comments" -Method Post -Headers $headers -ContentType 'application/json' -Body $validComment -WebSession $owner -SkipHttpErrorCheck }
$comment = $commentResponse.Content | ConvertFrom-Json
if ($comment.body -notmatch 'still present' -or -not $comment.authorName) { throw 'Created comment response is incomplete.' }
$commentsResponse = Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$($created.reference)/comments" -WebSession $owner -SkipHttpErrorCheck }
$comments = $commentsResponse.Content | ConvertFrom-Json
if ($comments.Count -ne 1 -or $comments[0].id -ne $comment.id) { throw 'Comment list is incomplete.' }
Invoke-Checked 404 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$($created.reference)/comments" -WebSession $otherResident -SkipHttpErrorCheck } | Out-Null

$staff = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$staffLogin = @{ email = 'staff.demo@example.test'; password = 'DemoPass123!' } | ConvertTo-Json
Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/auth/login" -Method Post -Headers $headers -ContentType 'application/json' -Body $staffLogin -WebSession $staff -SkipHttpErrorCheck } | Out-Null
Invoke-Checked 403 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -WebSession $staff -SkipHttpErrorCheck } | Out-Null
Invoke-Checked 403 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -Method Post -Headers $headers -ContentType 'application/json' -Body $validReport -WebSession $staff -SkipHttpErrorCheck } | Out-Null

Write-Output "Report smoke test passed with references $($created.reference) and $($second.reference)."
