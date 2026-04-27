# BSW Portal Management

Web admin app for managing the data behind the BSW mobile app (Expo). Built with Vite + React + TypeScript + Tailwind, talks to the same Supabase project the mobile app uses.

## Features

- **Brochures** — upload PDFs and cover images, mark as popular, group by category.
- **Ex-Display** — manage on-floor sale categories and products (multi-image gallery, pricing, dimensions, colours).
- **Product Catalog** — full editor for categories → subcategories (recursive) → sections (Details/Styles/Hardware/Colours/Glass/Extras) → items (image/swatch/carousel).
- **Push Notifications** — send Expo push to all registered mobile devices.
- **Auth** — Supabase email/password, gated by an `admin_users` allowlist + Row Level Security.
- **Live iPhone preview** — every section has a phone-shaped preview pane on the right that mirrors what the mobile app will render.

## Getting started

### 1. Install + run

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

### 2. Configure Supabase

Copy `.env.example` to `.env` and fill in your Supabase URL and anon key. The current `.env` already points at the BSW project.

### 3. Run the SQL migration (one-time)

In the Supabase dashboard → SQL editor, paste the contents of [`supabase/migrations/0001_admin_and_rls.sql`](supabase/migrations/0001_admin_and_rls.sql) and run it. This creates the `admin_users` allowlist, the `is_admin()` helper, and Row-Level-Security policies on every managed table + the storage buckets (`brochures`, `product-assets`).

### 4. Create your first admin

The web app blocks anyone who isn't in `admin_users`. To bootstrap:

1. In Supabase → **Authentication → Users**, create your account (email + password).
2. In Supabase → **SQL editor**, run:

   ```sql
   insert into admin_users (user_id, email)
   select id, email from auth.users where email = 'you@example.com';
   ```

3. Sign in to the web app at <http://localhost:5173>. You should land on the Brochures page.

To add more admins later, sign in as an existing admin and run the same insert (or build a small admin-management page — not in v1).

### 5. Deploy the push-notification Edge Function (optional, but needed for /push to work)

```bash
# requires the Supabase CLI: brew install supabase/tap/supabase
supabase login
supabase link --project-ref kmrfnaurkbmkkoumfnxp
supabase functions deploy send-push
```

The function uses the project's built-in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` env vars — no extra secrets to set.

## Project layout

```
src/
  lib/         supabase client, table types, storage helpers, query client
  contexts/    AuthContext (session + isAdmin)
  components/  AppShell, Sidebar, PhonePreview, Modal, ImageUpload, PdfUpload, …
  pages/       BrochuresPage, DisplayPage, CatalogPage, CatalogSectionsEditor, PushPage
  preview/     iPhone-frame mirrors of each mobile screen (BrochuresPreview, …)
supabase/
  migrations/0001_admin_and_rls.sql      run once
  functions/send-push/index.ts            deploy via Supabase CLI
```

## Build

```bash
npm run build   # tsc + vite build → dist/
npm run preview # serve dist/ locally
```

## Notes / caveats

- **Catalog cache on devices.** The mobile app caches the catalog in AsyncStorage for **24 hours** ([bswportal/data/ProductsData.js:17](bswportal/data/ProductsData.js#L17)). Your edits hit Supabase immediately, but installed apps won't see them until the cache expires or the app is reopened past TTL. If we want push-button "force refresh", that's a small follow-up.
- **Mobile app push tokens.** The Expo token is upserted into `push_tokens` on every mobile-app launch ([bswportal/screens/Home.js:17-34](bswportal/screens/Home.js#L17-L34)) — no mobile change needed for /push to work.
- **Service role key.** Lives only inside the `send-push` edge function (auto-injected by Supabase). Never used in the browser. The browser uses the anon key + admin login + RLS.
