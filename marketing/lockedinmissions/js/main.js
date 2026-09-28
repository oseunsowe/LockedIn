import './waitlist.js';
import './motion.js';
import './journey.js';
import './demo.js';

// Disclosure navigation stays available without JavaScript.
const menu = document.querySelector('.menu-toggle');
const nav = document.getElementById('primary-nav');
if (menu && nav) {
  menu.hidden = false;
  const close = () => {
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      close();
      menu.focus();
    }
  });
}
