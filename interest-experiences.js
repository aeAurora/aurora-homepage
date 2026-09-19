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
