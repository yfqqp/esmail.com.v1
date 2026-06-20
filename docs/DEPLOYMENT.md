# Deployment Guide

## 1. Provision Supabase

1. Create a project at supabase.com.
2. In the SQL Editor, run every file in `database/migrations/` in order (001 → 011). Each file is self-contained and commented with its purpose.
3. Under **Authentication → Providers**, ensure Email is enabled. Disable public signups if you want invite-only access (Authentication → Settings → "Allow new users to sign up").
4. Under **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose client-side)
5. (Optional, for AI vector search) Under **Database → Extensions**, enable `vector`.

## 2. Provision Cloudinary

1. Create a free account at cloudinary.com.
2. From the dashboard, copy `Cloud Name`, `API Key`, `API Secret` into `.env`.
3. No bucket/folder setup needed — the app creates folders under `ismail-platform/` automatically on first upload.

## 3. Configure environment variables in Vercel

In your Vercel project → Settings → Environment Variables, add every key from `.env.example`. Set them for **Production**, **Preview**, and **Development** as appropriate. Never commit `.env.local`.

Required:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_APP_URL          # e.g. https://ismailsafwan.com
```

Optional (AI features):
```
OPENAI_API_KEY
```

## 4. Deploy

```bash
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for automatic deploys on push to `main`.

## 5. First-run checklist

- [ ] Visit `/en/login`, sign up with your real email — this account becomes `owner` automatically.
- [ ] Visit `/en/admin/sections` — confirm the 9 seeded sections appear and the homepage renders them.
- [ ] Visit `/en/admin/settings` — set `site_url`, social links, contact email.
- [ ] Visit `/en/admin/seo` — review and customize per-page meta titles/descriptions.
- [ ] Visit `/en/admin/media` — upload your real photos (hero background, certificates, gallery).
- [ ] Visit `/en/admin/theme` — adjust colors/fonts if desired (defaults are production-ready as-is).
- [ ] Confirm `/sitemap.xml` and `/robots.txt` resolve correctly.
- [ ] Test the AI assistant — if `OPENAI_API_KEY` isn't set, it shows a graceful "setup required" state rather than erroring.

## 6. Custom domain

In Vercel → Settings → Domains, add your domain and follow the DNS instructions. Update `NEXT_PUBLIC_APP_URL` to match — this value feeds the sitemap, robots.txt, and Open Graph URLs.

## 7. Ongoing maintenance

- **Database migrations**: new schema changes go in `database/migrations/0XX_description.sql`, numbered sequentially, never edited after being applied to production.
- **RLS is your security boundary**: every table has Row Level Security enabled (migration 011). If you add a table, add its policies in the same migration that creates it.
- **Backups**: Supabase takes automatic daily backups on paid plans; enable Point-in-Time Recovery for production use.
- **Monitoring**: Vercel provides request logs and basic analytics out of the box. The in-app `/admin/analytics` page shows first-party visitor data stored in your own database — no third-party tracking required.
