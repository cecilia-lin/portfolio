// GSAP is a local, optional enhancement. Static titles remain if it cannot load.
(() => {
  const hero = document.querySelector('.hero');
  const titles = [...document.querySelectorAll('.role-title')];
  const toggle = document.querySelector('#role-toggle');
  const gsap = window.gsap;
  if (!hero || titles.length < 2 || !toggle || !gsap) return;
  let userPaused = false;
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    let current = 0;
    let delay;
    let transition;
    let disposed = false;
    hero.classList.add('has-role-animation');
    toggle.hidden = false;
    gsap.set(titles, { autoAlpha: 0, yPercent: 65 });
    gsap.set(titles[0], { autoAlpha: 1, yPercent: 0 });
    const updateButton = () => {
      toggle.textContent = userPaused ? 'Resume' : 'Pause';
      toggle.setAttribute('aria-label', `${userPaused ? 'Resume' : 'Pause'} job title animation`);
      toggle.setAttribute('aria-pressed', String(userPaused));
    };
    const schedule = () => {
      if (disposed) return;
      delay = gsap.delayedCall(2.8, rotate);
      if (userPaused || document.hidden) delay.pause();
    };
    function rotate() {
      const next = (current + 1) % titles.length;
      transition = gsap.timeline({ onComplete: () => {
        current = next;
        transition = null;
        schedule();
      }});
      transition.to(titles[current], { autoAlpha: 0, yPercent: -65, duration: 0.28, ease: 'power2.in' })
        .fromTo(titles[next], { autoAlpha: 0, yPercent: 65 }, { autoAlpha: 1, yPercent: 0, duration: 0.38, ease: 'power2.out' }, 0.12);
    }
    const syncPlayback = () => {
      if (userPaused || document.hidden) {
        // Finish an in-flight transition so pausing leaves one readable title.
        transition?.progress(1);
        delay?.pause();
      } else delay?.resume();
    };
    const onToggle = () => { userPaused = !userPaused; updateButton(); syncPlayback(); };
    toggle.addEventListener('click', onToggle);
    document.addEventListener('visibilitychange', syncPlayback);
    updateButton();
    schedule();
    return () => {
      disposed = true;
      delay?.kill();
      transition?.kill();
      toggle.removeEventListener('click', onToggle);
      document.removeEventListener('visibilitychange', syncPlayback);
      hero.classList.remove('has-role-animation');
      toggle.hidden = true;
      gsap.set(titles, { clearProps: 'opacity,visibility,transform' });
    };
  });
})();
