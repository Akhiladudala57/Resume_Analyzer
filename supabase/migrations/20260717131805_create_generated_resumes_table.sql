/*
# Create generated_resumes table

## Overview
Adds storage for AI-generated resumes so users can build, save, and download
optimized resumes and revisit them later. Each user owns their generated
resumes.

## New Tables
1. `generated_resumes` — a structured resume produced by the resume builder.
   - `id` (uuid, PK)
   - `user_id` (uuid, FK auth.users, DEFAULT auth.uid())
   - `title` (text — a user-facing label, e.g. "Frontend Dev — Acme")
   - `target_role` (text, nullable)
   - `data` (jsonb — the full structured resume: contact, summary, experience,
     education, skills, projects, certifications)
   - `source_resume_id` (uuid, nullable — the uploaded resume it was based on)
   - `created_at`, `updated_at` (timestamptz)

## Security (RLS)
- `generated_resumes`: owner-scoped CRUD (authenticated, auth.uid() = user_id).
  Admins can read all rows via is_admin() for the admin panel.

## Notes
1. `user_id` defaults to `auth.uid()` so client inserts that omit it still
   satisfy the WITH CHECK policy.
2. `source_resume_id` references `resumes` with ON DELETE SET NULL so deleting
   the source upload does not destroy the generated resume.
3. An `updated_at` trigger keeps the timestamp current on edits.
*/

create table if not exists public.generated_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled resume',
  target_role text,
  data jsonb not null default '{}'::jsonb,
  source_resume_id uuid references public.resumes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.generated_resumes enable row level security;

drop policy if exists "gen_select_own" on public.generated_resumes;
create policy "gen_select_own" on public.generated_resumes
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists "gen_insert_own" on public.generated_resumes;
create policy "gen_insert_own" on public.generated_resumes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "gen_update_own" on public.generated_resumes;
create policy "gen_update_own" on public.generated_resumes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gen_delete_own" on public.generated_resumes;
create policy "gen_delete_own" on public.generated_resumes
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists gen_resumes_user_idx on public.generated_resumes(user_id);

-- updated_at trigger (reuse touch_updated_at if present, else create a scoped one)
drop trigger if exists gen_resumes_touch on public.generated_resumes;
create trigger gen_resumes_touch
  before update on public.generated_resumes
  for each row execute procedure public.touch_updated_at();
