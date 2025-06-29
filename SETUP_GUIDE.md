# 🚗 BOLT AUTO - Enhanced Features Setup Guide

## 🎯 Overview

This guide will help you set up the new **Payment Processing**, **Location Services**, **Video Calling**, and **Booking System** features.

---

## 📋 Prerequisites

### Required Accounts & Services:

1. **Supabase Project** (you already have this)
2. **Stripe Account** - [Get started here](https://dashboard.stripe.com/register)
3. **Google Cloud Console** - For Maps API (optional but recommended)
4. **TURN Server** - For production video calls (Twilio, Xirsys, or self-hosted)

### Required CLI Tools:

```bash
# Install Supabase CLI
npm install -g supabase

# Install Stripe CLI (optional, for webhooks testing)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe
```

---

## 🚀 Step-by-Step Setup

### Step 1: Environment Configuration

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Update your `.env` file with actual values:**

   ```env
   # Supabase (you already have these)
   VITE_SUPABASE_URL=https://vneaijpccgheumkrvgim.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PGPASSWORD=yVMCzLM21JrApu5B

   # Stripe Configuration
   VITE_STRIPE_PUBLIC_KEY=pk_test_your_actual_key
   STRIPE_SECRET_KEY=sk_test_your_actual_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

### Step 2: Database Migration

1. **Run the migration script:**

   ```powershell
   # Windows PowerShell
   .\scripts\run-migration.ps1

   # Or manually:
   supabase db push
   ```

2. **Verify tables were created:**
   - `invoices`
   - `mechanic_locations`
   - `service_areas`
   - `appointments`
   - `video_calls`
   - `mechanic_payouts`

### Step 3: Deploy Supabase Functions

1. **Login to Supabase:**

   ```bash
   supabase login
   ```

2. **Deploy the functions:**

   ```powershell
   # Windows PowerShell
   .\scripts\deploy-functions.ps1

   # Or manually:
   supabase functions deploy create-payment-intent
   supabase functions deploy create-connect-account
   supabase functions deploy process-payout
   ```

### Step 4: Stripe Configuration

1. **Get your Stripe keys:**

   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Get your **Publishable Key** and **Secret Key**
   - Enable **Stripe Connect** for marketplace functionality

2. **Set up webhooks:**

   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `account.updated`
     - `transfer.created`

3. **Configure Connect settings:**
   - Enable Express accounts
   - Set up your platform fees (we use 15%)

### Step 5: WebRTC Configuration (Video Calls)

1. **For Development (using free STUN servers):**

   ```env
   VITE_WEBRTC_STUN_SERVERS=stun:stun.l.google.com:19302
   ```

2. **For Production (requires TURN servers):**

   ```env
   VITE_WEBRTC_TURN_SERVER=turn:your-server:3478
   VITE_WEBRTC_TURN_USERNAME=username
   VITE_WEBRTC_TURN_CREDENTIAL=password
   ```

   **TURN Server Options:**

   - [Twilio STUN/TURN](https://www.twilio.com/stun-turn)
   - [Xirsys](https://xirsys.com/)
   - Self-hosted with [coturn](https://github.com/coturn/coturn)

### Step 6: Location Services (Optional)

1. **Google Maps API (recommended):**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API
   - Create API key and restrict it to your domain
   - Add to `.env`: `VITE_GOOGLE_MAPS_API_KEY=your_api_key`

2. **Alternative: Use free geocoding service:**
   - The system will fall back to BigDataCloud (free tier)

---

## 🧪 Testing the Features

### 1. Test Payment Processing

```bash
# Test payment intent creation
curl -X POST https://your-project.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'
```

### 2. Test Video Calling

1. Open two browser windows/tabs
2. Navigate to `/mechanic-support`
3. Start a video call between mechanic and customer
4. Verify audio, video, and screen sharing work

### 3. Test Booking System

1. Go to `/mechanic-support`
2. Click "Book" on a mechanic
3. Complete the booking flow
4. Verify appointment is created in database

### 4. Test Location Services

1. Enable location in browser
2. Toggle "Nearby Only" filter
3. Verify distance calculations
4. Test real-time location updates

---

## 🔧 Troubleshooting

### Common Issues:

1. **Migration fails:**

   ```bash
   # Check connection
   supabase status

   # Reset and retry
   supabase db reset
   supabase db push
   ```

2. **Functions not deploying:**

   ```bash
   # Check login status
   supabase projects list

   # Re-login if needed
   supabase login
   ```

3. **Video calls not connecting:**

   - Check STUN/TURN server configuration
   - Verify firewall settings
   - Test in different network environments

4. **Payments failing:**
   - Verify Stripe keys are correct
   - Check webhook endpoints
   - Test with Stripe test cards

### Debug Commands:

```bash
# View function logs
supabase functions logs

# Test database connection
supabase db diff --use-migra

# Check edge function status
supabase functions list
```

---

## 🚀 Production Deployment

### Required for Production:

1. **SSL Certificates** - Enable HTTPS
2. **TURN Servers** - For reliable video calls
3. **Stripe Live Keys** - Switch from test to live mode
4. **Database Backups** - Set up automated backups
5. **Monitoring** - Error tracking and performance monitoring

### Security Checklist:

- [ ] All API keys secured
- [ ] CORS properly configured
- [ ] RLS policies tested
- [ ] Webhook signatures verified
- [ ] Rate limiting enabled
- [ ] Input validation in place

---

## 📞 Support

### Need Help?

1. **Check the logs:**

   - Browser console for frontend issues
   - Supabase logs for backend issues
   - Stripe dashboard for payment issues

2. **Common resources:**

   - [Supabase Documentation](https://supabase.com/docs)
   - [Stripe Connect Guide](https://stripe.com/docs/connect)
   - [WebRTC Documentation](https://webrtc.org/getting-started/)

3. **Test in stages:**
   - Test each feature individually
   - Use test data and test accounts
   - Monitor performance and errors

---

## 🎉 What's Working Now

After completing this setup, you'll have:

✅ **Real-time video/voice calling** with mechanics
✅ **Professional booking system** with calendar integration
✅ **Automated payment processing** with Stripe
✅ **Location-based mechanic discovery**
✅ **Distance-based pricing** calculations
✅ **Automatic invoice generation**
✅ **Mechanic payout system**
✅ **Real-time location tracking**

**Your BOLT AUTO platform is now enterprise-ready!** 🚗💨
