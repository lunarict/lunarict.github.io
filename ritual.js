/* 56.6.5 - restored v56.6.3 paper letterpress, guarded/cancellable.
 * Only presentation changes here. traitAction remains the authoritative action.
 * No peel, sideways translation, Y flip, new tear mask or duplicated paper face.
 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const jobs = new Map();
  const decoration = new Set();
  const grid = document.getElementById('traits');
  const ease = 'cubic-bezier(.2,.72,.22,1)';
  function pointerInput() { document.body.dataset.input = 'pointer'; }
  document.addEventListener('pointerdown', pointerInput, {capture:true, passive:true});
  document.addEventListener('touchstart', pointerInput, {capture:true, passive:true});
  document.addEventListener('keydown', event => {
    if (!event.metaKey && !event.ctrlKey && !event.altKey &&
        ['Tab','Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      document.body.dataset.input = 'keyboard';
    }
  }, true);
  function play(el, frames, options, group = decoration) {
    if (!el?.animate || reduced.matches || document.hidden) return null;
    const a = el.animate(frames, options);
    group.add(a);
    a.finished.then(() => { if (options.fill !== 'forwards') group.delete(a); }, () => group.delete(a));
    return a;
  }
  function clean(job) {
    job.cancelled = true;
    for (const t of job.timers) clearTimeout(t);
    for (const a of job.animations) a.cancel();
    job.timers.clear(); job.animations.clear();
    job.card.removeAttribute('aria-busy');
    delete job.card.dataset.paperPress;
    job.card.classList.remove('paper-pressing','paper-fingerdown','paper-sealing','reveal-prelude');
    job.button.disabled = false;
    if (jobs.get(job.card) === job) jobs.delete(job.card);
  }
  function cancelAll() { for (const job of [...jobs.values()]) clean(job); }
  function turn(options) {
    const {card,button,action,isCurrent,commit} = options;
    if (jobs.has(card) || !isCurrent()) return;
    if (reduced.matches || !card.animate || document.hidden) { commit(); return; }
    const reveal = action === 'reveal';
    const job = {...options, animations:new Set(), timers:new Set(), cancelled:false};
    jobs.set(card,job);
    button.disabled = true;
    card.dataset.paperPress = 'true';
    card.setAttribute('aria-busy','true');
    card.classList.remove('paper-fingerdown');
    card.classList.add(reveal ? 'paper-pressing' : 'paper-sealing');
    if (reveal) card.classList.add('reveal-prelude');
    // These frames/durations are the v56.6.3 sequence, not a new interpretation.
    const frames = reveal ? [
      {offset:0,    scale:'1 1',        translate:'0 0'},
      {offset:.13,  scale:'.998 .991',  translate:'0 1px'},
      {offset:.28,  scale:'.991 .966',  translate:'0 3.2px'},
      {offset:.39,  scale:'.994 .976',  translate:'0 2px'},
      {offset:.52,  scale:'1.003 1.015', translate:'0 -1.3px'},
      {offset:.64,  scale:'.998 .994',  translate:'0 .7px'},
      {offset:.78,  scale:'1.001 1.004', translate:'0 -.35px'},
      {offset:1,    scale:'1 1',        translate:'0 0'}
    ] : [
      {offset:0,    scale:'1 1',        translate:'0 0'},
      {offset:.19,  scale:'1.003 1.007', translate:'0 -1.4px'},
      {offset:.41,  scale:'.999 .991',  translate:'0 1px'},
      {offset:.63,  scale:'.997 .983',  translate:'0 2px'},
      {offset:.81,  scale:'1.001 1.004', translate:'0 -.5px'},
      {offset:1,    scale:'1 1',        translate:'0 0'}
    ];
    play(card,frames,{duration:reveal?960:790,easing:'linear'},job.animations);
    if (!reveal) play(card.querySelector('.trait-value'),[
      {offset:0,opacity:1,filter:'blur(0)',transform:'translateY(0)'},
      {offset:.32,opacity:.86,filter:'blur(0)',transform:'translateY(0)'},
      {offset:1,opacity:0,filter:'blur(1.2px)',transform:'translateY(1.7px)'}
    ],{duration:315,easing:'cubic-bezier(.45,0,.75,1)',fill:'forwards'},job.animations);
    job.timers.add(setTimeout(() => {
      if (!job.cancelled && isCurrent()) commit();
    },reveal?286:302));
    job.timers.add(setTimeout(() => {
      clean(job);
      if (document.body.dataset.input==='keyboard' && isCurrent() && !document.querySelector('dialog[open]')) {
        card.querySelector(reveal?'.close-button':'.reveal-button')?.focus({preventScroll:true});
      }
    },reveal?1000:830));
  }
  window.ExorcistPaper = Object.freeze({turn,cancelAll});

  // Track holds only a view of the existing progress number. No gameplay data
  // is persisted or duplicated here, and switching players does not celebrate.
  const meter=document.querySelector('.progress-track');
  const progress=document.getElementById('progress-text');
  let previousPlayer=null, previousCount=null, meterFrame=0;
  const seals=[];
  if (meter && progress) {
    for(let i=1;i<=6;i++) {
      const seal=document.createElement('span');seal.className='ritual-step'+(i===6?' is-goal':'');seal.setAttribute('aria-hidden','true');
      seal.innerHTML=i===6 ? '<svg viewBox="0 0 24 24"><path class="seal-eye-shut" d="M3 10q9 9 18 0M5 12l-1 3m5-1-1 3m6-3 1 3m4-5 1 3"/><g class="seal-eye-open"><path d="M2 12q10-12 20 0Q12 24 2 12Z"/><ellipse class="seal-eye-iris" cx="12" cy="12" rx="2" ry="4"/><path d="M12 1v3m0 16v3M3 4l2 2m14 12 2 2M21 4l-2 2M5 18l-2 2"/></g></svg>' : `<b>${i}</b>`;
      meter.append(seal);seals.push(seal);
    }
    function update() {
      meterFrame=0;
      const count=Math.max(0,Math.min(6,parseInt(progress.textContent,10)||0));
      const player=grid.dataset.playerId;
      const advanced=player===previousPlayer && previousCount!==null && count>previousCount;
      const retreat=player===previousPlayer && previousCount!==null && count<previousCount;
      const from=previousCount??0;
      meter.style.setProperty('--ritual-fill',String(Math.max(0,(count-1)/5)));
      meter.dataset.seals=String(count);
      meter.setAttribute('aria-label','\u0421\u0447\u0438\u0442\u043a\u0430');meter.removeAttribute('aria-labelledby');
      meter.setAttribute('aria-valuetext',`${count} \u0438\u0437 6 \u0445\u0430\u0440\u0430\u043a\u0442\u0435\u0440\u0438\u0441\u0442\u0438\u043a`);
      seals.forEach((seal,i)=>{
        seal.classList.toggle('is-struck',i<count);seal.classList.toggle('is-next',i===count);
        if(advanced && i>=from && i<count) {
          play(seal,[{scale:'1.38',translate:'0 -4px',opacity:.35},{scale:'.91',translate:'0 1px',opacity:1,offset:.5},{scale:'1.025',translate:'0 -1px',offset:.73},{scale:'1',translate:'0 0'}],{duration:i===5?620:440,delay:(i-from)*55,easing:ease});
        } else if(retreat && i>=count && i<from) {
          play(seal,[{scale:'1'},{scale:'.88',offset:.3},{scale:'1'}],{duration:270,easing:ease});
        }
      });
      if(advanced) play(progress,[{translate:'0 2px',opacity:.45},{translate:'0 0',opacity:1}],{duration:240,easing:ease});
      if(advanced && count===6) {
        const eye=seals[5].querySelector('.seal-eye-open');
        play(eye,[{opacity:0},{opacity:1}],{duration:400,easing:'ease-out'});
        const book=document.querySelector('#open-entity-book-game .session-mini-book');
        play(book,[{rotate:'0deg'},{rotate:'-7deg',offset:.32},{rotate:'3deg',offset:.65},{rotate:'0deg'}],{duration:620,delay:170,easing:ease});
      }
      previousPlayer=player;previousCount=count;
    }
    const queue=()=>{if(!meterFrame)meterFrame=requestAnimationFrame(update);};
    new MutationObserver(queue).observe(progress,{childList:true,characterData:true,subtree:true});
    update();
  }

  // The eye wakes once as its own book opens; there is no idle breathing loop.
  for (const id of ['open-entity-book-home','open-entity-book-game']) {
    document.getElementById(id)?.addEventListener('click',()=>{
      const iris=document.querySelector(`#${id} .engraved-eye .eye-iris`);
      play(iris,[{scale:'1 .72'},{scale:'1 1.06',offset:.5},{scale:'1 1'}],{duration:500,easing:ease});
    });
  }
  function validateJobs() { for (const job of [...jobs.values()]) if (!job.isCurrent()) clean(job); }
  if(grid)new MutationObserver(validateJobs).observe(grid,{childList:true,attributes:true,attributeFilter:['data-player-id']});
  new MutationObserver(validateJobs).observe(document.body,{attributes:true,attributeFilter:['data-screen']});
  function stop(){cancelAll();for(const a of decoration)a.cancel();decoration.clear();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  let paperWidth=document.documentElement.clientWidth;
  window.addEventListener('resize',()=>{
    const width=document.documentElement.clientWidth;
    if(width!==paperWidth){paperWidth=width;cancelAll();}
  },{passive:true});
  reduced.addEventListener?.('change',()=>{if(reduced.matches)stop();});
})();
