export const PREFILL_EVENT = 'cr:prefill';

export const navLinks = [
  { href: '#story', label: 'Story' },
  { href: '#team', label: 'AI team' },
  { href: '#ghl', label: 'GHL' },
  { href: '#who', label: 'Who it’s for' },
  { href: '#impact', label: 'Why it works' },
  { href: '#proof', label: 'Proof' },
  { href: '#builder', label: 'Build' },
] as const;

export const heroBots = [
  { short: 'EA', chip: 'Voice', name: 'Executive Assistant', line: 'On the line. Ask by voice.' },
  { short: 'Coach', chip: 'Drafts', name: 'Sales Coach', line: 'Reading the latest CRM note for a draft.' },
  { short: 'Plan', chip: 'Day', name: 'Day Planner', line: 'Lining up today and the rest of the week.' },
  { short: 'Calls', chip: 'Notes', name: 'Call Analyst', line: 'Ready when a recording comes in.' },
  { short: 'Trip', chip: 'Route', name: 'Travel Planner', line: 'Grouping site visits by town.' },
  { short: 'Price', chip: 'Comps', name: 'Comp Analyst', line: 'Comparing this quote with similar jobs.' },
] as const;

export const storyLines = [
  { who: 'you', name: 'You · voice', text: 'Plan my day.' },
  {
    who: 'ea',
    name: 'Executive Assistant',
    text: 'Game plan is ready. Quote review, one callback, and a 2:00 walkthrough.',
  },
  {
    who: 'cal',
    name: 'Calendar',
    text: 'Company — Contact · (203) 555-0148 · Latest CRM note: revisit the quote after the holiday week.',
  },
  {
    who: 'coach',
    name: 'Sales Coach',
    text: 'Follow-up draft uses that CRM note. It is still a draft.',
  },
  {
    who: 'calls',
    name: 'Call Analyst',
    text: 'Yesterday’s call is summarized. The draft and next steps are waiting for your review.',
  },
  {
    who: 'travel',
    name: 'Travel Planner',
    text: 'Thursday’s visits are grouped by town. Drive time is on the plan.',
  },
  {
    who: 'comp',
    name: 'Comp Analyst',
    text: 'That quote sits under similar jobs. Flagged for you. The price was not changed.',
  },
  {
    who: 'ea',
    name: 'Executive Assistant',
    text: 'Your admin’s team of 10 is live. It was set up in a few days, separate from yours.',
  },
] as const;

export const storyPoints = [
  'A main executive assistant he talks to by voice on his phone.',
  'A sales coach that drafts follow-up emails from his CRM history, deal by deal.',
  'A morning game plan that lays out the day and the week.',
  'A travel assistant for site visits, grouped so the drive makes sense.',
  'A comp analyst that flags pricing context and does not change the price.',
  'Calendar events titled Company — Contact, with the phone number and the latest CRM note.',
  'Call recordings turned into a draft follow-up and the next steps.',
  'Every email stays a draft until he reviews it. Nothing sends on its own.',
] as const;

export type AgentId = 'ea' | 'coach' | 'writer' | 'planner' | 'calls' | 'travel' | 'comp' | 'admin';

export const agents: {
  id: AgentId;
  name: string;
  role: string;
  demo: string;
  more: string;
}[] = [
  {
    id: 'ea',
    name: 'Executive Assistant',
    role: 'The voice on the phone. Keeps the day moving and answers in plain language.',
    demo: 'Two quotes before noon, then a 2:00 walkthrough. I can read them in drive order.',
    more: 'You talk. It answers. The specialists work behind that conversation, and you still approve anything that goes out.',
  },
  {
    id: 'coach',
    name: 'Sales Coach',
    role: 'Drafts the next note from the deal, not from a blank page.',
    demo: 'Draft mentions the holiday pause from Tuesday’s CRM note. Still a draft.',
    more: 'It reads the history already in the CRM. You fix the tone, then you send it. It does not send itself.',
  },
  {
    id: 'writer',
    name: 'Follow-Up Writer',
    role: 'Writes the email and leaves it sitting in drafts.',
    demo: 'Subject: Checking back on the bi-weekly quote. In drafts. Not sent.',
    more: 'A subject, a short body, and a stop. The send button stays with a person.',
  },
  {
    id: 'planner',
    name: 'Day Planner',
    role: 'A morning game plan for today and the rest of the week.',
    demo: 'Today: three calls, one site visit. Thursday is the pipeline pass.',
    more: 'Quiet deals come back onto the day. The plan is a suggestion you can rearrange.',
  },
  {
    id: 'calls',
    name: 'Call Analyst',
    role: 'Turns a recording into a summary, a draft, and the next step.',
    demo: 'They want a revised quote by Friday. The next step is in the draft.',
    more: 'The recording stays attached. You read the summary before anyone is emailed.',
  },
  {
    id: 'travel',
    name: 'Travel Planner',
    role: 'Lines up visits and puts the drive time on the plan.',
    demo: 'Two stops, same town. The closer one is first. Drive time is noted.',
    more: 'Useful when the day is a truck and a list of addresses, not a desk.',
  },
  {
    id: 'comp',
    name: 'Comp / Pricing Analyst',
    role: 'Compares a quote with similar jobs and leaves the price alone.',
    demo: 'This quote is under the last similar jobs. Flagged. Price unchanged.',
    more: 'It shows the context. You decide whether the number moves.',
  },
  {
    id: 'admin',
    name: 'Office Admin Assistant',
    role: 'The extra pair of hands for the person running the office.',
    demo: 'Reminders, invoices, and inbox triage are split up. Outbound still waits.',
    more: 'One office admin got her own team of 10 agents. That desk was set up in a few days.',
  },
];

export const flowSteps = [
  { n: '01', title: 'Chat or form', text: 'A visitor asks a question or requests a quote on the site.' },
  { n: '02', title: 'GHL CRM', text: 'The lead lands on the right contact, with the note attached.' },
  { n: '03', title: 'Automation', text: 'GoHighLevel routes it by service, area, or teammate.' },
  { n: '04', title: 'Team email', text: 'The people who need to act get an alert right away.' },
  { n: '05', title: 'Follow-up', text: 'A person, or a draft from the AI team, takes the next step.' },
] as const;

export const ghlServices = [
  { title: 'CRM and pipeline setup', text: 'Stages that match how you actually sell, with contacts and notes in one place.' },
  { title: 'Website chat and form alerts', text: 'A chat or a form emails the right people the moment it comes in.' },
  { title: 'Booking and forms', text: 'Quote requests, estimates, and appointments land in GoHighLevel.' },
  { title: 'Reminders and holiday campaigns', text: 'The nudge can go out while you are on a job, including the weeks people forget.' },
  { title: 'Statements and invoices', text: 'Statement and invoice distribution on a rhythm you approve.' },
  { title: 'Account migration', text: 'Move a GoHighLevel account under the agency when that cuts the monthly software cost.' },
  { title: 'Team training', text: 'The people who live in the CRM learn it before we hand it over.' },
] as const;

export const audiences = {
  cleaning: {
    label: 'For cleaning businesses',
    lede: 'Franchise owners, home cleaning companies, and commercial crews. The work is on the road. The follow-up usually is not.',
    pairs: [
      {
        pain: 'Leads from the website sit until someone is back at a desk.',
        fix: 'Chat and forms hit GoHighLevel and email the team when they arrive.',
      },
      {
        pain: 'The owner is on a job, not in front of a laptop.',
        fix: 'The AI team lives on the phone. You talk to it by voice.',
      },
      {
        pain: 'Follow-up depends on who remembers the last visit.',
        fix: 'The sales coach drafts from the CRM history. You review before anything sends.',
      },
      {
        pain: 'The day is a scramble of drives, quotes, and callbacks.',
        fix: 'A morning game plan lays out the day and the week, with travel grouped by town.',
      },
      {
        pain: 'The office admin is the whole back office.',
        fix: 'An office admin can have her own agent team. One desk was set up in a few days.',
      },
    ],
  },
  sales: {
    label: 'For sales teams',
    lede: 'A department with a pipeline, a CRM, and too much of the week spent rewriting the same note.',
    pairs: [
      {
        pain: 'Reps rewrite the same follow-up from memory.',
        fix: 'Deal-aware drafts pull from the CRM note. They stay drafts until someone sends them.',
      },
      {
        pain: 'A call recording never becomes a next step.',
        fix: 'The call analyst writes a summary, a draft, and the next step for review.',
      },
      {
        pain: 'A quiet deal shows up a week late.',
        fix: 'The morning game plan puts it back on the day.',
      },
      {
        pain: 'Booking, reminders, and holiday notes are manual.',
        fix: 'GoHighLevel handles booking, reminders, and holiday campaigns.',
      },
      {
        pain: 'The pipeline looks different in every rep’s head.',
        fix: 'One CRM setup, then training so the team actually uses it.',
      },
    ],
  },
} as const;

export const proof = [
  {
    kicker: 'Cleaning franchise · Connecticut · anonymized',
    title: 'A full AI team on the owner’s phone',
    text: 'Executive assistant, sales coach, morning game plan, travel assistant, and comp analyst. He talks to the team by voice. Calendar events use the Company — Contact pattern, with the phone number and the latest CRM note. Call recordings become a draft and next steps. Emails stay drafts. His office admin later got her own team.',
    counts: [
      { to: 5, suffix: '+', label: 'specialist bots for one owner' },
      { to: 10, suffix: '', label: 'AI agents built for one admin' },
    ],
    pending: true,
  },
  {
    kicker: 'Home cleaning company · anonymized',
    title: 'GoHighLevel, under the agency account',
    text: 'The company moved its GoHighLevel account under Create & Reach so the monthly software cost would come down. Forms and automations were set up as part of the same work. We are not publishing a dollar figure.',
    counts: [],
    pending: false,
  },
  {
    kicker: 'Cleaning company · anonymized',
    title: 'A website wired into the follow-up',
    text: 'A cleaning company site set up so an inquiry does not sit in a forgotten inbox. Forms feed the CRM, and automations carry the next step to the team.',
    counts: [],
    pending: false,
  },
  {
    kicker: 'Create & Reach · our own site',
    title: 'Website-chat alerts, in-house',
    text: 'We use the same pattern on the agency site. A new chat can email the team right away, so a conversation does not wait for someone to refresh the page.',
    counts: [],
    pending: false,
  },
] as const;

export const needs = [
  { id: 'followups', label: 'Follow-ups', hint: 'Draft the next email from the CRM note' },
  { id: 'scheduling', label: 'Scheduling', hint: 'Plan the day, the week, and the drive' },
  { id: 'calls', label: 'Call analysis', hint: 'Turn a recording into next steps' },
  { id: 'crm', label: 'CRM', hint: 'Pipeline, contacts, and deal history' },
  { id: 'reminders', label: 'Reminders', hint: 'Nudges, holidays, and booking reminders' },
  { id: 'invoicing', label: 'Invoicing', hint: 'Statements and invoice distribution' },
] as const;

export type NeedId = (typeof needs)[number]['id'];

export const needPlan: Record<NeedId, { agents: string[]; ghl: string }> = {
  followups: {
    agents: ['Sales Coach', 'Follow-Up Writer'],
    ghl: 'Pipeline stages, plus a task when a deal goes quiet',
  },
  scheduling: {
    agents: ['Day Planner', 'Travel Planner'],
    ghl: 'A booking calendar tied to the day plan',
  },
  calls: {
    agents: ['Call Analyst'],
    ghl: 'A place on the contact for the call summary and next step',
  },
  crm: {
    agents: ['Sales Coach'],
    ghl: 'CRM and pipeline setup so drafts can see the history',
  },
  reminders: {
    agents: ['Executive Assistant'],
    ghl: 'Automated reminders and holiday campaigns',
  },
  invoicing: {
    agents: ['Office Admin Assistant'],
    ghl: 'Statement and invoice distribution',
  },
};

export const agentOrder = [
  'Executive Assistant',
  'Sales Coach',
  'Follow-Up Writer',
  'Day Planner',
  'Call Analyst',
  'Travel Planner',
  'Comp / Pricing Analyst',
  'Office Admin Assistant',
];

export const processSteps = [
  { n: '01', title: 'Discovery call', text: 'We learn the business, the tools you already pay for, and where deals stall.' },
  { n: '02', title: 'Map your processes', text: 'Follow-ups, booking, invoicing, alerts. We write down how work actually moves.' },
  { n: '03', title: 'We build the team and GHL', text: 'Agents on Grok, plus the CRM and automations behind them.' },
  { n: '04', title: 'Training and turnover', text: 'Your people learn the phone, the drafts, and the pipeline. Then it is yours to run.' },
] as const;

export const sources = {
  hbr: {
    name: 'Harvard Business Review',
    year: 'March 2011',
    title: 'The Short Life of Online Sales Leads',
    url: 'https://hbr.org/2011/03/the-short-life-of-online-sales-leads',
  },
  salesforce: {
    name: 'Salesforce',
    year: '2026',
    title: 'State of Sales, 7th edition',
    url: 'https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/reports/sales/salesforce-state-of-sales-report-2026.pdf',
  },
  intuit: {
    name: 'Intuit QuickBooks',
    year: '2024',
    title: 'Business Solutions Survey',
    url: 'https://erp.intuit.com/blog/research/business-solutions-survey-2024/',
  },
  leadferno: {
    name: 'Leadferno',
    year: 'June 28, 2024',
    title: 'Website contact forms and lead management',
    url: 'https://leadferno.com/blog/research-website-contact-forms-and-lead-management-uncovering-costly-mistakes',
  },
  locals: {
    name: '411 Locals',
    year: 'January 18, 2016',
    title: 'Small business owners don’t answer 62% of phone calls',
    url: 'https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/',
  },
} as const;

/** Published response audit. Shares sum to 100. */
export const hbrResponse = [
  { label: 'Replied within an hour', value: 37, tone: 'fast' as const },
  { label: 'Replied in 1–24 hours', value: 16, tone: 'mid' as const },
  { label: 'Took more than 24 hours', value: 24, tone: 'slow' as const },
  { label: 'Never responded', value: 23, tone: 'never' as const },
];

/**
 * Relative qualification index drawn from HBR’s stated ratios.
 * Within an hour is “more than 60×” a day-later attempt, drawn as 60.
 * An hour later is “nearly 7×” less likely than within the hour, so 60/7.
 * Waiting 24 hours or longer is the baseline, drawn as 1.
 * These are not percentages.
 */
export const hbrQualify = [
  { label: 'Contact within 1 hour', value: 60, note: 'More than 60× a day-later try' },
  { label: 'An hour later', value: 60 / 7, note: 'Nearly 7× less likely than within the hour' },
  { label: '24 hours or longer', value: 1, note: 'The comparison baseline' },
];

/** Salesforce State of Sales 2026 donut. Sums to 100. Prospecting is inside the selling share. */
export const salesWeek = [
  { label: 'Meeting with customers', value: 22, group: 'selling' as const },
  { label: 'Prospecting', value: 18, group: 'selling' as const },
  { label: 'Creating quotes', value: 17, group: 'other' as const },
  { label: 'Planning', value: 16, group: 'other' as const },
  { label: 'Manually entering data', value: 13, group: 'other' as const },
  { label: 'Training', value: 11, group: 'other' as const },
  { label: 'Other', value: 3, group: 'other' as const },
];

/** Cumulative: share of leads that had a first reply by this point. Not a partition. */
export const leadfernoSpeed = [
  { label: 'Reply within 5 minutes', value: 3.1 },
  { label: 'Reply within 1 hour', value: 10.6 },
  { label: 'Reply within 4 hours', value: 24.3 },
];

export const callSplit = [
  { label: 'Answered by a person', value: 37.8, tone: 'fast' as const },
  { label: 'Went to voicemail', value: 37.8, tone: 'mid' as const },
  { label: 'No response at all', value: 24.3, tone: 'never' as const },
];

/** Invented sketch. Never present these as measurements. */
export const illustrativeWeek = [
  {
    label: 'Hours writing follow-ups',
    hint: 'Lower is the lighter week',
    unit: 'hr',
    max: 8,
    without: 6,
    with: 1,
  },
  {
    label: 'Inquiries still waiting the next morning',
    hint: 'Lower is the point',
    unit: '',
    max: 5,
    without: 4,
    with: 0,
  },
  {
    label: 'Drafts ready for a person to review',
    hint: 'Higher means more prepared. Nothing sends itself.',
    unit: '',
    max: 8,
    without: 2,
    with: 8,
  },
];
