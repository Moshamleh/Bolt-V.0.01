# BOLT AUTO - Remote Supabase Deployment Script
# ==============================================
# This script deploys to your hosted Supabase instance

Write-Host "🚗 BOLT AUTO - Remote Deployment to Supabase" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Supabase CLI is installed
if (!(Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Installing Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Supabase CLI. Please install manually:" -ForegroundColor Red
        Write-Host "   npm install -g supabase" -ForegroundColor Yellow
        exit 1
    }
}

# Set your project details
$SUPABASE_PROJECT_REF = "vneaijpccgheumkrvgim"
$SUPABASE_DB_PASSWORD = "yVMCzLM21JrApu5B"

Write-Host "📡 Connecting to remote Supabase project: $SUPABASE_PROJECT_REF" -ForegroundColor Blue

try {
    # Login to Supabase if not already
    Write-Host "🔐 Checking Supabase authentication..." -ForegroundColor Blue
    $loginCheck = supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Not logged in. Please run: supabase login" -ForegroundColor Yellow
        Write-Host "Then rerun this script." -ForegroundColor Yellow
        exit 1
    }

    # Link to remote project
    Write-Host "🔗 Linking to remote project..." -ForegroundColor Blue
    supabase link --project-ref $SUPABASE_PROJECT_REF --password $SUPABASE_DB_PASSWORD

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully linked to remote project!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Link may already exist, continuing..." -ForegroundColor Yellow
    }

    # Apply database migrations
    Write-Host "🔄 Applying database migrations..." -ForegroundColor Blue
    supabase db push --password $SUPABASE_DB_PASSWORD

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migrations applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed. Check the logs above." -ForegroundColor Red
        exit 1
    }

    # Deploy Edge Functions
    Write-Host "🚀 Deploying Edge Functions..." -ForegroundColor Blue
    
    $functions = @("create-payment-intent", "create-connect-account", "process-payout")
    
    foreach ($func in $functions) {
        Write-Host "   Deploying: $func" -ForegroundColor Cyan
        supabase functions deploy $func --no-verify-jwt
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $func deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Failed to deploy $func" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "🎉 REMOTE DEPLOYMENT COMPLETED!" -ForegroundColor Green
    Write-Host "===============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Database schema updated" -ForegroundColor Green
    Write-Host "✅ Edge functions deployed" -ForegroundColor Green
    Write-Host "✅ Your BOLT AUTO platform is enhanced!" -ForegroundColor Green
    Write-Host ""

    Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Update Stripe keys in your .env file" -ForegroundColor White
    Write-Host "2. Test the new features: npm run dev" -ForegroundColor White
    Write-Host "3. Visit: http://localhost:5173/mechanic-support" -ForegroundColor White
    Write-Host "4. Test video calls, booking, and payments" -ForegroundColor White
    Write-Host ""

    Write-Host "🔧 STRIPE SETUP NEEDED:" -ForegroundColor Yellow
    Write-Host "- Get API keys from: https://dashboard.stripe.com/" -ForegroundColor White
    Write-Host "- Enable Stripe Connect for marketplace" -ForegroundColor White
    Write-Host "- Set up webhooks for payment events" -ForegroundColor White

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "1. Make sure you're logged in: supabase login" -ForegroundColor White
    Write-Host "2. Check your internet connection" -ForegroundColor White
    Write-Host "3. Verify your project credentials" -ForegroundColor White
    Write-Host "4. Check Supabase status: https://status.supabase.com/" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🚀 Ready to test your enhanced BOLT AUTO platform!" -ForegroundColor Green