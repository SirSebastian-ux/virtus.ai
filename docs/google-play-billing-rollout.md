# Virtus AI — Google Play Billing rollout controls (2026-11-03)

## Current implementation

- Android package: `com.virtusaiworld.app`
- Native Capacitor bridge: `VirtusPlayBilling` (Google Play Billing Library 9.1.0)
- Google Play products: `virtus_life_coach`, `virtus_trainer`, `virtus_mentor`
- Base plan: `monthly` (all currently Draft)
- Server verification API: `GET/POST /api/google-play/verify`
- Private database: `public.google_play_subscriptions`, migration `20261103122413`
- Website checkout: Stripe, untouched
- Android checkout: disabled by the server response `checkoutEnabled: false`

## Fail-closed configuration

The verification POST requires all three **server-side** environment variables:

- `VIRTUS_GOOGLE_PLAY_BILLING_ENABLED=true`
- `GOOGLE_PLAY_WIF_PROVIDER=projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/VERCEL_POOL/providers/VERCEL_PROVIDER`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=...@PROJECT_ID.iam.gserviceaccount.com`

These values must not use `NEXT_PUBLIC_`. Do **not** reuse the GitHub Actions workload identity pool for Vercel functions.
Create a *separate* Google Workload Identity Federation pool/provider restricted to Vercel's exact project ID, production environment and issuer. Configure service-account impersonation and enable the IAM Service Account Credentials API. The Vercel OIDC identity is taken from the server-provided `x-vercel-oidc-token` header and exchanged via Google STS and IAMCredentials. See https://vercel.com/docs/oidc/gcp.

For eventual native checkout, `NEXT_PUBLIC_VIRTUS_GOOGLE_PLAY_BILLING_ENABLED=true` is a secondary client-side flag. **Do not enable it until the backend activates entitlements, acknowledges purchases, and handles renewals.** The server `checkoutEnabled` remains false regardless of the client flag in this staged implementation.

## Provider-aware billing implementation staged

- Migration `20261103124558_virtus_multi_provider_billing_entitlements.sql` created a protected `virtus_billing_entitlements` ledger and a service-role-only transactional reconciliation RPC.
- Existing manually assigned paid plans are recorded as `manual` entries so Stripe or Google events do not downgrade them.
- `VIRTUS_MULTI_PROVIDER_BILLING_ENABLED=true` enables both Stripe reconciliation and Google Play fulfillment; **do not enable until credential and RTDN tests pass**.
- `/api/google-play/rtdn` validates Google-signed Pub/Sub push JWTs before processing notification payloads. RTDN never trusts a notification as a paid state; it rechecks the Google Publisher API.
- `GOOGLE_PLAY_RTDN_ENABLED=true` additionally enables authenticated RTDN, but only when Pub/Sub has been configured and tested.
- The current production deployment keeps Google checkout disabled even if the verification code is present.

## Required Vercel-to-Google Cloud configuration

Project: `melodic-nature-513606-u2` (number `481064087365`).
Vercel project: `virtus-ai`, team slug `sebastian-9493s-projects`.

1. Confirm the Vercel project's OIDC issuer mode under Settings → Security. Use **Team** issuer mode if available.
2. In Google Cloud, create **a distinct workload identity pool/provider for Vercel**. Set issuer to the exact Vercel issuer (for team mode, `https://oidc.vercel.com/sebastian-9493s-projects`) and allowed audience to `https://vercel.com/sebastian-9493s-projects`. Confirm these against Vercel project settings first.
3. Map `google.subject=assertion.sub` and restrict the provider to `assertion.sub == 'owner:sebastian-9493s-projects:project:virtus-ai:environment:production'`. Verify the actual subject from Vercel's settings/token reference before applying this condition.
4. Grant only that Vercel principal permission to impersonate the existing Play API service account, with no JSON private keys.
5. Configure `GOOGLE_PLAY_WIF_PROVIDER` and `GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL` in Vercel **server-side** environment variables. Keep `VIRTUS_GOOGLE_PLAY_BILLING_ENABLED` unset until a live token exchange passes.

## Required Pub/Sub push configuration

1. Enable Cloud Pub/Sub API and create a dedicated topic for `com.virtusaiworld.app`; grant `google-play-developer-notifications@system.gserviceaccount.com` Pub/Sub Publisher on that topic.
2. Create a Pub/Sub push subscription to `https://virtusaiworld.com/api/google-play/rtdn` with **authenticated push** using a dedicated Google service account, and a fixed expected OIDC audience.
3. Set `GOOGLE_PLAY_PUBSUB_PUSH_SERVICE_ACCOUNT` (expected push identity) and `GOOGLE_PLAY_PUBSUB_PUSH_AUDIENCE` (expected audience). Test its signed push authorization before setting `GOOGLE_PLAY_RTDN_ENABLED=true`.
4. Enable subscription + voided-purchase notifications in Play Console's Monetization setup and send a test message. Verify the message reaches the authenticated endpoint.
5. Confirm renewal, hold, grace, expiry, cancellation, and linked-token transitions against the Developer API and entitlement ledger.

## Remaining launch requirements

1. Set up Vercel -> Google Cloud Workload Identity Federation and verify short-lived service-account tokens from an actual Vercel Function.
2. Implement a **single, authoritative billing-source entitlement reconciler**, migrate/backfill existing Stripe subscription ownership, and eliminate direct provider overwrites of `profiles.plan`.
3. After verifying Google `subscriptionsv2.get` and granting server-side entitlement, call the Google Play acknowledgement endpoint within Google's required window. Do not acknowledge unfulfilled purchases.
4. Integrate authenticated Pub/Sub Real-time Developer Notifications and reliable retry/idempotency for renewal, hold, grace, cancellation, refund, expiration and linked token lifecycle.
5. Make `GET /api/google-play/verify` report `checkoutEnabled: true` **only** when backend readiness checks and system integration tests pass.
6. Activate monthly base plans in Google Play Console after product details, country pricing and compliance review.
7. Build and sign a new Android App Bundle (native changes cannot be shipped via Vercel web deployment). Release in closed testing, add Google Play license testers, test a complete test-payment lifecycle and restore across devices.
8. Verify website Stripe subscriptions and Android Play subscriptions cannot charge or revoke each other's access. Do not allow simultaneous conflicting provider-managed subscriptions without a clear account policy.

## Security invariants

- Never grant paid access based only on a device callback or unverified token.
- Never store raw Google purchase tokens in client-accessible storage.
- Require authenticated user identity and match Google's `obfuscatedExternalAccountId` to SHA-256 of the authenticated Supabase user ID.
- Deny a token already bound to a different account.
- The purchase-record table must remain RLS-enabled and restricted to the service role.
- Keep all real purchasing disabled during development.
