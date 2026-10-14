/* 56.6.1 - presentation only. No random/game state/network access.
 * Static CSS supplies materials; these timelines run only on interaction.
 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const animations = new Set();
  const touchTimers = new Map();
  let oracleBusy = false;
  let chapterFrame = 0;

  function play(element, frames, options) {
    if (!element?.animate || reduced.matches || document.hidden) return null;
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    return animation;
  }
  function shakeOracle(button) {
    if (oracleBusy || reduced.matches || document.hidden || document.querySelector('dialog[open]')) return;
    oracleBusy = true;
    const shell = play(button.querySelector('.oracle-mini'), [
      { transform:'translate3d(0,0,0) rotate(0deg)', offset:0 },
      { transform:'translate3d(-4px,-2px,0) rotate(-6deg)', offset:.18 },
      { transform:'translate3d(4px,-3px,0) rotate(5deg)', offset:.36 },
      { transform:'translate3d(-2px,-1px,0) rotate(-3deg)', offset:.55 },
      { transform:'translate3d(1px,0,0) rotate(1.5deg)', offset:.73 },
      { transform:'translate3d(0,0,0) rotate(0deg)', offset:1 }
    ], { duration:780, easing:'ease-in-out' });
    play(button.querySelector('.oracle-facet'), [
      { transform:'translate(0,0) rotate(-13deg)', offset:0 },
      { transform:'translate(0,0) rotate(-13deg)', offset:.12 },
      { transform:'translate(3px,2px) rotate(-23deg)', offset:.33 },
      { transform:'translate(-2px,-1px) rotate(-6deg)', offset:.55 },
      { transform:'translate(1px,1px) rotate(-17deg)', offset:.75 },
      { transform:'translate(0,0) rotate(-13deg)', offset:1 }
    ], { duration:1000, easing:'ease-in-out' });
    const tail = play(button.querySelector('.oracle-meniscus'), [
      { transform:'translate(0,0) rotate(0deg)', opacity:.6 },
      { transform:'translate(3px,-1px) rotate(-13deg)', opacity:.8, offset:.3 },
      { transform:'translate(-2px,2px) rotate(9deg)', opacity:.7, offset:.57 },
      { transform:'translate(0,0) rotate(0deg)', opacity:.6 }
    ], { duration:1050, easing:'ease-in-out' });
    play(button.querySelector('.oracle-shadow'), [
      { transform:'scaleX(1)', opacity:1 },
      { transform:'scaleX(.92)', opacity:.8, offset:.35 },
      { transform:'scaleX(1)', opacity:1 }
    ], { duration:780, easing:'ease-in-out' });
    if (tail || shell) (tail || shell).finished.then(() => { oracleBusy = false; }, () => { oracleBusy = false; });
    else oracleBusy = false;
  }
  function ribbon(button) {
    const strip = button.querySelector('.book-ribbon');
    strip?.getAnimations().forEach(animation => animation.cancel());
    play(strip, [
      { rotate:'0deg' }, { rotate:'7deg', offset:.22 },
      { rotate:'-4deg', offset:.52 }, { rotate:'1deg', offset:.78 }, { rotate:'0deg' }
    ], { duration:820, easing:'ease-in-out' });
  }
  function interact(button) {
    if (button.id === 'open-magic-ball-home') shakeOracle(button);
    else ribbon(button);
  }
  function release(button, delay = 0) {
    clearTimeout(touchTimers.get(button));
    touchTimers.delete(button);
    if (!delay) { button.classList.remove('prop-engaged'); return; }
    touchTimers.set(button, setTimeout(() => {
      button.classList.remove('prop-engaged');
      touchTimers.delete(button);
    }, delay));
  }
  document.querySelectorAll('#home-screen .home-tools > button').forEach(button => {
    button.addEventListener('pointerenter', event => {
      if (!fine.matches || event.pointerType === 'touch' || reduced.matches) return;
      interact(button);
    }, { passive:true });
    button.addEventListener('focus', () => {
      if (button.matches(':focus-visible')) interact(button);
    });
    button.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' || reduced.matches) return;
      release(button);
      button.classList.add('prop-engaged');
      interact(button);
      release(button, 1100); // Cancelled/stray pointers cannot leave a hinge open.
    }, { passive:true });
    button.addEventListener('pointerup', () => release(button, 240), { passive:true });
    button.addEventListener('pointercancel', () => release(button), { passive:true });
    button.addEventListener('blur', () => release(button));
  });

  // Reuse the category marks already shipped with the original app, not new lore.
  const tabs = document.getElementById('entity-tabs');
  function addCategoryMarks() {
    if (typeof ENTITY_CATEGORIES === 'undefined') return;
    tabs?.querySelectorAll('.entity-tab').forEach(button => {
      if (button.querySelector('.category-glyph')) return;
      const icon = ENTITY_CATEGORIES[button.dataset.category]?.icon;
      if (!icon) return;
      const mark = document.createElement('span');
      mark.className = 'category-glyph';
      mark.setAttribute('aria-hidden', 'true');
      mark.innerHTML = icon;
      button.prepend(mark);
    });
  }
  if (tabs) new MutationObserver(addCategoryMarks).observe(tabs, {childList:true});
  addCategoryMarks();

  function addCurls(root) {
    root.querySelectorAll('.entity-effect-card:nth-child(2),.rules-block:nth-of-type(odd)').forEach(note => {
      if (note.querySelector('.note-curl')) return;
      const curl = document.createElement('span');
      curl.className = 'note-curl';
      curl.setAttribute('aria-hidden', 'true');
      note.appendChild(curl);
    });
  }
  const entityDetail = document.getElementById('entity-detail');
  if (entityDetail) new MutationObserver(() => addCurls(entityDetail)).observe(entityDetail, {childList:true});

  // A new rules chapter lands as a few loose scraps. Only the first visible
  // items move: reading, scrolling and opening a search result stay stable.
  const paper = document.getElementById('rules-paper');
  function chapterArrival() {
    if (paper) addCurls(paper);
    if (chapterFrame) cancelAnimationFrame(chapterFrame);
    if (reduced.matches || document.hidden) return;
    chapterFrame = requestAnimationFrame(() => {
      chapterFrame = 0;
      if (!document.getElementById('rules-dialog')?.open || paper.hidden) return;
      const viewport = document.getElementById('rules-scroll');
      // A search jump has its own scroll positioning; do not animate its target.
      if (viewport.scrollTop > 10) return;
      const bottom = viewport.getBoundingClientRect().bottom;
      const scraps = [...paper.querySelectorAll('.rules-page-heading,.rules-facts,.rules-block')]
        .filter(el => el.getBoundingClientRect().top < bottom).slice(0,4);
      scraps.forEach((el,i) => play(el, [
        { opacity:0, translate:'0 10px', rotate:i % 2 ? '.7deg' : '-.7deg' },
        { opacity:1, translate:'0 -1px', rotate:'0deg', offset:.8 },
        { opacity:1, translate:'0 0', rotate:'0deg' }
      ], { duration:430, delay:i*45, easing:'cubic-bezier(.2,.75,.2,1)', fill:'backwards' }));
    });
  }
  if (paper) new MutationObserver(chapterArrival).observe(paper, {childList:true});

  function stop() {
    for (const animation of animations) animation.cancel();
    animations.clear();
    for (const [button, timer] of touchTimers) {
      clearTimeout(timer); button.classList.remove('prop-engaged');
    }
    touchTimers.clear();
    if (chapterFrame) cancelAnimationFrame(chapterFrame);
    chapterFrame = 0;
    oracleBusy = false;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  reduced.addEventListener?.('change', () => { if (reduced.matches) stop(); });
})();
