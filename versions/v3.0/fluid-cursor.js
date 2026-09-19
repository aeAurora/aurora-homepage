/*!
 * FluidCursor — 纯 2D Canvas 彩色发光鼠标拖尾（零依赖，纯 HTML/CSS/JS 可用）
 *
 * 用法：
 *   <script src="fluid-cursor.js"></script>
 *   <script>FluidCursor.init();</script>
 *
 * API：
 *   FluidCursor.init(options) -> handle（浏览器不支持时返回 null，页面照常工作）
 *   handle.pause()            暂停动画
 *   handle.resume()           恢复动画
 *   handle.destroy()          移除画布、注销事件
 *
 * options（全部可选）：
 *   trailWidth     拖尾粗细，默认 22
 *   glow           发光半径，默认 28
 *   dissipation    淡出速度，默认 0.08（越小拖尾越长）
 *   hueSpeed       颜色循环速度，默认 1.2（度/帧）
 *   clickBurst     点击时炸出的粒子数，默认 24
 *   zIndex         画布层级，默认 -1
 *   respectMotion  遵守 prefers-reduced-motion，默认 true
 *   forceEnable    强制开启（无视触屏/减少动态效果判断），默认 false
 */
(function (global) {
  "use strict";

  if (global.FluidCursor) return;

  var defaultConfig = {
    TRAIL_WIDTH: 22,
    GLOW: 28,
    DISSIPATION: 0.08,
    HUE_SPEED: 1.2,
    CLICK_BURST: 24,
    Z_INDEX: -1,
    RESPECT_MOTION: true,
    FORCE_ENABLE: false
  };

  function init(options) {
    options = options || {};
    var config = {};
    for (var k in defaultConfig) config[k] = defaultConfig[k];
    for (var k2 in options) {
      if (options.hasOwnProperty(k2) && k2 in defaultConfig) config[k2] = options[k2];
    }

    function noop() {}
    function disabled(reason) {
      return { mode: "disabled", reason: reason, pause: noop, resume: noop, destroy: noop };
    }

    // 自动降级：减少动态效果 或 无鼠标的纯触屏设备
    if (!config.FORCE_ENABLE) {
      if (config.RESPECT_MOTION && global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return disabled("prefers-reduced-motion");
      if (global.matchMedia && global.matchMedia("(hover: none) and (pointer: coarse)").matches)
        return disabled("touch");
    }

    function mount() {
      var canvas = document.createElement("canvas");
      canvas.id = "fluid-cursor-canvas";
      canvas.style.cssText =
        "position:fixed;left:0;top:0;width:100vw;height:100vh;" +
        "pointer-events:none;z-index:" + config.Z_INDEX + ";";
      document.body.appendChild(canvas);

      var ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) {
        canvas.parentNode && canvas.parentNode.removeChild(canvas);
        return null;
      }

      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var width, height;
      var points = [];     // 当前鼠标轨迹点
      var particles = [];  // 点击/burst 粒子
      var hue = Math.random() * 360;
      var lastX = 0, lastY = 0, hasLast = false;
      var rafId = null, paused = false;

      function resize() {
        width = Math.floor(global.innerWidth * dpr);
        height = Math.floor(global.innerHeight * dpr);
        canvas.width = width;
        canvas.height = height;
      }

      function addPoint(x, y) {
        points.push({ x: x, y: y, hue: hue, age: 1.0 });
        if (points.length > 80) points.shift();
      }

      function spawnBurst(x, y) {
        for (var i = 0; i < config.CLICK_BURST; i++) {
          var angle = (i / config.CLICK_BURST) * Math.PI * 2;
          var speed = (Math.random() * 5 + 3) * dpr;
          particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            hue: (hue + i * 12) % 360,
            size: (Math.random() * 5 + 3) * dpr
          });
        }
      }

      function onPointerMove(e) {
        var cx = e.clientX * dpr;
        var cy = e.clientY * dpr;
        if (!hasLast) {
          lastX = cx; lastY = cy; hasLast = true;
          addPoint(cx, cy);
          spawnBurst(cx, cy); // 首次出现也炸一下，确保能看到
          return;
        }
        var dx = cx - lastX, dy = cy - lastY;
        var dist = Math.hypot(dx, dy);
        if (dist < 2) return; // 避免同一点重复
        var steps = Math.max(1, Math.floor(dist / 6));
        for (var i = 1; i <= steps; i++) {
          var t = i / steps;
          hue = (hue + config.HUE_SPEED) % 360;
          addPoint(lastX + dx * t, lastY + dy * t);
        }
        lastX = cx; lastY = cy;
      }

      function onPointerDown(e) {
        var cx = e.clientX * dpr, cy = e.clientY * dpr;
        spawnBurst(cx, cy);
        lastX = cx; lastY = cy; hasLast = true;
      }

      function drawTrail() {
        if (points.length < 2) return;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = "lighter";

        for (var i = 1; i < points.length; i++) {
          var p0 = points[i - 1];
          var p1 = points[i];
          p0.age -= 0.015;
          if (p0.age <= 0) continue;

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);

          var a = p0.age * 0.85;
          var w = config.TRAIL_WIDTH * dpr * p0.age;
          ctx.lineWidth = w;
          ctx.strokeStyle = "hsla(" + p0.hue + ", 90%, 60%, " + a + ")";
          ctx.shadowBlur = config.GLOW * dpr * p0.age;
          ctx.shadowColor = "hsla(" + p0.hue + ", 90%, 60%, " + a + ")";
          ctx.stroke();
        }

        // 移除过老的点
        for (var j = points.length - 1; j >= 0; j--) {
          if (points[j].age <= 0) points.splice(j, 1);
        }
      }

      function drawParticles() {
        ctx.globalCompositeOperation = "lighter";
        for (var i = particles.length - 1; i >= 0; i--) {
          var p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.015;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          var r = p.size * p.life;
          var a = p.life * 0.9;
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
          g.addColorStop(0, "hsla(" + p.hue + ", 90%, 65%, " + a + ")");
          g.addColorStop(1, "hsla(" + p.hue + ", 90%, 65%, 0)");
          ctx.fillStyle = g;
          ctx.shadowBlur = config.GLOW * dpr * p.life;
          ctx.shadowColor = "hsla(" + p.hue + ", 90%, 65%, " + a + ")";
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function frame() {
        rafId = global.requestAnimationFrame(frame);
        if (paused) return;

        // 以 destination-out 方式淡出旧帧，保持画布透明、不盖住页面背景
        ctx.globalCompositeOperation = "destination-out";
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(0, 0, 0, " + config.DISSIPATION + ")";
        ctx.fillRect(0, 0, width, height);

        drawTrail();
        drawParticles();
      }

      function onVisibility() {
        paused = document.hidden;
      }

      resize();
      global.addEventListener("pointermove", onPointerMove, { passive: true });
      global.addEventListener("pointerdown", onPointerDown, { passive: true });
      global.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", onVisibility);
      frame();

      return {
        mode: "2d",
        pause: function () { paused = true; },
        resume: function () { paused = false; },
        destroy: function () {
          if (rafId != null) global.cancelAnimationFrame(rafId);
          global.removeEventListener("pointermove", onPointerMove);
          global.removeEventListener("pointerdown", onPointerDown);
          global.removeEventListener("resize", resize);
          document.removeEventListener("visibilitychange", onVisibility);
          canvas.parentNode && canvas.parentNode.removeChild(canvas);
        }
      };
    }

    if (document.body) {
      var h = mount();
      return h || disabled("canvas");
    }
    document.addEventListener("DOMContentLoaded", function () { mount(); });
    return { mode: "pending", reason: "waiting-dom", pause: noop, resume: noop, destroy: noop };
  }

  global.FluidCursor = { init: init };
})(window);
