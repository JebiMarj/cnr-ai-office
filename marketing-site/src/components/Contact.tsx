import { useEffect, useState, type FormEvent } from 'react';
import { PREFILL_EVENT } from '../content';
import { SectionHead } from '../ui';

export function Contact() {
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const onPrefill = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? '';
      setNote((current) => (current.trim() ? current : detail));
      setSent(false);
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Placeholder only — no backend in this static site.
    // Later, this form will POST to a GoHighLevel form / webhook.
    setSent(true);
  }

  return (
    <section className="band contact" id="contact">
      <div className="wrap contact-grid">
        <SectionHead
          kicker="Final call"
          title="Book a free strategy call."
          lede="Tell us whether you want an AI team, a GoHighLevel setup, or both. Bring the messy process. We’ll tell you plainly what we would build."
        />
        {sent ? (
          <div className="success" role="status">
            <h3>Nothing was sent.</h3>
            <p>
              This preview form is not connected yet. When the marketing site goes live, the same fields will post to a
              GoHighLevel form webhook. Your note stayed in this browser.
            </p>
            <button type="button" className="btn btn-ghost" onClick={() => setSent(false)}>
              Edit the note
            </button>
          </div>
        ) : (
          <form className="form" onSubmit={onSubmit}>
            <div className="form-row">
              <label>
                Name
                <input name="name" autoComplete="name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required />
              </label>
            </div>
            <label>
              Company
              <input name="company" autoComplete="organization" />
            </label>
            <div className="form-row">
              <label>
                I am with
                <select name="audience" defaultValue="cleaning" required>
                  <option value="cleaning">A cleaning business</option>
                  <option value="sales">A sales team</option>
                  <option value="both">Both</option>
                  <option value="other">Something else</option>
                </select>
              </label>
              <label>
                I need
                <select name="need" defaultValue="both" required>
                  <option value="ai">An AI team</option>
                  <option value="ghl">A GoHighLevel setup</option>
                  <option value="both">Both</option>
                  <option value="unsure">Not sure yet</option>
                </select>
              </label>
            </div>
            <label>
              Note
              <textarea id="note" name="note" rows={4} value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">
              Request the strategy call
            </button>
            <p className="fine">
              This form does not send yet. It will connect to a GoHighLevel webhook later. Please don’t include
              passwords, customer lists, or other secrets.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
