import { useMemo, useState } from 'react';
import { agentOrder, needPlan, needs, PREFILL_EVENT, type NeedId } from '../content';
import { useReducedMotion } from '../hooks';
import { SectionHead } from '../ui';

export function Builder() {
  const [selected, setSelected] = useState<NeedId[]>(['followups', 'crm']);
  const reduced = useReducedMotion();

  const plan = useMemo(() => {
    const names = new Set<string>();
    const ghl: string[] = [];
    if (selected.length) names.add('Executive Assistant');
    for (const id of selected) {
      needPlan[id].agents.forEach((name) => names.add(name));
      ghl.push(needPlan[id].ghl);
    }
    return {
      agents: agentOrder.filter((name) => names.has(name)),
      ghl,
    };
  }, [selected]);

  const toggle = (id: NeedId) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const book = () => {
    const labels = needs.filter((need) => selected.includes(need.id)).map((need) => need.label);
    const detail = labels.length ? `Interested in: ${labels.join(', ')}.` : '';
    window.dispatchEvent(new CustomEvent(PREFILL_EVENT, { detail }));
    document.getElementById('contact')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    window.setTimeout(() => document.getElementById('note')?.focus(), reduced ? 0 : 400);
  };

  const summary =
    plan.agents.length === 0
      ? 'Nothing selected yet. Pick a few needs, or skip ahead and book the call.'
      : `Suggested team: ${plan.agents.join(', ')}. GoHighLevel: ${plan.ghl.join('; ')}.`;

  return (
    <section className="band" id="builder">
      <div className="wrap builder">
        <div>
          <SectionHead
            kicker="What’s possible"
            title="Build a first sketch of your AI team."
            lede="Toggle what you want help with. We’ll show a starting team and the GoHighLevel pieces that sit behind it. This is a conversation starter, not a quote."
          />
          <div className="need-grid">
            {needs.map((need) => {
              const on = selected.includes(need.id);
              return (
                <button
                  key={need.id}
                  type="button"
                  className={`need${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => toggle(need.id)}
                >
                  <strong>{need.label}</strong>
                  <span>{need.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sketch" aria-live="polite">
          <p className="kicker">Suggested setup</p>
          {plan.agents.length === 0 ? (
            <p>Choose a few needs. The executive assistant shows up as soon as you pick one, because that is the voice on the phone.</p>
          ) : (
            <>
              <ul className="chips" key={plan.agents.join('|')}>
                {plan.agents.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <h3>GoHighLevel behind them</h3>
              <ul className="ghl-list">
                {plan.ghl.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          )}
          <p className="sr-only">{summary}</p>
          <button type="button" className="btn btn-primary" onClick={book}>
            Book a Free Strategy Call
          </button>
        </div>
      </div>
    </section>
  );
}
