import { useEffect, useRef, useState, type ReactNode } from 'react';
import { heroBots, storyLines } from '../content';
import { useReducedMotion } from '../hooks';
import { Typed } from '../ui';

export function PhoneFrame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="phone" role="img" aria-label={label}>
      <div className="phone-screen">
        <div className="phone-status">
          <span>9:41</span>
          <span className="phone-island" />
          <span>5G</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export function OfficeScreen() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % heroBots.length);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [reduced]);

  const bot = heroBots[reduced ? 0 : active];

  return (
    <div className="office-screen">
      <p className="phone-kicker">AI Office</p>
      <h3>Your team is on</h3>
      <ul className="bot-grid">
        {heroBots.map((item, index) => (
          <li key={item.short} className={index === active || reduced ? 'is-live' : ''}>
            <span>{item.short}</span>
            <small>{item.chip}</small>
          </li>
        ))}
      </ul>
      <div className="status-card">
        <strong>{bot.name}</strong>
        <p>{reduced ? 'Ask by voice. Emails stay drafts until you send them.' : bot.line}</p>
      </div>
      <p className="drafts-pill">2 drafts waiting · nothing sent</p>
      <div className="mic">
        <span />
        Hold to talk
      </div>
    </div>
  );
}

export function StoryScreen() {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(reduced ? storyLines.length : 0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      setCount(storyLines.length);
      return;
    }
    const previous = count === 0 ? null : storyLines[count - 1];
    const wait =
      count === 0 ? 400 : count >= storyLines.length ? 2600 : 640 + (previous ? previous.text.length * 16 : 0);
    const timer = window.setTimeout(() => {
      setCount((current) => (current >= storyLines.length ? 0 : current + 1));
    }, wait);
    return () => window.clearTimeout(timer);
  }, [count, reduced]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [count, reduced]);

  return (
    <div className="story-screen">
      <p className="phone-kicker">Voice</p>
      <h3>Morning check-in</h3>
      <div className="thread" ref={scroller}>
        {storyLines.slice(0, count).map((line, index) => (
          <div key={`${line.name}-${index}`} className={`bubble bubble-${line.who === 'you' ? 'you' : line.who === 'cal' ? 'cal' : 'bot'}`}>
            <span className="who">{line.name}</span>
            <p>
              <Typed text={line.text} active={!reduced && index === count - 1} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
