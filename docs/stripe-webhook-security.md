# BOLT Auto - Stripe Webhook Security Documentation

## 🔐 Overview

This document outlines the comprehensive security measures implemented in the BOLT Auto Stripe webhook handler. Given the sensitive nature of payment processing and the critical security requirements of the platform, this webhook has been designed with multiple layers of protection.

## 🛡️ Security Features

### 1. Request Validation & Authentication

#### Stripe Signature Verification

- **Mandatory signature verification** using Stripe's webhook signature
- **Timestamp validation** to prevent replay attacks
- **Rejection of unsigned requests** with appropriate error responses

#### Request Method Validation

- **POST-only endpoints** - all other methods return 405 Method Not Allowed
- **CORS preflight handling** for cross-origin requests
- **Content-type validation** for application/json

### 2. Rate Limiting & DoS Protection

#### Built-in Rate Limiting

- **100 requests per minute per IP** address
- **Sliding window rate limiting** with automatic cleanup
- **429 Too Many Requests** response for rate-limited requests
- **IP-based tracking** with memory-efficient storage

#### Request Size Limits

- **Maximum request body size** validation
- **Empty request body rejection**
- **Malformed JSON handling**

### 3. Security Headers

#### Standard Security Headers

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

#### CORS Configuration

- **Restrictive CORS policy** allowing only necessary headers
- **Specific origin validation** for production environments
- **Credential handling** with secure defaults

### 4. Comprehensive Logging & Monitoring

#### Security Event Logging

- **All webhook requests logged** with sanitized data
- **IP address tracking** for security monitoring
- **Failed signature attempts** logged with details
- **Rate limiting events** tracked for analysis

#### Audit Trail

- **Complete payment audit log** for compliance
- **User activity tracking** for suspicious behavior detection
- **Transaction correlation** across multiple systems
- **GDPR-compliant data retention** with automatic cleanup

### 5. Error Handling & Information Disclosure Prevention

#### Secure Error Responses

- **Generic error messages** to prevent information leakage
- **Detailed logging** without exposing sensitive data in responses
- **Consistent error format** across all failure scenarios
- **No stack traces** in production responses

## 🚀 Supported Webhook Events

### Payment Events

- `checkout.session.completed` - Successful payment completion
- `checkout.session.expired` - Payment session expiration
- `payment_intent.succeeded` - Payment intent success
- `payment_intent.payment_failed` - Payment intent failure

### Invoice Events

- `invoice.payment_succeeded` - Invoice payment success
- `invoice.payment_failed` - Invoice payment failure

### Subscription Events

- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancellation

### Connect Events

- `account.updated` - Stripe Connect account updates
- `payout.paid` - Successful payout to mechanic
- `payout.failed` - Failed payout attempt

## 💾 Database Schema

### Payment Audit Log

```sql
CREATE TABLE payment_audit_log (
    id UUID PRIMARY KEY,
    stripe_session_id TEXT UNIQUE,
    user_id UUID REFERENCES profiles(id),
    amount INTEGER,
    currency TEXT DEFAULT 'usd',
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Security Monitoring

```sql
CREATE TABLE webhook_security_log (
    id UUID PRIMARY KEY,
    ip_address TEXT NOT NULL,
    request_method TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    signature_valid BOOLEAN NOT NULL,
    rate_limited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Required Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...          # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook endpoint secret
STRIPE_CONNECT_CLIENT_ID=ca_...        # Connect client ID

# Required Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co   # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Service role key for RLS bypass

# Security Configuration
WEBHOOK_RATE_LIMIT_PER_MINUTE=100      # Requests per minute per IP
WEBHOOK_MAX_BODY_SIZE=1048576          # Maximum request body size (1MB)
WEBHOOK_ENABLE_SECURITY_LOGGING=true   # Enable security event logging
```

### Stripe Dashboard Configuration

1. **Create webhook endpoint** with URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
2. **Enable required events** (see supported events above)
3. **Configure webhook secret** and add to environment variables
4. **Test webhook** with Stripe CLI or dashboard

## 🧪 Testing & Validation

### Security Testing Script

Run the comprehensive security test suite:

```bash
powershell -ExecutionPolicy Bypass -File scripts/test-stripe-webhook-security.ps1 -WebhookUrl "https://your-project.supabase.co/functions/v1/stripe-webhook" -Verbose
```

### Manual Testing Checklist

- [ ] **Signature verification** - Test with invalid signatures
- [ ] **Rate limiting** - Send rapid requests to trigger limits
- [ ] **CORS handling** - Test preflight requests
- [ ] **Error responses** - Verify no sensitive data leakage
- [ ] **Method validation** - Test with GET, PUT, DELETE methods
- [ ] **Response times** - Ensure fast response times
- [ ] **Security headers** - Verify all headers are present

## 🚨 Security Monitoring

### Real-time Alerts

Set up monitoring for:

- **Failed signature verifications** (potential attack)
- **Rate limiting triggers** (DoS attempts)
- **Unusual payment patterns** (fraud detection)
- **High error rates** (system issues)
- **Slow response times** (performance issues)

### Log Analysis Queries

```sql
-- Failed signature attempts in last hour
SELECT ip_address, COUNT(*) as attempts
FROM webhook_security_log
WHERE signature_valid = false
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY attempts DESC;

-- Payment audit summary
SELECT status, COUNT(*) as count, SUM(amount) as total_amount
FROM payment_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

## 🔄 Deployment Process

### 1. Pre-deployment Checklist

- [ ] **Environment variables configured**
- [ ] **Database migration completed**
- [ ] **Security tests passed**
- [ ] **Code review completed**
- [ ] **Staging environment tested**

### 2. Deployment Steps

```bash
# 1. Run database migration
supabase db push

# 2. Deploy webhook function
supabase functions deploy stripe-webhook --no-verify-jwt

# 3. Run security tests
powershell scripts/deploy-stripe-webhook.ps1 -Environment production

# 4. Configure Stripe webhook endpoint
# 5. Test with small transactions
```

### 3. Post-deployment Verification

- [ ] **Webhook endpoint responding**
- [ ] **Test transactions processing**
- [ ] **Logs showing correct data**
- [ ] **Monitoring alerts configured**
- [ ] **Performance metrics normal**

## 🎯 Best Practices

### Development

1. **Never log sensitive data** (payment details, personal info)
2. **Use secure coding practices** (input validation, output encoding)
3. **Implement proper error handling** (fail secure principles)
4. **Regular security reviews** (code audits, penetration testing)

### Operations

1. **Monitor webhook health** (uptime, response times, error rates)
2. **Regular secret rotation** (webhook secrets, API keys)
3. **Audit log review** (daily review of security events)
4. **Incident response plan** (security breach procedures)

### Compliance

1. **PCI DSS compliance** (secure payment processing)
2. **GDPR compliance** (data protection, retention policies)
3. **SOX compliance** (financial controls, audit trails)
4. **Regular compliance audits** (quarterly reviews)

## 🚨 Incident Response

### Security Incident Types

- **Webhook signature bypass attempts**
- **Rate limiting threshold breaches**
- **Unusual payment patterns**
- **Failed authentication attempts**
- **Data exfiltration attempts**

### Response Procedures

1. **Immediate assessment** (severity, impact, scope)
2. **Containment** (disable webhook if necessary)
3. **Investigation** (log analysis, forensics)
4. **Recovery** (restore normal operations)
5. **Lessons learned** (improve security measures)

## 📞 Support & Escalation

### Internal Team

- **Security Team**: security@boltauto.com
- **Development Team**: dev@boltauto.com
- **Operations Team**: ops@boltauto.com

### External Support

- **Stripe Support**: https://support.stripe.com
- **Supabase Support**: https://supabase.com/support
- **Security Consultant**: [Contact Information]

## 📚 Additional Resources

- [Stripe Webhook Security Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Supabase Edge Functions Security](https://supabase.com/docs/guides/functions/security)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)

---

**⚠️ IMPORTANT**: This webhook handles sensitive payment data. Always follow security best practices and regularly review and update security measures. Never deploy to production without thorough testing and security validation.
