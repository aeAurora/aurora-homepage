(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('js');

  function createChapterDeck(pageClass, label, onActivate) {
    if (!document.body.classList.contains(pageClass)) return null;
    const layout = document.querySelector('.story-layout');
    const prose = layout?.querySelector('.prose');
    const chapters = prose ? [...prose.querySelectorAll(':scope > .chapter')] : [];
    if (!layout || !prose || chapters.length < 2) return null;

    prose.classList.add('chapter-deck');
    layout.classList.add('has-chapter-deck');
    layout.classList.add('has-chapter-deck');
    const consoleEl = document.createElement('section');
    consoleEl.className = 'chapter-console';
    consoleEl.setAttribute('aria-label', label);
    consoleEl.innerHTML = `
      <div class="chapter-console-head">
        <div><span class="chapter-console-kicker">INTERACTIVE INDEX</span><strong class="chapter-current-title"></strong></div>
        <span class="chapter-progress" aria-live="polite"></span>
      </div>
      <div class="chapter-tabs" role="tablist" aria-label="${label}"></div>
      <div class="chapter-actions">
        <button class="chapter-prev" type="button">← 上一章</button>
        <span class="chapter-dots" aria-hidden="true"></span>
        <button class="chapter-next" type="button">下一章 →</button>
      </div>`;
    prose.before(consoleEl);

    const tabs = consoleEl.querySelector('.chapter-tabs');
    const title = consoleEl.querySelector('.chapter-current-title');
    const progress = consoleEl.querySelector('.chapter-progress');
    const dots = consoleEl.querySelector('.chapter-dots');
    const previous = consoleEl.querySelector('.chapter-prev');
    const next = consoleEl.querySelector('.chapter-next');
    let current = 0;

    const buttons = chapters.map((chapter, index) => {
      const number = String(index + 1).padStart(2, '0');
      const heading = chapter.querySelector('h2')?.textContent.trim() || `章节 ${number}`;
      const panelId = `${pageClass}-chapter-${index + 1}`;
      const tabId = `${pageClass}-tab-${index + 1}`;
      chapter.id ||= panelId;
      chapter.setAttribute('role', 'tabpanel');
      chapter.setAttribute('aria-labelledby', tabId);
      const button = document.createElement('button');
      button.type = 'button';
      button.id = tabId;
      button.className = 'chapter-tab';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', chapter.id);
      button.dataset.shortTitle = heading;
      button.innerHTML = `<span>${number}</span><b>${heading}</b>`;
      tabs.append(button);
      const dot = document.createElement('i');
      dots.append(dot);
      return button;
    });

    const activate = (index, moveFocus = false) => {
      current = (index + chapters.length) % chapters.length;
      chapters.forEach((chapter, chapterIndex) => {
        const active = chapterIndex === current;
        chapter.hidden = !active;
        chapter.classList.toggle('is-current', active);
      });
      buttons.forEach((button, buttonIndex) => {
        const active = buttonIndex === current;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      });
      [...dots.children].forEach((dot, dotIndex) => dot.classList.toggle('is-current', dotIndex === current));
      title.textContent = buttons[current].dataset.shortTitle;
      progress.textContent = `${String(current + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
      previous.disabled = current === 0;
      next.disabled = current === chapters.length - 1;
      if (moveFocus) {
        chapters[current].focus({ preventScroll: true });
        chapters[current].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
      onActivate?.(chapters[current]);
    };

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(index, true));
      button.addEventListener('keydown', (event) => {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1);
        activate(target);
        buttons[current].focus();
      });
    });
    previous.addEventListener('click', () => activate(Math.max(0, current - 1), true));
    next.addEventListener('click', () => activate(Math.min(chapters.length - 1, current + 1), true));
    chapters.forEach((chapter) => chapter.tabIndex = -1);
    activate(0);
    return { activate, chapters };
  }

  function typeChapter(chapter) {
    if (reduceMotion || chapter.dataset.typed === 'true') return;
    chapter.dataset.typed = 'true';
    const targets = [...chapter.querySelectorAll('h2, p, blockquote')];
    let targetIndex = 0;
    const typeNext = () => {
      const node = targets[targetIndex++];
      if (!node) return;
      const text = node.textContent;
      node.textContent = '';
      node.classList.add('is-typing');
      let index = 0;
      const step = () => {
        index += /[，。！？；：]/.test(text[index] || '') ? 1 : 3;
        node.textContent = text.slice(0, index);
        if (index < text.length) {
          window.setTimeout(step, /[，。！？；：]/.test(text[index - 1] || '') ? 54 : 11);
        } else {
          node.textContent = text;
          node.classList.remove('is-typing');
          window.setTimeout(typeNext, 70);
        }
      };
      step();
    };
    typeNext();
  }

  function initRoute() {
    const route = document.querySelector('.route');
    if (!route) return;
    const stops = [...route.querySelectorAll('.route-stop')];
    const map = document.createElement('nav');
    map.className = 'route-map';
    map.setAttribute('aria-label', '成长路线快速导航');
    map.innerHTML = '<span>JOURNEY MAP</span><div></div>';
    const mapButtons = stops.map((stop, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<b>${String(index + 1).padStart(2, '0')}</b><span>${stop.dataset.place}</span>`;
      button.addEventListener('click', () => stop.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }));
      map.lastElementChild.append(button);
      return button;
    });
    route.before(map);

    const setActive = (index) => {
      stops.forEach((stop, stopIndex) => stop.classList.toggle('is-active', stopIndex === index));
      mapButtons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;
        button.classList.toggle('is-active', active);
        if (active) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
    };

    let ticking = false;
    const update = () => {
      const rect = route.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight * 0.45);
      const progressValue = Math.max(0, Math.min(1, (window.innerHeight * 0.45 - rect.top) / travel));
      route.style.setProperty('--route-progress', `${progressValue * 100}%`);
      const center = window.innerHeight * 0.48;
      let nearest = 0;
      let distance = Infinity;
      stops.forEach((stop, index) => {
        const stopRect = stop.getBoundingClientRect();
        const currentDistance = Math.abs(stopRect.top + stopRect.height / 2 - center);
        if (currentDistance < distance) { distance = currentDistance; nearest = index; }
      });
      setActive(nearest);
      ticking = false;
    };
    const requestUpdate = () => {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    };
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    const lightbox = document.createElement('dialog');
    lightbox.className = 'photo-dialog';
    lightbox.innerHTML = '<button type="button" aria-label="关闭照片">×</button><img alt=""><p></p>';
    document.body.append(lightbox);
    const close = () => lightbox.close();
    lightbox.querySelector('button').addEventListener('click', close);
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) close(); });
    route.querySelectorAll('figure img').forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', `放大查看：${image.alt}`);
      const open = () => {
        lightbox.querySelector('img').src = image.src;
        lightbox.querySelector('img').alt = image.alt;
        lightbox.querySelector('p').textContent = image.alt;
        lightbox.showModal();
      };
      image.addEventListener('click', open);
      image.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });

    const notebook = document.querySelector('.campus-page .story-layout');
    if (notebook) {
      const reveal = document.createElement('section');
      reveal.className = 'notebook-gate wrap';
      reveal.innerHTML = '<div><span>OPTIONAL LONG READ</span><h2>路线之外，还有一份完整成长手记。</h2><p>照片已经讲完主线。如果你想继续读，再展开四个章节。</p></div><button type="button" aria-expanded="false">展开完整手记 <b>＋</b></button>';
      notebook.before(reveal);
      notebook.hidden = true;
      reveal.querySelector('button').addEventListener('click', (event) => {
        const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
        event.currentTarget.setAttribute('aria-expanded', String(!expanded));
        event.currentTarget.firstChild.textContent = expanded ? '展开完整手记 ' : '收起完整手记 ';
        event.currentTarget.querySelector('b').textContent = expanded ? '＋' : '−';
        notebook.hidden = expanded;
        if (!expanded) notebook.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }
  }

  function initPortrait(deck) {
    const thoughts = [...document.querySelectorAll('.portrait-thoughts button')];
    if (!thoughts.length || !deck) return;
    const select = (button, moveFocus = true) => {
      thoughts.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-selected', active);
        item.setAttribute('aria-pressed', String(active));
      });
      deck.activate(Number(button.dataset.chapter), moveFocus);
    };
    thoughts.forEach((button) => button.addEventListener('click', () => select(button)));
    thoughts.forEach((button) => button.setAttribute('aria-pressed', 'false'));
    thoughts[0].classList.add('is-selected');
    thoughts[0].setAttribute('aria-pressed', 'true');
  }

  const studyDeck = createChapterDeck('study-page', '学习章节', typeChapter);
  const innerDeck = createChapterDeck('inner-page', '内心档案');
  initRoute();
  initPortrait(innerDeck);
})();
