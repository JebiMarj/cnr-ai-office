import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useInView, useReducedMotion } from './hooks';

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, visible] = useInView<HTMLDivElement>(0.18);
  return (
    <div ref={ref} className={`reveal${visible ? ' is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function SectionHead({
  kicker,
  title,
  lede,
  id,
}: {
  kicker: string;
  title: string;
  lede?: string;
  id?: string;
}) {
  return (
    <header className="sec-head">
      <p className="kicker">{kicker}</p>
      <h2 id={id}>{title}</h2>
      {lede ? <p className="lede">{lede}</p> : null}
    </header>
  );
}

export function Typed({ text, active }: { text: string; active: boolean }) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduced) {
      setCount(text.length);
      return;
    }
    if (!active) return;
    setCount(0);
    let index = 0;
    const timer = window.setInterval(() => {
      index = Math.min(text.length, index + 1);
      setCount(index);
      if (index >= text.length) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [active, reduced, text]);

  const done = count >= text.length;
  return (
    <span>
      {text.slice(0, count)}
      {active && !done && !reduced ? <span className="caret" aria-hidden="true" /> : null}
    </span>
  );
}

export function CountUp({
  to,
  decimals = 0,
  suffix = '',
  prefix = '',
  label,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  label: string;
}) {
  const reduced = useReducedMotion();
  const [ref, visible] = useInView<HTMLSpanElement>(0.5);
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (reduced || !visible) {
      if (reduced) setValue(to);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 1100);
      const eased = 1 - (1 - progress) ** 3;
      setValue(to * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, to, visible]);

  const shown = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  const finalText = `${prefix}${decimals > 0 ? to.toFixed(decimals) : String(to)}${suffix}`;

  return (
    <span ref={ref} aria-label={`${finalText} ${label}`}>
      <span aria-hidden="true">
        {prefix}
        {shown}
        {suffix}
      </span>
    </span>
  );
}

export function SourceLink({
  name,
  year,
  url,
}: {
  name: string;
  year: string;
  url: string;
  title?: string;
}) {
  return (
    <a className="source" href={url} target="_blank" rel="noreferrer noopener">
      {name}, {year}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function Bar({
  value,
  max,
  tone = 'accent',
  active,
  delay = 0,
}: {
  value: number;
  max: number;
  tone?: 'accent' | 'fast' | 'mid' | 'slow' | 'never' | 'muted' | 'selling';
  active: boolean;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const scale = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const style = {
    width: `${(active || reduced ? scale : 0) * 100}%`,
    transitionDelay: reduced ? '0ms' : `${delay}ms`,
  } as CSSProperties;
  return (
    <span className="bar-track" aria-hidden="true">
      <span className={`bar-fill tone-${tone}`} style={style} />
    </span>
  );
}
