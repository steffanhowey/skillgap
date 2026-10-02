# Billing test

Test mode. `npm run dev` on port 3000. The five Stripe names and `KICKOFF_PAYMENT_LINK_URL` are in `docs/DEPLOY_CHECKLIST.md`. Values stay in `.env.local`.

Forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Put the signing secret from that command in `STRIPE_WEBHOOK_SECRET` and restart the dev server.

Card: `4242 4242 4242 4242`. Any future expiry, any CVC, any postal code.

## Checks

1. Monthly purchase on `/pricing` sets `fp_profiles.plan` to `individual`.
2. Founding annual sets `is_founding` to true and the remaining count drops by one (100 minus rows with `is_founding` true).
3. Cancel in the customer portal sets `plan_status` to `canceled`.
4. On a free plan, the Do step of a second mission returns 402 and the player shows the paywall. Reading the mission stays open.
5. On a paid plan, that same Do step is allowed.

Checks 4 and 5 also run in `app/api/learn/paths/[id]/route.test.ts` without Stripe.
