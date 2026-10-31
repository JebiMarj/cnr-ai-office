-- Stores the bot shared secret as a SHA-256 hex digest, never the secret itself.
-- anon and authenticated have no grants and no policies. service_role reads it
-- through office_private.agent_secret_hash(), which post-status calls when
-- OFFICE_AGENT_SECRET is not set. Expose the office_private schema on the
-- Data API so that RPC is reachable; the table stays closed to the public roles.

create table office_private.settings (
  key text primary key,
  value text not null,
  constraint settings_key_format check (key ~ '^[a-z0-9_]{1,64}$'),
  constraint settings_value_len check (char_length(value) between 1 and 256)
);

alter table office_private.settings enable row level security;
alter table office_private.settings force row level security;

revoke all on table office_private.settings from public, anon, authenticated;
grant select, insert, update, delete on table office_private.settings to service_role;

create or replace function office_private.agent_secret_hash()
returns text
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select value
  from office_private.settings
  where key = 'agent_secret_sha256'
$$;

revoke all on function office_private.agent_secret_hash() from public, anon, authenticated;
grant usage on schema office_private to service_role;
grant execute on function office_private.agent_secret_hash() to service_role;

comment on table office_private.settings is
  'Private office settings. agent_secret_sha256 is the hex SHA-256 of the bot shared secret.';
comment on function office_private.agent_secret_hash() is
  'Returns the stored bot-secret hash for service_role. Does not accept or reveal the secret.';
