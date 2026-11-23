import { hbrResponse, salesWeek, sources } from '../content';
import { useInView, useReducedMotion } from '../hooks';
import { CountUp, SourceLink } from '../ui';

const donutColors = ['#ffc56b', '#ff8a2b', '#ff8d7a', '#ff4d88', '#d23d78', '#8d3d78', '#5c3558'];

export function Impact() {
  return (
    <section className="band impact" id="impact">
      <div className="wrap">
        <header className="sec-head">
          <p className="kicker">Why it works</p>
          <h2>The follow-up is where deals stall.</h2>
          <p className="lede">Three published figures. Not our client results.</p>
        </header>
        <div className="stat-row">
          <article className="stat">
            <p className="stat-num">
              <CountUp to={42} suffix=" hr" label="average response" />
            </p>
            <p>Average time to answer a web lead.</p>
            <SourceLink {...sources.hbr} />
          </article>
          <article className="stat">
            <p className="stat-num">
              <CountUp to={60} suffix="%" label="of the week not selling" />
            </p>
            <p>Of a sales week is not spent selling.</p>
            <SourceLink {...sources.salesforce} />
          </article>
          <article className="stat">
            <p className="stat-num">
              <CountUp to={25} suffix=" hr" label="manual data work each week" />
            </p>
            <p>A week on manual data entry and reconciling apps.</p>
            <SourceLink {...sources.intuit} />
          </article>
        </div>
        <details className="research">
          <summary>See the research</summary>
          <div className="research-body">
            <ResponseChart />
            <WeekChart />
            <div className="footnotes">
              <p>
                In that same Harvard audit of 2,241 U.S. companies, 37% replied within an hour, 16% within a day, 24%
                after 24 hours, and 23% never replied. Firms that tried within an hour were nearly 7 times as likely to
                qualify the lead as those that tried an hour later, and more than 60 times as likely as those that waited
                a day. Qualify meant a conversation with a decision maker, not a closed sale.{' '}
                <SourceLink {...sources.hbr} />
              </p>
              <p>
                The 25 hours is a weighted median from 630 owners and executives at U.S. firms with 10–99 employees
                (August 2024). The same survey estimates $3,000 a month on apps they rarely use. That is not a savings
                promise. <SourceLink {...sources.intuit} />
              </p>
              <p>
                Leadferno (June 28, 2024) found 42.6% of 225 small-business form leads, including home services, got no
                reply. The average first human reply took 17 hours 49 minutes.{' '}
                <SourceLink {...sources.leadferno} />
              </p>
              <p>
                411 Locals (January 18, 2016) watched 85 small businesses for 30 days: 37.8% of calls were answered
                live, 37.8% went to voicemail, and 24.3% got no response. <SourceLink {...sources.locals} />
              </p>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

function ResponseChart() {
  const [ref, visible] = useInView<HTMLElement>(0.3);
  const reduced = useReducedMotion();
  const show = visible || reduced;
  return (
    <figure ref={ref} className="chart-card">
      <figcaption>
        <h3>What happened to the web lead</h3>
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
        <SourceLink {...sources.hbr} />
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
    <figure ref={ref} className="chart-card">
      <figcaption>
        <h3>Where a sales week goes</h3>
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
            </li>
          ))}
        </ul>
      </div>
      <p className="fine">
        <SourceLink {...sources.salesforce} />. Prospecting is inside the 40% selling share.
      </p>
    </figure>
  );
}
