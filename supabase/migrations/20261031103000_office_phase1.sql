-- C&R AI Office, phase 1.
-- Public visitors get read-only access to names, roles, statuses, and short titles.
-- Writes go through the post-status edge function, which uses the service role.
-- Do not add emails, client records, or secrets to these tables. Realtime publishes
-- the full row, and the anon key can select every column listed below.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end
$$;

create schema if not exists office_private;

revoke all on schema office_private from public;
revoke all on schema office_private from anon, authenticated;

create or replace function office_private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function office_private.set_updated_at() from public, anon, authenticated;
grant usage on schema office_private to service_role;
grant execute on function office_private.set_updated_at() to service_role;

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text,
  role text not null,
  desk_x double precision not null,
  desk_y double precision not null,
  status text not null,
  status_mode text not null default 'manual',
  current_task text,
  is_boss boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agents_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 32),
  constraint agents_name_len check (char_length(btrim(name)) between 1 and 80),
  constraint agents_subtitle_len check (subtitle is null or char_length(btrim(subtitle)) between 1 and 80),
  constraint agents_role_len check (char_length(btrim(role)) between 1 and 120),
  constraint agents_desk_x check (desk_x >= 0 and desk_x <= 100),
  constraint agents_desk_y check (desk_y >= 0 and desk_y <= 100),
  constraint agents_status_mode check (status_mode in ('auto', 'manual')),
  constraint agents_current_task_len check (
    current_task is null or char_length(btrim(current_task)) between 1 and 160
  ),
  constraint agents_status_by_kind check (
    (is_boss and status in ('online', 'in_meeting', 'away'))
    or
    (not is_boss and status in ('working', 'idle', 'waiting_on_jv', 'offline'))
  ),
  constraint agents_staff_status_mode check (is_boss or status_mode = 'manual'),
  constraint agents_meeting_is_manual check (status <> 'in_meeting' or status_mode = 'manual')
);

create unique index agents_one_boss on public.agents (is_boss) where is_boss;

comment on table public.agents is
  'Office members. desk_x and desk_y are floor percentages (x east, y south) for a later scene.';
comment on column public.agents.status_mode is
  'auto: the dashboard derives online/away from the 9pm-5am Asia/Manila shift. manual: status is explicit.';

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete restrict,
  task_title text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint activities_title_len check (char_length(btrim(task_title)) between 1 and 120),
  constraint activities_status check (status in ('working', 'done', 'waiting_on_jv')),
  constraint activities_finished check (
    (status = 'done' and finished_at is not null)
    or
    (status <> 'done' and finished_at is null)
  )
);

create index activities_agent_id_idx on public.activities (agent_id);
create index activities_updated_at_idx on public.activities (updated_at desc);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete restrict,
  title text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint approvals_title_len check (char_length(btrim(title)) between 1 and 140),
  constraint approvals_status check (status in ('pending', 'approved', 'declined')),
  constraint approvals_resolved check (
    (status = 'pending' and resolved_at is null)
    or
    (status <> 'pending' and resolved_at is not null)
  )
);

create index approvals_status_created_idx on public.approvals (status, created_at);

create trigger agents_set_updated_at
before update on public.agents
for each row execute function office_private.set_updated_at();

create trigger activities_set_updated_at
before update on public.activities
for each row execute function office_private.set_updated_at();

alter table public.agents enable row level security;
alter table public.agents force row level security;
alter table public.activities enable row level security;
alter table public.activities force row level security;
alter table public.approvals enable row level security;
alter table public.approvals force row level security;

create policy agents_public_read
on public.agents
for select
to anon, authenticated
using (true);

create policy activities_public_read
on public.activities
for select
to anon, authenticated
using (true);

create policy approvals_public_read
on public.approvals
for select
to anon, authenticated
using (true);

create view public.office_agents
with (security_invoker = true) as
select
  id,
  slug,
  name,
  subtitle,
  role,
  desk_x,
  desk_y,
  status,
  status_mode,
  current_task,
  is_boss,
  updated_at
from public.agents;

create view public.office_activities
with (security_invoker = true) as
select
  activities.id,
  activities.agent_id,
  agents.slug as agent_slug,
  agents.name as agent_name,
  activities.task_title,
  activities.status,
  activities.created_at,
  activities.updated_at,
  activities.finished_at
from public.activities
join public.agents on agents.id = activities.agent_id;

create view public.office_approvals
with (security_invoker = true) as
select
  approvals.id,
  approvals.agent_id,
  agents.slug as agent_slug,
  agents.name as agent_name,
  approvals.title,
  approvals.status,
  approvals.created_at,
  approvals.resolved_at
from public.approvals
join public.agents on agents.id = approvals.agent_id;

comment on view public.office_agents is 'Public read model for the floor. Safe columns only.';
comment on view public.office_activities is 'Public read model for task events.';
comment on view public.office_approvals is 'Public read model for JV approval items.';

revoke all on table public.agents from public, anon, authenticated;
revoke all on table public.activities from public, anon, authenticated;
revoke all on table public.approvals from public, anon, authenticated;
revoke all on table public.office_agents from public, anon, authenticated;
revoke all on table public.office_activities from public, anon, authenticated;
revoke all on table public.office_approvals from public, anon, authenticated;

grant select on table public.agents to anon, authenticated;
grant select on table public.activities to anon, authenticated;
grant select on table public.approvals to anon, authenticated;
grant select on table public.office_agents to anon, authenticated;
grant select on table public.office_activities to anon, authenticated;
grant select on table public.office_approvals to anon, authenticated;

grant all on table public.agents to service_role;
grant all on table public.activities to service_role;
grant all on table public.approvals to service_role;
grant select on table public.office_agents to service_role;
grant select on table public.office_activities to service_role;
grant select on table public.office_approvals to service_role;

alter publication supabase_realtime add table public.agents;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.approvals;

insert into public.agents (
  id, slug, name, subtitle, role, desk_x, desk_y, status, status_mode, current_task, is_boss, updated_at
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'jv',
    'JV',
    'John Vincent Lorenzana',
    'Chief Executive Officer',
    76, 26,
    'away',
    'auto',
    null,
    true,
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'alex',
    'Alex',
    null,
    'Executive & IT Project Assistant',
    24, 40,
    'waiting_on_jv',
    'manual',
    null,
    false,
    now() - interval '18 minutes'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'mechanicus',
    'Mechanicus',
    null,
    'GHL Setup Builder',
    28, 70,
    'working',
    'manual',
    null,
    false,
    now() - interval '12 minutes'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'sage',
    'Sage',
    null,
    'IT Project Advisor & Solutions Architect',
    46, 36,
    'idle',
    'manual',
    null,
    false,
    now() - interval '35 minutes'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'dev',
    'Dev',
    null,
    'Senior Full-Stack Systems Developer',
    68, 46,
    'working',
    'manual',
    null,
    false,
    now() - interval '4 minutes'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'tech',
    'Tech',
    null,
    'IT Support & Systems Technician',
    50, 74,
    'offline',
    'manual',
    null,
    false,
    now() - interval '2 hours'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    'gia',
    'Gia',
    null,
    'Growth & Creative Assistant',
    72, 66,
    'working',
    'manual',
    null,
    false,
    now() - interval '6 minutes'
  );

-- Roster only. Sample tasks and approvals live in the client demo (?mock=1),
-- not in this seed. 20261031180000_clear_sample_floor_seed.sql removes any
-- copy of those rows that an earlier draft of this file already inserted.
