(() => {
  const root = document.body;
  root.classList.add('ambient-ready');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const compact = window.matchMedia('(max-width: 700px)').matches;
  const themes = {
    'interest-stage': { glyphs: ['★', '✦', '✧', '·'], label: '舞台星芒' },
    'interest-writing': { glyphs: ['“', '”', '，', '。', '…'], label: '文字标点' },
    'interest-reading': { glyphs: ['A', '字', '页', '§', '¶'], label: '书页字符' },
    'interest-movies': { glyphs: ['●', '◇', '▰', '—', '○'], label: '胶片光点' },
    'interest-music': { glyphs: ['♪', '♫', '♬', '♩', '·'], label: '漂浮音符' },
    'interest-sports': { glyphs: ['→', '·', '+', '／', '○'], label: '运动轨迹' },
    'interest-diy': { glyphs: ['×', '+', '◇', '□', '·'], label: '工作台零件' }
  };
  const themeName = Object.keys(themes).find((name) => root.classList.contains(name));
  const theme = themes[themeName];
  let scrollFrame = 0;

  const updateScroll = () => {
    scrollFrame = 0;
    root.style.setProperty('--scroll-y', `${window.scrollY}px`);
  };

  updateScroll();
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }, { passive: true });

  document.querySelectorAll('.bookmark, .gallery-button').forEach((card) => {
    if (reducedMotion || !finePointer) return;
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--tilt-x', `${x * 4}deg`);
      card.style.setProperty('--tilt-y', `${y * -4}deg`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });

  const stations = document.querySelectorAll('.sport-station');
  if (stations.length && 'IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { threshold: 0.28, rootMargin: '-5% 0px -10%' });
    stations.forEach((station) => observer.observe(station));
  } else {
    stations.forEach((station) => station.classList.add('is-visible'));
  }

  if (!theme) return;

  const layer = document.createElement('div');
  layer.className = 'ambient-symbols';
  layer.setAttribute('aria-hidden', 'true');
  layer.dataset.theme = theme.label;
  root.prepend(layer);

  const particles = [];
  const count = reducedMotion ? 10 : compact ? 15 : 28;
  const seeded = (index, salt) => {
    const value = Math.sin((index + 1) * (12.9898 + salt * 31.73)) * 43758.5453;
    return value - Math.floor(value);
  };

  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span');
    const glyph = document.createElement('i');
    const x = 3 + seeded(index, 1) * 94;
    const y = 4 + seeded(index, 2) * 90;
    const depth = 0.55 + seeded(index, 3) * 1.15;
    const size = (index % 7 === 0 ? 34 : 15) + seeded(index, 4) * (index % 7 === 0 ? 24 : 20);
    particle.className = `ambient-symbol${index % 7 === 0 ? ' is-featured' : ''}`;
    particle.style.left = `${x}%`;
    particle.style.top = `${y}%`;
    particle.style.setProperty('--symbol-size', `${size.toFixed(1)}px`);
    particle.style.setProperty('--symbol-opacity', `${(0.25 + depth * 0.24).toFixed(2)}`);
    particle.style.setProperty('--float-time', `${(5.5 + seeded(index, 5) * 6).toFixed(1)}s`);
    particle.style.setProperty('--float-delay', `${(-seeded(index, 6) * 8).toFixed(1)}s`);
    glyph.textContent = theme.glyphs[index % theme.glyphs.length];
    particle.append(glyph);
    layer.append(particle);
    particles.push({ element: particle, x, y, depth, index });
  }

  let pointer = null;
  let renderFrame = 0;
  const renderParticles = () => {
    renderFrame = 0;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pointerX = pointer ? pointer.x / width - 0.5 : 0;
    const pointerY = pointer ? pointer.y / height - 0.5 : 0;

    particles.forEach((particle) => {
      const baseX = width * particle.x / 100;
      const baseY = height * particle.y / 100;
      let repelX = 0;
      let repelY = 0;
      if (pointer) {
        const dx = baseX - pointer.x;
        const dy = baseY - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        const radius = 190;
        if (distance < radius) {
          const force = Math.pow(1 - distance / radius, 1.4) * 105 * particle.depth;
          repelX = dx / distance * force;
          repelY = dy / distance * force;
        }
      }
      const parallaxX = pointerX * -32 * particle.depth;
      const parallaxY = pointerY * -24 * particle.depth;
      const scrollWave = Math.sin(window.scrollY / 360 + particle.index * 0.7) * 18 * particle.depth;
      particle.element.style.transform = `translate3d(${(repelX + parallaxX).toFixed(1)}px, ${(repelY + parallaxY + scrollWave).toFixed(1)}px, 0)`;
    });
  };

  const requestRender = () => {
    if (!renderFrame) renderFrame = requestAnimationFrame(renderParticles);
  };

  if (!reducedMotion) {
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender, { passive: true });
  }

  if (!reducedMotion && finePointer) {
    const cursor = document.createElement('span');
    cursor.className = 'ambient-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    root.append(cursor);

    window.addEventListener('pointermove', (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      root.style.setProperty('--mx', `${event.clientX}px`);
      root.style.setProperty('--my', `${event.clientY}px`);
      root.style.setProperty('--pointer-x', ((event.clientX / innerWidth) - 0.5).toFixed(3));
      root.style.setProperty('--pointer-y', ((event.clientY / innerHeight) - 0.5).toFixed(3));
      root.style.setProperty('--ambient-angle', `${((event.clientX / innerWidth) - 0.5) * 3}deg`);
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      cursor.classList.add('is-visible');
      requestRender();
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => {
      pointer = null;
      cursor.classList.remove('is-visible');
      requestRender();
    });

    window.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      for (let index = 0; index < 8; index += 1) {
        const burst = document.createElement('span');
        const angle = index / 8 * Math.PI * 2;
        const distance = 46 + (index % 3) * 18;
        burst.className = 'ambient-burst';
        burst.textContent = theme.glyphs[index % theme.glyphs.length];
        burst.style.left = `${event.clientX}px`;
        burst.style.top = `${event.clientY}px`;
        burst.style.setProperty('--burst-x', `${Math.cos(angle) * distance}px`);
        burst.style.setProperty('--burst-y', `${Math.sin(angle) * distance}px`);
        root.append(burst);
        burst.addEventListener('animationend', () => burst.remove(), { once: true });
      }
    });
  }

  renderParticles();
})();
