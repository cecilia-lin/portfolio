// Progressive enhancements: every page remains readable without this module.
const root = document.documentElement;
const themeSelect = document.querySelector('#theme-selector');
const schemes = ['auto', 'light', 'dark'];
let savedTheme = 'auto';
try {
  const legacy = localStorage.getItem('colorScheme');
  const saved = localStorage.getItem('portfolio-theme') ?? legacy;
  if (schemes.includes(saved)) savedTheme = saved;
} catch { /* Private browsing may make storage unavailable. */ }
root.dataset.theme = savedTheme;
if (themeSelect) {
  themeSelect.parentElement.hidden = false;
  themeSelect.hidden = false;
  themeSelect.value = savedTheme;
  themeSelect.addEventListener('change', () => {
    root.dataset.theme = themeSelect.value;
    try { localStorage.setItem('portfolio-theme', themeSelect.value); } catch { /* Keep the in-session choice. */ }
  });
}

const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#primary-nav');
if (navToggle && nav) {
  navToggle.hidden = false;
  const closeMenu = () => {
    navToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      navToggle.focus();
    }
  });
  matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
}

// Highlight the section currently being read, without intercepting native links.
const sectionLinks = [...document.querySelectorAll('nav a[href^="#"]')];
if ('IntersectionObserver' in window && sectionLinks.length) {
  const observer = new IntersectionObserver(entries => {
    const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!active) return;
    for (const link of sectionLinks) {
      if (link.hash === `#${active.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }, { rootMargin: '-15% 0px -45% 0px', threshold: [0, 0.2, 0.5] });
  for (const link of sectionLinks) {
    const section = document.getElementById(link.hash.slice(1));
    if (section) observer.observe(section);
  }
}
