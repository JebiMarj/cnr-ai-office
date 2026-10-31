-- Marj, VP. Humans share executive status rules. Rank orders the floor.
-- Shift hours live on the person (default 9:00 PM–5:00 AM Manila), not on the jv slug.
-- Idempotent. Does not change RLS. Apply it yourself; the app does not run it.

alter table public.agents add column if not exists is_human boolean not null default false;
alter table public.agents add column if not exists floor_rank integer not null default 100;
alter table public.agents add column if not exists shift_start_hour smallint not null default 21;
alter table public.agents add column if not exists shift_end_hour smallint not null default 5;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agents_shift_hours') then
    alter table public.agents
      add constraint agents_shift_hours
      check (shift_start_hour between 0 and 23 and shift_end_hour between 0 and 23);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agents_rank_range') then
    alter table public.agents
      add constraint agents_rank_range
      check (floor_rank between 1 and 999);
  end if;
end
$$;

alter table public.agents drop constraint if exists agents_status_by_kind;
alter table public.agents add constraint agents_status_by_kind check (
  ((is_human or is_boss) and status in ('online', 'in_meeting', 'away'))
  or
  (not is_human and not is_boss and status in ('working', 'idle', 'waiting_on_jv', 'offline'))
);

alter table public.agents drop constraint if exists agents_staff_status_mode;
alter table public.agents add constraint agents_staff_status_mode check (
  is_human or is_boss or status_mode = 'manual'
);

comment on column public.agents.is_human is
  'Human executive. online, in_meeting, or away. Auto mode uses this row''s Manila shift hours.';
comment on column public.agents.floor_rank is
  'Display order. 1 is the CEO, 2 is the VP, then the bots.';
comment on column public.agents.shift_start_hour is
  'Manila hour an auto-mode human comes online. Default 21 (9:00 PM).';
comment on column public.agents.shift_end_hour is
  'Manila hour an auto-mode human goes away. Default 5 (5:00 AM), exclusive.';

update public.agents
set is_human = true,
    floor_rank = 1
where slug = 'jv';

update public.agents set floor_rank = 10 where slug = 'alex' and floor_rank = 100;
update public.agents set floor_rank = 11 where slug = 'mechanicus' and floor_rank = 100;
update public.agents set floor_rank = 12 where slug = 'sage' and floor_rank = 100;
update public.agents set floor_rank = 13 where slug = 'dev' and floor_rank = 100;
update public.agents set floor_rank = 14 where slug = 'tech' and floor_rank = 100;
update public.agents set floor_rank = 15 where slug = 'gia' and floor_rank = 100;

insert into public.agents (
  id, slug, name, subtitle, role, desk_x, desk_y, status, status_mode, current_task,
  is_boss, is_human, floor_rank, shift_start_hour, shift_end_hour, updated_at
) values (
  '88888888-8888-4888-8888-888888888888',
  'marj',
  'Marj',
  null,
  'Vice President',
  62, 22,
  'away',
  'auto',
  null,
  false,
  true,
  2,
  21,
  5,
  now()
)
on conflict (slug) do update set
  name = excluded.name,
  role = excluded.role,
  is_human = true,
  is_boss = false,
  floor_rank = 2;

create or replace view public.office_agents
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
  updated_at,
  is_human,
  floor_rank,
  shift_start_hour,
  shift_end_hour
from public.agents;

comment on view public.office_agents is 'Public read model for the floor. Safe columns only.';
