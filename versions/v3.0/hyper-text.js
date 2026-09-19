(function () {
  'use strict';

  var element = document.getElementById('heroName');
  if (!element) return;

  var glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789星光未来宇宙极光';
  var duration = 800;
  var frameTime = 34;
  var timer = 0;
  var running = false;

  function targetText() {
    return element.getAttribute('data-text') || '赵昕瑶';
  }

  function randomGlyph() {
    return glyphs.charAt(Math.floor(Math.random() * glyphs.length));
  }

  function play() {
    window.clearInterval(timer);
    running = true;
    element.classList.add('is-scrambling');

    var text = targetText();
    var startedAt = performance.now();

    timer = window.setInterval(function () {
      var progress = Math.min(1, (performance.now() - startedAt) / duration);
      var locked = Math.floor(progress * text.length);
      var output = '';

      for (var index = 0; index < text.length; index += 1) {
        output += index < locked ? text.charAt(index) : randomGlyph();
      }

      element.textContent = output;

      if (progress >= 1) {
        window.clearInterval(timer);
        element.textContent = text;
        element.classList.remove('is-scrambling');
        running = false;
      }
    }, frameTime);
  }

  element.addEventListener('mouseenter', play);
  element.addEventListener('focus', play);
  element.addEventListener('click', function () {
    if (!running) play();
  });

  play();
})();
