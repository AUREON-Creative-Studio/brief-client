-- AUREON Client Briefs — initial database setup
-- Run this in Supabase Dashboard > SQL Editor.
-- First create your AUREON admin account in Authentication > Users.
-- Copy that user's UUID and replace ADMIN_USER_UUID below before running.

create table if not exists public.client_briefs (
  id bigint generated always as identity primary key,
  company_name text not null check (char_length(company_name) between 1 and 200),
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.client_briefs enable row level security;

-- Remove broad/default access, then grant only what the app needs.
revoke all on table public.client_briefs from anon, authenticated;
grant insert on table public.client_briefs to anon;
grant select on table public.client_briefs to authenticated;

-- Public visitors may submit a brief, but cannot read, update or delete any brief.
drop policy if exists "Public can submit client briefs" on public.client_briefs;
create policy "Public can submit client briefs"
on public.client_briefs
for insert
to anon
with check (
  char_length(company_name) between 1 and 200
  and jsonb_typeof(answers) = 'object'
);

-- Only this specific AUREON administrator account can read submissions.
drop policy if exists "AUREON admin can read client briefs" on public.client_briefs;
create policy "AUREON admin can read client briefs"
on public.client_briefs
for select
to authenticated
using (auth.uid() = '6b2f33fc-5e99-4a07-b1e1-fdf7a2eaad71'::uuid);

-- The dashboard is read-only. No update/delete policies or grants are created.
