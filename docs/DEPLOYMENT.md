# Final Deployment Guide

Follow in order. Each numbered section assumes the previous one is complete.

---

## 1. GitHub

```bash
cd ismail-platform
git init
git add .
git commit -m "Initial production build"
gh repo create ismail-safwan-platform --private --source=. --push
# or: create the repo on github.com, then
# git remote add origin <your-repo-url> && git push -u origin main
```

Confirm `.env.local` is in `.gitignore` (it is, by default in this project) — never commit real secrets.

---

## 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL Editor. Run every file in `database/migrations/` **in numeric order, one at a time**: `001` through `012`. Each is self-contained; run them in sequence on a fresh project.
3. Verify the schema: `select count(*) from public.sections;` should return `9`.
4. Authentication → Providers: confirm **Email** is enabled.
5. Authentication → Settings: leave "Allow new users to sign up" **enabled** for now (needed for step 5 below) — disable it after creating your owner account if you want the site closed to public registration.
6. Project Settings → API: copy the three keys you'll need:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server-only)

---

## 3. Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Dashboard home page shows `Cloud Name`, `API Key`, `API Secret` — copy all three.
3. No further setup needed; the app creates its own folder structure on first upload.

---

## 4. Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset should auto-detect **Next.js** — leave build settings default.
3. Before deploying, add environment variables (Settings → Environment Variables), applied to **Production**, **Preview**, and **Development**:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   CLOUDINARY_CLOUD_NAME
   CLOUDINARY_API_KEY
   CLOUDINARY_API_SECRET
   NEXT_PUBLIC_APP_URL          (your final domain, e.g. https://ismailsafwan.com)
   OPENAI_API_KEY               (optional — leave blank to launch without AI)
   CRON_SECRET                  (optional — only if not using pg_cron, see below)
   ```

4. Deploy. First build should complete in 2–4 minutes.
5. If you have a custom domain: Settings → Domains → add it, follow the DNS instructions, then update `NEXT_PUBLIC_APP_URL` to match and redeploy.

### Analytics refresh scheduling (pick one)

- **Supabase Pro+ with `pg_cron`**: nothing to do, migration 012 already schedules it.
- **Otherwise**: add a `vercel.json` at the project root:
  ```json
  {
    "crons": [{ "path": "/api/admin/analytics/refresh", "schedule": "0 * * * *" }]
  }
  ```
  Vercel Cron Jobs don't support custom headers on all plans — if yours doesn't, call the route from an external scheduler that can send the `x-cron-secret` header, or just use the "Refresh Now" button on `/admin/analytics`, which calls the same route under your authenticated admin session.

---

## 5. First admin account

The shipped `/login` page is **sign-in only**. To create your first (owner) account:

**Option A — Supabase Dashboard (simplest):**
1. Supabase Dashboard → Authentication → Users → "Add user"
2. Enter your email and a password, confirm email automatically.
3. This fires the `handle_new_auth_user()` trigger, which checks if any `profiles` row exists yet — since this is the first user, you become `owner` automatically.

**Option B — Browser console:**
1. Visit your deployed site, open DevTools console.
2. Run:
   ```js
   const { createClient } = await import('@supabase/supabase-js')
   const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_ANON_KEY')
   await supabase.auth.signUp({ email: 'you@example.com', password: 'a-strong-password' })
   ```
3. Check your email for the confirmation link if email confirmation is required.

Either way, confirm it worked:
```sql
select email, role from public.profiles;
-- should show your email with role = 'owner'
```

Then visit `/en/login`, sign in, and you should land on `/en/admin/sections` with full access.

**After this**, go back to Supabase → Authentication → Settings and disable "Allow new users to sign up" if you want the platform closed to public registration — every future admin/editor account would then need to be created the same way (Option A) by you as owner.

---

## 6. Post-deployment verification

Run through this immediately after the first successful deploy:

- [ ] Homepage loads at your real domain, all 9 sections render
- [ ] Language switcher works (`/en`, `/ar`, `/ru` all resolve, Arabic renders RTL)
- [ ] `/sitemap.xml` returns valid XML with your real domain
- [ ] `/robots.txt` correctly disallows `/admin`, `/api`, `/login`
- [ ] Sign in at `/login` with your owner account succeeds
- [ ] `/admin/sections` loads, drag-to-reorder works, toggling visibility reflects live on the public homepage within a refresh
- [ ] Upload a test image via `/admin/media` — confirm it appears in Cloudinary's dashboard and renders correctly
- [ ] Create a test project via `/admin/projects`, publish it, confirm it appears on the homepage Projects section and at `/projects/<slug>`
- [ ] Try accessing `/admin` while signed out — confirm redirect to `/login`
- [ ] If `OPENAI_API_KEY` is set: test the AI chat widget with a real question

You're live. See `docs/LAUNCH_CHECKLIST.md` for the full content/security checklist before announcing publicly.
