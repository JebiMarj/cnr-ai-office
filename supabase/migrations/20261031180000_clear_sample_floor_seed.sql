-- Remove the sample activities, approvals, and placeholder current tasks that
-- shipped with the first draft of 20261031103000_office_phase1.sql.
-- Does not remove the agent roster. Safe to run more than once.
-- Only the known demo titles are touched, so a real task with a different
-- title is left alone. Apply this yourself; the app does not run it.

delete from public.activities
where task_title in (
  'Wiring realtime desk updates',
  'Color study for the spring campaign',
  'Building the GHL onboarding pipeline',
  'Weekly client handoff drafted',
  'Filed the architecture notes',
  'Closed the overnight support queue',
  'Pinned the floor data model',
  'Posted the first creative concepts'
);

delete from public.approvals
where title in (
  'Approve the weekly client handoff',
  'Sign off on the systems diagram',
  'Approve the hero palette',
  'Hold the vendor swap'
);

update public.agents
set current_task = null
where current_task in (
  'Weekly client handoff is ready for review',
  'Building the GHL onboarding pipeline',
  'Architecture notes are filed',
  'Wiring realtime desk updates',
  'Color study for the spring campaign'
);
