param([string]$BaseUrl = 'http://localhost:5079')

$ErrorActionPreference = 'Stop'
$headers = @{ 'X-Requested-With' = 'XMLHttpRequest' }
function Invoke-Checked([int]$Expected, [scriptblock]$Request) {
  $response = & $Request
  if ([int]$response.StatusCode -ne $Expected) { throw "Expected HTTP $Expected, got $([int]$response.StatusCode): $($response.Content)" }
  return $response
}

$managed = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$email = "admin-managed-$([guid]::NewGuid().ToString('N'))@example.test"
$password = 'TestPassword123'
$register = @{ name = 'Admin Managed User'; email = $email; password = $password } | ConvertTo-Json
$managedUser = (Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/auth/register" -Method Post -Headers $headers -ContentType 'application/json' -Body $register -WebSession $managed -SkipHttpErrorCheck }).Content | ConvertFrom-Json
Invoke-Checked 403 { Invoke-WebRequest "$BaseUrl/api/v1/admin/dashboard" -WebSession $managed -SkipHttpErrorCheck } | Out-Null

$admin = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminLogin = @{ email = 'admin.demo@example.test'; password = 'DemoPass123!' } | ConvertTo-Json
Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/auth/login" -Method Post -Headers $headers -ContentType 'application/json' -Body $adminLogin -WebSession $admin -SkipHttpErrorCheck } | Out-Null
$adminMe = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/auth/me" -WebSession $admin -SkipHttpErrorCheck }).Content | ConvertFrom-Json
$dashboard = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/admin/dashboard" -WebSession $admin -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($dashboard.totalUsers -lt 4 -or $dashboard.activeCategories -lt 4) { throw 'Administrator dashboard totals are incomplete.' }
$roles = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/admin/roles" -WebSession $admin -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($roles.Count -ne 3) { throw 'Expected three seeded roles.' }

$selfDeactivate = @{ isActive = $false } | ConvertTo-Json
Invoke-Checked 400 { Invoke-WebRequest "$BaseUrl/api/v1/admin/users/$($adminMe.id)/status" -Method Patch -Headers $headers -ContentType 'application/json' -Body $selfDeactivate -WebSession $admin -SkipHttpErrorCheck } | Out-Null
$selfRoles = @{ roles = @('Staff') } | ConvertTo-Json
Invoke-Checked 400 { Invoke-WebRequest "$BaseUrl/api/v1/admin/users/$($adminMe.id)/roles" -Method Put -Headers $headers -ContentType 'application/json' -Body $selfRoles -WebSession $admin -SkipHttpErrorCheck } | Out-Null

$newRoles = @{ roles = @('Resident', 'Staff') } | ConvertTo-Json
Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/admin/users/$($managedUser.id)/roles" -Method Put -Headers $headers -ContentType 'application/json' -Body $newRoles -WebSession $admin -SkipHttpErrorCheck } | Out-Null
Invoke-Checked 401 { Invoke-WebRequest "$BaseUrl/api/v1/auth/me" -WebSession $managed -SkipHttpErrorCheck } | Out-Null
$managedLogin = @{ email = $email; password = $password } | ConvertTo-Json
$managed = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginResponse = Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/auth/login" -Method Post -Headers $headers -ContentType 'application/json' -Body $managedLogin -WebSession $managed -SkipHttpErrorCheck }
$loginUser = $loginResponse.Content | ConvertFrom-Json
if ($loginUser.role -ne 'Staff' -or $loginUser.roles -notcontains 'Resident') { throw 'Normalised multi-role login response is incorrect.' }
Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/staff/dashboard" -WebSession $managed -SkipHttpErrorCheck } | Out-Null

$deactivate = @{ isActive = $false } | ConvertTo-Json
Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/admin/users/$($managedUser.id)/status" -Method Patch -Headers $headers -ContentType 'application/json' -Body $deactivate -WebSession $admin -SkipHttpErrorCheck } | Out-Null
$blockedSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-Checked 401 { Invoke-WebRequest "$BaseUrl/api/v1/auth/login" -Method Post -Headers $headers -ContentType 'application/json' -Body $managedLogin -WebSession $blockedSession -SkipHttpErrorCheck } | Out-Null
$activate = @{ isActive = $true } | ConvertTo-Json
Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/admin/users/$($managedUser.id)/status" -Method Patch -Headers $headers -ContentType 'application/json' -Body $activate -WebSession $admin -SkipHttpErrorCheck } | Out-Null

$slug = "admin-test-$([guid]::NewGuid().ToString('N').Substring(0, 10))"
$categoryBody = @{ slug = $slug; name = "Admin test $slug"; description = 'Synthetic category for administration verification.'; sortOrder = 900; isActive = $true } | ConvertTo-Json
$category = (Invoke-Checked 201 { Invoke-WebRequest "$BaseUrl/api/v1/admin/categories" -Method Post -Headers $headers -ContentType 'application/json' -Body $categoryBody -WebSession $admin -SkipHttpErrorCheck }).Content | ConvertFrom-Json
$publicCategories = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/categories" -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($publicCategories.slug -notcontains $slug) { throw 'Active category did not appear in the resident lookup.' }
$categoryUpdate = @{ name = "Updated $slug"; description = 'Updated synthetic category description.'; sortOrder = 901; isActive = $false } | ConvertTo-Json
Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/admin/categories/$($category.id)" -Method Patch -Headers $headers -ContentType 'application/json' -Body $categoryUpdate -WebSession $admin -SkipHttpErrorCheck } | Out-Null
$publicCategories = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/categories" -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($publicCategories.slug -contains $slug) { throw 'Inactive category remains visible in the resident lookup.' }

$settingBody = @{ value = 'Synthetic administration verification notice.' } | ConvertTo-Json
$setting = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/admin/settings/reports.public_notice" -Method Put -Headers $headers -ContentType 'application/json' -Body $settingBody -WebSession $admin -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($setting.version -ne 1) { throw 'First setting version should be 1.' }
Invoke-Checked 400 { Invoke-WebRequest "$BaseUrl/api/v1/admin/settings/aws.secret_key" -Method Put -Headers $headers -ContentType 'application/json' -Body $settingBody -WebSession $admin -SkipHttpErrorCheck } | Out-Null

$audits = (Invoke-Checked 200 { Invoke-WebRequest "$BaseUrl/api/v1/admin/audit-logs" -WebSession $admin -SkipHttpErrorCheck }).Content | ConvertFrom-Json
if ($audits.action -notcontains 'user.roles_updated' -or $audits.action -notcontains 'category.created' -or $audits.action -notcontains 'setting.updated') {
  throw 'Expected administrative audit records are missing.'
}
Write-Output "Administration smoke test passed for managed user $email."
