(function () {
  var logo = document.getElementById('identityLogo');
  if (!logo) return;

  var axes = [
    { path: document.getElementById('coordAxisX'), label: document.getElementById('coordLabelX'), vector: [1, 0, 0] },
    { path: document.getElementById('coordAxisY'), label: document.getElementById('coordLabelY'), vector: [0, 1, 0] },
    { path: document.getElementById('coordAxisZ'), label: document.getElementById('coordLabelZ'), vector: [0, 0, 1] }
  ];
  var grid = logo.querySelector('.sphere-grid');
  if (axes.some(function (axis) { return !axis.path || !axis.label; })) return;

  var CENTER = 110;
  var LENGTH = 72;
  var DEFAULT_X = 25;
  var DEFAULT_Y = -40;
  var rotationX = DEFAULT_X;
  var rotationY = DEFAULT_Y;
  var velocityX = 0;
  var velocityY = 0;
  var lastX = 0;
  var lastY = 0;
  var lastTime = 0;
  var dragging = false;
  var inertiaFrame = 0;
  var resetFrame = 0;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function radians(degrees) { return degrees * Math.PI / 180; }

  function rotate(vector) {
    var x = vector[0];
    var y = vector[1];
    var z = vector[2];
    var cy = Math.cos(radians(rotationY));
    var sy = Math.sin(radians(rotationY));
    var cx = Math.cos(radians(rotationX));
    var sx = Math.sin(radians(rotationX));
    var x1 = x * cy + z * sy;
    var z1 = -x * sy + z * cy;
    var y1 = y * cx - z1 * sx;
    var z2 = y * sx + z1 * cx;
    return [x1, y1, z2];
  }

  function axisPath(endX, endY, depth) {
    var dx = endX - CENTER;
    var dy = endY - CENTER;
    var length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    var ux = dx / length;
    var uy = dy / length;
    var arrow = 8 + Math.max(0, depth) * 2;
    var wing = 5;
    var baseX = endX - ux * arrow;
    var baseY = endY - uy * arrow;
    var leftX = baseX - uy * wing;
    var leftY = baseY + ux * wing;
    var rightX = baseX + uy * wing;
    var rightY = baseY - ux * wing;
    return 'M' + CENTER + ' ' + CENTER + ' L' + endX.toFixed(2) + ' ' + endY.toFixed(2) +
      ' M' + leftX.toFixed(2) + ' ' + leftY.toFixed(2) + ' L' + endX.toFixed(2) + ' ' + endY.toFixed(2) +
      ' L' + rightX.toFixed(2) + ' ' + rightY.toFixed(2);
  }

  function render() {
    axes.forEach(function (axis) {
      var point = rotate(axis.vector);
      var perspective = 1 + point[2] * 0.17;
      var endX = CENTER + point[0] * LENGTH * perspective;
      var endY = CENTER - point[1] * LENGTH * perspective;
      var opacity = 0.38 + (point[2] + 1) * 0.31;
      axis.path.setAttribute('d', axisPath(endX, endY, point[2]));
      axis.path.style.opacity = opacity.toFixed(2);
      axis.path.style.strokeWidth = (2.05 + (point[2] + 1) * 0.42).toFixed(2);
      axis.label.setAttribute('x', (CENTER + point[0] * 85 * perspective - 4).toFixed(2));
      axis.label.setAttribute('y', (CENTER - point[1] * 85 * perspective + 5).toFixed(2));
      axis.label.style.opacity = Math.max(.42, opacity).toFixed(2);
    });
    if (grid) {
      var squash = Math.max(.25, Math.abs(Math.cos(radians(rotationY))));
      grid.style.transform = 'rotate(' + (rotationY * .34).toFixed(2) + 'deg) scaleX(' + (.72 + squash * .28).toFixed(3) + ')';
    }
  }

  function stopMotion() {
    cancelAnimationFrame(inertiaFrame);
    cancelAnimationFrame(resetFrame);
    inertiaFrame = 0;
    resetFrame = 0;
  }

  function startInertia() {
    if (reducedMotion || (Math.abs(velocityX) < .02 && Math.abs(velocityY) < .02)) return;
    function coast() {
      rotationX += velocityX;
      rotationY += velocityY;
      velocityX *= .94;
      velocityY *= .94;
      render();
      if (Math.abs(velocityX) + Math.abs(velocityY) > .025) inertiaFrame = requestAnimationFrame(coast);
    }
    inertiaFrame = requestAnimationFrame(coast);
  }

  function reset() {
    stopMotion();
    if (reducedMotion) {
      rotationX = DEFAULT_X;
      rotationY = DEFAULT_Y;
      render();
      return;
    }
    var startRotationX = rotationX;
    var startRotationY = rotationY;
    var started = performance.now();
    function settle(now) {
      var progress = Math.min(1, (now - started) / 480);
      var eased = 1 - Math.pow(1 - progress, 3);
      rotationX = startRotationX + (DEFAULT_X - startRotationX) * eased;
      rotationY = startRotationY + (DEFAULT_Y - startRotationY) * eased;
      render();
      if (progress < 1) resetFrame = requestAnimationFrame(settle);
    }
    resetFrame = requestAnimationFrame(settle);
  }

  logo.addEventListener('pointerdown', function (event) {
    if (event.button !== 0) return;
    stopMotion();
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    lastTime = performance.now();
    velocityX = 0;
    velocityY = 0;
    logo.setPointerCapture(event.pointerId);
    logo.classList.add('is-dragging');
    event.preventDefault();
    event.stopPropagation();
  });

  logo.addEventListener('pointermove', function (event) {
    if (!dragging) return;
    var now = performance.now();
    var elapsed = Math.max(8, now - lastTime);
    var deltaX = event.clientX - lastX;
    var deltaY = event.clientY - lastY;
    rotationY += deltaX * .72;
    rotationX -= deltaY * .72;
    velocityY = deltaX * .72 * (16 / elapsed);
    velocityX = -deltaY * .72 * (16 / elapsed);
    lastX = event.clientX;
    lastY = event.clientY;
    lastTime = now;
    render();
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    if (logo.hasPointerCapture(event.pointerId)) logo.releasePointerCapture(event.pointerId);
    logo.classList.remove('is-dragging');
    startInertia();
  }

  logo.addEventListener('pointerup', endDrag);
  logo.addEventListener('pointercancel', endDrag);
  logo.addEventListener('dblclick', function (event) {
    event.preventDefault();
    event.stopPropagation();
    reset();
  });

  logo.addEventListener('keydown', function (event) {
    var changed = true;
    stopMotion();
    if (event.key === 'ArrowLeft') rotationY -= 10;
    else if (event.key === 'ArrowRight') rotationY += 10;
    else if (event.key === 'ArrowUp') rotationX += 10;
    else if (event.key === 'ArrowDown') rotationX -= 10;
    else if (event.key === 'Home' || event.key === 'Enter' || event.key === ' ') reset();
    else changed = false;
    if (changed) {
      event.preventDefault();
      render();
    }
  });

  render();
})();
