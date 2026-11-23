import { useEffect, useId, useRef } from 'react';
import { flowSteps, ghlServices } from '../content';
import { useMedia, useReducedMotion } from '../hooks';
import { Reveal, SectionHead } from '../ui';

export function Ghl() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const narrow = useMedia('(max-width: 800px)');
  const reduced = useReducedMotion();
  const gradId = useId().replace(/:/g, '');

  useEffect(() => {
    const section = sectionRef.current;
    const path = pathRef.current;
    if (!section || !path) return;

    let cancelled = false;
    let revert: (() => void) | undefined;

    const setup = async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled || !pathRef.current || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      const livePath = pathRef.current;
      const liveSection = sectionRef.current;
      if (!livePath || !liveSection || cancelled) return;
      const length = livePath.getTotalLength();
      if (!length) return;

      const ctx = gsap.context(() => {
        if (reduced) {
          gsap.set(livePath, { strokeDasharray: length, strokeDashoffset: 0 });
          liveSection.dataset.step = '5';
          return;
        }
        gsap.set(livePath, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(livePath, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: liveSection,
            start: 'top 68%',
            end: 'bottom 62%',
            scrub: 0.65,
            onUpdate: (self) => {
              const step = Math.min(5, Math.ceil(self.progress * 5));
              liveSection.dataset.step = String(step);
            },
          },
        });
      }, liveSection);
      revert = () => ctx.revert();
    };

    void setup();
    return () => {
      cancelled = true;
      revert?.();
    };
  }, [narrow, reduced]);

  const pathD = narrow ? 'M6 1 V99' : 'M8 6 H992';

  return (
    <section className="band ghl" id="ghl" ref={sectionRef} data-step={reduced ? '5' : '0'}>
      <div className="wrap">
        <SectionHead
          kicker="GoHighLevel"
          title="The lead should not wait in an inbox no one is watching."
          lede="We set up the CRM and the automations that carry a website chat or form to the right person. The line below draws as you scroll. The words are the workflow."
        />
        <div className={`flow${narrow ? ' is-vertical' : ''}`}>
          <svg
            className="flow-svg"
            viewBox={narrow ? '0 0 12 100' : '0 0 1000 12'}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2={narrow ? '0' : '1'} y2={narrow ? '1' : '0'}>
                <stop offset="0" stopColor="#ffc56b" />
                <stop offset="0.5" stopColor="#ff8a2b" />
                <stop offset="1" stopColor="#ff4d88" />
              </linearGradient>
            </defs>
            <path className="flow-base" d={pathD} />
            <path ref={pathRef} className="flow-draw" d={pathD} stroke={`url(#${gradId})`} />
          </svg>
          <ol className="flow-steps">
            {flowSteps.map((step) => (
              <li key={step.n} className="flow-step">
                <span className="node" />
                <p className="flow-n">{step.n}</p>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="service-grid">
          {ghlServices.map((service, index) => (
            <Reveal key={service.title} delay={index * 40} className="service">
              <span>0{index + 1}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
