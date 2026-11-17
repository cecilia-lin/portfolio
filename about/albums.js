// Optional GSAP enhancement: native details and every photo remain usable without it.
(() => {
  const gsap = window.gsap;
  if (!gsap) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const states = [...document.querySelectorAll('.hobby-album')].map(album => ({
    album,
    cover: album.querySelector('.album-cover'),
    reveal: album.querySelector('.album-reveal'),
    pages: [...album.querySelectorAll('.hobby-polaroid')],
    navigation: album.querySelector('.album-navigation'),
    previous: album.querySelector('.album-prev'),
    next: album.querySelector('.album-next'),
    count: album.querySelector('.album-count'),
    expanded: album.open,
    index: 0,
    animation: null,
    flip: null,
  })).filter(state => state.cover && state.reveal && state.pages.length && state.navigation && state.previous && state.next && state.count);

  const updatePages = state => {
    state.pages.forEach((page, index) => { page.hidden = index !== state.index; });
    state.count.textContent = `Page ${state.index + 1} of ${state.pages.length}`;
    state.previous.disabled = state.index === 0;
    state.next.disabled = state.index === state.pages.length - 1;
  };
  const settle = state => {
    state.album.open = state.expanded;
    state.reveal.inert = false;
    state.album.classList.remove('is-album-animating');
    gsap.set(state.reveal, { clearProps: 'height,opacity,overflow' });
    gsap.set(state.cover, { clearProps: 'transform,transformOrigin' });
    state.animation = null;
  };
  const setExpanded = (state, expanded) => {
    state.flip?.progress(1);
    state.animation?.kill();
    state.expanded = expanded;
    if (!expanded && state.album.contains(document.activeElement) && document.activeElement !== state.cover) state.cover.focus();
    if (motion.matches || document.hidden || (!expanded && !state.album.open)) {
      settle(state);
      return;
    }
    if (!state.album.open) {
      state.album.open = true;
      gsap.set(state.reveal, { height: 0, opacity: 0 });
    }
    state.reveal.inert = !expanded;
    state.album.classList.add('is-album-animating');
    gsap.set(state.reveal, { overflow: 'hidden' });
    state.animation = gsap.timeline({ onComplete: () => settle(state) })
      .to(state.reveal, { height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0, duration: 0.46, ease: 'power2.inOut' }, 0)
      .to(state.cover, { rotationY: expanded ? -10 : 8, transformPerspective: 900, transformOrigin: 'left center', duration: 0.23, ease: 'power2.out' }, 0)
      .to(state.cover, { rotationY: 0, duration: 0.23, ease: 'power2.inOut' }, 0.23);
  };
  const turnPage = (state, direction) => {
    const target = state.index + direction;
    if (!state.expanded || state.flip || target < 0 || target >= state.pages.length) return;
    // Finish opening first so the page turn can use the album's natural height.
    state.animation?.progress(1);
    if (motion.matches || document.hidden) {
      state.index = target;
      updatePages(state);
      return;
    }
    const outgoing = state.pages[state.index];
    const incoming = state.pages[target];
    incoming.hidden = false;
    state.previous.disabled = state.next.disabled = true;
    state.flip = gsap.timeline({ onComplete: () => {
      state.index = target;
      updatePages(state);
      gsap.set([outgoing, incoming], { clearProps: 'transform,transformOrigin,opacity,visibility' });
      state.flip = null;
    } })
      .to(outgoing, { rotationY: -70 * direction, autoAlpha: 0, transformOrigin: 'left center', duration: 0.26, ease: 'power2.in' }, 0)
      .fromTo(incoming, { rotationY: 70 * direction, autoAlpha: 0, transformOrigin: 'left center' }, { rotationY: 0, autoAlpha: 1, duration: 0.42, ease: 'power2.out' }, 0.12);
  };

  states.forEach(state => {
    // Handle exclusivity here so the previous album can finish its closing motion.
    state.album.removeAttribute('name');
    state.album.classList.add('album-paged');
    state.navigation.hidden = state.pages.length < 2;
    updatePages(state);
    state.cover.addEventListener('click', event => {
      event.preventDefault();
      const expanded = !state.expanded;
      if (expanded) states.forEach(other => { if (other !== state && other.expanded) setExpanded(other, false); });
      setExpanded(state, expanded);
    });
    state.album.addEventListener('toggle', () => {
      // Keep find-in-page or other native changes synchronized with the enhancement.
      if (!state.animation && state.album.open !== state.expanded) setExpanded(state, state.album.open);
    });
    state.previous.addEventListener('click', () => turnPage(state, -1));
    state.next.addEventListener('click', () => turnPage(state, 1));
  });
  const finishMotion = () => states.forEach(state => {
    state.flip?.progress(1);
    state.animation?.progress(1);
  });
  motion.addEventListener('change', () => { if (motion.matches) finishMotion(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishMotion(); });
})();
