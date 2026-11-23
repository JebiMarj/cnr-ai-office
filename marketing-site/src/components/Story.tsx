import { agents } from '../content';
import { Icon } from '../icons';
import { SectionHead } from '../ui';
import { PhoneFrame, StoryScreen } from './Phone';

export function Story() {
  return (
    <section id="story">
      <div className="wrap">
        <div className="story-grid">
          <SectionHead
            kicker="On your phone"
            title="A full AI team, on one phone."
            lede="A cleaning franchise owner in Connecticut talks to it by voice. Emails stay drafts. His admin’s team of 10 was set up in a few days."
          />
          <PhoneFrame label="A short voice check-in with the AI team. Emails stay drafts.">
            <StoryScreen />
          </PhoneFrame>
        </div>
        <ul className="role-grid">
          {agents.map((agent) => (
            <li key={agent.id}>
              <span className="icon-badge">
                <Icon name={agent.id} />
              </span>
              <h3>{agent.name}</h3>
              <p>{agent.line}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
