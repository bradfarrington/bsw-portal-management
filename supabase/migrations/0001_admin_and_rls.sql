-- ============================================================
-- BSW Portal Management — admin allowlist + RLS policies
-- Run this once against the BSW Supabase project.
-- ============================================================

-- 1) admin_users table (allowlist of auth users who can write data)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Anyone authenticated can check whether THEY are an admin (used by the web app gate)
drop policy if exists "admins read self" on public.admin_users;
create policy "admins read self"
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Helper: SECURITY DEFINER function so RLS policies can check admin status without
-- recursing into admin_users' own RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- Existing admins can manage the admin_users list. Uses is_admin() so the SELECT
-- inside the policy doesn't recurse into admin_users' own RLS.
drop policy if exists "admins manage admins" on public.admin_users;
create policy "admins manage admins"
  on public.admin_users
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- 2) RLS for app-managed tables
--    Public (anon) keeps read access — the mobile app uses anon.
--    Admins get write access.
-- ============================================================

-- BROCHURES
alter table public.brochures enable row level security;
drop policy if exists "brochures public read" on public.brochures;
create policy "brochures public read" on public.brochures for select to anon, authenticated using (true);
drop policy if exists "brochures admin write" on public.brochures;
create policy "brochures admin write" on public.brochures for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- DISPLAY CATEGORIES
alter table public.display_categories enable row level security;
drop policy if exists "display_categories public read" on public.display_categories;
create policy "display_categories public read" on public.display_categories for select to anon, authenticated using (true);
drop policy if exists "display_categories admin write" on public.display_categories;
create policy "display_categories admin write" on public.display_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- DISPLAY PRODUCTS
alter table public.display_products enable row level security;
drop policy if exists "display_products public read" on public.display_products;
create policy "display_products public read" on public.display_products for select to anon, authenticated using (true);
drop policy if exists "display_products admin write" on public.display_products;
create policy "display_products admin write" on public.display_products for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- PRODUCT CATEGORIES / SUBCATEGORIES / SECTIONS / ITEMS
alter table public.product_categories enable row level security;
drop policy if exists "product_categories public read" on public.product_categories;
create policy "product_categories public read" on public.product_categories for select to anon, authenticated using (true);
drop policy if exists "product_categories admin write" on public.product_categories;
create policy "product_categories admin write" on public.product_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.product_subcategories enable row level security;
drop policy if exists "product_subcategories public read" on public.product_subcategories;
create policy "product_subcategories public read" on public.product_subcategories for select to anon, authenticated using (true);
drop policy if exists "product_subcategories admin write" on public.product_subcategories;
create policy "product_subcategories admin write" on public.product_subcategories for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.product_sections enable row level security;
drop policy if exists "product_sections public read" on public.product_sections;
create policy "product_sections public read" on public.product_sections for select to anon, authenticated using (true);
drop policy if exists "product_sections admin write" on public.product_sections;
create policy "product_sections admin write" on public.product_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.product_section_items enable row level security;
drop policy if exists "product_section_items public read" on public.product_section_items;
create policy "product_section_items public read" on public.product_section_items for select to anon, authenticated using (true);
drop policy if exists "product_section_items admin write" on public.product_section_items;
create policy "product_section_items admin write" on public.product_section_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- PUSH TOKENS
-- Anyone (incl. anon mobile clients) can insert their own token.
-- Only admins can read or delete.
alter table public.push_tokens enable row level security;
drop policy if exists "push_tokens public insert" on public.push_tokens;
create policy "push_tokens public insert" on public.push_tokens for insert to anon, authenticated with check (true);
drop policy if exists "push_tokens admin read" on public.push_tokens;
create policy "push_tokens admin read" on public.push_tokens for select to authenticated using (public.is_admin());
drop policy if exists "push_tokens admin delete" on public.push_tokens;
create policy "push_tokens admin delete" on public.push_tokens for delete to authenticated using (public.is_admin());

-- ============================================================
-- 3) Storage policies — admins can write to brochures + product-assets
--    Public read remains via the buckets being marked public.
-- ============================================================

drop policy if exists "brochures bucket admin write" on storage.objects;
create policy "brochures bucket admin write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'brochures' and public.is_admin())
  with check (bucket_id = 'brochures' and public.is_admin());

drop policy if exists "product-assets bucket admin write" on storage.objects;
create policy "product-assets bucket admin write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'product-assets' and public.is_admin())
  with check (bucket_id = 'product-assets' and public.is_admin());
