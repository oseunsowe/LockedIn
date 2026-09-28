// Progressive enhancement: the inline, accessible screens remain the source of truth.
// Only a wide, tall viewport with motion enabled gets a shared visual phone.
const eligible = window.matchMedia('(min-width: 1101px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');

function enhanceJourney(journey) {
  const steps = [...journey.querySelectorAll('.step')];
  const sources = steps.map((step) => step.querySelector('.step-phone picture'));
  if (sources.length < 2 || sources.some((source) => !source)) return;

  let rail;
  let screens = [];
  let label;
  let meter;
  let ready = false;
  let loading = false;
  let active = -1;
  let frame = 0;
  let observingScroll = false;

  function update() {
    frame = 0;
    if (!ready || !eligible.matches) return;
    const middle = 72 + (window.innerHeight - 72) / 2;
    let index = 0;
    // Boundaries select the section containing the viewport's usable centre.
    steps.forEach((step, i) => {
      if (step.getBoundingClientRect().top <= middle) index = i;
    });
    if (active === index) return;
    active = index;
    screens.forEach((screen, i) => screen.classList.toggle('is-active', i === index));
    label.textContent = steps[index].querySelector('.step-index b').textContent;
    meter.style.transform = `scaleX(${(index + 1) / steps.length})`;
    rail.dataset.activeStep = String(index);
    rail.classList.toggle('is-earned', steps[index].dataset.view === 'verification_section_view' || journey.closest('#proof') !== null && index === steps.length - 1);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function sync() {
    const enabled = ready && eligible.matches;
    journey.classList.toggle('journey-enhanced', enabled);
    if (rail) rail.hidden = !enabled;
    if (enabled && !observingScroll) {
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      observingScroll = true;
    } else if (!enabled && observingScroll) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
      frame = 0;
      observingScroll = false;
    }
    if (enabled) {
      active = -1;
      update();
    }
  }

  async function prepare() {
    if (ready || loading || !eligible.matches) return;
    loading = true;
    rail = document.createElement('div');
    rail.className = 'product-rail';
    rail.hidden = true;
    // This repeats imagery already described by each inline screen's alt text.
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<div class="product-sticky"><div class="phone"><div class="phone-screen"></div></div><div class="journey-caption"><span></span><div class="journey-meter"><i></i></div></div></div>';
    const screenHost = rail.querySelector('.phone-screen');
    label = rail.querySelector('.journey-caption span');
    meter = rail.querySelector('.journey-meter i');
    screens = sources.map((source, index) => {
      const screen = document.createElement('div');
      screen.className = `stage-screen${index === 0 ? ' is-active' : ''}`;
      const picture = source.cloneNode(true);
      const img = picture.querySelector('img');
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'low');
      screen.append(picture);
      screenHost.append(screen);
      return screen;
    });
    journey.append(rail);
    try {
      // Never hide the original phones until every replacement can render.
      await Promise.all(screens.map((screen) => screen.querySelector('img').decode()));
      ready = true;
      sync();
    } catch {
      rail.remove();
      rail = null;
      // A failed image must leave the readable static layout untouched.
    } finally {
      loading = false;
    }
  }

  eligible.addEventListener('change', () => {
    sync();
    if (eligible.matches) {
      const bounds = journey.getBoundingClientRect();
      if (bounds.top < window.innerHeight + 500 && bounds.bottom > -500) void prepare();
    }
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void prepare();
    }, { rootMargin: '500px 0px' });
    observer.observe(journey);
  }
}

document.querySelectorAll('.journey').forEach(enhanceJourney);
