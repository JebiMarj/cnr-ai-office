# Create & Reach marketing site

A one-page marketing site for Create & Reach VA Services. It is a separate Vite app from the C&R AI Office. Do not deploy it over the live office at `https://cnr-ai-office.onrender.com`, and do not change that service’s build, Supabase, or Render settings.

## Preview locally

```bash
cd marketing-site
npm ci
npm run dev
```

Open http://localhost:5173.

Production build (static files land in `marketing-site/dist`):

```bash
npm run build
npm run preview
```

No environment variables are required. The contact form is a placeholder. It does not send. A comment in `src/components/Contact.tsx` marks where a GoHighLevel form webhook will connect later.

## Deploy as its own Render static site

Create a **new** Static Site. Leave the existing AI Office service alone.

- Root directory: `marketing-site`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Node: 20 or newer
- Environment variables: none

## Sources used in “Why it works”

These are industry figures, not client results. The illustrated week on that section is labeled as an example and is not data.

- Harvard Business Review, March 2011, “The Short Life of Online Sales Leads” — https://hbr.org/2011/03/the-short-life-of-online-sales-leads
- Salesforce, State of Sales, 7th edition, 2026 — https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/reports/sales/salesforce-state-of-sales-report-2026.pdf
- Intuit QuickBooks, Business Solutions Survey, 2024 — https://erp.intuit.com/blog/research/business-solutions-survey-2024/
- Leadferno, June 28, 2024 — https://leadferno.com/blog/research-website-contact-forms-and-lead-management-uncovering-costly-mistakes
- 411 Locals, January 18, 2016 — https://411locals.us/small-business-owners-dont-answer-62-of-phone-calls/
