# 🔧 BOLT Auto - Stripe Environment Variables Setup Guide

## 📋 Required Environment Variables

### 🎯 Frontend (.env)

Create or update your `.env` file in the project root:

```bash
# Stripe Configuration (Frontend)
VITE_STRIPE_PUBLIC_KEY=pk_test_...                    # Your Stripe publishable key
VITE_STRIPE_CONNECT_CLIENT_ID=ca_...                  # Stripe Connect client ID

# Supabase Configuration (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co   # Your Supabase URL
VITE_SUPABASE_ANON_KEY=eyJ...                        # Your Supabase anon key

# App Configuration
VITE_APP_URL=http://localhost:5173                   # Your app URL for redirects
```

### 🚀 Backend (Supabase Edge Functions)

Set these in your Supabase project settings or via CLI:

```bash
# Stripe Configuration (Backend)
STRIPE_SECRET_KEY=sk_test_...                        # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...                      # Webhook signing secret
STRIPE_CONNECT_CLIENT_ID=ca_...                      # Connect client ID

# Supabase Configuration (Backend)
SUPABASE_URL=https://your-project.supabase.co        # Your Supabase URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...                     # Service role key (full access)

# App URLs
FRONTEND_URL=http://localhost:5173                   # Frontend URL for redirects
```

## 🔑 How to Get Each Key

### 1. Stripe Keys

#### Get Stripe API Keys:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers → API keys**
3. Copy your **Publishable key** (`pk_test_...`) → `VITE_STRIPE_PUBLIC_KEY`
4. Reveal and copy your **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`

#### Get Stripe Connect Client ID:

1. In Stripe Dashboard, go to **Connect → Settings**
2. Copy your **Client ID** (`ca_...`) → `STRIPE_CONNECT_CLIENT_ID`

#### Get Webhook Secret:

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`, etc.
5. Copy the **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### 2. Supabase Keys

#### Get Supabase Keys:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **URL** → `SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 🛠️ Setting Environment Variables

### Frontend (.env file)

Create `.env` in your project root:

```bash
echo "VITE_STRIPE_PUBLIC_KEY=pk_test_your_key_here" > .env
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" >> .env
# ... add other variables
```

### Backend (Supabase CLI)

```bash
# Set secrets using Supabase CLI
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ_your_key_here
```

### Backend (Supabase Dashboard)

1. Go to **Project Settings → Edge Functions**
2. Add environment variables one by one
3. Deploy your functions after setting variables

## 🔒 Security Best Practices

### ✅ Do's

- ✅ Use test keys during development (`pk_test_`, `sk_test_`)
- ✅ Store production keys securely (never in version control)
- ✅ Use different keys for different environments
- ✅ Rotate webhook secrets regularly
- ✅ Set appropriate CORS origins
- ✅ Use service role key only on backend

### ❌ Don'ts

- ❌ Never commit secret keys to Git
- ❌ Don't use production keys in development
- ❌ Don't expose service role key on frontend
- ❌ Don't share webhook secrets publicly
- ❌ Don't hardcode keys in source code

## 🚀 Quick Setup Script

Create this script to set all variables at once:

```bash
# setup-stripe-env.ps1
param(
    [string]$StripePublicKey,
    [string]$StripeSecretKey,
    [string]$StripeWebhookSecret,
    [string]$StripeConnectClientId,
    [string]$SupabaseUrl,
    [string]$SupabaseAnonKey,
    [string]$SupabaseServiceRoleKey
)

# Frontend .env
@"
VITE_STRIPE_PUBLIC_KEY=$StripePublicKey
VITE_STRIPE_CONNECT_CLIENT_ID=$StripeConnectClientId
VITE_SUPABASE_URL=$SupabaseUrl
VITE_SUPABASE_ANON_KEY=$SupabaseAnonKey
VITE_APP_URL=http://localhost:5173
"@ | Out-File -FilePath .env -Encoding UTF8

# Backend secrets (Supabase)
supabase secrets set STRIPE_SECRET_KEY=$StripeSecretKey
supabase secrets set STRIPE_WEBHOOK_SECRET=$StripeWebhookSecret
supabase secrets set STRIPE_CONNECT_CLIENT_ID=$StripeConnectClientId
supabase secrets set SUPABASE_URL=$SupabaseUrl
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SupabaseServiceRoleKey
supabase secrets set FRONTEND_URL=http://localhost:5173

Write-Host "✅ Environment variables configured!" -ForegroundColor Green
```

Usage:

```powershell
./setup-stripe-env.ps1 -StripePublicKey "pk_test_..." -StripeSecretKey "sk_test_..." # ... etc
```

## 🧪 Testing Your Setup

### 1. Test Frontend Environment

```javascript
// In browser console
console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
// Should show: pk_test_...
```

### 2. Test Backend Environment

```bash
# Test Supabase function
supabase functions serve

# Check logs for environment variables
supabase functions logs stripe-webhook
```

### 3. End-to-End Test

```bash
# Run the security test
powershell scripts/test-stripe-webhook-security.ps1 -WebhookUrl "https://your-project.supabase.co/functions/v1/stripe-webhook"
```

## 📊 Environment Validation Checklist

| Variable                    | Type     | Example                   | Status |
| --------------------------- | -------- | ------------------------- | ------ |
| `VITE_STRIPE_PUBLIC_KEY`    | Frontend | `pk_test_51...`           | ⏳     |
| `STRIPE_SECRET_KEY`         | Backend  | `sk_test_51...`           | ⏳     |
| `STRIPE_WEBHOOK_SECRET`     | Backend  | `whsec_...`               | ⏳     |
| `STRIPE_CONNECT_CLIENT_ID`  | Both     | `ca_...`                  | ⏳     |
| `VITE_SUPABASE_URL`         | Frontend | `https://xxx.supabase.co` | ⏳     |
| `VITE_SUPABASE_ANON_KEY`    | Frontend | `eyJ...`                  | ⏳     |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend  | `eyJ...`                  | ⏳     |

## 🔄 Environment-Specific Configurations

### Development

```bash
# Use Stripe test mode
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Local URLs
VITE_APP_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Staging

```bash
# Still use test mode for staging
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Staging URLs
VITE_APP_URL=https://staging.boltauto.com
FRONTEND_URL=https://staging.boltauto.com
```

### Production

```bash
# Use Stripe live mode
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Production URLs
VITE_APP_URL=https://boltauto.com
FRONTEND_URL=https://boltauto.com
```

## 🚨 Troubleshooting

### Common Issues:

#### "Invalid API key provided"

- ✅ Check key format (starts with `pk_` or `sk_`)
- ✅ Verify you're using the correct environment (test vs live)
- ✅ Ensure no extra spaces or characters

#### "Webhook signature verification failed"

- ✅ Check `STRIPE_WEBHOOK_SECRET` is correct
- ✅ Verify webhook endpoint URL matches exactly
- ✅ Ensure webhook is active in Stripe dashboard

#### "Missing environment variable"

- ✅ Check variable names match exactly (case-sensitive)
- ✅ Restart your development server after adding variables
- ✅ Verify Supabase secrets are deployed

#### "CORS errors"

- ✅ Check `FRONTEND_URL` is set correctly
- ✅ Verify Supabase CORS settings
- ✅ Ensure Edge Functions have proper CORS headers

## 📞 Support

If you encounter issues:

1. Check this guide thoroughly
2. Review Stripe and Supabase documentation
3. Test with the provided scripts
4. Contact support with error logs

---

**🔐 Remember**: Keep your production keys secure and never share them publicly!
