import { useId } from 'react';

function Sparkle({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="-12 -12 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FFE3A6" />
          <stop offset="0.4" stopColor="#F79521" />
          <stop offset="1" stopColor="#FF5A78" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M0-10.4 1.2-1.2 10.4 0 1.2 1.2 0 10.4-1.2 1.2-10.4 0-1.2-1.2Z" />
    </svg>
  );
}

export function BrandLockup({ size = 'nav' }: { size?: 'nav' | 'hero' | 'footer' }) {
  return (
    <span className={`lockup lockup-${size}`}>
      <img className="lockup-mark" src="/cnri-mark.svg" alt="" />
      <span className="lockup-words">
        <span>Create &amp; Reach</span>
        <span className="lockup-line2">
          Intelligence
          <Sparkle className="lockup-spark" />
        </span>
      </span>
    </span>
  );
}
