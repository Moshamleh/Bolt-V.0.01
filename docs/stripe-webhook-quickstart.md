# 🚀 BOLT Auto - Stripe Webhook Quick Start Guide

## 🎯 Overview

This guide will help you quickly deploy the secure Stripe webhook handler for BOLT Auto. The webhook endpoint will be available at:

```
https://bolt-auto.com/api/stripe/webhooks
```

## ⚡ Quick Deployment (5 minutes)

### 1. Prerequisites Check

Ensure you have:

- [x] Supabase CLI installed
- [x] Stripe account with webhook secret
- [x] Environment variables configured
- [x] Project repository cloned

### 2. Environment Setup

Create/update your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...                    # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...                  # Your webhook secret from Stripe
STRIPE_CONNECT_CLIENT_ID=ca_...                  # Connect client ID

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co    # Your Supabase URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...                 # Service role key
```

### 3. One-Command Deployment

```bash
powershell -ExecutionPolicy Bypass -File scripts/deploy-stripe-webhook.ps1 -Environment production
```

### 4. Configure Stripe Dashboard

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to your environment variables

### 5. Verify Deployment

```bash
# Test the webhook
powershell scripts/test-stripe-webhook-security.ps1 -WebhookUrl "https://your-project.supabase.co/functions/v1/stripe-webhook"
```

## 🔐 Security Verification

### Critical Security Checks ✅

- [x] **Signature Verification**: All requests validated with Stripe signatures
- [x] **Rate Limiting**: 100 requests/minute per IP with automatic blocking
- [x] **CORS Protection**: Strict origin validation and secure headers
- [x] **Input Validation**: All inputs sanitized and validated
- [x] **Error Handling**: No sensitive data leaked in error responses
- [x] **Audit Logging**: Complete transaction audit trail
- [x] **Encryption**: All data encrypted in transit and at rest

### Security Headers Enabled 🛡️

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 📊 What the Webhook Handles

### ✅ Supported Payment Events

| Event                           | Action                      | Security Level |
| ------------------------------- | --------------------------- | -------------- |
| `checkout.session.completed`    | Process successful payments | 🔴 Critical    |
| `checkout.session.expired`      | Handle expired sessions     | 🟡 Medium      |
| `payment_intent.succeeded`      | Confirm payment success     | 🔴 Critical    |
| `payment_intent.payment_failed` | Handle failed payments      | 🟡 Medium      |
| `invoice.payment_succeeded`     | Process invoice payments    | 🔴 Critical    |
| `invoice.payment_failed`        | Handle invoice failures     | 🟡 Medium      |

### 🚀 Enhanced Features

- **Multi-payment type support**: Boost orders, part purchases, service payments
- **Real-time notifications**: Users notified instantly of payment status
- **Automatic reconciliation**: Database updated atomically
- **Fraud detection**: Suspicious patterns logged and flagged
- **Compliance logging**: Full audit trail for regulatory requirements

## 🗄️ Database Tables Created

The webhook automatically creates these secure tables:

```sql
✅ payment_audit_log      -- Complete payment audit trail
✅ purchases              -- Marketplace transactions
✅ service_payments       -- Mechanic service payments
✅ payment_intents        -- Stripe payment intent tracking
✅ payouts                -- Mechanic payout records
✅ webhook_security_log   -- Security monitoring
✅ webhook_rate_limits    -- Rate limiting protection
```

## 🔍 Monitoring & Alerts

### Real-time Monitoring 📈

Access your webhook monitoring at:

- **Supabase Dashboard**: https://app.supabase.com/project/your-project/functions
- **Stripe Dashboard**: https://dashboard.stripe.com/webhooks
- **Security Logs**: Query `webhook_security_log` table

### Key Metrics to Watch 📊

- **Success Rate**: >99% (alert if <95%)
- **Response Time**: <500ms (alert if >1000ms)
- **Failed Signatures**: 0 (alert on any)
- **Rate Limiting**: <1% (alert if >5%)

### Sample Monitoring Queries

```sql
-- Payment success rate (last 24 hours)
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM payment_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Security incidents
SELECT
  ip_address,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM webhook_security_log
WHERE signature_valid = false
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5;
```

## 🚨 Emergency Procedures

### If Webhook is Compromised 🚨

1. **Immediately disable** the webhook in Stripe Dashboard
2. **Rotate webhook secret** in Stripe and update environment
3. **Check security logs** for suspicious activity:
   ```sql
   SELECT * FROM webhook_security_log
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```
4. **Redeploy** with new secrets
5. **Monitor closely** for 24 hours after restoration

### Contact Information 📞

- **Emergency**: security@boltauto.com
- **Development**: dev@boltauto.com
- **Stripe Support**: https://support.stripe.com

## 📋 Maintenance Schedule

### Daily ✅

- [ ] Check webhook success rate
- [ ] Review security logs for anomalies
- [ ] Verify payment reconciliation

### Weekly ✅

- [ ] Run security test suite
- [ ] Review rate limiting patterns
- [ ] Check database performance

### Monthly ✅

- [ ] Rotate webhook secrets
- [ ] Security audit review
- [ ] Performance optimization
- [ ] Update dependencies

## 🎉 You're All Set!

Your BOLT Auto Stripe webhook is now:

- ✅ Deployed with enterprise-grade security
- ✅ Monitoring all payment events
- ✅ Protecting against attacks
- ✅ Logging all activities for compliance
- ✅ Ready for production traffic

### Test Your Setup

Send a test webhook from Stripe Dashboard to verify everything works:

1. Go to Stripe Dashboard > Webhooks
2. Click your webhook endpoint
3. Click "Send test webhook"
4. Select "checkout.session.completed"
5. Verify success in logs

**🔐 Remember**: Security is critical. Monitor your webhook regularly and report any suspicious activity immediately.

---

**Need Help?**

- 📖 Full documentation: [docs/stripe-webhook-security.md](./stripe-webhook-security.md)
- 🧪 Run security tests: `scripts/test-stripe-webhook-security.ps1`
- 🚀 Redeploy: `scripts/deploy-stripe-webhook.ps1`
