import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const globalSource = await read('global.js');
const filterSource = await read('projects/projects.js');

function element(dataset = {}) {
  const events = new Map();
  const attributes = new Map();
  const classes = new Set();
  return {
    dataset, hidden: true, value: '', textContent: '', focused: false,
    addEventListener: (type, listener) => events.set(type, listener),
    emit: (type, event = {}) => events.get(type)?.(event),
    setAttribute: (key, value) => attributes.set(key, value),
    getAttribute: key => attributes.get(key),
    focus() { this.focused = true; },
    classList: {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      contains: value => classes.has(value),
      toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value),
    },
  };
}

function globalUI({ saved, legacy, dark = false, blocked = false } = {}) {
  const root = { dataset: {} };
  const theme = element();
  const toggle = element();
  toggle.setAttribute('aria-expanded', 'false');
  const nav = element();
  const document = element();
  const system = element();
  system.matches = dark;
  const viewport = element();
  const storage = new Map([['portfolio-theme', saved], ['colorScheme', legacy]]);
  document.documentElement = root;
  document.querySelector = selector => ({ '#theme-toggle': theme, '.nav-toggle': toggle, '#primary-nav': nav })[selector];
  const localStorage = {
    getItem: key => { if (blocked) throw Error('Storage unavailable'); return storage.get(key) ?? null; },
    setItem: (key, value) => { if (blocked) throw Error('Storage unavailable'); storage.set(key, value); },
  };
  vm.runInNewContext(globalSource, { document, localStorage, matchMedia: query => query.includes('color-scheme') ? system : viewport });
  return { root, theme, toggle, nav, document, system, viewport, storage };
}

test('theme follows system changes until the visitor chooses a mode', () => {
  const ui = globalUI();
  assert.equal(ui.theme.dataset.mode, 'light');
  assert.equal(ui.theme.hidden, false);
  ui.system.matches = true;
  ui.system.emit('change');
  assert.equal(ui.theme.dataset.mode, 'dark');
  ui.theme.emit('click');
  assert.equal(ui.root.dataset.theme, 'light');
  assert.equal(ui.storage.get('portfolio-theme'), 'light');
  assert.equal(ui.theme.getAttribute('aria-label'), 'Switch to dark mode');
  ui.system.emit('change');
  assert.equal(ui.theme.dataset.mode, 'light');
  ui.theme.emit('click');
  assert.equal(ui.storage.get('portfolio-theme'), 'dark');
  assert.equal(ui.theme.getAttribute('aria-label'), 'Switch to light mode');
});

test('theme restores saved and legacy preferences and tolerates blocked storage', () => {
  assert.equal(globalUI({ saved: 'light', dark: true }).theme.dataset.mode, 'light');
  assert.equal(globalUI({ saved: 'dark' }).theme.dataset.mode, 'dark');
  assert.equal(globalUI({ legacy: 'dark' }).theme.dataset.mode, 'dark');
  assert.equal(globalUI({ saved: 'invalid', dark: true }).root.dataset.theme, 'auto');
  const ui = globalUI({ blocked: true, dark: true });
  ui.theme.emit('click');
  assert.equal(ui.theme.dataset.mode, 'light');
});

test('mobile navigation closes on Escape, navigation, and viewport change', () => {
  const ui = globalUI();
  ui.toggle.emit('click');
  assert.equal(ui.toggle.getAttribute('aria-expanded'), 'true');
  assert.ok(ui.nav.classList.contains('is-open'));
  ui.document.emit('keydown', { key: 'Escape' });
  assert.equal(ui.toggle.getAttribute('aria-expanded'), 'false');
  assert.ok(ui.toggle.focused);
  ui.toggle.emit('click');
  ui.nav.emit('click', { target: { closest: () => ({}) } });
  assert.equal(ui.toggle.getAttribute('aria-expanded'), 'false');
  ui.toggle.emit('click');
  ui.viewport.emit('change');
  assert.ok(!ui.nav.classList.contains('is-open'));
});

function filterUI({ missingSearch = false } = {}) {
  const search = element();
  const form = element();
  const count = element();
  const empty = element();
  const status = element();
  const buttons = ['all', 'modeling', 'pipelines'].map(filter => element({ filter }));
  const cards = [
    element({ tags: 'modeling|pipelines', search: 'ai credibility python' }),
    element({ tags: 'modeling', search: 'recipe rating prediction python' }),
    element({ tags: 'pipelines|visualization', search: 'blood glucose d3' }),
  ];
  cards.forEach(card => { card.hidden = false; });
  let nextFrame;
  form.querySelector = () => missingSearch ? null : search;
  form.querySelectorAll = () => buttons;
  form.reset = () => { form.emit('reset'); search.value = ''; nextFrame(); };
  const reset = element();
  const document = {
    querySelector: selector => ({ '#project-filters': form, '#project-count': count, '#empty-results': empty, '#filter-status': status, '#empty-reset': reset })[selector],
    querySelectorAll: () => cards,
  };
  vm.runInNewContext(filterSource, { document, requestAnimationFrame: callback => { nextFrame = callback; } });
  return { search, form, count, empty, status, buttons, cards, reset };
}

test('project filters combine search and category, show empty results, and reset', () => {
  const ui = filterUI();
  assert.equal(ui.count.textContent, 'Showing 3 of 3 projects');
  ui.buttons[1].emit('click');
  assert.equal(ui.count.textContent, 'Showing 2 of 3 projects');
  ui.search.value = '  RECIPE  ';
  ui.search.emit('input');
  assert.equal(ui.count.textContent, 'Showing 1 of 3 projects');
  assert.equal(ui.cards[1].hidden, false);
  ui.buttons[2].emit('click');
  assert.equal(ui.count.textContent, 'Showing 0 of 3 projects');
  assert.equal(ui.empty.hidden, false);
  ui.reset.emit('click');
  assert.equal(ui.count.textContent, 'Showing 3 of 3 projects');
  assert.equal(ui.empty.hidden, true);
  assert.equal(ui.buttons[0].getAttribute('aria-pressed'), 'true');
  assert.equal(ui.search.value, '');
  assert.ok(ui.search.focused);
});

test('a missing search control leaves static projects available with feedback', () => {
  const ui = filterUI({ missingSearch: true });
  assert.equal(ui.form.hidden, true);
  assert.ok(ui.cards.every(card => !card.hidden));
  assert.equal(ui.status.hidden, false);
  assert.match(ui.status.textContent, /still browse all projects/);
});

test('title animation stays optional when GSAP is unavailable', async () => {
  const hero = element();
  const toggle = element();
  const document = { querySelector: selector => selector === '.hero' ? hero : toggle, querySelectorAll: () => [element(), element(), element()] };
  vm.runInNewContext(await read('hero.js'), { document, window: {} });
  assert.equal(toggle.hidden, true);
  assert.ok(!hero.classList.contains('has-role-animation'));
});
