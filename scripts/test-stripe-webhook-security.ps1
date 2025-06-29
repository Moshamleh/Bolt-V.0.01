# BOLT Auto - Stripe Webhook Security Testing Script
# This script tests the security measures of the webhook handler

param(
    [string]$WebhookUrl = "",
    [switch]$Verbose
)

Write-Host "🔒 BOLT Auto - Webhook Security Testing" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

if (-not $WebhookUrl) {
    $WebhookUrl = Read-Host "Enter webhook URL (e.g., https://your-project.supabase.co/functions/v1/stripe-webhook)"
}

if (-not $WebhookUrl) {
    Write-Error "❌ Webhook URL is required"
    exit 1
}

Write-Host "🎯 Testing webhook: $WebhookUrl" -ForegroundColor Yellow
Write-Host ""

# Test results tracking
$testResults = @{
    Passed = 0
    Failed = 0
    Tests = @()
}

function Test-WebhookEndpoint {
    param(
        [string]$TestName,
        [string]$Method = "POST",
        [hashtable]$Headers = @{},
        [string]$Body = "",
        [int]$ExpectedStatus = 200,
        [string]$Description = ""
    )
    
    Write-Host "🧪 $TestName" -ForegroundColor Blue
    if ($Description) {
        Write-Host "   $Description" -ForegroundColor Gray
    }
    
    try {
        $response = Invoke-WebRequest -Uri $WebhookUrl -Method $Method -Headers $Headers -Body $Body -UseBasicParsing -TimeoutSec 10
        $actualStatus = $response.StatusCode
        
        if ($actualStatus -eq $ExpectedStatus) {
            Write-Host "   ✅ PASS - Status: $actualStatus" -ForegroundColor Green
            $testResults.Passed++
            $testResults.Tests += @{
                Name = $TestName
                Status = "PASS"
                Expected = $ExpectedStatus
                Actual = $actualStatus
            }
        } else {
            Write-Host "   ❌ FAIL - Expected: $ExpectedStatus, Got: $actualStatus" -ForegroundColor Red
            $testResults.Failed++
            $testResults.Tests += @{
                Name = $TestName
                Status = "FAIL"
                Expected = $ExpectedStatus
                Actual = $actualStatus
            }
        }
        
        if ($Verbose) {
            Write-Host "   Headers: $($response.Headers | ConvertTo-Json -Compress)" -ForegroundColor Gray
        }
        
    } catch {
        $actualStatus = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Error" }
        
        if ($actualStatus -eq $ExpectedStatus) {
            Write-Host "   ✅ PASS - Status: $actualStatus (Expected error)" -ForegroundColor Green
            $testResults.Passed++
            $testResults.Tests += @{
                Name = $TestName
                Status = "PASS"
                Expected = $ExpectedStatus
                Actual = $actualStatus
            }
        } else {
            Write-Host "   ❌ FAIL - Expected: $ExpectedStatus, Got: $actualStatus" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
            $testResults.Failed++
            $testResults.Tests += @{
                Name = $TestName
                Status = "FAIL"
                Expected = $ExpectedStatus
                Actual = $actualStatus
                Error = $_.Exception.Message
            }
        }
    }
    
    Write-Host ""
}

# Test 1: CORS Preflight Request
Test-WebhookEndpoint -TestName "CORS Preflight" -Method "OPTIONS" -ExpectedStatus 200 -Description "Testing CORS preflight request handling"

# Test 2: Invalid HTTP Method
Test-WebhookEndpoint -TestName "Invalid HTTP Method" -Method "GET" -ExpectedStatus 405 -Description "Testing rejection of non-POST requests"

# Test 3: Missing Stripe Signature
Test-WebhookEndpoint -TestName "Missing Stripe Signature" -Method "POST" -Body '{"test":"data"}' -ExpectedStatus 400 -Description "Testing rejection of requests without Stripe signature"

# Test 4: Invalid Stripe Signature
Test-WebhookEndpoint -TestName "Invalid Stripe Signature" -Method "POST" -Headers @{"stripe-signature" = "invalid-signature"} -Body '{"test":"data"}' -ExpectedStatus 400 -Description "Testing rejection of invalid signatures"

# Test 5: Empty Request Body
Test-WebhookEndpoint -TestName "Empty Request Body" -Method "POST" -Headers @{"stripe-signature" = "t=1234567890,v1=test"} -Body "" -ExpectedStatus 400 -Description "Testing rejection of empty request bodies"

# Test 6: Large Request Body (potential DoS)
$largeBody = "x" * 1000000  # 1MB of data
Test-WebhookEndpoint -TestName "Large Request Body" -Method "POST" -Headers @{"stripe-signature" = "t=1234567890,v1=test"} -Body $largeBody -ExpectedStatus 400 -Description "Testing handling of oversized requests"

# Test 7: Rate Limiting (multiple rapid requests)
Write-Host "🧪 Rate Limiting Test" -ForegroundColor Blue
Write-Host "   Testing rate limiting with rapid requests" -ForegroundColor Gray

$rateLimitHit = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $WebhookUrl -Method "POST" -Headers @{"stripe-signature" = "test$i"} -Body "{}" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 429) {
            $rateLimitHit = $true
            break
        }
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 429) {
            $rateLimitHit = $true
            break
        }
    }
    Start-Sleep -Milliseconds 100
}

if ($rateLimitHit) {
    Write-Host "   ✅ PASS - Rate limiting is working" -ForegroundColor Green
    $testResults.Passed++
} else {
    Write-Host "   ⚠️  WARNING - Rate limiting may not be configured" -ForegroundColor Yellow
    $testResults.Failed++
}
$testResults.Tests += @{
    Name = "Rate Limiting"
    Status = if ($rateLimitHit) { "PASS" } else { "WARNING" }
    Description = "Rate limiting functionality"
}

Write-Host ""

# Test 8: Security Headers Check
Write-Host "🧪 Security Headers Check" -ForegroundColor Blue
Write-Host "   Checking for security headers in responses" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $WebhookUrl -Method "OPTIONS" -UseBasicParsing
    $headers = $response.Headers
    
    $securityHeaders = @{
        "X-Content-Type-Options" = "nosniff"
        "X-Frame-Options" = "DENY"
        "X-XSS-Protection" = "1; mode=block"
        "Strict-Transport-Security" = $null  # Just check if exists
    }
    
    $headersPassed = 0
    $headersTotal = $securityHeaders.Count
    
    foreach ($header in $securityHeaders.Keys) {
        if ($headers.ContainsKey($header)) {
            $expectedValue = $securityHeaders[$header]
            if ($expectedValue -eq $null -or $headers[$header] -match $expectedValue) {
                Write-Host "   ✅ $header" -ForegroundColor Green
                $headersPassed++
            } else {
                Write-Host "   ❌ $header (incorrect value)" -ForegroundColor Red
            }
        } else {
            Write-Host "   ❌ $header (missing)" -ForegroundColor Red
        }
    }
    
    if ($headersPassed -eq $headersTotal) {
        Write-Host "   ✅ PASS - All security headers present" -ForegroundColor Green
        $testResults.Passed++
    } else {
        Write-Host "   ❌ FAIL - Missing security headers ($headersPassed/$headersTotal)" -ForegroundColor Red
        $testResults.Failed++
    }
    
    $testResults.Tests += @{
        Name = "Security Headers"
        Status = if ($headersPassed -eq $headersTotal) { "PASS" } else { "FAIL" }
        Score = "$headersPassed/$headersTotal"
    }
    
} catch {
    Write-Host "   ❌ FAIL - Could not check security headers" -ForegroundColor Red
    $testResults.Failed++
    $testResults.Tests += @{
        Name = "Security Headers"
        Status = "FAIL"
        Error = $_.Exception.Message
    }
}

Write-Host ""

# Test 9: Response Time Check
Write-Host "🧪 Response Time Check" -ForegroundColor Blue
Write-Host "   Testing webhook response times" -ForegroundColor Gray

$responseTimes = @()
for ($i = 1; $i -le 5; $i++) {
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $WebhookUrl -Method "OPTIONS" -UseBasicParsing -TimeoutSec 10
        $stopwatch.Stop()
        $responseTimes += $stopwatch.ElapsedMilliseconds
    } catch {
        Write-Host "   Request $i failed" -ForegroundColor Red
    }
}

if ($responseTimes.Count -gt 0) {
    $avgResponseTime = ($responseTimes | Measure-Object -Average).Average
    Write-Host "   Average response time: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor Cyan
    
    if ($avgResponseTime -lt 1000) {
        Write-Host "   ✅ PASS - Good response times" -ForegroundColor Green
        $testResults.Passed++
    } else {
        Write-Host "   ⚠️  WARNING - Slow response times" -ForegroundColor Yellow
        $testResults.Failed++
    }
    
    $testResults.Tests += @{
        Name = "Response Time"
        Status = if ($avgResponseTime -lt 1000) { "PASS" } else { "WARNING" }
        AverageMs = [math]::Round($avgResponseTime, 2)
    }
} else {
    Write-Host "   ❌ FAIL - No successful requests" -ForegroundColor Red
    $testResults.Failed++
    $testResults.Tests += @{
        Name = "Response Time"
        Status = "FAIL"
        Error = "No successful requests"
    }
}

Write-Host ""

# Summary
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "Total Tests: $($testResults.Tests.Count)" -ForegroundColor White
Write-Host "Passed: $($testResults.Passed)" -ForegroundColor Green
Write-Host "Failed: $($testResults.Failed)" -ForegroundColor Red

$passRate = if ($testResults.Tests.Count -gt 0) { 
    [math]::Round(($testResults.Passed / $testResults.Tests.Count) * 100, 1) 
} else { 0 }

Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })

Write-Host ""

# Detailed results
if ($Verbose) {
    Write-Host "📋 DETAILED RESULTS" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    foreach ($test in $testResults.Tests) {
        Write-Host "Test: $($test.Name)" -ForegroundColor White
        Write-Host "Status: $($test.Status)" -ForegroundColor $(if ($test.Status -eq "PASS") { "Green" } else { "Red" })
        if ($test.Expected) { Write-Host "Expected: $($test.Expected)" -ForegroundColor Gray }
        if ($test.Actual) { Write-Host "Actual: $($test.Actual)" -ForegroundColor Gray }
        if ($test.Error) { Write-Host "Error: $($test.Error)" -ForegroundColor Red }
        Write-Host ""
    }
}

# Security recommendations
Write-Host "🔐 SECURITY RECOMMENDATIONS" -ForegroundColor Red
Write-Host "===========================" -ForegroundColor Red

if ($testResults.Failed -gt 0) {
    Write-Host "⚠️  Fix all failed tests before deploying to production" -ForegroundColor Yellow
}

Write-Host "1. Monitor webhook logs regularly for suspicious activity" -ForegroundColor White
Write-Host "2. Set up alerts for failed webhook signatures" -ForegroundColor White
Write-Host "3. Implement proper logging and monitoring" -ForegroundColor White
Write-Host "4. Regularly review and update security measures" -ForegroundColor White
Write-Host "5. Use HTTPS only for webhook endpoints" -ForegroundColor White
Write-Host "6. Keep webhook secrets secure and rotate them regularly" -ForegroundColor White

# Exit with appropriate code
if ($testResults.Failed -eq 0) {
    Write-Host ""
    Write-Host "✅ All security tests passed! Webhook is ready for production." -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ Some security tests failed. Please address issues before production deployment." -ForegroundColor Red
    exit 1
}