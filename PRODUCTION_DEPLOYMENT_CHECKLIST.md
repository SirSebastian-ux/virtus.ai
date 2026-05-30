# Virtus AI Production Deployment Checklist

## Before deployment

- Run `git status --short`.
- Confirm latest changes are committed and pushed.
- Confirm no secret files are tracked.
- Confirm Vercel has all variables from `.env.example`.

## Local verification

Run:

- `npm.cmd ci`
- `npm.cmd run build`

## Access checks

Normal user must not access:

- /admin/global-learning-report
- /admin/library-manager
- /api/admin/global-learning
- /api/admin/library-manager
- /api/library/ingest

Admin user should still access admin tools.

## Stripe checks

Confirm:

- Checkout opens for Plus and Premium.
- Stripe webhook updates plan.
- /api/account/plan does not directly upgrade users.
- Billing portal opens only for users with stripe_customer_id.

## Supabase checks

Confirm:

- user-files bucket is private.
- storage policies restrict access to own user folder.
- profiles, user_files, chat_sessions, capture_notes, project_spaces, and user_reasoning_preferences have RLS enabled.

## File privacy checks

Use two test users.

Confirm:

- User A can upload, download, and delete their own files.
- User B cannot access User A files.
- Unsupported and oversized files are blocked.

## Public pages

Confirm these load:

- /privacy
- /terms
- /legal
- /support
- /pricing
- /robots.txt
- /sitemap.xml

## Rollback

If production breaks:

1. Open Vercel.
2. Go to Deployments.
3. Redeploy the last known good deployment.
4. Test login, chat, account, and upgrade.
