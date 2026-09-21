(function () {
  'use strict';

  var stage = document.getElementById('avatarStage');
  var reveal = document.getElementById('avatarScratch');
  var canvas = document.getElementById('avatarScratchCanvas');
  if (!stage || !reveal || !canvas) return;

  var context = canvas.getContext('2d');
  if (!context) return;

  var controls = Array.prototype.slice.call(stage.querySelectorAll('[data-avatar-action]'));
  var status = document.getElementById('avatarStatus');
  var threshold = 45;
  var scratching = false;
  var complete = false;
  var lastPoint = null;
  var checkTimer = 0;
  var cssWidth = 0;
  var cssHeight = 0;
  var sampleCanvas = document.createElement('canvas');
  var sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });

  function lockControls(locked) {
    controls.forEach(function (button) {
      button.disabled = locked;
      button.setAttribute('aria-disabled', locked ? 'true' : 'false');
      button.title = locked ? '刮开人物遮罩后解锁' : '';
    });
  }

  function drawCover() {
    var bounds = reveal.getBoundingClientRect();
    var deviceRatio = window.devicePixelRatio || 1;
    var ratio = Math.min(deviceRatio, deviceRatio > 1.5 ? 1.25 : 1);
    cssWidth = Math.max(1, Math.round(bounds.width));
    cssHeight = Math.max(1, Math.round(bounds.height));
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalCompositeOperation = 'source-over';

    var gradient = context.createLinearGradient(0, 0, cssWidth, cssHeight);
    gradient.addColorStop(0, '#263b52');
    gradient.addColorStop(.28, '#72e4e0');
    gradient.addColorStop(.56, '#8585dc');
    gradient.addColorStop(.8, '#ef8fc5');
    gradient.addColorStop(1, '#d9f4ff');
    context.fillStyle = gradient;
    context.fillRect(0, 0, cssWidth, cssHeight);

    context.globalAlpha = .24;
    context.strokeStyle = '#ffffff';
    context.lineWidth = 1;
    for (var x = -cssHeight; x < cssWidth; x += 28) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + cssHeight, cssHeight);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  function pointFromEvent(event) {
    var bounds = canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };
  }

  function erase(from, to) {
    context.save();
    context.globalCompositeOperation = 'destination-out';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = Math.max(34, Math.min(cssWidth, cssHeight) * .095);
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.restore();
  }

  function scratchedPercentage() {
    if (!sampleContext) return 0;
    var sampleWidth = Math.max(1, Math.min(180, Math.round(cssWidth / 3)));
    var sampleHeight = Math.max(1, Math.round(sampleWidth * cssHeight / Math.max(1, cssWidth)));
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    sampleContext.clearRect(0, 0, sampleWidth, sampleHeight);
    sampleContext.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
    var pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
    var transparent = 0;
    var sampled = pixels.length / 4;
    for (var index = 3; index < pixels.length; index += 4) {
      if (pixels[index] < 32) transparent += 1;
    }
    return sampled ? transparent / sampled * 100 : 0;
  }

  function unlock() {
    if (complete) return;
    complete = true;
    scratching = false;
    reveal.classList.add('is-complete');
    reveal.setAttribute('aria-hidden', 'true');
    stage.classList.add('scratch-unlocked');
    lockControls(false);
    if (status) {
      status.textContent = document.documentElement.lang === 'en' ? 'Actions unlocked' : '动作已解锁';
      status.classList.add('show');
      window.setTimeout(function () { status.classList.remove('show'); }, 1400);
    }
  }

  function scheduleCheck() {
    window.clearTimeout(checkTimer);
    checkTimer = window.setTimeout(function () {
      if (scratchedPercentage() >= threshold) unlock();
    }, 80);
  }

  canvas.addEventListener('pointerdown', function (event) {
    if (complete) return;
    event.preventDefault();
    event.stopPropagation();
    scratching = true;
    reveal.classList.add('is-scratching');
    canvas.setPointerCapture(event.pointerId);
    lastPoint = pointFromEvent(event);
    erase(lastPoint, lastPoint);
  });

  canvas.addEventListener('pointermove', function (event) {
    if (!scratching || complete) return;
    event.preventDefault();
    event.stopPropagation();
    var nextPoint = pointFromEvent(event);
    erase(lastPoint, nextPoint);
    lastPoint = nextPoint;
    scheduleCheck();
  });

  function finishScratch(event) {
    if (!scratching) return;
    event.preventDefault();
    event.stopPropagation();
    scratching = false;
    lastPoint = null;
    reveal.classList.remove('is-scratching');
    scheduleCheck();
  }

  canvas.addEventListener('pointerup', finishScratch);
  canvas.addEventListener('pointercancel', finishScratch);
  canvas.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
  });
  canvas.addEventListener('dblclick', function (event) {
    event.preventDefault();
    event.stopPropagation();
  });
  canvas.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      unlock();
    }
  });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    if (complete) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(drawCover, 120);
  });

  lockControls(true);
  drawCover();
})();

import('./avatar-3d-rotate.js?v=3.7.0').catch(function (error) {
  console.error('Unable to start the 3D avatar:', error);
  var loading = document.getElementById('avatarLoading');
  var loadingText = loading && loading.querySelector('b');
  var status = document.getElementById('avatarStatus');
  var openedAsFile = window.location.protocol === 'file:';
  var message = openedAsFile ? '请通过本地服务器打开页面，不能直接双击 HTML' : '3D 引擎启动失败，请刷新页面重试';
  if (loadingText) loadingText.textContent = message;
  if (status) {
    status.textContent = message;
    status.classList.add('show');
  }
});
