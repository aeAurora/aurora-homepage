(function () {
  'use strict';

  var markup = '<section class="emotion-intro" id="emotionIntro" aria-label="情绪星河开场" aria-modal="true" role="dialog" hidden>' +
    '<div class="intro-controls"><button class="intro-control intro-sound" id="introSound" type="button" aria-label="开启开场声音" aria-pressed="false">♩</button><button class="intro-control" id="introSkip" type="button">跳过</button></div>' +
    '<div class="intro-stage"><div class="intro-copy"><span class="intro-kicker">AURORA / EMOTION ORBIT</span><p class="intro-prompt">挑一颗，看看它懂不懂你。</p></div>' +
    '<div class="intro-orbit" aria-label="选择一种此刻的情绪"><button class="emotion-ball constellation constellation-joy" data-emotion="joy" type="button" aria-label="大犬座，代表快乐"><svg viewBox="0 0 120 90" aria-hidden="true"><path d="M18 58 38 39 58 48 78 21 89 48 106 61M58 48 49 72M89 48 97 76"/><g><circle cx="18" cy="58" r="3"/><circle cx="38" cy="39" r="2.6"/><circle cx="58" cy="48" r="3.8"/><circle cx="78" cy="21" r="2.4"/><circle cx="89" cy="48" r="4.5"/><circle cx="106" cy="61" r="2.5"/><circle cx="49" cy="72" r="2.4"/><circle cx="97" cy="76" r="2.4"/></g></svg><span class="constellation-name">大犬座</span><span class="emotion-name">快乐</span></button><button class="emotion-ball constellation constellation-gentle" data-emotion="gentle" type="button" aria-label="天琴座，代表温柔"><svg viewBox="0 0 120 90" aria-hidden="true"><path d="M24 20 51 35 77 29 96 48 72 69 43 63 51 35M43 63 24 20"/><g><circle cx="24" cy="20" r="4.5"/><circle cx="51" cy="35" r="2.5"/><circle cx="77" cy="29" r="3"/><circle cx="96" cy="48" r="2.3"/><circle cx="72" cy="69" r="2.7"/><circle cx="43" cy="63" r="2.4"/></g></svg><span class="constellation-name">天琴座</span><span class="emotion-name">温柔</span></button><button class="emotion-ball constellation constellation-passion" data-emotion="passion" type="button" aria-label="凤凰座，代表热爱"><svg viewBox="0 0 120 90" aria-hidden="true"><path d="M15 49 39 39 59 18 65 49 91 31 104 57 76 70 65 49 45 73 39 39"/><g><circle cx="15" cy="49" r="2.5"/><circle cx="39" cy="39" r="3.2"/><circle cx="59" cy="18" r="2.4"/><circle cx="65" cy="49" r="4.3"/><circle cx="91" cy="31" r="2.7"/><circle cx="104" cy="57" r="2.3"/><circle cx="76" cy="70" r="2.5"/><circle cx="45" cy="73" r="2.5"/></g></svg><span class="constellation-name">凤凰座</span><span class="emotion-name">热爱</span></button><button class="emotion-ball constellation constellation-romance" data-emotion="romance" type="button" aria-label="双鱼座，代表浪漫"><svg viewBox="0 0 120 90" aria-hidden="true"><path d="M13 24 28 17 42 29 54 45 68 48 82 34 99 25M13 24 20 40 34 46 54 45M68 48 85 57 101 70M99 25 106 40 101 70"/><g><circle cx="13" cy="24" r="2.7"/><circle cx="28" cy="17" r="2.4"/><circle cx="42" cy="29" r="3"/><circle cx="54" cy="45" r="3.8"/><circle cx="68" cy="48" r="3.2"/><circle cx="82" cy="34" r="2.3"/><circle cx="99" cy="25" r="2.7"/><circle cx="20" cy="40" r="2.2"/><circle cx="34" cy="46" r="2.5"/><circle cx="85" cy="57" r="2.4"/><circle cx="101" cy="70" r="3"/><circle cx="106" cy="40" r="2.1"/></g></svg><span class="constellation-name">双鱼座</span><span class="emotion-name">浪漫</span></button></div>' +
    '<p class="intro-mobile-hint" id="introMobileHint">再碰一下，就接住它。</p><p class="intro-nudge" id="introNudge">要不先认识一下我？</p>' +
    '<div class="intro-response" id="introResponse" aria-live="polite"><strong id="introResponseTitle"></strong><span id="introResponseText"></span></div>' +
    '<svg class="intro-axis" id="introAxis" viewBox="0 0 360 360" aria-label="由星光组成的空间直角坐标系"><defs><linearGradient id="introAxisGradient" x1="66" y1="300" x2="276" y2="55" gradientUnits="userSpaceOnUse"><stop stop-color="#ef9fbc"/><stop offset=".46" stop-color="#fff4d4"/><stop offset="1" stop-color="#ffc76c"/></linearGradient></defs><path d="M180 190 L82 278 M82 278 L94 273 M82 278 L87 266"/><path d="M180 190 L294 190 M294 190 L282 184 M294 190 L282 196"/><path d="M180 190 L180 56 M180 56 L174 69 M180 56 L186 69"/><circle cx="180" cy="190" r="5"/><text x="66" y="294">x</text><text x="306" y="196">y</text><text x="188" y="48">z</text><text x="190" y="211">O</text></svg></div></section>';
  document.body.insertAdjacentHTML('afterbegin', markup);

  var intro = document.getElementById('emotionIntro');
  var logo = document.getElementById('identityLogo');
  if (!intro || !logo) return;
  logo.insertAdjacentHTML('afterend', '<button class="replay-intro" id="replayIntro" type="button" data-label="重遇星光" aria-label="重遇星光">✦</button>');
  var replay = document.getElementById('replayIntro');
  if (!replay) return;

  var response = document.getElementById('introResponse');
  var responseTitle = document.getElementById('introResponseTitle');
  var responseText = document.getElementById('introResponseText');
  var axis = document.getElementById('introAxis');
  var soundButton = document.getElementById('introSound');
  var skipButton = document.getElementById('introSkip');
  var mobileHint = document.getElementById('introMobileHint');
  var nudge = document.getElementById('introNudge');
  var balls = Array.prototype.slice.call(intro.querySelectorAll('.emotion-ball'));
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var timers = [];
  var selected = false;
  var previewedBall = null;
  var audioContext = null;
  var soundEnabled = false;
  var STORAGE_DAY = 'aurora-emotion-intro-day';
  var STORAGE_SOUND = 'aurora-emotion-intro-sound';

  var emotions = {
    joy: {
      title: '逮到一只快乐显眼包！',
      text: '很好，从现在起，你负责笑，我负责把主页打开。',
      accent: '#ffd05d',
      notes: [523.25, 659.25, 783.99]
    },
    gentle: {
      title: '谁把温柔球落这儿了？',
      text: '没人认领的话——那我可要连人一起欢迎了。',
      accent: '#ff9fb5',
      notes: [392, 493.88, 587.33]
    },
    passion: {
      title: '嚯，这颗烫手！',
      text: '检测结果：热爱浓度爆表，建议立即冲进主页释放能量。',
      accent: '#ff875d',
      notes: [440, 587.33, 880]
    },
    romance: {
      title: '好家伙，星河这么大，偏偏抓到一个浪漫同伙。',
      text: '暗号正确，放你进去。',
      accent: '#d59cff',
      notes: [493.88, 622.25, 739.99]
    }
  };

  function todayKey() {
    var now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (error) { return null; }
  }

  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (error) { /* 本地存储不可用时仍可播放 */ }
  }

  function later(callback, delay) {
    var timer = window.setTimeout(callback, reducedMotion ? Math.min(delay, 180) : delay);
    timers.push(timer);
    return timer;
  }

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers = [];
  }

  function ensureAudio() {
    if (!soundEnabled) return null;
    if (!audioContext) {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      audioContext = new Context();
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }

  function playTone(frequency, delay, duration, volume) {
    var context = ensureAudio();
    if (!context) return;
    var oscillator = context.createOscillator();
    var gain = context.createGain();
    var start = context.currentTime + (delay || 0);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.035, start + .025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + (duration || .34));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + (duration || .34) + .04);
  }

  function playEmotionSound(config) {
    config.notes.forEach(function (note, index) { playTone(note, index * .12, .34, .035); });
  }

  function setSound(enabled) {
    soundEnabled = enabled;
    soundButton.setAttribute('aria-pressed', String(enabled));
    soundButton.setAttribute('aria-label', enabled ? '关闭开场声音' : '开启开场声音');
    soundButton.textContent = enabled ? '♫' : '♩';
    storageSet(STORAGE_SOUND, enabled ? 'on' : 'off');
    if (enabled) playTone(659.25, 0, .22, .025);
  }

  function resetIntro() {
    clearTimers();
    selected = false;
    previewedBall = null;
    intro.className = 'emotion-intro';
    response.classList.remove('is-visible');
    axis.classList.remove('is-visible', 'is-drawing');
    mobileHint.classList.remove('is-visible');
    nudge.classList.remove('is-visible');
    balls.forEach(function (ball) {
      ball.classList.remove('is-preview');
      ball.disabled = false;
    });
  }

  function showIntro(force) {
    if (!force && storageGet(STORAGE_DAY) === todayKey()) return;
    resetIntro();
    document.body.classList.add('intro-open');
    logo.classList.add('intro-target');
    intro.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        intro.classList.add('is-visible');
        balls[0].focus({ preventScroll: true });
      });
    });
    later(function () {
      if (selected) return;
      nudge.classList.add('is-visible');
      balls[Math.floor(Math.random() * balls.length)].classList.add('is-preview');
    }, 6000);
  }

  function finishIntro(remember) {
    if (remember !== false) storageSet(STORAGE_DAY, todayKey());
    var introRect = axis.getBoundingClientRect();
    var targetRect = logo.getBoundingClientRect();
    var deltaX = targetRect.left + targetRect.width / 2 - (introRect.left + introRect.width / 2);
    var deltaY = targetRect.top + targetRect.height / 2 - (introRect.top + introRect.height / 2);
    var scale = targetRect.width / Math.max(1, introRect.width);
    intro.classList.add('is-arriving');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        axis.style.transform = 'translate(calc(-50% + ' + deltaX + 'px), calc(-50% + ' + deltaY + 'px)) scale(' + scale + ') rotate(-8deg)';
      });
    });
    later(function () {
      logo.classList.remove('intro-target');
      logo.classList.add('intro-arrived');
      intro.classList.add('is-leaving');
    }, 720);
    later(function () {
      intro.hidden = true;
      intro.className = 'emotion-intro';
      axis.removeAttribute('style');
      document.body.classList.remove('intro-open');
      logo.classList.remove('intro-arrived');
      replay.focus({ preventScroll: true });
    }, 1120);
  }

  function formAxis() {
    intro.classList.add('is-forming');
    axis.classList.add('is-visible');
    requestAnimationFrame(function () { axis.classList.add('is-drawing'); });
    playTone(392, 0, .45, .025);
    playTone(523.25, .34, .45, .025);
    playTone(659.25, .68, .5, .025);
    later(function () { finishIntro(true); }, 1700);
  }

  function chooseEmotion(ball) {
    if (selected) return;
    selected = true;
    var config = emotions[ball.getAttribute('data-emotion')];
    intro.style.setProperty('--intro-accent', config.accent);
    intro.classList.add('is-selected', 'emotion-' + ball.getAttribute('data-emotion'));
    balls.forEach(function (item) { item.disabled = true; });
    nudge.classList.remove('is-visible');
    mobileHint.classList.remove('is-visible');
    responseTitle.textContent = config.title;
    responseText.textContent = config.text;
    playEmotionSound(config);
    later(function () { response.classList.add('is-visible'); }, 260);
    later(formAxis, 3000);
  }

  balls.forEach(function (ball) {
    ball.addEventListener('click', function () {
      if (coarsePointer && previewedBall !== ball) {
        if (previewedBall) previewedBall.classList.remove('is-preview');
        previewedBall = ball;
        ball.classList.add('is-preview');
        mobileHint.classList.add('is-visible');
        return;
      }
      chooseEmotion(ball);
    });
  });

  soundButton.addEventListener('click', function () { setSound(!soundEnabled); });
  skipButton.addEventListener('click', function () {
    if (selected) return;
    selected = true;
    intro.classList.add('is-selected', 'is-forming');
    axis.classList.add('is-visible', 'is-drawing');
    later(function () { finishIntro(true); }, 520);
  });
  replay.addEventListener('click', function () { showIntro(true); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !intro.hidden) {
      event.preventDefault();
      skipButton.click();
    }
  });

  soundEnabled = storageGet(STORAGE_SOUND) === 'on';
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  soundButton.textContent = soundEnabled ? '♫' : '♩';
  if (storageGet(STORAGE_DAY) !== todayKey()) showIntro(false);
})();
