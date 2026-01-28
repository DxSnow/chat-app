# Chat App TODO

## Email Setup for Production

To send OTP emails to any user (not just your own email), you need to verify a domain in Resend:

1. **Buy a domain** (~$10/year from Namecheap, Cloudflare, Porkbun, etc.)
   - Note: DuckDNS doesn't support TXT records, so you can't use it for email verification

2. **Add domain in Resend**: https://resend.com/domains
   - Click "Add Domain"
   - Enter your domain

3. **Add DNS records** (Resend will provide these):
   - SPF record (TXT)
   - DKIM record (TXT)
   - Optional: DMARC record

4. **Click "Verify"** in Resend after adding DNS records

5. **Update server/.env**:
   ```
   EMAIL_FROM=ChaChaChat <noreply@yourdomain.com>
   ```

---

## Current Workaround

For now, OTP codes are logged to the server terminal:
```
========================================
OTP CODE for user@example.com: 123456
========================================
```

This works for development and testing.
