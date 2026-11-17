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
    hidden: false, disabled: false, open: false, textContent: '', children: [], childNodes: [], selectors: {},
    style: { setProperty: (name, value) => attributes.set(name, value) },
    addEventListener: (name, callback) => events.set(name, callback),
    emit: (name, event = {}) => events.get(name)?.(event),
    setAttribute: (name, value) => attributes.set(name, value),
    getAttribute: name => attributes.get(name),
    querySelector(selector) { return this.selectors[selector]; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    replaceWith(replacement) { this.replacement = replacement; },
    cloneNode() {
      const copy = node();
      copy.source = this;
      for (const [selector, child] of Object.entries(this.selectors)) copy.selectors[selector] = child.cloneNode();
      return copy;
    },
    classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
    focus() { this.focused = true; },
  };
}
function albumUI({ available = true, reduced = false, nativeDialog = true } = {}) {
  const motion = Object.assign(node(), { matches: reduced });
  const timelines = [];
  const albums = [5, 1].map((length, index) => {
    const source = node();
    source.className = `hobby-album album-${index}`;
    source.id = `album-${index}`;
    const cover = node();
    const title = Object.assign(node(), { textContent: `Album ${index}` });
    const image = Object.assign(node(), { src: `cover-${index}.svg` });
    cover.selectors = { '.album-title': title, img: image };
    cover.childNodes = [node()];
    const note = Object.assign(node(), { textContent: `Album ${index} note` });
    const photos = Array.from({ length }, () => {
      const photo = node();
      photo.selectors.img = node();
      return photo;
    });
    source.selectors = { '.album-cover': cover, '.album-page-title': note };
    source.querySelectorAll = () => photos;
    return { source, cover, photos, get launcher() { return source.replacement?.children[0]; } };
  });
  const parts = Object.fromEntries(['scene', 'spread', 'page-left', 'page-right', 'lid', 'dialog-close', 'navigation', 'prev', 'next', 'count'].map(name => [name, node()]));
  const title = node();
  const dialog = node();
  dialog.selectors = Object.fromEntries(Object.entries(parts).map(([name, part]) => [`.album-${name}`, part]));
  dialog.selectors['#album-dialog-title'] = title;
  parts.lid.selectors = { h3: node(), img: node() };
  parts.navigation.hidden = parts.lid.hidden = true;
  for (const page of [parts['page-left'], parts['page-right']]) page.selectors = { '.album-page-content': node(), '.album-folio': node() };
  if (nativeDialog) dialog.showModal = () => { dialog.open = true; parts['dialog-close'].focus(); };
  dialog.close = () => { dialog.open = false; dialog.emit('close'); };
  const document = Object.assign(node(), {
    body: node(), createElement: () => node(),
    querySelector: () => dialog, querySelectorAll: () => albums.map(ui => ui.source),
  });
  const gsap = {
    set() {},
    timeline: ({ onComplete }) => {
      const timeline = { killed: false, completed: false, callbacks: [],
        to() { return this; },
        fromTo() { return this; },
        call(callback) { this.callbacks.push(callback); return this; },
        kill() { this.killed = true; },
        progress(value) {
          assert.equal(value, 1);
          if (!this.killed && !this.completed) {
            this.completed = true;
            this.callbacks.forEach(callback => callback());
            onComplete();
          }
          return this;
        },
      };
      timelines.push(timeline);
      return timeline;
    },
  };
  const window = {
    matchMedia: () => motion,
    getComputedStyle: () => ({ getPropertyValue: () => '#f0d2c9' }),
  };
  if (available) window.gsap = gsap;
  vm.runInNewContext(source, { document, window });
  return { albums, document, motion, timelines, dialog, parts, title, left: parts['page-left'].querySelector('.album-page-content'), right: parts['page-right'].querySelector('.album-page-content') };
}

test('missing GSAP or dialog support preserves native albums and all photos', () => {
  for (const options of [{ available: false }, { nativeDialog: false }]) {
    const ui = albumUI(options);
    assert.equal(ui.dialog.open, false);
    for (const album of ui.albums) {
      assert.equal(album.source.replacement, undefined);
      assert.ok(album.photos.every(photo => !photo.hidden));
    }
  }
});

test('opening an album uses a dialog and shows two different photos on facing pages', () => {
  const ui = albumUI();
  const album = ui.albums[0];
  assert.equal(album.launcher.type, 'button');
  assert.equal(album.launcher.getAttribute('aria-haspopup'), 'dialog');
  assert.equal(album.launcher.getAttribute('aria-controls'), 'album-dialog');
  album.launcher.emit('click');
  assert.equal(ui.dialog.open, true);
  assert.equal(ui.title.textContent, 'Album 0');
  assert.equal(ui.document.body.classList.contains('album-modal-open'), true);
  assert.equal(ui.left.children[0].source, album.photos[0]);
  assert.equal(ui.right.children[0].source, album.photos[1]);
  assert.equal(ui.left.children[0].querySelector('img').loading, 'eager');
  assert.equal(ui.parts.count.textContent, 'Spread 1 of 3');
  ui.timelines.at(-1).progress(1);
  assert.equal(ui.parts.lid.hidden, true);
});

test('single-photo albums pair a title page with a photo and hide paging controls', () => {
  const ui = albumUI({ reduced: true });
  const album = ui.albums[1];
  album.launcher.emit('click');
  assert.equal(ui.left.children[0].className, 'album-inscription');
  assert.equal(ui.left.children[0].children[1].textContent, 'Album 1');
  assert.equal(ui.right.children[0].source, album.photos[0]);
  assert.equal(ui.parts.navigation.hidden, true);
  assert.equal(ui.timelines.length, 0);
});

test('closing during opening cancels stale motion and restores launcher focus', () => {
  const ui = albumUI();
  const album = ui.albums[0];
  album.launcher.emit('click');
  const opening = ui.timelines[0];
  ui.parts['dialog-close'].emit('click');
  assert.equal(opening.killed, true);
  ui.parts['dialog-close'].emit('click');
  assert.equal(ui.timelines.length, 2, 'repeated close clicks do not start competing timelines');
  ui.timelines.at(-1).progress(1);
  opening.progress(1);
  assert.equal(ui.dialog.open, false);
  assert.equal(ui.document.body.classList.contains('album-modal-open'), false);
  assert.equal(album.launcher.focused, true);
});

test('Escape and backdrop close the book; clicks within the book leave it open', () => {
  const ui = albumUI({ reduced: true });
  ui.albums[0].launcher.emit('click');
  ui.dialog.emit('click', { target: ui.parts.spread });
  assert.equal(ui.dialog.open, true);
  let prevented = false;
  ui.dialog.emit('cancel', { preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ui.dialog.open, false);
  ui.albums[1].launcher.emit('click');
  ui.dialog.emit('click', { target: ui.dialog });
  assert.equal(ui.dialog.open, false);
  assert.equal(ui.albums[1].launcher.focused, true);
});

test('spread turns ignore repeated clicks, update both pages, and enforce bounds', () => {
  const ui = albumUI();
  const album = ui.albums[0];
  album.launcher.emit('click');
  ui.parts.next.emit('click');
  assert.equal(ui.timelines[0].completed, true);
  assert.equal(ui.parts.next.disabled, true);
  const total = ui.timelines.length;
  ui.parts.next.emit('click');
  assert.equal(ui.timelines.length, total);
  ui.timelines.at(-1).progress(1);
  assert.equal(ui.parts.count.textContent, 'Spread 2 of 3');
  assert.equal(ui.left.children[0].source, album.photos[2]);
  assert.equal(ui.right.children[0].source, album.photos[3]);
  ui.parts.next.emit('click');
  ui.timelines.at(-1).progress(1);
  assert.equal(ui.parts.count.textContent, 'Spread 3 of 3');
  assert.equal(ui.left.children[0].className, 'album-inscription');
  assert.equal(ui.right.children[0].source, album.photos[4]);
  assert.equal(ui.parts.next.disabled, true);
  const last = ui.timelines.length;
  ui.parts.next.emit('click');
  assert.equal(ui.timelines.length, last);
});

test('arrow keys turn spreads and reopening preserves the selected spread', () => {
  const ui = albumUI({ reduced: true });
  const album = ui.albums[0];
  album.launcher.emit('click');
  let prevented = false;
  ui.dialog.emit('keydown', { key: 'ArrowRight', preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ui.parts.count.textContent, 'Spread 2 of 3');
  ui.parts['dialog-close'].emit('click');
  album.launcher.emit('click');
  assert.equal(ui.parts.count.textContent, 'Spread 2 of 3');
  ui.dialog.emit('keydown', { key: 'ArrowLeft', preventDefault() {} });
  assert.equal(ui.parts.count.textContent, 'Spread 1 of 3');
});

test('reduced motion and backgrounding finish pending animations without losing state', () => {
  const ui = albumUI();
  ui.albums[0].launcher.emit('click');
  ui.motion.matches = true;
  ui.motion.emit('change');
  assert.equal(ui.parts.lid.hidden, true);
  ui.parts.next.emit('click');
  assert.equal(ui.parts.count.textContent, 'Spread 2 of 3');
  ui.motion.matches = false;
  ui.parts.next.emit('click');
  ui.document.hidden = true;
  ui.document.emit('visibilitychange');
  assert.equal(ui.parts.count.textContent, 'Spread 3 of 3');
  ui.parts['dialog-close'].emit('click');
  assert.equal(ui.dialog.open, false);
  assert.equal(ui.document.body.classList.contains('album-modal-open'), false);
});
