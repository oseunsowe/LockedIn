import { track } from './analytics.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Header turns translucent only once the page has scrolled.
const header = document.querySelector('[data-header]');
if (header) {
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

// Reveal-on-scroll (transform + opacity only). Under reduced motion everything is simply shown.
const reveals = document.querySelectorAll('[data-reveal]');
if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-in'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );
  reveals.forEach((el) => observer.observe(el));
}

// Analytics: landing view, section views (once each), CTA clicks, scroll depth.
track('landing_view', { viewport: `${window.innerWidth}x${window.innerHeight}` }, { once: true });

if ('IntersectionObserver' in window) {
  const viewObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        track(entry.target.dataset.view, {}, { once: true });
        viewObserver.unobserve(entry.target);
      }
    },
    // A viewport band also detects mobile sections taller than the screen.
    { rootMargin: '-15% 0px -15% 0px', threshold: 0 },
  );
  document.querySelectorAll('[data-view]').forEach((el) => viewObserver.observe(el));
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-track],[data-social]') : null;
  if (!target) return;
  if (target.dataset.track) track(target.dataset.track);
  if (target.dataset.social) track('social_outbound_click', { network: target.dataset.social });
});

const depths = [25, 50, 75, 90];
let ticking = false;
window.addEventListener(
  'scroll',
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      for (const depth of depths) {
        if (percent >= depth) track(`scroll_${depth}`, {}, { once: true });
      }
      ticking = false;
    });
  },
  { passive: true },
);
