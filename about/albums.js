// Optional enhancement: without GSAP or native dialogs, the inline details stay usable.
(() => {
  const gsap = window.gsap;
  const dialog = document.querySelector('#album-dialog');
  if (!gsap || !dialog || typeof dialog.showModal !== 'function') return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = dialog.querySelector('.album-scene');
  const spread = dialog.querySelector('.album-spread');
  const left = dialog.querySelector('.album-page-left');
  const right = dialog.querySelector('.album-page-right');
  const leftContent = left.querySelector('.album-page-content');
  const rightContent = right.querySelector('.album-page-content');
  const leftFolio = left.querySelector('.album-folio');
  const rightFolio = right.querySelector('.album-folio');
  const lid = dialog.querySelector('.album-lid');
  const lidTitle = lid.querySelector('h3');
  const lidImage = lid.querySelector('img');
  const title = dialog.querySelector('#album-dialog-title');
  const close = dialog.querySelector('.album-dialog-close');
  const navigation = dialog.querySelector('.album-navigation');
  const previous = dialog.querySelector('.album-prev');
  const next = dialog.querySelector('.album-next');
  const count = dialog.querySelector('.album-count');
  let active = null;
  let animation = null;
  let flip = null;
  let closing = false;
  const instant = () => motion.matches || document.hidden;
  const targets = [scene, spread, left, right, lid];
  const clearMotion = () => gsap.set(targets, { clearProps: 'transform,transformOrigin,opacity,visibility' });
  const updateNavigation = () => {
    const total = Math.ceil(active.photos.length / 2);
    navigation.hidden = total < 2;
    count.textContent = `Spread ${active.index + 1} of ${total}`;
    previous.disabled = Boolean(flip) || active.index === 0;
    next.disabled = Boolean(flip) || active.index === total - 1;
  };
  const makePhoto = original => {
    const photo = original.cloneNode(true);
    photo.querySelector('img').loading = 'eager';
    return photo;
  };
  const renderSpread = index => {
    active.index = index;
    const photos = active.photos.slice(index * 2, index * 2 + 2);
    leftContent.replaceChildren();
    rightContent.replaceChildren();
    if (photos.length === 2) {
      leftContent.append(makePhoto(photos[0]));
      rightContent.append(makePhoto(photos[1]));
    } else {
      const inscription = document.createElement('div');
      inscription.className = 'album-inscription';
      const flower = document.createElement('span');
      flower.className = 'album-inscription-flower';
      flower.setAttribute('aria-hidden', 'true');
      flower.textContent = '✿';
      const heading = document.createElement('h3');
      heading.textContent = active.title;
      const note = document.createElement('p');
      note.textContent = active.note;
      inscription.append(flower, heading, note);
      leftContent.append(inscription);
      rightContent.append(makePhoto(photos[0]));
    }
    leftFolio.textContent = String(index * 2 + 1).padStart(2, '0');
    rightFolio.textContent = String(index * 2 + 2).padStart(2, '0');
    updateNavigation();
  };
  const reset = () => {
    if (dialog.open || !active) return;
    animation?.kill();
    flip?.kill();
    animation = flip = null;
    closing = false;
    clearMotion();
    lid.hidden = true;
    document.body.classList.remove('album-modal-open');
    const launcher = active?.launcher;
    active = null;
    launcher?.focus({ preventScroll: true });
  };
  const finishClose = () => {
    if (dialog.open) dialog.close();
    reset();
  };
  const closeAlbum = () => {
    if (!active || closing) return;
    closing = true;
    flip?.progress(1);
    animation?.kill();
    if (instant()) { finishClose(); return; }
    if (lid.hidden) gsap.set(lid, { rotationY: -165, autoAlpha: 0 });
    lid.hidden = false;
    animation = gsap.timeline({ onComplete: finishClose })
      .to(lid, { rotationY: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.inOut' }, 0)
      .to(spread, { opacity: 0, duration: 0.2 }, 0.25)
      .to(scene, { scale: 0.94, y: 20, opacity: 0, duration: 0.22, ease: 'power2.in' }, 0.4);
  };
  const openAlbum = album => {
    if (dialog.open) return;
    active = album;
    closing = false;
    title.textContent = album.title;
    dialog.style.setProperty('--album-cover-color', window.getComputedStyle(album.card).getPropertyValue('--cover'));
    lidTitle.textContent = album.title;
    lidImage.src = album.coverImage;
    renderSpread(album.index);
    clearMotion();
    lid.hidden = true;
    dialog.showModal();
    document.body.classList.add('album-modal-open');
    if (instant()) return;
    lid.hidden = false;
    animation = gsap.timeline({ onComplete: () => {
      lid.hidden = true;
      clearMotion();
      animation = null;
    } })
      .fromTo(scene, { opacity: 0, scale: 0.9, y: 35 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0)
      .fromTo(spread, { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0.15)
      .fromTo(lid, { rotationY: 0, autoAlpha: 1 }, { rotationY: -165, duration: 0.8, ease: 'power2.inOut' }, 0.06)
      .to(lid, { autoAlpha: 0, duration: 0.2 }, 0.6)
      .fromTo(left, { rotationY: 35 }, { rotationY: 0, duration: 0.65, ease: 'power2.out' }, 0.2);
  };
  const turnSpread = direction => {
    if (!active || closing || flip) return;
    const target = active.index + direction;
    if (target < 0 || target >= Math.ceil(active.photos.length / 2)) return;
    animation?.progress(1);
    if (instant()) { renderSpread(target); return; }
    const page = direction > 0 ? right : left;
    flip = gsap.timeline({ onComplete: () => {
      if (active.index !== target) renderSpread(target);
      flip = null;
      clearMotion();
      updateNavigation();
    } })
      .to(page, { rotationY: -80 * direction, opacity: 0, duration: 0.26, ease: 'power2.in' }, 0)
      .call(() => renderSpread(target), [], 0.26)
      .fromTo(page, { rotationY: 70 * direction, opacity: 0 }, { rotationY: 0, opacity: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }, 0.26);
    updateNavigation();
  };

  document.querySelectorAll('.hobby-album').forEach(source => {
    const cover = source.querySelector('.album-cover');
    const photos = [...source.querySelectorAll('.hobby-polaroid')];
    if (!cover || !photos.length) return;
    // Replace the disclosure with a real dialog-launching button only after enhancement is available.
    const card = document.createElement('div');
    card.className = source.className;
    card.id = source.id;
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'album-cover';
    launcher.append(...[...cover.childNodes].map(child => child.cloneNode(true)));
    const album = {
      card, launcher, photos, index: 0,
      title: cover.querySelector('.album-title').textContent,
      note: source.querySelector('.album-page-title').textContent,
      coverImage: cover.querySelector('img').src,
    };
    launcher.setAttribute('aria-label', `Open ${album.title} album`);
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-controls', 'album-dialog');
    launcher.addEventListener('click', () => openAlbum(album));
    card.append(launcher);
    source.replaceWith(card);
  });
  close.addEventListener('click', closeAlbum);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeAlbum(); });
  dialog.addEventListener('close', reset);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeAlbum(); });
  previous.addEventListener('click', () => turnSpread(-1));
  next.addEventListener('click', () => turnSpread(1));
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      turnSpread(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  const finishMotion = () => {
    if (closing) finishClose();
    else { animation?.progress(1); flip?.progress(1); }
  };
  motion.addEventListener('change', () => { if (motion.matches) finishMotion(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishMotion(); });
})();
