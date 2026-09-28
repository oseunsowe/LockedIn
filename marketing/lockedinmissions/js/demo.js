/*
 * Interactive phones. Each framed phone becomes a tappable walkthrough of the REAL app screens:
 * a highlighted hotspot sits on the actual button in the screenshot, tapping it plays a tap ripple
 * and slides to the next real screen. Nothing here is synthetic UI - only real captures move.
 * Progressive enhancement: without JS (or under reduced motion) the phone stays a static screenshot
 * (reduced motion still allows tapping, with instant swaps).
 *
 * Hotspot boxes are percentages of the screenshot (x, y, w, h), measured from the captures.
 */
const FLOW = [
  {
    id: 'LIM-UI-005-intentions',
    name: 'Hidden intentions',
    alt: 'LockedIn Hidden Intentions screen: found 9 hidden intentions with Ignore and Turn into Mission actions',
    hot: { x: 38, y: 44.2, w: 52, h: 5.9, r: '999px' },
    action: 'Turn into Mission',
  },
  {
    id: 'LIM-UI-002-mission-board',
    name: 'Mission board',
    alt: 'LockedIn mission board showing an active Main Quest and side missions',
    hot: { x: 6, y: 18.2, w: 88, h: 12.2, r: '16px' },
    action: 'Open the Main Quest',
  },
  {
    id: 'LIM-UI-003-mission-detail',
    name: 'Mission detail',
    alt: 'LockedIn mission detail with a countdown, the proof required and a Submit Proof button',
    hot: { x: 52, y: 80.6, w: 42, h: 5.8, r: '999px' },
    action: 'Start Focus Mode',
  },
  {
    id: 'LIM-UI-004-focus',
    name: 'Focus Mode',
    alt: 'LockedIn Focus Mode: a live session timer with a personal commitment to skip feeds, short video and messaging',
    hot: { x: 6, y: 91.6, w: 88, h: 6.4, r: '999px' },
    action: 'Submit Proof',
  },
  {
    id: 'LIM-UI-011-verified',
    name: 'Mission verified',
    alt: 'LockedIn Mission Verified screen showing 78 percent confidence and plus 100 XP',
    hot: { x: 6, y: 65.3, w: 88, h: 6.6, r: '999px' },
    action: 'Continue',
  },
  {
    id: 'LIM-UI-012-level-up',
    name: 'Level up',
    alt: 'LockedIn level-up screen with the rank journey',
    hot: { x: 6, y: 89, w: 88, h: 6.5, r: '999px' },
    action: 'Keep Going',
  },
];

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

function makePicture(step) {
  const picture = document.createElement('picture');
  for (const ext of ['avif', 'webp']) {
    const source = document.createElement('source');
    source.type = `image/${ext}`;
    source.srcset = `assets/lockedin/ui/${step.id}-360.${ext} 360w, assets/lockedin/ui/${step.id}-720.${ext} 720w`;
    source.sizes = '(max-width: 640px) 80vw, 340px';
    picture.append(source);
  }
  const img = document.createElement('img');
  img.src = `assets/lockedin/ui/${step.id}-720.webp`;
  img.alt = step.alt;
  img.width = 720;
  img.height = 1558;
  img.loading = 'lazy';
  img.decoding = 'async';
  picture.append(img);
  return picture;
}

function enhance(phone) {
  const screen = phone.querySelector('.phone-screen');
  const firstPicture = screen?.querySelector('picture');
  const firstImage = firstPicture?.querySelector('img');
  if (!screen || !firstPicture || !firstImage) return;

  const start = FLOW.findIndex((step) => firstImage.src.includes(step.id));
  if (start < 0) return;

  let current = start;
  let busy = false;
  const layers = new Array(FLOW.length).fill(null);

  const layerFor = (index) => {
    if (layers[index]) return layers[index];
    const layer = document.createElement('div');
    layer.className = 'demo-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.append(makePicture(FLOW[index]));
    screen.insertBefore(layer, hot);
    layers[index] = layer;
    return layer;
  };

  // Hotspot, the one interactive control on the phone.
  const hot = document.createElement('button');
  hot.type = 'button';
  hot.className = 'demo-hot';
  screen.append(hot);

  // The original picture becomes the first layer, reusing its already-loaded image.
  const firstLayer = document.createElement('div');
  firstLayer.className = 'demo-layer is-current';
  screen.insertBefore(firstLayer, hot);
  firstLayer.append(firstPicture);
  layers[start] = firstLayer;

  const caption = document.createElement('p');
  caption.className = 'demo-caption';
  caption.setAttribute('role', 'status');
  caption.setAttribute('aria-live', 'polite');
  phone.after(caption);

  function render() {
    const step = FLOW[current];
    const next = FLOW[(current + 1) % FLOW.length];
    hot.style.setProperty('--x', `${step.hot.x}%`);
    hot.style.setProperty('--y', `${step.hot.y}%`);
    hot.style.setProperty('--w', `${step.hot.w}%`);
    hot.style.setProperty('--h', `${step.hot.h}%`);
    hot.style.setProperty('--r', step.hot.r);
    hot.setAttribute('aria-label', `${step.action}. Shows the ${next.name.toLowerCase()} screen.`);
    // Restart the attention ring on each new screen (it runs a few times, then stops).
    hot.classList.remove('is-hinting');
    void hot.offsetWidth;
    hot.classList.add('is-hinting');
    caption.innerHTML = `<span class="demo-tap-hint">Tap <b>${step.action}</b></span><span class="demo-dots" aria-hidden="true">${FLOW.map((_, i) => `<i${i === current ? ' class="on"' : ''}></i>`).join('')}</span>`;
    caption.setAttribute('aria-label', `${step.name}. Tap ${step.action} to continue.`);
  }

  function ripple() {
    const dot = document.createElement('span');
    dot.className = 'demo-tap';
    dot.style.left = `calc(${FLOW[current].hot.x + FLOW[current].hot.w / 2}%)`;
    dot.style.top = `calc(${FLOW[current].hot.y + FLOW[current].hot.h / 2}%)`;
    screen.append(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
    setTimeout(() => dot.remove(), 800);
  }

  async function advance() {
    if (busy) return;
    busy = true;
    const from = layers[current];
    const nextIndex = (current + 1) % FLOW.length;
    const to = layerFor(nextIndex);

    if (!reduced.matches) {
      ripple();
      await new Promise((resolve) => setTimeout(resolve, 170));
    }

    to.style.visibility = 'visible';
    to.style.zIndex = '2';
    from.style.zIndex = '1';
    const timing = { duration: reduced.matches ? 0 : 340, easing: EASE, fill: 'forwards' };
    const out = from.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(-7%)' }], timing);
    const inn = to.animate([{ opacity: 0, transform: 'translateX(7%)' }, { opacity: 1, transform: 'translateX(0)' }], timing);
    await Promise.allSettled([out.finished, inn.finished]);

    from.classList.remove('is-current');
    from.setAttribute('aria-hidden', 'true');
    from.style.zIndex = '';
    to.classList.add('is-current');
    to.removeAttribute('aria-hidden');
    to.style.visibility = '';
    to.style.zIndex = '';
    out.cancel();
    inn.cancel();
    current = nextIndex;
    render();
    busy = false;
  }

  hot.addEventListener('click', advance);
  render();

  // Preload the other screens shortly after the phone nears the viewport, so taps feel instant.
  const warm = () => {
    for (let i = 0; i < FLOW.length; i++) layerFor(i);
  };
  const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 400));
  const warmObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      warmObserver.disconnect();
      idle(warm);
    },
    { rootMargin: '400px 0px' },
  );
  warmObserver.observe(phone);

  // Scroll-in: the phone rises and its screen "wakes" once, when first seen.
  const wake = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      wake.disconnect();
      phone.classList.add('is-live');
    },
    { threshold: 0.25 },
  );
  if (reduced.matches) phone.classList.add('is-live');
  else wake.observe(phone);
}

document.querySelectorAll('.hero-stage .phone, .step-phone').forEach(enhance);
