/** Validate static routes, fragments, project metadata, and progressive content. */
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const files = [];
async function walk(path) {
  for (const entry of await readdir(path,{withFileTypes:true})) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) await walk(child);
    else if (entry.name.endsWith('.html')) files.push(child);
  }
}
await walk(root);
const contents = new Map(await Promise.all(files.map(async file => [file,await readFile(file,'utf8')])));
let links = 0;
for (const [file, html] of contents) {
  const name = relative(root,file);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`Duplicate IDs: ${name}`);
  assert.equal([...html.matchAll(/<h1\b/g)].length,1,`One h1 required: ${name}`);
  assert.match(html,/<meta name="description" content="[^"]+"/,`Description required: ${name}`);
  assert.match(html,/<nav[^>]+aria-label="Main navigation"/,`Static navigation required: ${name}`);
  assert.match(html,/<main id="main"/,`Main landmark required: ${name}`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1].replace(/&amp;/g,'&');
    if (/^(?:https?:|mailto:|data:)/.test(value)) continue;
    assert.ok(!value.startsWith('/'),`Link must support the Pages base path: ${name}: ${value}`);
    const [path,hash] = value.split('#');
    let target = path ? resolve(dirname(file),decodeURIComponent(path.split('?')[0])) : file;
    assert.ok((target === root || target.startsWith(root + '/')),`Link escapes site: ${value}`);
    let info;
    try { info = await stat(target); } catch { assert.fail(`Missing target: ${name}: ${value}`); }
    if (info.isDirectory()) target=resolve(target,'index.html');
    await stat(target);
    if (hash) {
      const targetHTML=contents.get(target) ?? await readFile(target,'utf8');
      assert.ok(targetHTML.includes(`id="${hash}"`),`Missing fragment: ${name}: ${value}`);
    }
    links++;
  }
  for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(match[0],/rel="[^"]*noopener/,`New tab needs noopener: ${name}`);
}
const projects=JSON.parse(await readFile(resolve(root,'lib/projects.json'),'utf8'));
assert.equal(projects.length,6);
assert.equal(projects.filter(p=>p.featuredOrder!==null).length,3);
for(const p of projects) {
  assert.match(p.slug,/^[a-z0-9-]+$/);
  assert.ok(Array.isArray(p.tags)&&p.tags.length);
  if(p.featuredOrder!==null) assert.ok(contents.has(resolve(root,'projects',p.slug,'index.html')));
}
const home=contents.get(resolve(root,'index.html'));
const index=contents.get(resolve(root,'projects/index.html'));
assert.equal([...home.matchAll(/data-project=/g)].length,3);
assert.equal([...index.matchAll(/data-project=/g)].length,6);
assert.match(home,/Associate Quantitative Analyst/);
assert.match(home,/Sep 2025 — Sep 2026/);
assert.match(home,/Knitting/);
assert.match(index,/id="empty-results"/);
assert.match(index,/<form[^>]+hidden/);
assert.ok(![...contents.values()].some(html=>/href="[^"]*\.pdf/.test(html)),'PDF download was not requested.');
console.log(`Passed: ${files.length} pages, ${links} local links/assets/fragments, six static projects, and three case-study routes.`);
