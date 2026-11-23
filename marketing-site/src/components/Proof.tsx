import { proof } from '../content';
import { CountUp, Reveal, SectionHead } from '../ui';

export function Proof() {
  return (
    <section id="proof">
      <div className="wrap">
        <SectionHead
          kicker="Proof of work"
          title="Real engagements. Names left off."
          lede="These are jobs we have done. We are not publishing a client’s results, a testimonial, or a number they have not approved. The only counts below are the number of agents we built."
        />
        <div className="proof-grid">
          {proof.map((card, index) => (
            <Reveal key={card.title} className={`proof-card${index === 0 ? ' is-feature' : ''}`} delay={index * 50}>
              <div>
                <p className="kicker">{card.kicker}</p>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                {card.pending ? (
                  <p className="pending">
                    <span>Outcome figure</span>
                    [Result stat - pending client approval]
                  </p>
                ) : null}
              </div>
              {card.counts.length > 0 ? (
                <div className="mini-counts">
                  {card.counts.map((count) => (
                    <p key={count.label}>
                      <strong>
                        <CountUp to={count.to} suffix={count.suffix} label={count.label} />
                      </strong>
                      <span>{count.label}</span>
                    </p>
                  ))}
                </div>
              ) : null}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
