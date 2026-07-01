# Production Launch Checklist

Work through this top to bottom. Each section gates the next — don't skip ahead.

## 1. Local verification (before touching any cloud service)

- [ ] `npm install` completes cleanly
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes (or only has warnings you've reviewed)
- [ ] `npm run build` completes successfully
- [ ] `npm run dev` boots and the homepage renders at `localhost:3000`

This environment could not run `npm install` (no network access), so these four commands are unverified by me — they are the single highest-value thing to run yourself before going further.

## 2. Supabase setup

- [ ] Project created at supabase.com
- [ ] Migrations `001` through `012` run **in numeric order** via SQL Editor or `supabase db push`
- [ ] Confirm `select * from public.sections;` returns 9 seeded rows
- [ ] Confirm `select * from public.profiles;` returns zero rows (no signups yet)
- [ ] Email auth provider enabled (Authentication → Providers)
- [ ] Decide: open signups or invite-only (Authentication → Settings → "Allow new users to sign up") — recommend **disabling** public signup once your owner account exists, since anyone who signs up otherwise lands as `viewer` with no real access, but it's cleaner to close the door
- [ ] (Optional) `vector` extension enabled if you plan to activate real AI retrieval later — not required at launch
- [ ] (Optional) Confirm `pg_cron` extension is available on your plan; if not, you'll use the Vercel Cron fallback (see step 5)
- [ ] Copy `Project URL`, `anon public` key, `service_role` key into your env vars

## 3. Cloudinary setup

- [ ] Account created, cloud name/API key/API secret copied into env vars
- [ ] No manual folder setup needed — the app creates `ismail-platform/*` folders on first upload

## 4. Environment variables

Set every variable from `.env.example` in your hosting provider (see table below). Do not commit `.env.local`.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only, never exposed client-side |
| `CLOUDINARY_CLOUD_NAME` | Yes | |
| `CLOUDINARY_API_KEY` | Yes | |
| `CLOUDINARY_API_SECRET` | Yes | |
| `NEXT_PUBLIC_APP_URL` | Yes | Must match real production domain — feeds sitemap, robots.txt, OG tags, and the Server Actions origin allowlist |
| `OPENAI_API_KEY` | No | AI Assistant shows graceful "setup required" state without it |
| `CRON_SECRET` | No | Only needed if using the Vercel Cron fallback instead of `pg_cron` |

## 5. Analytics refresh scheduling

Pick one:

- **If `pg_cron` is available** on your Supabase plan: nothing to do — migration 012 already schedules an hourly refresh automatically.
- **If not**: set up a Vercel Cron Job (`vercel.json`) hitting `POST /api/admin/analytics/refresh` hourly with header `x-cron-secret: <your CRON_SECRET value>`.

## 6. Deploy

- [ ] Push to GitHub
- [ ] Connect repo in Vercel, set environment variables for Production + Preview
- [ ] Deploy
- [ ] Confirm the deployed homepage renders all 9 sections
- [ ] Confirm `/sitemap.xml` and `/robots.txt` resolve

## 7. First admin account

- [ ] Visit `/en/login`, sign up with your real email (Supabase's default sign-up flow, or build a sign-up form if you haven't — the codebase currently only ships a sign-**in** form at `/login`; see note below)
- [ ] Confirm this account is `owner` (check `select role from public.profiles;` in Supabase)
- [ ] Sign in, confirm `/en/admin/sections` loads and shows the 9 seeded sections

> **Note**: the shipped `/login` page handles sign-**in** only (`signInWithPassword`). To create the first account you'll either (a) use the Supabase Dashboard → Authentication → Users → "Add user" with a password, or (b) temporarily call `supabase.auth.signUp()` from the browser console / a one-off script. A proper sign-up UI was out of scope for this build pass — worth adding before inviting any other admins.

## 8. Content pass

- [ ] `/admin/media` — upload real photos (hero background, certificates, gallery)
- [ ] `/admin/sections` — review/edit the 9 seeded sections with real copy
- [ ] `/admin/projects`, `/admin/certificates`, `/admin/timeline`, `/admin/blog`, `/admin/quotes` — replace seed content or extend it
- [ ] `/admin/settings` — set real site name, tagline, contact email, social links
- [ ] `/admin/seo` — review per-page meta titles/descriptions
- [ ] `/admin/theme` — adjust colors/fonts if desired (defaults are launch-ready as shipped)
- [ ] `/admin/navigation` — confirm menu items match your final section order

## 9. Security verification

- [ ] Confirm a `viewer`-role test account **cannot** reach `/admin` (redirects to homepage)
- [ ] Confirm an `editor`-role account **cannot** delete a project, certificate, or section (403)
- [ ] Confirm an `editor`-role account **cannot** reach `/admin/ai-knowledge` or `/admin/users` (admin/owner only)
- [ ] Confirm the AI chat widget rate-limits after ~20 messages in 10 minutes
- [ ] Confirm file upload rejects a `.exe` or unlisted MIME type

## 10. AI Assistant (optional, can launch without)

- [ ] Set `OPENAI_API_KEY`
- [ ] Visit `/admin/ai-knowledge`, click **Embed** on the 3 seeded entries
- [ ] Test the chat widget on the live site with a real question
- [ ] See `docs/AI_ACTIVATION.md` for the Phase 2 (pgvector) upgrade path
