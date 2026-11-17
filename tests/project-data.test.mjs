import test from 'node:test';
import assert from 'node:assert/strict';
import { readProjects, validateProjects } from '../scripts/project-data.mjs';

const projects = await readProjects();

test('current project data meets the publishing contract', () => {
  assert.equal(validateProjects(projects).length, 6);
});

test('invalid project routes, destinations, categories, and featured order are rejected', () => {
  const invalidEdits = [
    items => { items[0].slug = '../escape'; },
    items => { items[1].slug = items[0].slug; },
    items => { items[0].url = 'javascript:alert(1)'; },
    items => { items[0].tags = ['unknown']; },
    items => { items[0].tools = []; },
    items => { items[1].featuredOrder = items[0].featuredOrder; },
    items => { items[0].featuredOrder = -1; },
    items => { delete items[0].shortTitle; },
  ];
  for (const edit of invalidEdits) {
    const items = structuredClone(projects);
    edit(items);
    assert.throws(() => validateProjects(items));
  }
});
