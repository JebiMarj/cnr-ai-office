import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks';
import { OfficeScreen, PhoneFrame } from './Phone';

export function Hero() {
  const reduced = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el || reduced || window.matchMedia('(pointer: coarse)').matches) return;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`;
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced]);

  return (
    <section className="hero" id="top">
      <div className="aurora a1" aria-hidden="true" />
      <div className="aurora a2" aria-hidden="true" />
      <div className="particles" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            className="particle"
            style={{
              left: `${(index * 19) % 100}%`,
              animationDuration: `${9 + (index % 5)}s`,
              animationDelay: `${-index * 0.8}s`,
              width: `${3 + (index % 3)}px`,
              height: `${3 + (index % 3)}px`,
            }}
          />
        ))}
      </div>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow load-in">
            <img src="/mark.png" alt="" width="22" height="22" />
            Philippines · AI agents on Grok · GoHighLevel
          </p>
          <h1 className="load-in">
            Close more deals with an <em className="grad">AI sales team</em> in your pocket.
          </h1>
          <p className="lede load-in">
            Create &amp; Reach builds custom AI assistants, plus the GoHighLevel automation behind them, for cleaning
            businesses and sales teams. Talk to your team by voice. Every customer email stays a draft until you send it.
          </p>
          <div className="hero-cta load-in">
            <a className="btn btn-primary" href="#contact">
              Book a Free Strategy Call
            </a>
            <a className="btn btn-ghost" href="#story">
              See the story
            </a>
          </div>
          <ul className="pills load-in">
            <li>Drafts stay drafts</li>
            <li>Voice on your phone</li>
            <li>Cleaning businesses</li>
            <li>Sales teams</li>
          </ul>
        </div>
        <div className="hero-stage">
          <div className="tilt" ref={stage}>
            <PhoneFrame label="Phone showing an AI office with specialist bots lighting up">
              <OfficeScreen />
            </PhoneFrame>
          </div>
          <div className="chip-row">
            <p className="float-chip">Emails stay drafts</p>
            <p className="float-chip">Voice, on the job</p>
          </div>
        </div>
      </div>
    </section>
  );
}
