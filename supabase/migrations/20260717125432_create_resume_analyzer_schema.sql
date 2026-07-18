/*
# ResumeAI — core schema (multi-user, owner-scoped)

## Overview
Creates the data layer for an AI-powered resume analyzer. Each user owns their
profile, uploaded resumes, analysis reports, and chat conversations. An admin
layer tracks system activity and aggregated analytics.

## New Tables
1. `profiles` — extends `auth.users` with display name, role, and admin flag.
   - `id` (uuid, PK, references auth.users)
   - `full_name` (text)
   - `role` (text: 'user' | 'admin', default 'user')
   - `avatar_url` (text, nullable)
   - `created_at`, `updated_at` (timestamptz)

2. `resumes` — uploaded resume files + extracted text.
   - `id` (uuid, PK)
   - `user_id` (uuid, FK auth.users, DEFAULT auth.uid())
   - `file_name` (text)
   - `file_type` (text: 'pdf' | 'docx')
   - `file_size` (integer, bytes)
   - `content_text` (text, extracted plain text)
   - `storage_path` (text, nullable — reserved for future blob storage)
   - `created_at` (timestamptz)

3. `analyses` — a full AI analysis report for one resume.
   - `id` (uuid, PK)
   - `user_id` (uuid, FK auth.users, DEFAULT auth.uid())
   - `resume_id` (uuid, FK resumes, ON DELETE CASCADE)
   - `target_role` (text, nullable — optional job target)
   - `resume_score` (integer 0-100)
   - `ats_score` (integer 0-100)
   - `summary` (text)
   - `strengths` (jsonb array of strings)
   - `weaknesses` (jsonb array of strings)
   - `missing_keywords` (jsonb array of strings)
   - `missing_tech_skills` (jsonb array of strings)
   - `missing_soft_skills` (jsonb array of strings)
   - `grammar_suggestions` (jsonb array of objects {text, severity})
   - `formatting_suggestions` (jsonb array of objects {text, severity})
   - `recommendations` (jsonb — category -> {title, items[]} map)
   - `skill_scores` (jsonb array of {skill, score})
   - `raw_ai_response` (jsonb, nullable — full provider payload)
   - `engine` (text: 'ai' | 'heuristic')
   - `created_at` (timestamptz)

4. `chat_messages` — career assistant conversation turns.
   - `id` (uuid, PK)
   - `user_id` (uuid, FK auth.users, DEFAULT auth.uid())
   - `role` (text: 'user' | 'assistant')
   - `content` (text)
   - `context_resume_id` (uuid, nullable — resume the chat is grounded in)
   - `created_at` (timestamptz)

5. `admin_activity` — append-only log of notable system events.
   - `id` (uuid, PK)
   - `user_id` (uuid, nullable)
   - `event` (text)
   - `meta` (jsonb)
   - `created_at` (timestamptz)

## Security (RLS)
- `profiles`: owner read/update. Admins (role = 'admin') read all via a helper
  check on `raw_app_meta_data`. INSERT is handled by a trigger on auth.users
  so users never insert directly; we still allow owner INSERT as a fallback.
- `resumes`, `analyses`, `chat_messages`: owner-scoped CRUD (authenticated,
  auth.uid() = user_id).
- `admin_activity`: authenticated users can INSERT rows about their own
  activity; only admins can SELECT. This keeps the log append-only for
  regular users while letting the admin panel read it.

## Notes
1. `handle_new_user()` trigger auto-creates a profile row whenever a new auth
   user signs up, so the profile exists before the user first loads the app.
2. The `is_admin()` SQL function reads `raw_app_meta_data ->> 'role'` so admin
   status is driven by secure JWT claims, not a user-mutable column. To grant
   admin, set the user's `raw_app_meta_data.role` to 'admin' via the Supabase
   dashboard / SQL. The `profiles.role` column is a denormalized mirror for
   display only and is NOT trusted for authorization.
3. Owner columns default to `auth.uid()` so client inserts that omit user_id
   still satisfy the WITH CHECK policies.
*/

-- ---------- helper: admin check ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text default '',
  role text not null default 'user' check (role in ('user','admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- resumes ----------
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null check (file_type in ('pdf','docx')),
  file_size integer not null default 0,
  content_text text not null default '',
  storage_path text,
  created_at timestamptz not null default now()
);

alter table public.resumes enable row level security;

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own" on public.resumes
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own" on public.resumes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own" on public.resumes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own" on public.resumes
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- analyses ----------
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete cascade,
  target_role text,
  resume_score integer not null default 0 check (resume_score between 0 and 100),
  ats_score integer not null default 0 check (ats_score between 0 and 100),
  summary text not null default '',
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  missing_keywords jsonb not null default '[]'::jsonb,
  missing_tech_skills jsonb not null default '[]'::jsonb,
  missing_soft_skills jsonb not null default '[]'::jsonb,
  grammar_suggestions jsonb not null default '[]'::jsonb,
  formatting_suggestions jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '{}'::jsonb,
  skill_scores jsonb not null default '[]'::jsonb,
  raw_ai_response jsonb,
  engine text not null default 'heuristic' check (engine in ('ai','heuristic')),
  created_at timestamptz not null default now()
);

alter table public.analyses enable row level security;

drop policy if exists "analyses_select_own" on public.analyses;
create policy "analyses_select_own" on public.analyses
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists "analyses_insert_own" on public.analyses;
create policy "analyses_insert_own" on public.analyses
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "analyses_update_own" on public.analyses;
create policy "analyses_update_own" on public.analyses
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "analyses_delete_own" on public.analyses;
create policy "analyses_delete_own" on public.analyses
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- chat_messages ----------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null default '',
  context_resume_id uuid references public.resumes(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_select_own" on public.chat_messages;
create policy "chat_select_own" on public.chat_messages
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "chat_delete_own" on public.chat_messages;
create policy "chat_delete_own" on public.chat_messages
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- admin_activity ----------
create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_activity enable row level security;

drop policy if exists "activity_insert_own" on public.admin_activity;
create policy "activity_insert_own" on public.admin_activity
  for insert to authenticated with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "activity_select_admin" on public.admin_activity;
create policy "activity_select_admin" on public.admin_activity
  for select to authenticated using (public.is_admin());

-- ---------- indexes ----------
create index if not exists resumes_user_idx on public.resumes(user_id);
create index if not exists analyses_user_idx on public.analyses(user_id);
create index if not exists analyses_resume_idx on public.analyses(resume_id);
create index if not exists chat_user_idx on public.chat_messages(user_id, created_at);
create index if not exists activity_created_idx on public.admin_activity(created_at desc);

-- ---------- trigger: auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- updated_at helper for profiles ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();
