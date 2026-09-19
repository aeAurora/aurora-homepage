(() => {
  const reader = document.getElementById('essay-reader');
  const readerLabel = document.getElementById('reader-label');
  const readerTitle = document.getElementById('reader-title');
  const readerBody = document.getElementById('reader-body');
  const closeButton = reader.querySelector('.reader-close');
  const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let trigger = null;
  let closeTimer = null;

  const openReader = (button) => {
    const source = document.getElementById(`essay-${button.dataset.essay}`);
    if (!source) return;

    window.clearTimeout(closeTimer);
    trigger = button;
    readerLabel.textContent = source.dataset.label;
    readerTitle.textContent = source.dataset.title;
    readerBody.innerHTML = source.innerHTML;
    readerBody.scrollTop = 0;
    reader.hidden = false;
    reader.classList.add('is-entering');
    document.body.classList.add('bookmark-open');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        reader.classList.remove('is-entering');
        closeButton.focus();
      });
    });
  };

  const closeReader = () => {
    if (reader.hidden) return;
    reader.classList.add('is-entering');
    document.body.classList.remove('bookmark-open');
    closeTimer = window.setTimeout(() => {
      reader.hidden = true;
      reader.classList.remove('is-entering');
      readerBody.innerHTML = '';
      if (trigger) trigger.focus();
    }, motionReduced ? 0 : 650);
  };

  document.querySelectorAll('.bookmark').forEach((button) => {
    button.addEventListener('click', () => openReader(button));
  });

  closeButton.addEventListener('click', closeReader);
  reader.addEventListener('click', (event) => {
    if (event.target === reader) closeReader();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeReader();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
