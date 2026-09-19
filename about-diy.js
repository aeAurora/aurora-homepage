(() => {
  const badge = document.getElementById('imageBadge');
  const gallery = document.getElementById('diyGallery');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxIndex = document.getElementById('lightboxIndex');
  const closeButton = document.getElementById('lightboxClose');
  const buttons = gallery ? Array.from(gallery.querySelectorAll('.gallery-button')) : [];
  let activeIndex = 0;
  let previousFocus = null;

  document.getElementById('year').textContent = new Date().getFullYear();

  const showImage = (index) => {
    if (!buttons.length) return;
    activeIndex = (index + buttons.length) % buttons.length;
    const source = buttons[activeIndex].querySelector('img');
    lightboxImage.src = source.src;
    lightboxImage.alt = source.alt;
    lightboxIndex.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(buttons.length).padStart(2, '0')}`;
  };

  const openLightbox = (index) => {
    previousFocus = document.activeElement;
    showImage(index);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (previousFocus) previousFocus.focus();
  };

  badge?.addEventListener('click', () => {
    gallery.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    buttons[0]?.focus({ preventScroll: true });
  });

  buttons.forEach((button, index) => button.addEventListener('click', () => openLightbox(index)));
  closeButton?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (event) => {
    if (lightbox?.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') showImage(activeIndex + 1);
    if (event.key === 'ArrowLeft') showImage(activeIndex - 1);
  });
})();
