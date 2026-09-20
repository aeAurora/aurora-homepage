(function () {
  'use strict';

  if (document.getElementById('flowerPet')) return;

  var css = document.createElement('style');
  css.id = 'flowerPixelPetStyles';
  css.textContent =
    '.flower-pixel-pet{position:fixed;left:0;bottom:2px;z-index:58;width:142px;height:142px;touch-action:none;user-select:none;cursor:grab;will-change:transform}' +
    '.flower-pixel-pet.is-dragging{cursor:grabbing}' +
    '.flower-pixel-pet__stage{position:absolute;inset:0;transform-origin:50% 100%;will-change:transform}' +
    '.flower-pixel-pet__image{display:block;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 8px 5px rgba(0,0,0,.34));pointer-events:none;transform:scaleX(var(--flower-facing,1));transform-origin:50% 100%}' +
    '.flower-pixel-pet[data-state="idle"] .flower-pixel-pet__stage{animation:flower-png-breathe 2.6s ease-in-out infinite}' +
    '.flower-pixel-pet[data-state="walk"] .flower-pixel-pet__stage{animation:flower-png-walk .3s steps(2,end) infinite}' +
    '.flower-pixel-pet[data-state="happy"] .flower-pixel-pet__stage{animation:flower-png-hop .62s cubic-bezier(.2,.8,.3,1) both}' +
    '.flower-pixel-pet[data-state="look"] .flower-pixel-pet__stage{animation:flower-png-look .8s ease-in-out infinite alternate}' +
    '.flower-pixel-pet[data-state="sleep"] .flower-pixel-pet__stage{animation:flower-png-sleep 3.2s ease-in-out infinite}' +
    '.flower-pixel-pet.is-dragging .flower-pixel-pet__stage{animation:flower-png-held .5s ease-in-out infinite alternate}' +
    '.flower-pixel-pet__bubble{position:absolute;z-index:2;left:50%;bottom:124px;padding:5px 8px;border:2px solid #352519;border-radius:2px;color:#2b2020;background:#fff5d9;box-shadow:3px 3px 0 rgba(0,0,0,.2);font:800 10px/1.15 ui-monospace,Consolas,monospace;white-space:nowrap;opacity:0;transform:translate(-50%,5px);transition:opacity .14s,transform .14s;pointer-events:none}' +
    '.flower-pixel-pet__bubble.is-visible{opacity:1;transform:translate(-50%,0)}' +
    '.flower-pixel-pet:focus-visible{outline:2px solid #7ee7ff;outline-offset:2px}' +
    '@keyframes flower-png-breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(2px) scale(1.018,.982)}}' +
    '@keyframes flower-png-walk{0%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-4px) rotate(1deg)}100%{transform:translateY(0) rotate(-1deg)}}' +
    '@keyframes flower-png-hop{0%,100%{transform:translateY(0) scale(1)}35%{transform:translateY(-17px) rotate(-4deg) scale(1.05,.95)}68%{transform:translateY(-5px) rotate(3deg) scale(.98,1.03)}}' +
    '@keyframes flower-png-look{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-3px) rotate(3deg)}}' +
    '@keyframes flower-png-sleep{0%,100%{transform:scale(1)}50%{transform:scale(1.025,.975)}}' +
    '@keyframes flower-png-held{from{transform:translateY(-3px) rotate(-3deg)}to{transform:translateY(1px) rotate(3deg)}}' +
    '@media(max-width:820px){.flower-pixel-pet{width:116px;height:116px}.flower-pixel-pet__bubble{bottom:101px}}' +
    '@media(prefers-reduced-motion:reduce){.flower-pixel-pet__stage{animation:none!important}.flower-pixel-pet__bubble{transition:none}}';
  document.head.appendChild(css);

  var pet = document.createElement('div');
  pet.id = 'flowerPet';
  pet.className = 'flower-pixel-pet';
  pet.dataset.state = 'idle';
  pet.tabIndex = 0;
  pet.setAttribute('role', 'button');
  pet.setAttribute('aria-label', '像素宠物 Flower。点击互动，也可以拖动她。');
  pet.innerHTML = '<span class="flower-pixel-pet__bubble" aria-hidden="true"></span>' +
    '<span class="flower-pixel-pet__stage"><img class="flower-pixel-pet__image" src="assets/flower-pixel/flower-idle.png" alt="像素风 Flower"></span>';
  document.body.appendChild(pet);

  var image = pet.querySelector('.flower-pixel-pet__image');
  var bubble = pet.querySelector('.flower-pixel-pet__bubble');
  var assets = {
    idle: 'assets/flower-pixel/flower-idle.png',
    blink: 'assets/flower-pixel/flower-blink.png',
    look: 'assets/flower-pixel/flower-look.png',
    happy: 'assets/flower-pixel/flower-happy.png',
    walk1: 'assets/flower-pixel/flower-walk-1.png',
    walk2: 'assets/flower-pixel/flower-walk-2.png',
    sit: 'assets/flower-pixel/flower-sit.png',
    sleep: 'assets/flower-pixel/flower-sleep.png'
  };
  Object.keys(assets).forEach(function (key) { var preload = new Image(); preload.src = assets[key]; });

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var x = Math.max(8, window.innerWidth - 168);
  var y = 0;
  var facing = -1;
  var state = 'idle';
  var stateUntil = performance.now() + 2400;
  var targetX = x;
  var lastTime = performance.now();
  var walkFrame = 0;
  var lastWalkFrame = 0;
  var pointerX = -9999;
  var pointerY = -9999;
  var dragging = false;
  var dragMoved = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var originX = 0;
  var originY = 0;
  var bubbleTimer = 0;

  try {
    var saved = Number(sessionStorage.getItem('flowerPixelX'));
    if (isFinite(saved)) x = Math.max(4, Math.min(saved, window.innerWidth - pet.offsetWidth - 4));
  } catch (ignore) {}

  function showFrame(name) {
    var next = assets[name] || assets.idle;
    if (!image.src.endsWith(next)) image.src = next;
  }

  function setState(next, duration) {
    state = next;
    pet.dataset.state = next;
    stateUntil = performance.now() + duration;
    showFrame(next === 'walk' ? 'walk1' : next);
  }

  function say(text, duration) {
    window.clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.classList.add('is-visible');
    bubbleTimer = window.setTimeout(function () { bubble.classList.remove('is-visible'); }, duration || 1200);
  }

  function chooseState(now) {
    var roll = Math.random();
    if (reduced) {
      setState(roll < .72 ? 'idle' : 'blink', 2000);
    } else if (roll < .43) {
      state = 'walk';
      pet.dataset.state = 'walk';
      targetX = 8 + Math.random() * Math.max(20, window.innerWidth - pet.offsetWidth - 16);
      facing = targetX >= x ? 1 : -1;
      stateUntil = now + 2800 + Math.random() * 3200;
      showFrame('walk1');
    } else if (roll < .64) {
      setState('idle', 1800 + Math.random() * 1800);
    } else if (roll < .78) {
      setState('look', 1300 + Math.random() * 1000);
    } else if (roll < .9) {
      setState('sit', 2200 + Math.random() * 2200);
    } else {
      setState('sleep', 4200 + Math.random() * 3200);
      say('z z z', 1500);
    }
  }

  function loop(now) {
    var dt = Math.min(34, now - lastTime);
    lastTime = now;
    if (!dragging) {
      var pointerNear = Math.abs(pointerX - (x + pet.offsetWidth / 2)) < 150 && pointerY > window.innerHeight - 220;
      if (pointerNear && state === 'idle') {
        state = 'look'; pet.dataset.state = 'look'; showFrame('look'); stateUntil = now + 900;
        facing = pointerX >= x + pet.offsetWidth / 2 ? 1 : -1;
      }
      if (state === 'walk') {
        var direction = targetX > x ? 1 : -1;
        x += direction * dt * .027;
        facing = direction;
        if (now - lastWalkFrame > 170) {
          walkFrame = 1 - walkFrame;
          showFrame(walkFrame ? 'walk2' : 'walk1');
          lastWalkFrame = now;
        }
        if (Math.abs(targetX - x) < 2) { x = targetX; stateUntil = 0; }
      }
      if (now > stateUntil) chooseState(now);
      y += (0 - y) * .13;
    }
    x = Math.max(3, Math.min(x, window.innerWidth - pet.offsetWidth - 3));
    pet.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
    image.style.setProperty('--flower-facing', facing);
    window.requestAnimationFrame(loop);
  }

  function startDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    dragging = true;
    dragMoved = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    originX = x;
    originY = y;
    pet.classList.add('is-dragging');
    setState('happy', 100000);
    pet.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  pet.addEventListener('pointerdown', startDrag);
  pet.addEventListener('pointermove', function (event) {
    if (!dragging) return;
    var dx = event.clientX - dragStartX;
    var dy = event.clientY - dragStartY;
    if (Math.abs(dx) + Math.abs(dy) > 5) dragMoved = true;
    x = originX + dx;
    y = Math.max(-window.innerHeight + 150, Math.min(0, originY + dy));
    facing = dx >= 0 ? 1 : -1;
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    pet.classList.remove('is-dragging');
    if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    if (!dragMoved) {
      setState('happy', 900);
      say(Math.random() > .5 ? '汪！' : '摸摸～');
    } else {
      setState('idle', 1800);
      say('放这里啦', 1000);
      try { sessionStorage.setItem('flowerPixelX', String(Math.round(x))); } catch (ignore) {}
    }
  }

  pet.addEventListener('pointerup', endDrag);
  pet.addEventListener('pointercancel', endDrag);
  pet.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); setState('happy', 900); say('汪！');
    }
  });
  window.addEventListener('pointermove', function (event) { pointerX = event.clientX; pointerY = event.clientY; }, { passive: true });
  window.addEventListener('resize', function () { x = Math.min(x, window.innerWidth - pet.offsetWidth - 3); }, { passive: true });
  document.addEventListener('visibilitychange', function () { lastTime = performance.now(); });

  pet.style.transform = 'translate3d(' + Math.round(x) + 'px,0,0)';
  say('拖我试试', 1700);
  window.requestAnimationFrame(loop);
})();
