(function () {
  'use strict';

  var button = document.getElementById('backToTop');
  if (!button) return;

  if (!document.querySelector('link[data-back-to-top-style]')) {
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'back-to-top.css';
    stylesheet.setAttribute('data-back-to-top-style', '');
    document.head.appendChild(stylesheet);
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;

  function updateVisibility() {
    var visible = window.scrollY > Math.max(360, window.innerHeight * 0.55);
    button.classList.toggle('is-visible', visible);
    button.setAttribute('aria-hidden', visible ? 'false' : 'true');
    button.tabIndex = visible ? 0 : -1;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateVisibility);
  }, { passive: true });

  window.addEventListener('resize', updateVisibility, { passive: true });

  button.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  updateVisibility();

  if (!document.querySelector('script[data-flower-pet]')) {
    var flowerScript = document.createElement('script');
    flowerScript.src = 'flower-png-pet.js?v=2.1.0';
    flowerScript.setAttribute('data-flower-pet', '');
    document.body.appendChild(flowerScript);
  }
})();
