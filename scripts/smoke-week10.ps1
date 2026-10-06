param([string]$BaseUrl = 'http://127.0.0.1:5079')

$ErrorActionPreference = 'Stop'
$headers = @{ 'X-Requested-With' = 'XMLHttpRequest' }
function Request([int]$Expected, [scriptblock]$Call) {
  $response = & $Call
  if ([int]$response.StatusCode -ne $Expected) { throw "Expected $Expected, got $($response.StatusCode): $($response.Content)" }
  return $response
}

$categories = (Request 200 { Invoke-WebRequest "$BaseUrl/api/v1/categories" -SkipHttpErrorCheck }).Content | ConvertFrom-Json
$resident = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$other = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$staff = New-Object Microsoft.PowerShell.Commands.WebRequestSession
foreach ($entry in @(@{ session = $resident; name = 'Week Ten Resident' }, @{ session = $other; name = 'Week Ten Other' })) {
  $body = @{ name = $entry.name; email = "week10-$([guid]::NewGuid().ToString('N'))@example.test"; password = 'TestPassword123' } | ConvertTo-Json
  Request 201 { Invoke-WebRequest "$BaseUrl/api/v1/auth/register" -Method Post -Headers $headers -ContentType 'application/json' -Body $body -WebSession $entry.session -SkipHttpErrorCheck } | Out-Null
}
$login = @{ email = 'staff.demo@example.test'; password = 'DemoPass123!' } | ConvertTo-Json
Request 200 { Invoke-WebRequest "$BaseUrl/api/v1/auth/login" -Method Post -Headers $headers -ContentType 'application/json' -Body $login -WebSession $staff -SkipHttpErrorCheck } | Out-Null
$body = @{ categoryId = $categories[0].id; location = 'Week Ten Test Street'; description = 'Synthetic report for notification and feedback verification.' } | ConvertTo-Json
$report = (Request 201 { Invoke-WebRequest "$BaseUrl/api/v1/reports" -Method Post -Headers $headers -ContentType 'application/json' -Body $body -WebSession $resident -SkipHttpErrorCheck }).Content | ConvertFrom-Json
$reference = $report.reference
$state = (Request 200 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$reference/feedback" -WebSession $resident -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($state.eligible) { throw 'Feedback opened before resolution.' }
$feedbackBody = @{ rating = 5; comment = 'Resolved clearly.' } | ConvertTo-Json
Request 409 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$reference/feedback" -Method Post -Headers $headers -ContentType 'application/json' -Body $feedbackBody -WebSession $resident -SkipHttpErrorCheck } | Out-Null
Request 404 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$reference/feedback" -WebSession $other -SkipHttpErrorCheck } | Out-Null
$staffUser = ((Request 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/users" -WebSession $staff -SkipHttpErrorCheck }).Content | ConvertFrom-Json) | Where-Object email -eq 'staff.demo@example.test' | Select-Object -First 1
Request 201 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports/$reference/assignments" -Method Post -Headers $headers -ContentType 'application/json' -Body (@{ assignedToUserId = $staffUser.id } | ConvertTo-Json) -WebSession $staff -SkipHttpErrorCheck } | Out-Null
foreach ($code in @('UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED')) {
  Request 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/reports/$reference/status" -Method Post -Headers $headers -ContentType 'application/json' -Body (@{ statusCode = $code } | ConvertTo-Json) -WebSession $staff -SkipHttpErrorCheck } | Out-Null
}
$notifications = (Request 200 { Invoke-WebRequest "$BaseUrl/api/v1/resident/notifications" -WebSession $resident -SkipHttpErrorCheck }).Content | ConvertFrom-Json
$mine = @($notifications | Where-Object reference -eq $reference)
if ($mine.Count -ne 4) { throw "Expected four notifications, got $($mine.Count)." }
Request 404 { Invoke-WebRequest "$BaseUrl/api/v1/resident/notifications/$($mine[0].id)/read" -Method Patch -Headers $headers -WebSession $other -SkipHttpErrorCheck } | Out-Null
Request 200 { Invoke-WebRequest "$BaseUrl/api/v1/resident/notifications/$($mine[0].id)/read" -Method Patch -Headers $headers -WebSession $resident -SkipHttpErrorCheck } | Out-Null
Request 201 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$reference/feedback" -Method Post -Headers $headers -ContentType 'application/json' -Body $feedbackBody -WebSession $resident -SkipHttpErrorCheck } | Out-Null
Request 409 { Invoke-WebRequest "$BaseUrl/api/v1/reports/$reference/feedback" -Method Post -Headers $headers -ContentType 'application/json' -Body $feedbackBody -WebSession $resident -SkipHttpErrorCheck } | Out-Null
$dashboard = (Request 200 { Invoke-WebRequest "$BaseUrl/api/v1/resident/dashboard" -WebSession $resident -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($dashboard.unreadNotifications -ne 3 -or $dashboard.feedbackPending -ne 0) { throw 'Resident dashboard totals are wrong.' }
$staffDashboard = (Request 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/dashboard" -WebSession $staff -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($staffDashboard.submittedLast30Days -lt 1 -or $staffDashboard.resolvedLast30Days -lt 1) { throw 'Staff 30-day totals are wrong.' }
Write-Output "Week 10 smoke test passed for $reference."
