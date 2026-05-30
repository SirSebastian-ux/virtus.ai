# Virtus AI Security Stabilization Record

This file documents the security stabilization work completed after the Virtus AI audit.

## Completed fixes

1. Locked admin pages and admin APIs with a centralized admin guard.
2. Disabled direct user plan updates through /api/account/plan.
3. Routed upgrade UI through Stripe checkout and Stripe billing portal only.
4. Added legal, privacy, terms, support, pricing, robots.txt, and sitemap.xml routes.
5. Hardened user file upload, download, and delete routes.
6. Added basic rate limits to expensive routes:
   - /api/chat
   - /api/capture/transcribe
   - /api/files/upload
   - /api/files/create-image
   - /api/files/create-pptx
   - /api/web-search
7. Hardened account profile updates against unsafe billing/admin/identity field changes.
8. Hardened Stripe checkout, portal, and webhook routes.
9. Fixed Supabase Storage policies for the user-files bucket.
10. Added missing RLS policies for user_files and chat_sessions.
11. Documented Supabase RLS and storage policies in:
    - supabase-security/rls-and-storage-policies.sql
12. Added baseline browser security headers in next.config.mjs.
13. Confirmed no secret env files are tracked by Git.
14. Added local Git exclude entries to prevent accidental commit of backup/game/dev folders.

## Remaining notes

The current local uncommitted package.json and package-lock.json changes are related to Three.js / Virtus Realms work, not security.

Do not commit package.json or package-lock.json until the Virtus Realms feature is ready to be reviewed and committed together.

## Recommended next production checks

1. Confirm latest GitHub commit deployed successfully on Vercel.
2. Test normal user cannot access:
   - /admin/global-learning-report
   - /admin/library-manager
   - /api/admin/global-learning
   - /api/admin/library-manager
   - /api/library/ingest
3. Test Stripe checkout and webhook with a real test purchase.
4. Test file upload, download, and delete with two separate users.
5. Confirm Supabase user-files bucket remains private.
6. Confirm RLS policies remain active in Supabase.
7. Review monitoring options such as Sentry or PostHog later, with privacy-safe settings.
