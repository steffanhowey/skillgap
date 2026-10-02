# Email setup — Resend

Resend is the only email vendor: Supabase magic links, product email, and the Pulse newsletter. Verify `skillgap.ai` in Resend before any of this sends.

## Sender addresses

| Use | Address | Where it is set |
|---|---|---|
| Product email and Pulse | `hello@skillgap.ai` | `EMAIL_FROM_PRODUCT` = `SkillGap <hello@skillgap.ai>` |
| Auth (magic links, change-email) | `no-reply@skillgap.ai` | Supabase SMTP sender, and `EMAIL_FROM_AUTH` = `SkillGap <no-reply@skillgap.ai>` |

Product mail goes through `lib/email/client.ts` and `EMAIL_FROM_PRODUCT`. Magic links and the change-email confirmation go through Supabase, using the SMTP sender below, not through that client.

## Supabase custom SMTP

Authentication → Emails → SMTP Settings. Enable custom SMTP.

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the `RESEND_API_KEY` |
| Sender email | `no-reply@skillgap.ai` |
| Sender name | `SkillGap` |

Add `https://skillgap.ai/callback` to the redirect allow list. The change-email confirmation uses the same sender.

## DNS

Add `skillgap.ai` in the Resend dashboard first, then copy the Records tab into Namecheap. The DKIM names and values are generated for this domain. Paste those. Do not invent a key.

SPF stays on the sending subdomain `send` (Namecheap appends `.skillgap.ai`). Do not add Resend's include to the apex SPF record.

For a domain created before August 2026, Resend shows this SPF pair. If the Records tab shows CNAMEs instead, add those and skip this pair.

| Purpose | Type | Host | Value |
|---|---|---|---|
| SPF | MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority 10; use the host Resend shows if the region differs) |
| SPF | TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| DKIM | as shown | as shown | the value in the Records tab. Older domains: one TXT at `resend._domainkey`. Newer domains: usually three CNAMEs under `*_domainkey`. |
| DMARC | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@skillgap.ai` |

DMARC starts at `p=none`. Resend does not create this record. Leave it there until magic links and product mail are landing in the inbox, then tighten the policy.

A CNAME cannot share a host with another record. If `send` already has an A, TXT, or MX record, remove it before adding the Resend record.

## Inbox test

After the API key and `EMAIL_FROM_PRODUCT` are on Vercel:

```bash
curl -X POST https://skillgap.ai/api/email/test \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"template":"fridayCheckIn","to":"you@gmail.com"}'
```

`template` is `fridayCheckIn`, `mondayManagerDigest`, or `pulseIssue`. Send each to a Gmail, Outlook, and iCloud address. Magic-link delivery is a separate check: request a login link after the Supabase SMTP settings are saved.
