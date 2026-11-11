# C&R AI Office

The AI Office for Create & Reach Intelligence. The page uses the client template layout: a sidebar (Office, Chat, Needs you, Team, Board, Reports, Usage, Settings & help), a command box, counters (working / waiting on you / done today), an illustrated isometric office where each AI teammate sits at a desk, and an approval card. It reads the same public, read-only views as before (`office_agents`, `office_activities`, `office_approvals`). Bots keep posting through the `post-status` edge function, which this redesign does not change.

Status mapping: `working` → at their desk with a task bubble · `waiting_on_jv` → hand up, listed in Needs you · `idle` → done / standing by · `offline` → empty chair.

## Per-client template

Workspace name, office sign, time zone, logo, brand colors, owner card and teammate list come from `public/tenants/<id>.json`. The default tenant is `cnr`. Set `VITE_TENANT=<id>` at build time for another client, or open `?tenant=sample-client` to see the generic sample. `dataSource: "demo"` shows sample work with no backend.

The office command box starts a **local showcase sample** and opens the Jarvis command center. The goal stays in the browser tab. Pause, and Approve / Hold / Send back / Instruct on the office floor, stay preview stubs: they show a notice and send nothing.

## Jarvis showcase

`#/jarvis` is the command center. It keeps the Create & Reach sidebar and the office floor. A sample runs only in `sessionStorage`: goal, local specialist assignment, stepped progress, a decision, a recorded outcome, and reset. The banner reads “Showcase demo — sample tasks; no external actions.”

Displayed names on the C&R floor are Jarvis, Ultron, Friday, EDITH, Jocasta, and DUM-E. Status still keys off the slugs `alex`, `dev`, `sage`, `tech`, `gia`, and `mechanicus`. Responsibilities are unchanged. JV stays the human owner.

`#/voice` is a separate voice-interface prototype. It is not connected to a bot, the office team, or a model. A microphone session starts only from Start voice session. “Hello Jarvis” and “Hello Jarvis, are you up?” are handled in that tab, and the reply “At your service, sir” is a local script. A later line can file the existing sample task, still marked as a sample. Typed self-test works when the browser has no speech recognition. Browser speech recognition may send audio to the browser vendor; the page says so before the microphone starts. No audio is stored by this app.

The office feed (live, demo, connecting, offline, or stale) is separate from the sample. Gmail, calendar, and GoHighLevel show as not connected. The master project tracker shows as not verified, with no project rows. Voice input appears only when the browser exposes speech recognition, and only after a click.

The previous 3D floor is on the `backup/pre-cnri-redesign` branch.

## Preview without Supabase

```bash
npm ci
npm run dev
```

Open [http://localhost:5173/?mock=1](http://localhost:5173/?mock=1). Demo data also shows when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing.

## Production build

Render Static Site:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Render environment **before** the build. Vite inlines them. Do not set `OFFICE_AGENT_SECRET` on the static site. Copy `.env.example` to `.env` for local live mode. No real keys belong in git.

## Apply the database yourself

This repo does not connect to a Supabase project. After review:

1. Run both files in `supabase/migrations/` (`supabase db push`, or paste them into the SQL editor in order).
2. Set the bot secret, either as a function env var or as a hash in the database (see below).
3. Deploy the function: `supabase functions deploy post-status`

`supabase/config.toml` sets `verify_jwt = false` for `post-status`. Bots do not have user JWTs. The function rejects any request whose `x-office-secret` header does not match the shared secret. It writes with the service role key Supabase injects (`SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_SECRET_KEYS.default` on the newer key model).

### Bot secret

If you can set Edge Function secrets, that wins:

```bash
supabase secrets set OFFICE_AGENT_SECRET='YOUR_OFFICE_AGENT_SECRET'
```

If you cannot set function secrets, store only the SHA-256 of the secret. Leave `OFFICE_AGENT_SECRET` unset. The function then calls the public RPC `office_agent_secret_hash()` and compares that hex digest to a SHA-256 of the `x-office-secret` header. You do not need to expose the `office_private` schema. Only `service_role` can execute the RPC.

```bash
printf '%s' 'YOUR_OFFICE_AGENT_SECRET' | sha256sum
```

`sha256sum` prints 64 hex characters, then the filename `-`. Insert the hex only:

```sql
insert into office_private.settings (key, value)
values ('agent_secret_sha256', 'PASTE_SHA256_HEX_HERE');
```

To rotate it, update that row with a new hash. Do not put the secret itself in the table. If neither the env var nor this row is set, every write returns 503.

### What the migrations do

`20261031114500_office_agent_secret.sql` creates `office_private.settings` (`key`, `value`). Row level security is on and forced, and there are no policies. `public`, `anon`, and `authenticated` have every privilege revoked on the table. `public.office_agent_secret_hash()` is security definer, with `search_path` locked to `pg_catalog`. Execute is revoked from `public`, `anon`, and `authenticated`, and granted only to `service_role`. It returns the stored `agent_secret_sha256` value.

`20261031103000_office_phase1.sql`:

- Creates `agents`, `activities`, and `approvals`, plus `office_private.set_updated_at()`.
- Turns on and **forces** row level security. The only policies are `SELECT` for `anon` and `authenticated`.
- Revokes every privilege from `anon` and `authenticated`, then grants `SELECT` only. `service_role` can write and bypasses RLS.
- Creates `office_agents`, `office_activities`, and `office_approvals` as `security_invoker` views. Those views are the public column list: names, roles, statuses, desk coordinates, and short titles. No emails, client records, or secrets.
- Adds the three tables to the `supabase_realtime` publication.
- Seeds JV and the six desks only. It does not insert sample tasks, approvals, or placeholder current tasks. `20261031180000_clear_sample_floor_seed.sql` deletes those rows if an earlier copy of the phase 1 migration already inserted them. Demo tasks stay in the browser, behind `?mock=1`.

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

# JV. status is online, in_meeting, away, or auto. This still updates only the CEO.
curl --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/post-status' \
  --header 'content-type: application/json' \
  --header 'apikey: YOUR_SUPABASE_ANON_KEY' \
  --header 'x-office-secret: YOUR_OFFICE_AGENT_SECRET' \
  --data '{"action":"set_jv_status","status":"in_meeting"}'

# JV or Marj. slug is jv or marj. status is online, in_meeting, away, or auto.
curl --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/post-status' \
  --header 'content-type: application/json' \
  --header 'apikey: YOUR_SUPABASE_ANON_KEY' \
  --header 'x-office-secret: YOUR_OFFICE_AGENT_SECRET' \
  --data '{"action":"set_human_status","slug":"marj","status":"in_meeting"}'
```

Staff statuses are `working`, `idle`, `waiting_on_jv`, and `offline`. Limits: task titles 120 characters, current tasks 160, approval titles 140, whole body 4096. Asking a human executive to take a staff action returns 400. `set_jv_status` still updates JV. `set_human_status` updates JV or Marj. `auto` follows that person’s `shift_start_hour` and `shift_end_hour` (default 9:00 PM–5:00 AM Manila).

## The floor

`src/data/store.ts` exposes `OfficeStore`. The isometric view reads `getSceneAgents()` through `toFloorAgents()` in `src/floor/motion.ts`. It does not open its own Supabase client.

Zones come from the effective status:

| Who | Status | Where |
| --- | --- | --- |
| Staff | `working`, `waiting_on_jv`, `idle` | Their own desk, facing the monitor, with a small typing motion. Waiting still shows a gold badge. Idle still reads as idle. |
| Staff | `offline` | Hidden. The desk stays, dimmed. |
| JV | `online` | Corner office desk |
| Marj | `online` | VP office desk |
| JV, Marj | `in_meeting` | Conference table, separate seats |
| JV, Marj | `away` | The landing outside the door |

Anyone seated at their own desk (staff who are not offline, and JV or Marj when they are online) stands up about every 10 minutes. The first breaks are staggered, with a little random jitter, so the floor does not empty at once. The walk lasts about 30–60 seconds and ends at the kitchenette, the lounge, or beside another person’s desk. They then walk back and sit down. `prefers-reduced-motion: reduce` keeps them in the chair and skips those breaks.

Humans are `is_human`, ordered by `floor_rank` (JV 1, Marj 2, then the bots). A status change still builds a walkway path and moves the figure along it. `?shot=meeting` still frames the conference room. `?walk=dev` (or any slug) starts that person mid-errand, for a still of the walk. Click a person or a desk to open the detail card. The activity feed and approvals stay in the board, which starts open on a wide screen and closed on a narrow one. The header census counts bots only.

## Art and licences

The office is an original Three.js scene. Furniture, glass, and people are procedural geometry. People use smooth capsule limbs, heads with hair, simple faces, and fitted clothes: JV in a dark suit and tie, Marj in a navy blazer. No downloaded character models and no paid assets.

Image-based lighting uses Poly Haven’s [Studio Small 03](https://polyhaven.com/a/studio_small_03) 1k HDR by Greg Zaal, licensed CC0, committed at `public/hdri/studio_small_03_1k.hdr`. The page does not fetch it from a CDN. `@react-three/postprocessing` adds soft ambient occlusion and a gentle bloom on the neon accents, inside the same lazy 3D chunk as `@react-three/fiber` and `@react-three/drei`.

Drag to orbit, scroll or pinch to zoom, and use Reset view to return to the default camera. If WebGL is unavailable the page explains that and the side board still works.

The plan follows a real office: JV’s corner office and Marj’s VP office on the north wall, a kitchenette, storage, a restroom, a meeting room, back-to-back work pods, and a lounge with a curved reception desk. A reading nook sits in the lounge. A separate gym and library were left out so the plan could stay close to that reference.

The Create & Reach mark in `public/` is the official logo supplied by the client. `cnr-logo.png` is a 512px export, `cnr-logo-128.png` is the header size, `favicon-32.png` is the 32px icon, and `apple-touch-icon.png` is 180px. They are brand assets, not an open-source icon set.

Space Grotesk and Manrope are loaded through `@fontsource` under the SIL Open Font License.

## Tests

```bash
npm test
npm run build
```

`npm test` runs the edge-function validation tests and the RLS suite. The RLS suite loads the migration into PGlite (Postgres compiled to WebAssembly) and checks that `anon` and `authenticated` can read and cannot write, that a role with write grants still cannot change rows, and that `service_role` can.

## Branding

`src/brand.tsx` holds the product name, company name, logo paths, per-agent colours, fonts, and the accent colours sampled from the logo file: pink `#E4396E`, deep orange `#F79521`, light orange `#FEBD63`. Rebrand from that file. The header mark and `index.html` favicon both use the packaged logo.
