import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const categories = new Set(['modeling', 'pipelines', 'visualization', 'research']);

export function validateProjects(projects) {
  assert.ok(Array.isArray(projects) && projects.length, 'Projects must be a nonempty array.');
  const slugs = new Set();
  const featuredOrders = new Set();
  for (const project of projects) {
    assert.ok(project && typeof project === 'object', 'Each project must be an object.');
    const name = project.slug ?? 'Unnamed project';
    for (const field of ['slug', 'title', 'description', 'category', 'year', 'url', 'urlLabel']) {
      assert.ok(typeof project[field] === 'string' && project[field].trim(), `${name}: ${field} is required.`);
    }
    assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${name}: invalid slug.`);
    assert.ok(!slugs.has(project.slug), `${name}: duplicate slug.`);
    slugs.add(project.slug);
    assert.match(project.year, /^\d{4}$/, `${name}: year must have four digits.`);
    const url = new URL(project.url);
    assert.ok(url.protocol === 'https:' && !url.username && !url.password, `${name}: use a public HTTPS URL.`);
    for (const field of ['tags', 'tools']) {
      const values = project[field];
      assert.ok(Array.isArray(values) && values.length, `${name}: ${field} must be a nonempty array.`);
      assert.ok(values.every(value => typeof value === 'string' && value.trim()), `${name}: invalid ${field}.`);
      assert.equal(new Set(values).size, values.length, `${name}: duplicate ${field}.`);
    }
    assert.ok(project.tags.every(tag => categories.has(tag)), `${name}: unknown filter category.`);
    if (project.featuredOrder !== null) {
      assert.ok(Number.isSafeInteger(project.featuredOrder) && project.featuredOrder > 0, `${name}: invalid featured order.`);
      assert.ok(!featuredOrders.has(project.featuredOrder), `${name}: duplicate featured order.`);
      featuredOrders.add(project.featuredOrder);
      for (const field of ['shortTitle', 'shortDescription']) {
        assert.ok(typeof project[field] === 'string' && project[field].trim(), `${name}: ${field} is required for featured work.`);
      }
    }
  }
  return projects;
}

export async function readProjects() {
  const source = new URL('../lib/projects.json', import.meta.url);
  return validateProjects(JSON.parse(await readFile(source, 'utf8')));
}
