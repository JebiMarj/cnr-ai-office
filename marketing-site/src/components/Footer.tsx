import { navLinks } from '../content';

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <p className="brand-name">Create &amp; Reach</p>
          <p>VA Services · Philippines</p>
          <p>
            <a href="https://createandreachva.com">createandreachva.com</a>
          </p>
        </div>
        <nav aria-label="Footer">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a href="#contact">Book a call</a>
        </nav>
        <p className="fine">
          Stories are anonymized. Research figures stay in “See the research,” with the publisher and year. This page is
          separate from the AI Office app.
        </p>
      </div>
      <p className="legal">© {new Date().getFullYear()} Create &amp; Reach VA Services</p>
    </footer>
  );
}
