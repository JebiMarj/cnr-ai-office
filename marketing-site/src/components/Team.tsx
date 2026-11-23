import { useState } from 'react';
import { agents, type AgentId } from '../content';
import { useInView } from '../hooks';
import { Icon } from '../icons';
import { Reveal, SectionHead, Typed } from '../ui';

const iconFor: Record<AgentId, AgentId> = {
  ea: 'ea',
  coach: 'coach',
  writer: 'writer',
  planner: 'planner',
  calls: 'calls',
  travel: 'travel',
  comp: 'comp',
  admin: 'admin',
};

export function Team() {
  return (
    <section id="team">
      <div className="wrap">
        <SectionHead
          kicker="Meet the AI team"
          title="Specialists, not a single chatbot."
          lede="Each one has a job. Flip a card to see how a reply shows up. The words type out the way a draft would. You still decide what leaves the building."
        />
        <div className="team-grid">
          {agents.map((agent, index) => (
            <Reveal key={agent.id} delay={index * 60}>
              <AgentCard agent={agent} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentCard({ agent }: { agent: (typeof agents)[number] }) {
  const [open, setOpen] = useState(false);
  const [ref, visible] = useInView<HTMLElement>(0.4);

  return (
    <article ref={ref} className={`flip${open ? ' is-flipped' : ''}`}>
      <div className="flip-inner">
        <div className="face face-front" inert={open ? true : undefined}>
          <span className="icon-badge">
            <Icon name={iconFor[agent.id]} />
          </span>
          <h3>{agent.name}</h3>
          <p>{agent.role}</p>
          <p className="demo-line">
            <Typed text={agent.demo} active={visible && !open} />
          </p>
          <button type="button" className="text-btn" aria-expanded={open} onClick={() => setOpen(true)}>
            Flip card
          </button>
        </div>
        <div className="face face-back" inert={!open ? true : undefined}>
          <h3>{agent.name}</h3>
          <p className="demo-line">
            <Typed text={agent.more} active={open} />
          </p>
          <button type="button" className="text-btn" onClick={() => setOpen(false)}>
            Back
          </button>
        </div>
      </div>
    </article>
  );
}
