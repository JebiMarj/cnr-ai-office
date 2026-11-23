import { useEffect, useState } from 'react';
import { navLinks } from '../content';

export function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="nav">
      {open ? (
        <button type="button" className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <div className="wrap nav-inner">
        <a className="brand" href="#top">
          <img src="/cnr-logo-128.png" width="40" height="40" alt="" />
          <span>
            <span className="brand-name">Create &amp; Reach Intelligence</span>
          </span>
        </a>
        <nav id="mobile-nav" className={`nav-links${open ? ' is-open' : ''}`} aria-label="Page">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <a className="btn btn-primary nav-cta" href="#contact" onClick={() => setOpen(false)}>
            Book a call
          </a>
        </nav>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
