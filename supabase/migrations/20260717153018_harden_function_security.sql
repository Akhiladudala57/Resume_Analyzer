/*
# Harden database function security

## Overview
Fixes four security scanner findings on three `public` schema functions:
- Mutable search_path on `touch_updated_at()`
- Unwanted REST-RPC execution of `handle_new_user()` and `is_admin()` by
  `anon` and `authenticated` roles.

## Changes

### 1. `touch_updated_at()` — fix mutable search_path + remove direct execution
- Recreated with an explicit `SET search_path = public` so the function's
  schema resolution is immutable (prevents search_path hijacking).
- `REVOKE EXECUTE` from `PUBLIC`, `anon`, and `authenticated`. This is a
  trigger function invoked only by table triggers; triggers do not require
  EXECUTE privilege on the trigger function, so revoking direct execution
  has no impact on trigger behavior but closes the RPC surface.

### 2. `handle_new_user()` — remove REST-RPC execution
- Kept as SECURITY DEFINER (required: the function inserts into
  `public.profiles` and is fired by a trigger on `auth.users` whose
  inserting role is the Supabase auth service, which lacks INSERT on
  `profiles`).
- Already had `SET search_path = public` (immutable).
- `REVOKE EXECUTE` from `PUBLIC`, `anon`, and `authenticated` so the
  function cannot be invoked via `/rest/v1/rpc/handle_new_user`. Trigger
  invocation is unaffected (triggers bypass EXECUTE privilege checks).

### 3. `is_admin()` — switch to SECURITY INVOKER + restrict execution
- Switched from SECURITY DEFINER to SECURITY INVOKER. The function only
  reads `auth.jwt()` (the caller's own JWT, already available to them) and
  returns a boolean — it performs no privileged table access, so running
  as the invoker is correct and eliminates the SECURITY DEFINER exposure.
- `REVOKE EXECUTE` from `PUBLIC` and `anon`.
- `GRANT EXECUTE` to `authenticated` (required: RLS policies on
  `profiles`, `resumes`, `analyses`, and `admin_activity` call
  `is_admin()`, and policy expressions are evaluated with the querying
  role's privileges — authenticated users must retain EXECUTE for those
  policies to function).

## Security impact
- `anon` can no longer execute any of the three functions via REST RPC.
- `authenticated` can no longer execute `handle_new_user()` or
  `touch_updated_at()` via REST RPC, but retains `is_admin()` (needed for
  RLS, and harmless — it only reads the caller's own JWT).
- All search_paths are now explicitly pinned to `public`.
- Trigger behavior is fully preserved (triggers do not require EXECUTE
  privilege on their functions).

## Notes
1. `is_admin()` remains STABLE and schema-pinned (`SET search_path = public`).
2. RLS policies that reference `public.is_admin()` continue to work for
   authenticated users.
3. Idempotent: function definitions use `CREATE OR REPLACE` and grants
   use `REVOKE ... IF EXISTS`-style safe patterns (DROP POLICY IF EXISTS
   not needed here — no policy changes).
*/

-- 1. touch_updated_at: pin search_path, revoke direct execution
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public;
revoke execute on function public.touch_updated_at() from anon;
revoke execute on function public.touch_updated_at() from authenticated;

-- 2. handle_new_user: keep SECURITY DEFINER (trigger needs it), revoke direct execution
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

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- 3. is_admin: switch to SECURITY INVOKER, restrict to authenticated only
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
