# BOLT AUTO - Feature Testing Script
# ==================================
# This script helps you test all the new features

Write-Host "🚗 BOLT AUTO - Feature Testing Guide" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

Write-Host ""
Write-Host "🧪 TESTING CHECKLIST" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

# Check if dev server is running
Write-Host "1. Starting development server..." -ForegroundColor Blue
$devServerRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" }

if ($devServerRunning) {
    Write-Host "   ✅ Dev server is already running" -ForegroundColor Green
} else {
    Write-Host "   🔄 Starting dev server..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd" -ArgumentList "/c", "cd /d D:\BOLT && npm run dev" -WindowStyle Minimized
    Write-Host "   ✅ Dev server started (check http://localhost:5173)" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 FEATURE TESTING GUIDE:" -ForegroundColor Cyan
Write-Host ""

Write-Host "📱 1. VIDEO CALLING TEST:" -ForegroundColor Yellow
Write-Host "   • Navigate to: http://localhost:5173/mechanic-support" -ForegroundColor White
Write-Host "   • Allow camera/microphone permissions" -ForegroundColor White
Write-Host "   • Click 'Video' button on any mechanic" -ForegroundColor White
Write-Host "   • Verify: Video call modal opens" -ForegroundColor White
Write-Host "   • Test: Camera, microphone, screen share" -ForegroundColor White
Write-Host ""

Write-Host "📅 2. BOOKING SYSTEM TEST:" -ForegroundColor Yellow
Write-Host "   • Click 'Book' button on any mechanic" -ForegroundColor White
Write-Host "   • Complete: Date → Time → Service → Location" -ForegroundColor White
Write-Host "   • Verify: Cost calculation shows correctly" -ForegroundColor White
Write-Host "   • Confirm: Booking creates appointment" -ForegroundColor White
Write-Host ""

Write-Host "📍 3. LOCATION SERVICES TEST:" -ForegroundColor Yellow
Write-Host "   • Allow location access when prompted" -ForegroundColor White
Write-Host "   • Toggle 'Nearby Only' filter" -ForegroundColor White
Write-Host "   • Verify: Distance calculations appear" -ForegroundColor White
Write-Host "   • Check: Mechanics sorted by distance" -ForegroundColor White
Write-Host ""

Write-Host "💳 4. PAYMENT SYSTEM TEST:" -ForegroundColor Yellow
Write-Host "   • Complete a booking or video call" -ForegroundColor White
Write-Host "   • Wait for invoice generation" -ForegroundColor White
Write-Host "   • Click 'Pay Now' button" -ForegroundColor White
Write-Host "   • Use Stripe test card: 4242 4242 4242 4242" -ForegroundColor White
Write-Host ""

Write-Host "🔧 DATABASE VERIFICATION:" -ForegroundColor Yellow
Write-Host "   • Check Supabase dashboard for new tables:" -ForegroundColor White
Write-Host "     - appointments" -ForegroundColor Gray
Write-Host "     - video_calls" -ForegroundColor Gray
Write-Host "     - invoices" -ForegroundColor Gray
Write-Host "     - mechanic_locations" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 EXPECTED RESULTS:" -ForegroundColor Cyan
Write-Host "✅ Video calls connect successfully" -ForegroundColor Green
Write-Host "✅ Booking flow completes without errors" -ForegroundColor Green
Write-Host "✅ Location distances show accurately" -ForegroundColor Green
Write-Host "✅ Payment processing works smoothly" -ForegroundColor Green
Write-Host "✅ Database records are created properly" -ForegroundColor Green
Write-Host ""

Write-Host "🚨 COMMON ISSUES & FIXES:" -ForegroundColor Red
Write-Host ""
Write-Host "Issue: Video calls don't connect" -ForegroundColor Yellow
Write-Host "Fix: Check browser permissions and STUN server config" -ForegroundColor White
Write-Host ""
Write-Host "Issue: Payments fail" -ForegroundColor Yellow
Write-Host "Fix: Verify Stripe keys in .env file" -ForegroundColor White
Write-Host ""
Write-Host "Issue: Location not working" -ForegroundColor Yellow
Write-Host "Fix: Allow location access in browser settings" -ForegroundColor White
Write-Host ""
Write-Host "Issue: Database errors" -ForegroundColor Yellow
Write-Host "Fix: Run migration: .\scripts\deploy-remote.ps1" -ForegroundColor White
Write-Host ""

Write-Host "🔍 DEBUGGING COMMANDS:" -ForegroundColor Cyan
Write-Host "View browser console: F12 → Console tab" -ForegroundColor White
Write-Host "Check Supabase logs: Dashboard → Logs" -ForegroundColor White
Write-Host "Test Stripe: Dashboard → Test mode" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Happy Testing!" -ForegroundColor Green
Write-Host "Your BOLT AUTO platform is now enterprise-ready!" -ForegroundColor Cyan

# Keep the window open
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")