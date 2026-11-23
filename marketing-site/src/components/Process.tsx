import { processSteps } from '../content';
import { useInView } from '../hooks';
import { SectionHead } from '../ui';

export function Process() {
  const [ref, visible] = useInView<HTMLDivElement>(0.3);
  return (
    <section id="process">
      <div className="wrap">
        <SectionHead
          kicker="How it works"
          title="Four steps. Then the team is yours."
          lede="A strategy call, a map of how work moves, the build, and training. No surprise software left behind."
        />
        <div ref={ref} className={`steps${visible ? ' is-in' : ''}`}>
          <div className="steps-line" aria-hidden="true">
            <span />
          </div>
          <ol>
            {processSteps.map((step) => (
              <li key={step.n}>
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
