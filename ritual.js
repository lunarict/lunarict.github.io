/* 56.6.4 - presentation only. Finite, cancellable paper turns and seals.
 * The characteristic changes once, through the existing authoritative action.
 * Paper faces swap exactly edge-on, so no mirrored or sliding lettering leaks.
 */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const jobs = new Map();
  const decoration = new Set();
  const grid = document.getElementById('traits');
  const ease = 'cubic-bezier(.2,.72,.22,1)';

  // Input modality is explicit: Safari may focus a clicked control even when
  // it was activated by touch. Do not blur text inputs or destroy keyboard use.
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
  async function stage(job, frames, duration, easing = ease) {
    if (job.cancelled || !job.isCurrent()) throw new Error('paper-cancelled');
    const a = play(job.card, frames, {duration, easing, fill:'forwards'}, job.animations);
    if (a) await a.finished;
    if (job.cancelled || !job.isCurrent()) throw new Error('paper-cancelled');
    return a;
  }
  function clean(job) {
    job.cancelled = true;
    if (job.waitStop) job.waitStop();
    for (const a of job.animations) a.cancel();
    job.animations.clear();
    job.crease?.remove();
    job.shadow?.remove();
    job.card.removeAttribute('aria-busy');
    delete job.card.dataset.paperTurning;
    delete job.card.dataset.turnPhase;
    job.card.classList.remove('paper-pressing','paper-fingerdown','paper-sealing','reveal-prelude','just-revealed','just-concealed');
    job.button.disabled = false;
    if (jobs.get(job.card) === job) jobs.delete(job.card);
  }
  function cancelAll() { for (const job of [...jobs.values()]) clean(job); }
  function waitForAuthority(job) {
    if (job.isApplied()) return Promise.resolve();
    // Only a network client needs this. Never invent the revealed value or
    // mark the reading as complete before an authoritative update arrives.
    return new Promise((resolve, reject) => {
      let timer;
      const finish = ok => { observer.disconnect();clearTimeout(timer);job.waitStop = null;ok ? resolve() : reject(new Error('paper-await-state')); };
      const observer = new MutationObserver(() => {
        if (job.cancelled || !job.isCurrent()) finish(false);
        else if (job.isApplied()) finish(true);
      });
      observer.observe(grid,{subtree:true,childList:true,attributes:true,attributeFilter:['data-state-signature']});
      job.waitStop = () => finish(false);
      timer = setTimeout(() => finish(job.isApplied()), 2200);
    });
  }
  async function turn(options) {
    const {card,button,action,isCurrent,isApplied,commit} = options;
    if (jobs.has(card) || !isCurrent()) return;
    if (reduced.matches || !card.animate || !CSS.supports('rotate','0 1 0 90deg') || !CSS.supports('translate','1px 1px') || document.hidden) { commit();return; }
    const index = [...grid.querySelectorAll(':scope > .trait')].indexOf(card);
    const sign = index % 2 === 0 ? -1 : 1;
    const rect = card.getBoundingClientRect();
    const room = sign < 0 ? rect.left : innerWidth - rect.right;
    const dx = sign * Math.max(7, Math.min(30, room - 9));
    const job = {...options, animations:new Set(), cancelled:false, committed:false};
    jobs.set(card,job);
    button.disabled = true;
    card.dataset.paperTurning = 'true';
    card.dataset.tearSide = sign < 0 ? 'left' : 'right';
    card.dataset.turnPhase = 'grip';
    card.setAttribute('aria-busy','true');
    card.classList.remove('paper-fingerdown');

    const crease = document.createElement('span');
    crease.className = 'paper-lift-crease';crease.dataset.motionLayer='crease';crease.setAttribute('aria-hidden','true');card.append(crease);job.crease=crease;
    // Stationary cast shadow. It is not part of the turning face.
    const shadow = document.createElement('span');
    shadow.className = 'paper-contact-shadow';shadow.setAttribute('aria-hidden','true');
    shadow.style.cssText = `left:${card.offsetLeft}px;top:${card.offsetTop+7}px;width:${card.offsetWidth}px;height:${card.offsetHeight}px;`;
    shadow.style.setProperty('--shadow-mask',getComputedStyle(card).getPropertyValue('--tear-mask'));
    grid.append(shadow);job.shadow=shadow;
    play(shadow,[{opacity:.48,scale:'1 1'},{opacity:.32,scale:'.98 .97',offset:.3},{opacity:.22,scale:'.94 .95',offset:.65},{opacity:.48,scale:'1 1'}],{duration:830,easing:'ease-in-out',fill:'forwards'},job.animations);
    play(crease,[{opacity:0},{opacity:.65,offset:.22},{opacity:.9,offset:.43},{opacity:.4,offset:.75},{opacity:0}],{duration:830,easing:'linear'},job.animations);
    const tape=card.querySelector('.paper-tape');
    play(tape,[{translate:'0 0',rotate:'0deg',scale:'1 1'},{translate:`${sign*2}px -1px`,rotate:`${sign*4}deg`,scale:'1.06 .92',offset:.16},{translate:`${sign*4}px -4px`,rotate:`${sign*16}deg`,scale:'.98 1',offset:.36},{translate:`${sign*2}px -3px`,rotate:`${sign*8}deg`,offset:.65},{translate:'0 1px',rotate:'0deg',scale:'1.03 .96',offset:.85},{translate:'0 0',rotate:'0deg',scale:'1 1'}],{duration:830,easing:'linear'},job.animations);
    const pose=(x,y,angle,scale='1 1')=>({translate:`${x}px ${y}px`,rotate:`0 1 0 ${angle}deg`,scale});
    try {
      // Tension -> abrupt sideways detachment. The opposite edge is last to lift.
      await stage(job,[
        {...pose(0,0,0),offset:0},
        {...pose(-sign*2,1,sign*3,'.998 .985'),offset:.31},
        {...pose(dx*.72,-14,sign*17,'1.025 1.025'),offset:.72},
        {...pose(dx,-23,sign*25,'1.025 1.025'),offset:1}
      ],230,'cubic-bezier(.28,.04,.17,1)');
      card.dataset.turnPhase='flip-out';
      await stage(job,[pose(dx,-23,sign*25,'1.025 1.025'),pose(dx*.6,-25,sign*90,'1.015 1.015')],155,'cubic-bezier(.46,0,.78,.42)');
      if (!isCurrent()) return;
      commit();job.committed=true;
      await waitForAuthority(job);
      if (!isCurrent() || job.cancelled) return;
      // Opposite face starts at the very same edge; the paper completes its
      // half-turn while its new lettering remains correctly oriented.
      card.dataset.turnPhase='flip-in';
      await stage(job,[
        {...pose(dx*.6,-25,-sign*90,'1.015 1.015'),offset:0},
        {...pose(dx*.28,-13,-sign*24,'1.012 1.012'),offset:.6},
        {...pose(0,1.6,0,'1.008 .98'),offset:1}
      ],190,'cubic-bezier(.12,.48,.18,1)');
      card.dataset.turnPhase='paste';
      await stage(job,[
        {...pose(0,1.6,0,'1.008 .98'),offset:0},
        {...pose(0,-.8,0,'.998 1.005'),offset:.38},
        {...pose(0,.3,0,'1.001 .998'),offset:.7},
        {...pose(0,0,0),offset:1}
      ],225,'cubic-bezier(.2,.7,.25,1)');
    } catch (error) {
      // A navigation, new deal, changed preference or missing server reply is
      // not an unhandled rejection. Always restore the authoritative face.
      if (error?.name !== 'AbortError' && !job.cancelled && job.committed && !isApplied()) {
        card.dataset.turnPhase='waiting-ended';
      }
    } finally {
      clean(job);
      if (document.body.dataset.input==='keyboard' && isCurrent() && !document.querySelector('dialog[open]')) {
        card.querySelector(action==='reveal'?'.close-button':'.reveal-button')?.focus({preventScroll:true});
      }
    }
  }
  window.ExorcistPaper=Object.freeze({turn,cancelAll});

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
      const iris=document.querySelector(`#${id} .grimoire-iris`);
      play(iris,[{scale:'1 .72'},{scale:'1 1.06',offset:.5},{scale:'1 1'}],{duration:500,easing:ease});
    });
  }
  function validateJobs() { for (const job of [...jobs.values()]) if (!job.isCurrent()) clean(job); }
  if(grid)new MutationObserver(validateJobs).observe(grid,{childList:true,attributes:true,attributeFilter:['data-player-id']});
  new MutationObserver(validateJobs).observe(document.body,{attributes:true,attributeFilter:['data-screen']});
  function stop(){cancelAll();for(const a of decoration)a.cancel();decoration.clear();}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  window.addEventListener('resize',cancelAll,{passive:true});
  reduced.addEventListener?.('change',()=>{if(reduced.matches)stop();});
})();
