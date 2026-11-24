import { useEffect, useRef } from 'react';
import { useReducedMotion } from './hooks';
import { Builder } from './components/Builder';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { CrmFlow } from './components/CrmFlow';
import { Hero } from './components/Hero';
import { Impact } from './components/Impact';
import { Nav } from './components/Nav';
import { Story } from './components/Story';
export function App() {
  const bar = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = bar.current;
    if (!el || reduced) return;
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? window.scrollY / height : 0;
      el.style.transform = `scaleX(${progress})`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduced]);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {reduced ? null : <div className="progress" ref={bar} aria-hidden="true" />}
      <PointerGlow />
      <Nav />
      <main id="main">
        <Hero />
        <Story />
        <Impact />
        <CrmFlow />
        <Builder />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

function PointerGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || window.matchMedia('(pointer: coarse)').matches) return;
    const onMove = (event: PointerEvent) => {
      el.style.opacity = '1';
      el.style.transform = `translate3d(${event.clientX - 220}px, ${event.clientY - 220}px, 0)`;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  if (reduced) return null;
  return <div ref={ref} className="pointer-glow" aria-hidden="true" />;
}
