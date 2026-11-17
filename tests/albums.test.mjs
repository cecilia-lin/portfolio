import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../about/albums.js', import.meta.url), 'utf8');
function node() {
  const events = new Map();
  const attributes = new Map();
  const classes = new Set();
  return {
    hidden: false, disabled: false, inert: false, open: false, textContent: '',
    addEventListener: (name, callback) => events.set(name, callback),
    emit: (name, event = {}) => events.get(name)?.(event),
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
    getAttribute: name => attributes.get(name),
    classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
    focus() { this.focused = true; },
  };
}
function albumUI({ available = true, reduced = false } = {}) {
  const motion = Object.assign(node(), { matches: reduced });
  const timelines = [];
  const sets = [];
  const albums = [2, 1].map(length => {
    const album = node();
    album.setAttribute('name', 'hobby-albums');
    const parts = Object.fromEntries(['cover', 'reveal', 'navigation', 'prev', 'next', 'count'].map(name => [name, node()]));
    parts.navigation.hidden = true;
    const pages = Array.from({ length }, node);
    album.querySelector = selector => parts[selector.replace('.album-', '')];
    album.querySelectorAll = () => pages;
    album.contains = element => Object.values(parts).includes(element) || pages.includes(element);
    return { album, pages, ...parts };
  });
  const document = Object.assign(node(), { activeElement: albums[0].cover, querySelectorAll: () => albums.map(ui => ui.album) });
  const gsap = {
    set: (target, properties) => sets.push({ target, properties }),
    timeline: ({ onComplete }) => {
      const timeline = { killed: false, completed: false, steps: [],
        to(...args) { this.steps.push(args); return this; },
        fromTo(...args) { this.steps.push(args); return this; },
        kill() { this.killed = true; },
        progress(value) {
          assert.equal(value, 1);
          if (!this.killed && !this.completed) { this.completed = true; onComplete(); }
          return this;
        },
      };
      timelines.push(timeline);
      return timeline;
    },
  };
  const window = { matchMedia: query => {
    assert.equal(query, '(prefers-reduced-motion: reduce)');
    return motion;
  } };
  if (available) window.gsap = gsap;
  vm.runInNewContext(source, { document, window });
  const click = ui => {
    let prevented = false;
    ui.cover.emit('click', { preventDefault: () => { prevented = true; } });
    return prevented;
  };
  return { albums, document, motion, timelines, sets, click };
}

test('without GSAP, native album groups and all photos are untouched', () => {
  const ui = albumUI({ available: false });
  for (const { album, navigation, pages } of ui.albums) {
    assert.equal(album.getAttribute('name'), 'hobby-albums');
    assert.equal(navigation.hidden, true);
    assert.ok(pages.every(page => !page.hidden));
    assert.equal(album.classList.contains('album-paged'), false);
  }
});

test('album opening and closing settle to native, accessible states', () => {
  const ui = albumUI();
  const first = ui.albums[0];
  assert.equal(ui.click(first), true);
  assert.equal(first.album.open, true);
  assert.equal(first.album.classList.contains('is-album-animating'), true);
  ui.timelines.at(-1).progress(1);
  assert.equal(first.album.classList.contains('is-album-animating'), false);
  assert.equal(first.reveal.inert, false);
  ui.document.activeElement = first.next;
  ui.click(first);
  assert.equal(first.album.open, true, 'content stays open until closing finishes');
  assert.equal(first.reveal.inert, true, 'closing content cannot receive focus');
  assert.equal(first.cover.focused, true);
  ui.timelines.at(-1).progress(1);
  assert.equal(first.album.open, false);
  assert.equal(first.reveal.inert, false);
  assert.ok(ui.sets.some(set => set.properties.clearProps === 'height,opacity,overflow'));
});

test('rapid reversals and album switching cannot complete stale animations', () => {
  const ui = albumUI();
  const [first, second] = ui.albums;
  ui.click(first);
  ui.click(first);
  ui.click(first);
  assert.ok(ui.timelines.slice(0, 2).every(timeline => timeline.killed));
  ui.timelines.forEach(timeline => timeline.progress(1));
  assert.equal(first.album.open, true);
  ui.click(second);
  assert.equal(first.reveal.inert, true);
  ui.timelines.forEach(timeline => timeline.progress(1));
  assert.equal(first.album.open, false);
  assert.equal(second.album.open, true);
  assert.equal(second.navigation.hidden, true, 'single-page albums do not show empty paging controls');
});

test('page turns update the visible page and counter, enforce bounds, and ignore extra clicks', () => {
  const ui = albumUI();
  const first = ui.albums[0];
  assert.equal(first.navigation.hidden, false);
  assert.equal(first.count.textContent, 'Page 1 of 2');
  assert.equal(first.prev.disabled, true);
  assert.equal(first.pages[1].hidden, true);
  ui.click(first);
  first.next.emit('click');
  assert.equal(ui.timelines[0].completed, true, 'opening finishes before flipping');
  assert.equal(first.prev.disabled, true);
  assert.equal(first.next.disabled, true);
  const total = ui.timelines.length;
  first.next.emit('click');
  assert.equal(ui.timelines.length, total);
  ui.timelines.at(-1).progress(1);
  assert.equal(first.count.textContent, 'Page 2 of 2');
  assert.deepEqual(first.pages.map(page => page.hidden), [true, false]);
  assert.equal(first.next.disabled, true);
  first.next.emit('click');
  assert.equal(ui.timelines.length, total, 'cannot turn past the last page');
  first.prev.emit('click');
  ui.timelines.at(-1).progress(1);
  assert.equal(first.count.textContent, 'Page 1 of 2');
  assert.deepEqual(first.pages.map(page => page.hidden), [false, true]);
});

test('switching albums mid-turn finishes the page before hiding it', () => {
  const ui = albumUI();
  const [first, second] = ui.albums;
  ui.click(first);
  first.next.emit('click');
  ui.click(second);
  assert.equal(first.count.textContent, 'Page 2 of 2');
  assert.deepEqual(first.pages.map(page => page.hidden), [true, false]);
  ui.timelines.forEach(timeline => timeline.progress(1));
  assert.equal(first.album.open, false);
  assert.equal(second.album.open, true);
});

test('reduced motion and backgrounding finish pending motion without losing page state', () => {
  const ui = albumUI({ reduced: true });
  const first = ui.albums[0];
  ui.click(first);
  first.next.emit('click');
  assert.equal(ui.timelines.length, 0);
  assert.equal(first.count.textContent, 'Page 2 of 2');
  ui.motion.matches = false;
  first.prev.emit('click');
  ui.motion.matches = true;
  ui.motion.emit('change');
  assert.equal(first.count.textContent, 'Page 1 of 2');
  ui.motion.matches = false;
  ui.click(first);
  ui.document.hidden = true;
  ui.document.emit('visibilitychange');
  assert.equal(first.album.open, false);
  assert.equal(first.reveal.inert, false);
});
