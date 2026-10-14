/* ODERZHIMYE 56.6 - presentation and accessibility, never game state.
 * No animation loop runs at rest. The original globe and card reveal keep
 * their own rendering timelines. This file has no external dependencies.
 */
(() => {
  'use strict';
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const arrivals = new Set();
  let entered = false;
  let sheenFrame = 0;
  let pointerTarget = null;
  let pointerX = 0;

  function motion(element, frames, options) {
    if (!element?.animate || reduced.matches || document.hidden) return null;
    const animation = element.animate(frames, options);
    arrivals.add(animation);
    const remove = () => arrivals.delete(animation);
    animation.finished.then(remove, remove);
    return animation;
  }

  function enterScreen() {
    for (const animation of arrivals) animation.cancel();
    arrivals.clear();
    const screen = document.querySelector('.screen.active');
    if (!screen) return;
    if (entered) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const heading = screen.querySelector('h2');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
    entered = true;
    const selectors = screen.id === 'home-screen'
      ? '.hero-copy, .mode-card, .home-tools > button, .home-continue:not(.hidden)'
      : '.section-head, .compact-field, .name-grid > .field, .setup-card, .game-control-panel, .reading-head, #traits > .trait, .lobby-code-card, .lobby-layout > div';
    [...screen.querySelectorAll(selectors)].forEach((element, index) => {
      const material = element.matches('.mode-card, .trait, .home-tools > button');
      motion(element, material ? [
        { opacity: 0, translate: '0 20px', rotate: index % 2 ? '.8deg' : '-.8deg', scale: '.989' },
        { opacity: 1, translate: '0 -1px', rotate: '0deg', scale: '1', offset: .78 },
        { opacity: 1, translate: '0 0', rotate: '0deg', scale: '1' }
      ] : [
        { opacity: 0, translate: '0 13px' },
        { opacity: 1, translate: '0 0' }
      ], { duration: material ? 530 : 400, delay: Math.min(index * 45, 225), easing: 'cubic-bezier(.2,.72,.2,1)', fill: 'backwards' });
    });
  }

  new MutationObserver(enterScreen).observe(body, { attributes: true, attributeFilter: ['data-screen'] });
  enterScreen();

  // Native dialogs still own focus trapping and Escape. Scroll locking must
  // account for nested dialogs instead of blindly unlocking on any close.
  function syncDialogs(records) {
    const open = document.querySelector('dialog[open]');
    body.classList.toggle('ui-modal-open', Boolean(open));
    for (const record of records || []) {
      const dialog = record.target;
      if (!dialog.open || dialog.id === 'magic-ball-dialog') continue;
      motion(dialog, [
        { opacity: 0, translate: '0 18px' },
        { opacity: 1, translate: '0 0' }
      ], { duration: 300, easing: 'cubic-bezier(.2,.72,.2,1)' });
    }
  }
  const modalObserver = new MutationObserver(syncDialogs);
  document.querySelectorAll('dialog').forEach(dialog => {
    modalObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  });
  syncDialogs();

  // A single pre-painted reflection translates over the two mode cards.
  // Touch devices have no pointer tracking, per-frame filters, or gyroscope.
  function applySheen() {
    sheenFrame = 0;
    const element = pointerTarget;
    if (!element || !fine.matches || reduced.matches || document.hidden) return;
    const rect = element.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (pointerX - rect.left) / rect.width));
    const sheen = element.querySelector('.material-sheen');
    if (sheen) sheen.style.transform = `translate3d(${-18 + fraction * 13}%,0,0)`;
  }
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!fine.matches || reduced.matches || event.pointerType === 'touch') return;
      pointerTarget = card;
      pointerX = event.clientX;
      if (!sheenFrame) sheenFrame = requestAnimationFrame(applySheen);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      pointerTarget = null;
      if (sheenFrame) cancelAnimationFrame(sheenFrame);
      sheenFrame = 0;
    }, { passive: true });
  });

  // The visual meter is also a readable progress control.
  const meter = document.querySelector('.progress-track');
  const progressText = document.getElementById('progress-text');
  if (meter && progressText) {
    meter.setAttribute('role', 'progressbar');
    meter.setAttribute('aria-valuemin', '0');
    meter.setAttribute('aria-valuemax', '6');
    meter.setAttribute('aria-labelledby', 'progress-text');
    const updateMeter = () => {
      meter.setAttribute('aria-valuenow', String(parseInt(progressText.textContent, 10) || 0));
      meter.setAttribute('aria-valuetext', progressText.textContent);
    };
    new MutationObserver(updateMeter).observe(progressText, { childList: true, characterData: true, subtree: true });
    updateMeter();
  }

  function stopMotion() {
    if (sheenFrame) cancelAnimationFrame(sheenFrame);
    sheenFrame = 0;
    pointerTarget = null;
    for (const animation of arrivals) animation.cancel();
    arrivals.clear();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMotion(); });
  window.addEventListener('pagehide', stopMotion);
  reduced.addEventListener?.('change', () => { if (reduced.matches) stopMotion(); });
})();
