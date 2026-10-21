// Filter the pre-rendered cards; no network request is required to see the work.
const form = document.querySelector('#project-filters');
const cards = [...document.querySelectorAll('[data-project]')];
const count = document.querySelector('#project-count');
const empty = document.querySelector('#empty-results');
const status = document.querySelector('#filter-status');
if (form && cards.length && count && empty) {
  const search = form.querySelector('input[type="search"]');
  const buttons = [...form.querySelectorAll('[data-filter]')];
  let selected = 'all';
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const matchesCategory = selected === 'all' || card.dataset.tags.split('|').includes(selected);
      const matchesSearch = card.dataset.search.includes(query);
      card.hidden = !(matchesCategory && matchesSearch);
      if (!card.hidden) visible++;
    }
    count.textContent = `Showing ${visible} of ${cards.length} projects`;
    empty.hidden = visible !== 0;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
  };
  search.addEventListener('input', update);
  buttons.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.filter;
    update();
  }));
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', () => {
    selected = 'all';
    // The native reset applies after the reset event.
    requestAnimationFrame(update);
  });
  document.querySelector('#empty-reset')?.addEventListener('click', () => {
    form.reset();
    search.focus();
  });
  form.hidden = false;
  update();
} else if (status) {
  status.hidden = false;
  status.textContent = 'Project filters are unavailable. You can still browse all projects below.';
}
