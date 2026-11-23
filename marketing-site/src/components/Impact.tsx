import { useEffect, useState } from 'react';
import {
  callSplit,
  hbrQualify,
  hbrResponse,
  illustrativeWeek,
  leadfernoSpeed,
  salesWeek,
  sources,
} from '../content';
import { useInView, useReducedMotion } from '../hooks';
import { Bar, CountUp, SectionHead, SourceLink } from '../ui';

const donutColors = ['#ffc56b', '#ff8a2b', '#ff8d7a', '#ff4d88', '#d23d78', '#8d3d78', '#5c3558'];

export function Impact() {
  return (
    <section className="band impact" id="impact">
      <div className="wrap">
        <SectionHead
          kicker="Why it works · published research"
          title="The stall is measurable. These are not our client numbers."
          lede="Fast follow-up, less admin, and a phone that gets answered are why an AI team and a GoHighLevel setup are worth building. The charts below use published figures only. Nothing here is a Create & Reach result, and nothing here is a promise about your pipeline."
        />

        <div className="stat-row">
          <article className="stat">
            <p className="stat-flag">Published figure</p>
            <p className="stat-num">
              <CountUp to={42} suffix=" hr" label="average response" />
            </p>
            <p>Average time to answer a web lead, among companies that replied within 30 days.</p>
            <SourceLink {...sources.hbr} />
          </article>
          <article className="stat">
            <p className="stat-flag">Published figure</p>
            <p className="stat-num">
              <CountUp to={23} suffix="%" label="never responded" />
            </p>
            <p>Of 2,241 U.S. companies audited, this share never responded to the test lead at all.</p>
            <SourceLink {...sources.hbr} />
          </article>
          <article className="stat">
            <p className="stat-flag">Published figure</p>
            <p className="stat-num">
              <CountUp to={60} suffix="%" label="of the week not selling" />
            </p>
            <p>Of a sales rep’s average week is not spent selling. Quotes, planning, data entry, training, and other work.</p>
            <SourceLink {...sources.salesforce} />
          </article>
          <article className="stat">
            <p className="stat-flag">Published figure</p>
            <p className="stat-num">
              <CountUp to={25} suffix=" hr" label="manual data work each week" />
            </p>
            <p>A week growing small businesses report spending on manual data entry or reconciling apps.</p>
            <SourceLink {...sources.intuit} />
          </article>
        </div>

        <div className="chart-grid">
          <ResponseChart />
          <QualifyChart />
          <WeekChart />
          <FormsChart />
          <CallsChart />
        </div>

        <Illustrative />

        <div className="source-list">
          <h3>Every figure on this page, with the source</h3>
          <ul>
            <li>
              <SourceLink {...sources.hbr} /> — James B. Oldroyd, Kristina McElheran, and David Elkington. Audit of 2,241
              U.S. companies, plus a separate look at 1.25 million leads at 42 companies. “Qualify” meant a meaningful
              conversation with a decision maker, not a closed sale.
            </li>
            <li>
              <SourceLink {...sources.salesforce} /> — Survey of 4,050 sales professionals in 22 countries, August through
              September 2025. The donut is the report’s own chart. Prospecting sits inside the 40% “selling” share.
            </li>
            <li>
              <SourceLink {...sources.intuit} /> — Online survey in August 2024 of 630 owners and executives at U.S.
              businesses with 10–99 employees. The 25 hours is a weighted median for the business, not one person’s
              timesheet. The same survey estimates $3,000 a month spent on apps they never or rarely use. That is not a
              savings promise from Create &amp; Reach.
            </li>
            <li>
              <SourceLink {...sources.leadferno} /> — Aaron Weiche. 225 small businesses in home services, professional
              services, and medical care, tracked for three weeks. Leadferno sells contact-form software.
            </li>
            <li>
              <SourceLink {...sources.locals} /> — 85 small businesses across 58 industries, monitored for 30 days. 411
              Locals sells local marketing. The article adds voicemail and no-response together and calls that 62%
              unanswered. The chart keeps the three shares separate.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function ResponseChart() {
  const [ref, visible] = useInView<HTMLElement>(0.35);
  const reduced = useReducedMotion();
  const show = visible || reduced;
  return (
    <figure ref={ref} className={`chart-card${show ? ' is-in' : ''}`}>
      <figcaption>
        <h3>What happened when a web lead arrived</h3>
        <p>Most of the audited companies were not fast. Nearly a quarter never wrote back.</p>
      </figcaption>
      <div className="stack" aria-hidden="true">
        {hbrResponse.map((slice) => (
          <i key={slice.label} className={`tone-${slice.tone}`} style={{ width: show ? `${slice.value}%` : '0%' }} />
        ))}
      </div>
      <ul className="legend">
        {hbrResponse.map((slice) => (
          <li key={slice.label}>
            <span className={`swatch tone-${slice.tone}`} />
            <strong>{slice.value}%</strong> {slice.label}
          </li>
        ))}
      </ul>
      <p className="fine">
        Source: <SourceLink {...sources.hbr} />. Test leads sent to 2,241 U.S. companies. The average reply, among
        companies that answered within 30 days, was 42 hours.
      </p>
    </figure>
  );
}

function QualifyChart() {
  const [ref, visible] = useInView<HTMLElement>(0.35);
  return (
    <figure ref={ref} className="chart-card">
      <figcaption>
        <h3>Relative chance of qualifying the lead</h3>
        <p>
          Firms that tried within an hour were nearly 7 times as likely to qualify the lead as those that tried an hour
          later, and more than 60 times as likely as those that waited a day or more.
        </p>
      </figcaption>
      <ul className="hbar-list">
        {hbrQualify.map((row, index) => (
          <li key={row.label}>
            <div className="hbar-label">
              <span>{row.label}</span>
              <strong>{row.note}</strong>
            </div>
            <Bar value={row.value} max={60} tone={index === 2 ? 'never' : 'fast'} active={visible} delay={index * 90} />
          </li>
        ))}
      </ul>
      <p className="fine">
        Source: <SourceLink {...sources.hbr} />. Separate analysis of 1.25 million leads at 42 U.S. companies (29
        consumer, 13 business). Bar lengths follow the article’s ratios: “more than 60 times” is drawn as 60, and “nearly
        seven times” is drawn as 60 ÷ 7. They are not exact percentages, not closed-sale rates, and not Create &amp;
        Reach results.
      </p>
    </figure>
  );
}

function WeekChart() {
  const [ref, visible] = useInView<HTMLElement>(0.3);
  const reduced = useReducedMotion();
  const show = visible || reduced;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let start = 0;

  return (
    <figure ref={ref} className="chart-card chart-wide">
      <figcaption>
        <h3>Where a sales week actually goes</h3>
        <p>Reps spend 40% of the week selling. The other 60% is the work an assistant and a CRM can carry.</p>
      </figcaption>
      <div className="donut-layout">
        <div className="donut-wrap">
          <svg viewBox="0 0 120 120" className="donut" aria-hidden="true">
            <g transform="rotate(-90 60 60)">
              {salesWeek.map((slice, index) => {
                const length = (slice.value / 100) * circumference;
                const offset = show ? -start : -(start + length);
                const element = (
                  <circle
                    key={slice.label}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={donutColors[index]}
                    strokeWidth="14"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={offset}
                    style={{ transition: reduced ? 'none' : `stroke-dashoffset 1s ease ${index * 70}ms` }}
                  />
                );
                start += length;
                return element;
              })}
            </g>
          </svg>
          <p className="donut-center">
            <strong>40%</strong>
            <span>selling</span>
          </p>
        </div>
        <ul className="legend">
          {salesWeek.map((slice, index) => (
            <li key={slice.label}>
              <span className="swatch" style={{ background: donutColors[index] }} />
              <strong>{slice.value}%</strong> {slice.label}
              {slice.group === 'selling' ? <em> · selling</em> : null}
            </li>
          ))}
        </ul>
      </div>
      <p className="fine">
        Source: <SourceLink {...sources.salesforce} />. “How reps spend their time during an average workweek.” Meeting
        customers (22%) and prospecting (18%) are the selling share. The report also says preparation and planning take
        16%, which matches the planning slice.
      </p>
    </figure>
  );
}

function FormsChart() {
  const [ref, visible] = useInView<HTMLElement>(0.35);
  return (
    <figure ref={ref} className="chart-card">
      <figcaption>
        <h3>Small-business forms, including home services</h3>
        <p>A ready-to-buy inquiry still waited. Many never got a reply.</p>
      </figcaption>
      <p className="callout">
        <ReplyClock active={visible} />
        <span>average time to the first human reply</span>
      </p>
      <ul className="hbar-list">
        {leadfernoSpeed.map((row, index) => (
          <li key={row.label}>
            <div className="hbar-label">
              <span>{row.label}</span>
              <strong>{row.value}%</strong>
            </div>
            <Bar value={row.value} max={100} tone="mid" active={visible} delay={index * 80} />
          </li>
        ))}
        <li>
          <div className="hbar-label">
            <span>No reply at all</span>
            <strong>42.6%</strong>
          </div>
          <Bar value={42.6} max={100} tone="never" active={visible} delay={240} />
        </li>
      </ul>
      <p className="fine">
        Source: <SourceLink {...sources.leadferno} />. The first three bars are cumulative: a reply inside five minutes
        is also inside the hour. They are not slices of one pie. Sample: 225 businesses in home services, professional
        services, and medical care. Not a cleaning-only figure, and not a Create &amp; Reach client.
      </p>
    </figure>
  );
}

function CallsChart() {
  const [ref, visible] = useInView<HTMLElement>(0.35);
  return (
    <figure ref={ref} className="chart-card">
      <figcaption>
        <h3>What happened to the phone call</h3>
        <p>A live person picked up a little over a third of the time. The rest went to voicemail or nowhere.</p>
      </figcaption>
      <ul className="hbar-list">
        {callSplit.map((row, index) => (
          <li key={row.label}>
            <div className="hbar-label">
              <span>{row.label}</span>
              <strong>{row.value}%</strong>
            </div>
            <Bar value={row.value} max={100} tone={row.tone} active={visible} delay={index * 80} />
          </li>
        ))}
      </ul>
      <p className="fine">
        Source: <SourceLink {...sources.locals} />. 37.8% answered, 37.8% voicemail, 24.3% no response. In that same
        30-day watch, 70% of the businesses answered fewer than half their calls. The study is small and a decade old.
        It is still the clearest published split we could verify, so the year stays on the label.
      </p>
    </figure>
  );
}

function ReplyClock({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const total = 17 * 60 + 49;
  const [minutes, setMinutes] = useState(total);

  useEffect(() => {
    if (reduced || !active) {
      if (reduced) setMinutes(total);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 1200);
      const eased = 1 - (1 - progress) ** 3;
      setMinutes(Math.round(total * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced]);

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return (
    <strong aria-label="17 hours and 49 minutes">
      <span aria-hidden="true">
        {hours} hr {mins} min
      </span>
    </strong>
  );
}

function Illustrative() {
  const [ref, visible] = useInView<HTMLElement>(0.25);
  return (
    <figure ref={ref} className="example">
      <div className="example-flag">Illustrative example</div>
      <figcaption>
        <h3>A week with your AI team, and a week without</h3>
        <p>
          This is a sketch of the work the setup is designed to change: fewer hours writing follow-ups, fewer inquiries
          sitting overnight, more drafts waiting for a person. The numbers are made up.
        </p>
      </figcaption>
      <div className="compare-legend">
        <span>
          <i className="swatch tone-muted" /> Without the team
        </span>
        <span>
          <i className="swatch tone-fast" /> With an AI team and GHL alerts
        </span>
      </div>
      <ul className="compare">
        {illustrativeWeek.map((row) => (
          <li key={row.label}>
            <p>
              {row.label}
              <small>{row.hint}</small>
            </p>
            <div>
              <span className="compare-val">
                {row.without}
                {row.unit ? ` ${row.unit}` : ''}
              </span>
              <Bar value={row.without} max={row.max} tone="muted" active={visible} />
            </div>
            <div>
              <span className="compare-val">
                {row.with}
                {row.unit ? ` ${row.unit}` : ''}
              </span>
              <Bar value={row.with} max={row.max} tone="fast" active={visible} delay={120} />
            </div>
          </li>
        ))}
      </ul>
      <p className="example-note">
        Illustrative example — not a client result. These bars are a sketch we drew so you can picture a week. They are
        not measurements, not a study, and not a promise of hours saved or deals closed. No Create &amp; Reach client
        is the source of these numbers.
      </p>
    </figure>
  );
}
