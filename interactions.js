/* 56.6.6 - one finite, interruptible motion lifecycle for app dialogs.
 * No prototype overrides, cloned screens, rendering loops, or game state.
 * A native dialog stays modal until its exit completes, including form/Esc.
 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const easeOut = 'cubic-bezier(.18,.78,.23,1)';
  const easeIn = 'cubic-bezier(.4,0,.72,.35)';
  const dialogs = new Map();
  const panels = new Map();
  const presses = new Map();
  const accents = new Map();
  const still = () => reduced.matches || document.hidden;
  const animate = (el, frames, options) => {
    if (!el?.animate || still()) return null;
    try { return el.animate(frames, options); } catch (_) { return null; }
  };
  const settled = animation => animation ? animation.finished.catch(() => {}) : Promise.resolve();

  function syncLock() {
    document.body.classList.toggle('ui-modal-open', !!document.querySelector('dialog[open]'));
  }
  function resetDialog(dialog, job) {
    if (dialogs.get(dialog) !== job) return;
    job.animation?.cancel();
    dialogs.delete(dialog);
    delete dialog.dataset.motion;
    dialog.style.removeProperty('--veil-from');
    syncLock();
  }
  function open(dialog) {
    if (!dialog?.isConnected) return Promise.resolve();
    const previous = dialogs.get(dialog);
    if (dialog.open && previous?.kind !== 'closing') return previous?.done || Promise.resolve();
    const interrupted = dialog.open;
    const cs = interrupted ? getComputedStyle(dialog) : null;
    const from = cs ? {opacity:cs.opacity, translate:cs.translate, scale:cs.scale} : null;
    const veil = interrupted ? getComputedStyle(dialog, '::backdrop').opacity : '0';
    previous?.animation?.cancel();
    // Escape on the second opening must never reuse a previous "confirm" value.
    dialog.returnValue = '';
    dialog.style.setProperty('--veil-from', veil);
    dialog.dataset.motion = 'opening';
    if (!dialog.open) dialog.showModal();
    syncLock();
    const ball = dialog.id === 'magic-ball-dialog';
    const job = {kind:'opening', animation:null, done:null};
    dialogs.set(dialog, job);
    // Only opacity for the live globe: no parent scaling/re-rasterization of WebGL.
    const first = from || {opacity:0, translate:ball?'0 0':'0 16px', scale:ball?'1':'.983'};
    job.animation = animate(dialog, [first, {opacity:1,translate:'0 0',scale:'1'}], {
      duration:ball?280:330, easing:easeOut, fill:'both'
    });
    job.done = settled(job.animation).then(() => resetDialog(dialog, job));
    return job.done;
  }
  function close(dialog, value = '') {
    if (dialog) window.ExorcistBinding?.cancelIn(dialog);
    if (!dialog?.open) return Promise.resolve();
    const previous = dialogs.get(dialog);
    if (previous?.kind === 'closing') return previous.done;
    const cs = getComputedStyle(dialog);
    const start = {opacity:cs.opacity, translate:cs.translate, scale:cs.scale};
    const veil = getComputedStyle(dialog, '::backdrop').opacity;
    previous?.animation?.cancel();
    dialog.style.setProperty('--veil-from', veil);
    dialog.dataset.motion = 'closing';
    const ball = dialog.id === 'magic-ball-dialog';
    const job = {kind:'closing', value:String(value), animation:null, done:null};
    dialogs.set(dialog, job);
    job.animation = animate(dialog, [start,{opacity:0,translate:ball?'0 0':'0 9px',scale:ball?'1':'.989'}], {
      duration:200,easing:easeIn,fill:'both'
    });
    job.done = settled(job.animation).then(() => {
      if (dialogs.get(dialog) !== job) return;
      if (dialog.open) dialog.close(job.value);
      resetDialog(dialog, job);
    });
    return job.done;
  }

  // Collapsing the picker must animate the space it occupies as well as ink;
  // otherwise the sheet below it jumps even if the dropdown itself fades.
  function panel(element, expanded, toggle, immediate = false) {
    if (!element) return Promise.resolve();
    const previous = panels.get(element);
    if (previous?.expanded === expanded && !immediate) return previous.done;
    if (!previous && element.hidden === !expanded) {
      toggle?.setAttribute('aria-expanded', String(expanded));
      element.inert = !expanded;
      return Promise.resolve();
    }
    // A plain wrapper owns the layout tween. Inner padding/borders have
    // important legacy styles, which cannot safely be animated to zero.
    const frame = element.closest('.entity-picker-fold') || element;
    const measure = () => ({height:`${frame.getBoundingClientRect().height}px`,opacity:getComputedStyle(frame).opacity});
    const empty = {height:'0px',opacity:0};
    const start = element.hidden ? empty : measure();
    previous?.animation?.cancel();
    element.hidden = false;
    element.inert = !expanded;
    frame.dataset.panelMotion = expanded ? 'opening' : 'closing';
    toggle?.setAttribute('aria-expanded', String(expanded));
    if (!expanded && element.contains(document.activeElement)) toggle?.focus({preventScroll:true});
    const target = expanded ? measure() : empty;
    const job = {expanded,animation:null,done:null};
    panels.set(element,job);
    if (!immediate) job.animation = animate(frame,[start,target],{
      duration:expanded?280:210,easing:expanded?easeOut:easeIn,fill:'both'
    });
    job.done = settled(job.animation).then(() => {
      if (panels.get(element)!==job) return;
      element.hidden = !expanded;
      element.inert = !expanded;
      job.animation?.cancel();
      delete frame.dataset.panelMotion;
      panels.delete(element);
    });
    // Immediate resets happen before any measurements by the page renderer.
    if(immediate){element.hidden=!expanded;delete frame.dataset.panelMotion;panels.delete(element);}
    return job.done;
  }
  window.ExorcistMotion = Object.freeze({open,close,panel});

  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.dataset.motionManaged = 'true';
    dialog.addEventListener('close', () => {
      if (dialog.open) return; // Ignore a queued close event from an older cycle.
      const job = dialogs.get(dialog);
      if(job)resetDialog(dialog,job);
      syncLock();
    });
    // These two have dedicated cleanup hooks in app.js (ball sensors, page motion).
    if (!['magic-ball-dialog','entity-book-dialog'].includes(dialog.id)) {
      dialog.addEventListener('cancel', event => { event.preventDefault();close(dialog); });
    }
    if (['share-dialog','restart-dialog'].includes(dialog.id)) {
      let backdropDown = false;
      dialog.addEventListener('pointerdown',event=>{backdropDown=event.target===dialog;},{passive:true});
      dialog.addEventListener('click',event=>{
        if(backdropDown && event.target===dialog) close(dialog);
        backdropDown=false;
      });
    }
  }
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const method = event.submitter?.getAttribute('formmethod') || form.getAttribute('method');
    const dialog = form.closest('dialog');
    if (method?.toLowerCase() !== 'dialog' || !dialog) return;
    event.preventDefault();
    close(dialog, event.submitter?.value || '');
  }, true);

  // Native interactions are not delayed. The press uses independent scale,
  // preserving hand-cut rotations, 3D book hinges and the card's own spring.
  const controls = 'button,summary,[role="button"]';
  function control(target) {
    const el = target instanceof Element ? target.closest(controls) : null;
    if (!el || el.disabled || el.getAttribute('aria-disabled')==='true' ||
        el.closest('[inert],[data-motion="closing"]') ||
        el.matches('#magic-ball,.reveal-button,.close-button,.entity-tab,.rules-tab') ||
        el.closest('.trait')) return null;
    return el;
  }
  function press(el) {
    if (!el || still()) return;
    const old=presses.get(el), from=getComputedStyle(el).scale;
    old?.cancel();
    const a=animate(el,[{scale:from==='none'?'1':from},{scale:'.969'}],{duration:100,easing:easeOut,fill:'forwards'});
    if(a){presses.set(el,a);a.finished.catch(()=>{});}
  }
  function release(el) {
    const old=presses.get(el);
    if(!old)return;
    const from=getComputedStyle(el).scale;
    old.cancel();presses.delete(el);
    if(!el.isConnected || !el.getClientRects().length)return;
    const a=animate(el,[{scale:from==='none'?'1':from},{scale:'1.008',offset:.6},{scale:'1'}],{duration:230,easing:easeOut});
    if(!a)return;
    presses.set(el,a);
    settled(a).then(()=>{if(presses.get(el)===a)presses.delete(el);});
  }
  let pointerControl=null, keyControl=null;
  document.addEventListener('pointerdown',event=>{
    if(event.button!==0 || !event.isPrimary)return;
    pointerControl=control(event.target);press(pointerControl);
  },{capture:true,passive:true});
  document.addEventListener('pointerup',()=>{release(pointerControl);pointerControl=null;},{capture:true,passive:true});
  document.addEventListener('pointercancel',()=>{release(pointerControl);pointerControl=null;},{capture:true,passive:true});
  document.addEventListener('keydown',event=>{
    if(event.repeat || !['Enter',' '].includes(event.key))return;
    keyControl=control(event.target);press(keyControl);
  },true);
  document.addEventListener('keyup',()=>{release(keyControl);keyControl=null;},true);
  window.addEventListener('blur',()=>{release(pointerControl);release(keyControl);pointerControl=keyControl=null;});

  // Dynamic results and tabs get a single short arrival, never one animation
  // per search character with timers accumulating in the background.
  function accent(el) {
    if(!el?.getClientRects().length || el.closest('[data-motion="opening"]'))return;
    accents.get(el)?.cancel();
    const a=animate(el,[{opacity:.35,translate:'0 4px'},{opacity:1,translate:'0 0'}],{duration:220,easing:easeOut});
    if(a){accents.set(el,a);settled(a).then(()=>{if(accents.get(el)===a)accents.delete(el);});}
  }
  const results=document.getElementById('rules-results');
  if(results)new MutationObserver(()=>{if(!results.hidden)accent(results);}).observe(results,{childList:true});
  const tabs=document.getElementById('entity-tabs');
  // Bound bookmark tabs own their short lift; no separate ink fade.

  // Finish pending transitions when a tab is hidden or the OS asks for less
  // motion. Cancelled Animation.finished promises always have a handler.
  function settleAll() {
    for(const job of dialogs.values()) {try{job.animation?.finish();}catch(_){job.animation?.cancel();}}
    for(const job of panels.values()) {try{job.animation?.finish();}catch(_){job.animation?.cancel();}}
    for(const a of presses.values())a.cancel();presses.clear();
    for(const a of accents.values())a.cancel();accents.clear();
    pointerControl=keyControl=null;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settleAll();});
  window.addEventListener('pagehide',settleAll);
  reduced.addEventListener?.('change',()=>{if(reduced.matches)settleAll();});
})();
