# BOLT AUTO - Supabase Functions Deployment Script
# =================================================
# This script deploys all Edge Functions for payment processing

Write-Host "🚗 BOLT AUTO - Deploying Supabase Edge Functions" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if Supabase CLI is installed
if (!(Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
if (Test-Path ".env") {
    Write-Host "📄 Loading environment variables from .env" -ForegroundColor Blue
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
} else {
    Write-Host "⚠️  No .env file found. Please create one based on .env.example" -ForegroundColor Yellow
}

Write-Host "🔄 Checking Supabase login status..." -ForegroundColor Blue

try {
    # Check if logged in
    $loginCheck = supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Not logged in to Supabase. Please run:" -ForegroundColor Red
        Write-Host "   supabase login" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "✅ Supabase login verified" -ForegroundColor Green

    # Deploy functions one by one
    $functions = @(
        "create-payment-intent",
        "create-connect-account", 
        "process-payout"
    )

    foreach ($func in $functions) {
        Write-Host "🚀 Deploying function: $func" -ForegroundColor Blue
        
        try {
            supabase functions deploy $func --no-verify-jwt
            Write-Host "✅ Successfully deployed: $func" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to deploy: $func" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "✅ All functions deployment completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Set up Stripe webhook endpoints:" -ForegroundColor White
    Write-Host "   - payment_intent.succeeded" -ForegroundColor Gray
    Write-Host "   - account.updated" -ForegroundColor Gray
    Write-Host "   - transfer.created" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Test functions with:" -ForegroundColor White
    Write-Host "   supabase functions invoke create-payment-intent --data '{\"amount\":1000}'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Monitor function logs:" -ForegroundColor White
    Write-Host "   supabase functions logs" -ForegroundColor Gray

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure you're logged in: supabase login" -ForegroundColor White
    Write-Host "2. Check your project connection: supabase projects list" -ForegroundColor White
    Write-Host "3. Verify function code syntax" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🚀 BOLT AUTO Payment Functions are live!" -ForegroundColor Green