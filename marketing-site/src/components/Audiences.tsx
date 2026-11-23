import { useRef, useState, type KeyboardEvent } from 'react';
import { audiences } from '../content';
import { SectionHead } from '../ui';

type TabId = keyof typeof audiences;

export function Audiences() {
  const [tab, setTab] = useState<TabId>('cleaning');
  const cleaningRef = useRef<HTMLButtonElement>(null);
  const salesRef = useRef<HTMLButtonElement>(null);
  const current = audiences[tab];

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next: TabId = tab === 'cleaning' ? 'sales' : 'cleaning';
    setTab(next);
    (next === 'cleaning' ? cleaningRef : salesRef).current?.focus();
  };

  return (
    <section id="who">
      <div className="wrap">
        <SectionHead
          kicker="Who it’s for"
          title="Same craft. Two kinds of week."
          lede="Cleaning businesses and sales teams feel the stall in different places. Pick the one that sounds like yours."
        />
        <div className="tablist" role="tablist" aria-label="Who this is for" onKeyDown={onKey}>
          <button
            ref={cleaningRef}
            type="button"
            role="tab"
            id="tab-cleaning"
            aria-selected={tab === 'cleaning'}
            aria-controls="panel-cleaning"
            tabIndex={tab === 'cleaning' ? 0 : -1}
            className={tab === 'cleaning' ? 'is-on' : ''}
            onClick={() => setTab('cleaning')}
          >
            For cleaning businesses
          </button>
          <button
            ref={salesRef}
            type="button"
            role="tab"
            id="tab-sales"
            aria-selected={tab === 'sales'}
            aria-controls="panel-sales"
            tabIndex={tab === 'sales' ? 0 : -1}
            className={tab === 'sales' ? 'is-on' : ''}
            onClick={() => setTab('sales')}
          >
            For sales teams
          </button>
        </div>
        <div
          role="tabpanel"
          id={tab === 'cleaning' ? 'panel-cleaning' : 'panel-sales'}
          aria-labelledby={tab === 'cleaning' ? 'tab-cleaning' : 'tab-sales'}
          className="panel"
        >
          <p className="lede">{current.lede}</p>
          <ul className="pairs">
            {current.pairs.map((pair) => (
              <li key={pair.pain}>
                <div>
                  <span>Where it snags</span>
                  <p>{pair.pain}</p>
                </div>
                <div>
                  <span>What we set up</span>
                  <p>{pair.fix}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
