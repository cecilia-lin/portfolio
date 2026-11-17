// Progressive enhancements: every page remains readable without this module.
const root = document.documentElement;
const themeToggle = document.querySelector('#theme-toggle');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const schemes = ['auto', 'light', 'dark'];
let savedTheme = 'auto';
try {
  const legacy = localStorage.getItem('colorScheme');
  const saved = localStorage.getItem('portfolio-theme') ?? legacy;
  if (schemes.includes(saved)) savedTheme = saved;
} catch { /* Private browsing may make storage unavailable. */ }
root.dataset.theme = savedTheme;
if (themeToggle) {
  const isDark = () => savedTheme === 'dark' || (savedTheme === 'auto' && systemTheme.matches);
  const updateTheme = () => {
    root.dataset.theme = savedTheme;
    themeToggle.dataset.mode = isDark() ? 'dark' : 'light';
    const label = `Switch to ${isDark() ? 'light' : 'dark'} mode`;
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
  };
  updateTheme();
  themeToggle.hidden = false;
  themeToggle.addEventListener('click', () => {
    savedTheme = isDark() ? 'light' : 'dark';
    updateTheme();
    try { localStorage.setItem('portfolio-theme', savedTheme); } catch { /* Keep the in-session choice. */ }
  });
  systemTheme.addEventListener('change', updateTheme);
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
