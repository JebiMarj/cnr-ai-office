# C&R AI Office

A read-only floor for Create & Reach VA Services. Phase 1 is a dark dashboard: JV’s corner office, a desk for each AI employee, an approvals desk, and a live activity feed. Phase 2 can drop a Phaser or PixiJS scene onto the same store. Desk coordinates are already on every agent (`desk_x` / `desk_y`, percent of the floor, x east and y south).

The page has no login. Anyone with the link can read it. Bots write through one edge function. The anon key cannot insert, update, or delete.

## Preview without Supabase

```bash
npm ci
npm run dev
```

Open [http://localhost:5173/?mock=1](http://localhost:5173/?mock=1). Demo mode also turns on by itself when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing. A desk changes on its own every few seconds so the status animation is visible.

## Production build

Render Static Site:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Render environment **before** the build. Vite inlines them. Do not set `OFFICE_AGENT_SECRET` on the static site. Copy `.env.example` to `.env` for local live mode. No real keys belong in git.

## Apply the database yourself

This repo does not connect to a Supabase project. After review:

1. Run `supabase/migrations/20261031103000_office_phase1.sql` against the project (`supabase db push`, or paste it into the SQL editor).
2. Set the function secret: `supabase secrets set OFFICE_AGENT_SECRET='a-long-random-string'`
3. Deploy the function: `supabase functions deploy post-status`

`supabase/config.toml` sets `verify_jwt = false` for `post-status`. Bots do not have user JWTs. The function rejects any request whose `x-office-secret` header does not match `OFFICE_AGENT_SECRET`. It writes with the service role key Supabase injects (`SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_SECRET_KEYS.default` on the newer key model).

### What the migration does

- Creates `agents`, `activities`, and `approvals`, plus `office_private.set_updated_at()`.
- Turns on and **forces** row level security. The only policies are `SELECT` for `anon` and `authenticated`.
- Revokes every privilege from `anon` and `authenticated`, then grants `SELECT` only. `service_role` can write and bypasses RLS.
- Creates `office_agents`, `office_activities`, and `office_approvals` as `security_invoker` views. Those views are the public column list: names, roles, statuses, desk coordinates, and short titles. No emails, client records, or secrets.
- Adds the three tables to the `supabase_realtime` publication.
- Seeds JV and the six desks, a few tasks, and three items waiting on JV.

JV’s `status_mode` is `auto`. From 9:00 PM through 4:59 AM Asia/Manila the dashboard shows him **online**. Outside that window it shows **away**. `set_jv_status` with `online`, `in_meeting`, or `away` pins a manual status. `auto` hands control back to the shift.

If a migration runner refuses `ALTER PUBLICATION` inside a transaction, run these three lines in the SQL editor after the rest of the file:

```sql
alter publication supabase_realtime add table public.agents;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.approvals;
```

## How bots post updates

`POST https://YOUR_PROJECT.supabase.co/functions/v1/post-status`

Headers:

- `content-type: application/json`
- `apikey: YOUR_SUPABASE_ANON_KEY` (gateway key, not the office secret)
- `x-office-secret: YOUR_OFFICE_AGENT_SECRET`

The body is one JSON object. Unknown fields are rejected. Text is trimmed, length-limited, and restricted to letters, numbers, and punctuation. Slugs are lowercase (`alex`, `mechanicus`, `sage`, `dev`, `tech`, `gia`). Created rows return an `id`.

```bash
# Desk status. Omit current_task to leave it. Send null to clear it.
curl --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/post-status' \
  --header 'content-type: application/json' \
  --header 'apikey: YOUR_SUPABASE_ANON_KEY' \
  --header 'x-office-secret: YOUR_OFFICE_AGENT_SECRET' \
  --data '{"action":"set_agent_status","slug":"dev","status":"working","current_task":"Shipping the billing webhook"}'

# Task only. status stays as it is.
curl --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/post-status' \
  --header 'content-type: application/json' \
  --header 'apikey: YOUR_SUPABASE_ANON_KEY' \
  --header 'x-office-secret: YOUR_OFFICE_AGENT_SECRET' \
  --data '{"action":"set_current_task","slug":"gia","current_task":"Drafting the Q4 creative brief"}'

# Activity. status is working, done, or waiting_on_jv.
curl --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/post-status' \
  --header 'content-type: application/json' \
  --header 'apikey: YOUR_SUPABASE_ANON_KEY' \
  --header 'x-office-secret: YOUR_OFFICE_AGENT_SECRET' \
  --data '{"action":"add_activity","slug":"sage","task_title":"Review architecture notes","status":"working"}'

# Finish that activity. status is done or waiting_on_jv.
curl --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/post-status' \
  --header 'content-type: application/json' \
  --header 'apikey: YOUR_SUPABASE_ANON_KEY' \
  --header 'x-office-secret: YOUR_OFFICE_AGENT_SECRET' \
  --data '{"action":"finish_activity","activity_id":"ACTIVITY_UUID","status":"done"}'

curl --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/post-status' \
  --header 'content-type: application/json' \
  --header 'apikey: YOUR_SUPABASE_ANON_KEY' \
  --header 'x-office-secret: YOUR_OFFICE_AGENT_SECRET' \
  --data '{"action":"add_approval","slug":"alex","title":"Approve the weekly client handoff"}'

curl --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/post-status' \
  --header 'content-type: application/json' \
  --header 'apikey: YOUR_SUPABASE_ANON_KEY' \
  --header 'x-office-secret: YOUR_OFFICE_AGENT_SECRET' \
  --data '{"action":"resolve_approval","approval_id":"APPROVAL_UUID","status":"approved"}'

# JV. status is online, in_meeting, away, or auto.
curl --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/post-status' \
  --header 'content-type: application/json' \
  --header 'apikey: YOUR_SUPABASE_ANON_KEY' \
  --header 'x-office-secret: YOUR_OFFICE_AGENT_SECRET' \
  --data '{"action":"set_jv_status","status":"in_meeting"}'
```

Staff statuses are `working`, `idle`, `waiting_on_jv`, and `offline`. Limits: task titles 120 characters, current tasks 160, approval titles 140, whole body 4096. Asking the boss to take a staff action returns 400. Use `set_jv_status` for him.

## Phase 2

`src/data/store.ts` exposes `OfficeStore`. A scene should call `getSceneAgents()` and subscribe. It should not open its own Supabase client. `src/data/scene.ts` documents the coordinate system.

## Tests

```bash
npm test
npm run build
```

`npm test` runs the edge-function validation tests and the RLS suite. The RLS suite loads the migration into PGlite (Postgres compiled to WebAssembly) and checks that `anon` and `authenticated` can read and cannot write, that a role with write grants still cannot change rows, and that `service_role` can.

## Branding

`src/brand.tsx` holds the product name, company name, colors (`#E4386E`, `#F9A23C`, `#FDBE6A`), fonts, and logo. Rebrand from that file.
