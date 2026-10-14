/* 56.6.3 - finite object timelines and typographic layout only.
   Every activation awaits actual Animation.finished promises. There is no
   guessed opening timer, no synthetic second click, and no game-state access. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const animations = new Set();
  const groups = new Map();
  let pending = null;
  let chapterFrame = 0;
  let fitFrame = 0;
  const ease = 'cubic-bezier(.2,.74,.22,1)';

  function play(element, frames, options) {
    if (!element?.animate || reduced.matches || document.hidden) return null;
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    return animation;
  }
  function clearGroup(button) {
    const group = groups.get(button);
    if (group) group.forEach(a => a.cancel());
    groups.delete(button);
  }
  function parts(button) {
    return [button.querySelector('.prop-hinge'), ...button.querySelectorAll('.book-leaf,.session-mini-leaf')].filter(Boolean);
  }
  function bookMotion(button, mode) {
    const elements = parts(button);
    const starts = elements.map(el => getComputedStyle(el).transform);
    clearGroup(button);
    const open = mode !== 'close';
    const active = mode === 'activate';
    const duration = active ? 710 : open ? 470 : 310;
    const angles = active ? [-58,-14,-30] : [-40,-10,-23];
    const run = elements.map((el, i) => {
      const z = i ? i * 2 : 0;
      const end = open ? angles[i] || -13 : i ? -i : 0;
      const target = `translateZ(${z}px) rotateY(${end}deg)`;
      const frames = active ? [
        {transform: starts[i], offset:0},
        {transform:`translateZ(${z}px) rotateY(${end - 8}deg)`, offset:.66},
        {transform:target, offset:1}
      ] : [{transform:starts[i]}, {transform:target}];
      return play(el, frames, {duration:duration + i * (active ? 30 : 15),easing:ease,fill:'forwards'});
    }).filter(Boolean);
    if (open) {
      const ribbon = button.querySelector('.book-ribbon,.mini-ribbon');
      const a = play(ribbon,[{rotate:'0deg'},{rotate:'8deg',offset:.28},{rotate:'-4deg',offset:.62},{rotate:'0deg'}],{duration:active?780:580,easing:'ease-in-out'});
      if(a) run.push(a);
    }
    groups.set(button, run);
    if (!open) Promise.allSettled(run.map(a=>a.finished)).then(()=>{
      if(groups.get(button)===run) clearGroup(button);
    });
    return run;
  }
  function orbMotion(button) {
    clearGroup(button);
    const small = !!button.querySelector('.session-mini-orb');
    const shell = button.querySelector('.oracle-mini,.session-mini-orb');
    const facet = button.querySelector('.oracle-facet,.session-orb-window i');
    const liquid = button.querySelector('.oracle-meniscus');
    const distance = small ? 2 : 4;
    const run = [
      play(shell, [
        {transform:'translate3d(0,0,0) rotate(0deg)',offset:0},
        {transform:`translate3d(${-distance}px,-2px,0) rotate(-7deg)`,offset:.16},
        {transform:`translate3d(${distance}px,-3px,0) rotate(6deg)`,offset:.34},
        {transform:`translate3d(${-distance/2}px,-1px,0) rotate(-4deg)`,offset:.52},
        {transform:'translate3d(1px,0,0) rotate(2deg)',offset:.72},
        {transform:'translate3d(0,0,0) rotate(0deg)',offset:1}
      ],{duration:760,easing:'ease-in-out'}),
      play(facet,[
        {transform:'translate(0,0) rotate(-13deg)',offset:0},
        {transform:'translate(0,0) rotate(-13deg)',offset:.12},
        {transform:`translate(${small?1:3}px,1px) rotate(-27deg)`,offset:.32},
        {transform:'translate(-1px,-1px) rotate(-3deg)',offset:.55},
        {transform:'translate(1px,0) rotate(-18deg)',offset:.77},
        {transform:'translate(0,0) rotate(-13deg)',offset:1}
      ],{duration:960,easing:'ease-in-out'}),
      play(liquid,[
        {transform:'rotate(0deg)',opacity:.6},
        {transform:'translate(3px,-1px) rotate(-13deg)',opacity:.8,offset:.3},
        {transform:'translate(-2px,1px) rotate(9deg)',opacity:.7,offset:.6},
        {transform:'rotate(0deg)',opacity:.6}
      ],{duration:1000,easing:'ease-in-out'}),
      play(button.querySelector('.oracle-shadow'),[{scale:'1 1',opacity:1},{scale:'.93 1',opacity:.8,offset:.4},{scale:'1 1',opacity:1}],{duration:760,easing:'ease-in-out'})
    ].filter(Boolean);
    groups.set(button,run);
    return run;
  }
  function cleanupActivation(job) {
    job.button.removeAttribute('aria-busy');
    delete job.button.dataset.activating;
    if(pending===job) pending=null;
  }
  function cancelPending() {
    const job=pending;
    if (!job) return;
    job.cancelled=true;
    cleanupActivation(job);
    clearGroup(job.button);
  }
  async function activate(button, open) {
    if (pending || document.hidden || !button?.isConnected || typeof open!=='function') return;
    if (reduced.matches || !button.animate) { button.focus({preventScroll:true});open();return; }
    const job={button,screen:document.body.dataset.screen,cancelled:false};
    pending=job;
    button.focus({preventScroll:true});
    button.setAttribute('aria-busy','true');
    button.dataset.activating='true';
    try {
      const timeline=button.dataset.prop==='orb' ? orbMotion(button) : bookMotion(button,'activate');
      await Promise.allSettled(timeline.map(animation=>animation.finished));
      if (job.cancelled || document.hidden || !button.isConnected || document.body.dataset.screen!==job.screen || document.querySelector('dialog[open]')) return;
      // Keep the final pose until the modal has taken over. The whole timeline,
      // including the last delayed leaf/liquid movement, has completed here.
      open();
    } finally {
      cleanupActivation(job);
      clearGroup(button);
    }
  }
  window.ExorcistProps = Object.freeze({activate,cancel:cancelPending});

  document.querySelectorAll('#open-rules-home,#open-entity-book-home,#open-magic-ball-home,#open-rules-game,#open-entity-book-game,#open-magic-ball-game').forEach(button=>{
    const cover=button.querySelector('.book-cover,.session-mini-cover');
    button.dataset.prop=cover?'book':'orb';
    button.title=button.getAttribute('aria-label') || button.textContent.trim();
    if (cover) {
      const hinge=document.createElement('span');
      hinge.className='prop-hinge';
      hinge.setAttribute('aria-hidden','true');
      cover.before(hinge);
      hinge.append(cover);
      if (button.closest('#game-screen')) {
        for(let i=1;i<=2;i++) {
          const leaf=document.createElement('span');
          leaf.className='session-mini-leaf';
          leaf.setAttribute('aria-hidden','true');
          hinge.before(leaf);
        }
      }
    }
    function preview() {
      if (pending || reduced.matches || document.hidden || document.querySelector('dialog[open]')) return;
      if(button.dataset.prop==='book') bookMotion(button,'hover');
      else if(!(groups.get(button)||[]).some(a=>a.playState==='running')) orbMotion(button);
    }
    button.addEventListener('pointerenter',event=>{if(fine.matches && event.pointerType!=='touch')preview();},{passive:true});
    button.addEventListener('pointerleave',()=>{
      if(pending?.button===button || reduced.matches || button.dataset.prop!=='book')return;
      bookMotion(button,'close');
    },{passive:true});
    button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))preview();});
    button.addEventListener('blur',()=>{
      if(pending?.button===button || reduced.matches || button.dataset.prop!=='book')return;
      bookMotion(button,'close');
    });
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && pending){event.preventDefault();cancelPending();}
  });
  new MutationObserver(()=>{cancelPending();queueFit();}).observe(document.body,{attributes:true,attributeFilter:['data-screen']});

  // The real phase hint moves with the compact index; there is no duplicate
  // status text for assistive technology, and no second source of game state.
  const hint=document.getElementById('phase-hint');
  if(hint){hint.classList.add('compact-phase-hint');hint.setAttribute('aria-live','polite');document.querySelector('.reading-head')?.append(hint);}

  const tabs=document.getElementById('entity-tabs');
  function categoryMarks(){
    if(typeof ENTITY_CATEGORIES==='undefined')return;
    tabs?.querySelectorAll('.entity-tab').forEach(button=>{
      if(button.querySelector('.category-glyph'))return;
      const icon=ENTITY_CATEGORIES[button.dataset.category]?.icon;
      if(!icon)return;
      const mark=document.createElement('span');mark.className='category-glyph';mark.setAttribute('aria-hidden','true');mark.innerHTML=icon;button.prepend(mark);
    });
  }
  if(tabs)new MutationObserver(categoryMarks).observe(tabs,{childList:true});
  categoryMarks();
  const detail=document.getElementById('entity-detail');
  if(detail)new MutationObserver(()=>{
    detail.querySelectorAll('.entity-effect-card:nth-child(2)').forEach(note=>{
      if(note.querySelector('.note-curl'))return;
      const curl=document.createElement('span');curl.className='note-curl';curl.setAttribute('aria-hidden','true');note.append(curl);
    });
    queueFit();
  }).observe(detail,{childList:true});

  const paper=document.getElementById('rules-paper');
  function chapterArrival(){
    queueFit();
    if(chapterFrame)cancelAnimationFrame(chapterFrame);
    if(reduced.matches || document.hidden)return;
    chapterFrame=requestAnimationFrame(()=>{
      chapterFrame=0;
      if(!document.getElementById('rules-dialog')?.open || paper.hidden || document.getElementById('rules-scroll').scrollTop>10)return;
      paper.getAnimations().forEach(animation=>animation.cancel());
      play(paper,[{opacity:0,translate:'0 7px'},{opacity:1,translate:'0 0'}],{duration:270,easing:ease});
    });
  }
  if(paper)new MutationObserver(chapterArrival).observe(paper,{childList:true});

  // Never insert soft hyphens or split text nodes into individual letters.
  // Only a too-wide single word causes a local font-size adjustment; ordinary
  // phrases wrap at spaces. Re-fit on content, font, dialog and viewport changes.
  const canvas=document.createElement('canvas');
  const context=canvas.getContext('2d');
  const fitSelector=[
    '#current-player-name','.mode-copy strong','.home-tools .tool-label',
    '.trait-value','.trait-content','.trait-title','.entity-name',
    '.entity-effect-top h4','#entity-book-title','#entity-picker-current',
    '.rules-page-heading h3','.rules-block-heading h4','.rules-fact span',
    '.rules-result strong','.entity-choice-name'
  ].join(',');
  function fitWords(){
    fitFrame=0;
    if(!context || document.hidden)return;
    document.querySelectorAll(fitSelector).forEach(el=>{
      if(!el.getClientRects().length)return;
      if(el.dataset.wordFit==='true'){el.style.removeProperty('font-size');delete el.dataset.wordFit;}
      if(el.id==='current-player-name')el.closest('.reading-head')?.classList.remove('long-player-name');
      const cs=getComputedStyle(el);
      if(cs.display==='none')return;
      let width=el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-5;
      if(width<20)return;
      const size=parseFloat(cs.fontSize);
      context.font=`${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      const spacing=parseFloat(cs.letterSpacing)||0;
      const text=cs.textTransform==='uppercase'?el.textContent.toLocaleUpperCase('ru'):el.textContent;
      const words=text.trim().split(/\s+/u);
      const longest=Math.max(0,...words.map(word=>context.measureText(word).width+Math.max(0,word.length-1)*spacing));
      if(el.id==='current-player-name' && longest*(18/size)>width){
        el.closest('.reading-head')?.classList.add('long-player-name');
        width=el.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-5;
      }
      if(longest>width+1){
        const fitted=Math.max(9,Math.floor(size*width/longest*10)/10);
        el.style.setProperty('font-size',`${fitted}px`,'important');el.dataset.wordFit='true';
      }
    });
  }
  function queueFit(){if(!fitFrame)fitFrame=requestAnimationFrame(fitWords);}
  const contentObserver=new MutationObserver(queueFit);
  ['traits','player-strip','current-player-name','rules-results'].forEach(id=>{
    const el=document.getElementById(id);if(el)contentObserver.observe(el,{childList:true,subtree:true,characterData:true});
  });
  document.querySelectorAll('dialog').forEach(dialog=>{
    new MutationObserver(queueFit).observe(dialog,{attributes:true,attributeFilter:['open']});
  });
  window.addEventListener('resize',queueFit,{passive:true});
  document.fonts?.ready.then(queueFit);
  queueFit();

  function stop(){
    cancelPending();
    for(const animation of animations)animation.cancel();animations.clear();
    for(const button of groups.keys())clearGroup(button);
    if(chapterFrame)cancelAnimationFrame(chapterFrame);chapterFrame=0;
    if(fitFrame)cancelAnimationFrame(fitFrame);fitFrame=0;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else queueFit();});
  window.addEventListener('pagehide',stop);
  reduced.addEventListener?.('change',()=>{if(reduced.matches)stop();});
})();
