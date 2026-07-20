-- Star Kids — private family-group leaderboard
-- Schema + Row-Level Security + RPCs. Designed to be called directly from the
-- browser with the anon key; RLS is the only thing protecting data, so every
-- table is locked down and access flows through group membership.

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique,
  created_by  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.leaderboard_entries (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.groups (id) on delete cascade,
  owner_user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kid_key        text not null,                       -- local kid id (stable per device)
  display_name   text not null check (char_length(display_name) between 1 and 40),
  avatar         jsonb,                               -- small AvatarConfig snapshot
  total_stars    numeric not null default 0 check (total_stars >= 0),
  current_streak int not null default 0 check (current_streak >= 0),
  updated_at     timestamptz not null default now(),
  unique (group_id, owner_user_id, kid_key)
);

create index if not exists leaderboard_entries_group_idx on public.leaderboard_entries (group_id);
create index if not exists group_members_user_idx on public.group_members (user_id);

alter table public.groups              enable row level security;
alter table public.group_members       enable row level security;
alter table public.leaderboard_entries enable row level security;

-- ----------------------------------------------------------------------------
-- Membership helper (SECURITY DEFINER avoids recursive RLS on group_members)
-- ----------------------------------------------------------------------------

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- Policies
-- ----------------------------------------------------------------------------

-- groups: visible only to members; creation limited to self as creator.
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select using (public.is_group_member(id));

drop policy if exists groups_insert on public.groups;
create policy groups_insert on public.groups
  for insert with check (created_by = auth.uid());

-- group_members: you can read the membership of groups you belong to, and
-- remove your own membership. Inserts happen via the join_group RPC.
drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members
  for select using (public.is_group_member(group_id));

drop policy if exists group_members_delete on public.group_members;
create policy group_members_delete on public.group_members
  for delete using (user_id = auth.uid());

-- leaderboard_entries: readable by any group member; writable only for your
-- own rows, and only in groups you belong to.
drop policy if exists entries_select on public.leaderboard_entries;
create policy entries_select on public.leaderboard_entries
  for select using (public.is_group_member(group_id));

drop policy if exists entries_insert on public.leaderboard_entries;
create policy entries_insert on public.leaderboard_entries
  for insert with check (owner_user_id = auth.uid() and public.is_group_member(group_id));

drop policy if exists entries_update on public.leaderboard_entries;
create policy entries_update on public.leaderboard_entries
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists entries_delete on public.leaderboard_entries;
create policy entries_delete on public.leaderboard_entries
  for delete using (owner_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RPCs
-- ----------------------------------------------------------------------------

-- Short, unambiguous invite code (no 0/O/1/I).
create or replace function public.gen_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
           floor(random() * 32 + 1)::int, 1), '')
  from generate_series(1, 6);
$$;

-- Create a group and add the caller as owner. Returns the new group row.
create or replace function public.create_group(group_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
  g public.groups;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  loop
    code := public.gen_invite_code();
    exit when not exists (select 1 from public.groups where invite_code = code);
  end loop;

  insert into public.groups (name, invite_code, created_by)
  values (coalesce(nullif(trim(group_name), ''), 'My Family'), code, auth.uid())
  returning * into g;

  insert into public.group_members (group_id, user_id, role)
  values (g.id, auth.uid(), 'owner');

  return g;
end;
$$;

-- Join a group by its invite code. Returns the group row.
create or replace function public.join_group(code text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into g from public.groups
  where invite_code = upper(trim(code));

  if g.id is null then
    raise exception 'invalid invite code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (g.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return g;
end;
$$;

-- Leave a group: remove the caller's membership and their entries.
create or replace function public.leave_group(gid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.leaderboard_entries
    where group_id = gid and owner_user_id = auth.uid();
  delete from public.group_members
    where group_id = gid and user_id = auth.uid();
end;
$$;

grant execute on function public.create_group(text)  to authenticated;
grant execute on function public.join_group(text)    to authenticated;
grant execute on function public.leave_group(uuid)   to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
