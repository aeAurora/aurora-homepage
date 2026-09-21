(() => {
  document.getElementById('year')?.replaceChildren(String(new Date().getFullYear()));

  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const activate = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (panels[i]) panels[i].hidden = !active;
      });
      if (focus) tabs[index]?.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(index));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        activate(next, true);
      });
    });
    if (tabs.length) activate(Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true')));
  });

  document.querySelectorAll('.film-strip').forEach((strip) => {
    let pointerId = null;
    let startX = 0;
    let startScrollLeft = 0;
    let dragged = false;
    let suppressClick = false;

    strip.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = strip.scrollLeft;
      dragged = false;
      strip.setPointerCapture?.(pointerId);
    });

    strip.addEventListener('pointermove', (event) => {
      if (event.pointerId !== pointerId) return;
      const distance = event.clientX - startX;
      if (!dragged && Math.abs(distance) < 6) return;
      dragged = true;
      strip.classList.add('is-dragging');
      strip.scrollLeft = startScrollLeft - distance;
      event.preventDefault();
    });

    const finishDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      if (dragged) {
        suppressClick = true;
        requestAnimationFrame(() => { suppressClick = false; });
      }
      if (strip.hasPointerCapture?.(pointerId)) strip.releasePointerCapture(pointerId);
      pointerId = null;
      dragged = false;
      strip.classList.remove('is-dragging');
    };

    strip.addEventListener('pointerup', finishDrag);
    strip.addEventListener('pointercancel', finishDrag);
    strip.addEventListener('lostpointercapture', () => {
      pointerId = null;
      dragged = false;
      strip.classList.remove('is-dragging');
    });
    strip.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    strip.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      strip.scrollLeft += event.deltaY;
      event.preventDefault();
    }, { passive: false });
  });

  const audio = document.querySelector('[data-music-audio]');
  const vinyl = document.querySelector('[data-vinyl]');
  const deck = document.querySelector('[data-music-deck]');
  const setPlaying = (playing) => {
    vinyl?.classList.toggle('is-playing', playing);
    deck?.classList.toggle('is-audible', playing);
  };
  audio?.addEventListener('play', () => setPlaying(true));
  audio?.addEventListener('pause', () => setPlaying(false));
  audio?.addEventListener('ended', () => setPlaying(false));
})();
