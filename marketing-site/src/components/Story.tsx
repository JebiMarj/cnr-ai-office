import { storyPoints } from '../content';
import { Icon } from '../icons';
import { Reveal, SectionHead } from '../ui';
import { PhoneFrame, StoryScreen } from './Phone';

export function Story() {
  return (
    <section className="band" id="story">
      <div className="wrap story-grid">
        <Reveal className="story-copy">
          <SectionHead
            kicker="Featured story · anonymized"
            title="A full AI team, on one phone."
            lede="A cleaning franchise owner in Connecticut keeps his day on his phone. Create & Reach built him a custom AI team on Grok. He talks to it by voice. Nothing emails a customer until he has read the draft."
          />
          <ul className="check-list">
            {storyPoints.map((point) => (
              <li key={point}>
                <Icon name="check" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="aside">
            His office admin got her own team of 10 AI agents. That desk was set up in a few days. It is separate from his.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <PhoneFrame label="Phone conversation with the AI team typing a morning plan, a calendar card, and drafts">
            <StoryScreen />
          </PhoneFrame>
        </Reveal>
      </div>
    </section>
  );
}
