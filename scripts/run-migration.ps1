# BOLT AUTO - Database Migration Script
# =====================================
# This script runs the enhanced features migration

Write-Host "🚗 BOLT AUTO - Running Enhanced Features Migration" -ForegroundColor Green
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

Write-Host "🔄 Running migration: 20250621000000_enhanced_features.sql" -ForegroundColor Blue

try {
    # Run the migration
    supabase db push

    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Deploy Supabase Edge Functions:" -ForegroundColor White
    Write-Host "   supabase functions deploy create-payment-intent" -ForegroundColor Gray
    Write-Host "   supabase functions deploy create-connect-account" -ForegroundColor Gray
    Write-Host "   supabase functions deploy process-payout" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Configure Stripe webhooks at:" -ForegroundColor White
    Write-Host "   https://dashboard.stripe.com/webhooks" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Update environment variables with actual Stripe keys" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Test the new features in development mode" -ForegroundColor White

} catch {
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check your Supabase connection" -ForegroundColor White
    Write-Host "2. Verify your database credentials" -ForegroundColor White
    Write-Host "3. Check the migration file for syntax errors" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🚀 BOLT AUTO Enhanced Features are ready!" -ForegroundColor Green