(function () {
  'use strict';

  var button = document.getElementById('languageToggle');
  if (!button) return;

  var textRules = [
    ['.nav-links a[href="#about"]', 'About'],
    ['.nav-links a[href="#project"]', 'Work'],
    ['.nav-links a[href="#interests"]', 'Interests'],
    ['.nav-links a[href="#feedback"]', 'Messages'],
    ['.nav-links a[href="#contact"]', 'Contact'],
    ['.hero .lead', 'A first-year Computer Science and Technology student from Shanxi, now studying in Shenzhen. Starting with her first webpage, she is learning programming and AI, turning curiosity into visible, usable work through hands-on practice.'],
    ['.hero .tag:nth-child(1)', 'Tianjin University'],
    ['.hero .tag:nth-child(2)', 'The Hong Kong Polytechnic University'],
    ['.hero .tag:nth-child(3)', 'Shenzhen Future Technology Institute'],
    ['.hero .tag:nth-child(4)', 'Computer Science & Technology'],
    ['.hero .tag:nth-child(5)', 'First-year Student'],
    ['.hero .tag:nth-child(6)', 'From Taiyuan, Shanxi'],
    ['.hero .tag:nth-child(7)', 'Based in Shenzhen'],
    ['.hero .actions a:nth-child(1)', 'Explore My Interests'],
    ['.hero .actions a:nth-child(2)', 'My First Project: Website Iterations'],
    ['.avatar-status', 'Loading avatar'],
    ['.avatar-hint', 'Scratch to unlock · Choose a real skeletal animation'],
    ['.avatar-controls button:nth-child(1)', 'Afraid'],
    ['.avatar-controls button:nth-child(2)', 'Dance 02'],
    ['.avatar-controls button:nth-child(3)', 'Angry 01'],
    ['.avatar-controls button:nth-child(4)', 'Agree'],
    ['.avatar-controls button:nth-child(5)', 'Heart Pose'],
    ['.avatar-controls button:nth-child(6)', 'Dance 01'],
    ['.avatar-controls button:nth-child(7)', 'Bow'],
    ['.avatar-controls button:nth-child(8)', 'Laugh'],
    ['.avatar-size-control label span', 'Avatar Size'],
    ['#avatarSizeReset', 'Reset'],
    ['.dw-identity small', " AURORA's local AI persona"],
    ['.dw-prompts button:nth-child(1)', 'Meet Aurora'],
    ['.dw-prompts button:nth-child(2)', 'Education'],
    ['.dw-prompts button:nth-child(3)', 'Interests'],
    ['.dw-send span', 'Send'],
    ['.dw-hint', 'Hover over the input to start · Local chat content is never uploaded'],
    ['.dw-avatar > span:last-child', 'Chat with ae果'],
    ['#about .section-heading h2', 'About Me'],
    ['#about .section-heading p', 'A few keywords that genuinely describe who I am today.'],
    ['#about .card:nth-child(1) h3', 'First-year CS Student'],
    ['#about .card:nth-child(1) p', 'I am beginning to study programming, AI-assisted development and Git systematically, while using this website to practise turning ideas into real things.'],
    ['#about .card:nth-child(2) h3', 'Studying in Shenzhen'],
    ['#about .card:nth-child(2) p', 'I study at the Shenzhen Future Technology Institute jointly established by Tianjin University and PolyU. Its project-based learning and industry practice give me a new environment to learn and grow with new friends.'],
    ['#about .card:nth-child(3) h3', 'An ENFJ’s Inner Monologue'],
    ['#about .card:nth-child(3) p', 'Becoming myself is the heroism of my youth.'],
    ['#about .card:nth-child(3) .card-arrow', 'Enter My Inner Monologue →'],
    ['#project .section-heading h2', 'Website Iterations'],
    ['#project .section-heading p', 'Every update, from the first webpage to this complete edition, records a real step in my learning journey.'],
    ['#project .timeline-item:nth-child(1) .timeline-version', 'V1.0 / First Edition'],
    ['#project .timeline-item:nth-child(1) h3', 'Building My First Homepage from Scratch'],
    ['#project .timeline-item:nth-child(1) p', 'My first attempt to organise personal information with native HTML, CSS and JavaScript, establishing the basic structure and visual language.'],
    ['#project .timeline-item:nth-child(1) .version-action', 'View V1.0 →'],
    ['#project .timeline-item:nth-child(2) h3', 'Refining Content and Visual Style'],
    ['#project .timeline-item:nth-child(2) p', 'Added my name, major, interests and contact details, while improving responsive layout and information hierarchy.'],
    ['#project .timeline-item:nth-child(2) .version-action', 'View V1.5 →'],
    ['#project .timeline-item:nth-child(3) h3', 'Making the Site More Complete and More Personal'],
    ['#project .timeline-item:nth-child(3) p', 'Added real school and personal information, interactive avatars, ae果 Q&A and interest pages, with continued refinements to buttons, motion and visual hierarchy.'],
    ['#project .timeline-item:nth-child(3) .version-action', 'View V2.0 →'],
    ['#project .timeline-item:nth-child(4) h3', 'An Identity-first Futuristic Expression'],
    ['#project .timeline-item:nth-child(4) p', 'Rebuilt the opening screen with silver, blue and pink signals, a three-axis motif and immersive lighting while preserving all content and local interactions.'],
    ['#project .timeline-item:nth-child(4) .version-action', 'View V2.5 →'],
    ['#project .timeline-item:nth-child(5) .timeline-version', 'V3.5 / Local Development'],
    ['#project .timeline-item:nth-child(5) h3', 'Interactive 3D Avatar Edition'],
    ['#project .timeline-item:nth-child(5) p', 'Built on the published V3.0 edition with a local 3D avatar, eight skeletal animations, scratch-to-unlock interaction, and mouse or touch rotation controls.'],
    ['#project .timeline-item:nth-child(5) .version-action', 'Current V3.5 · Back to Top ↑'],
    ['#interests .section-heading h2', 'Interest Map'],
    ['#interests .section-heading p', 'Stages and words, stories and images, sports and hands-on creativity—together they form the real me beyond study.'],
    ['#interests .interest-intro', 'Stage, writing, books and films, music, sports and making things by hand are seven ways I experience the world. Different in colour, they form one complete me.'],
    ['#interests .interest-node-1 span', 'Stage Performance'],
    ['#interests .interest-node-2 span', 'Personal Writing'],
    ['#interests .interest-node-3 span', 'Reading'],
    ['#interests .interest-node-4 span', 'Movies'],
    ['#interests .interest-node-5 span', 'Music'],
    ['#interests .interest-node-6 span', 'Sports'],
    ['#interests .interest-node-7 span', 'Hands-on Making'],
    ['#interests .interest-orbit-center small', 'Seven passions · One me'],
    ['#feedback .section-heading h2', 'Messages & Comments'],
    ['#feedback .section-heading p', 'Choose to share a message publicly or leave it privately. Public messages pass through automatic content filtering.'],
    ['.feedback-intro > p', 'Your name is optional and will appear as “Anonymous Visitor” when blank. Only messages you choose to make public will appear below; contact details always remain private.'],
    ['.feedback-types span:nth-child(1)', 'Site Suggestion'],
    ['.feedback-types span:nth-child(2)', 'Content Correction'],
    ['.feedback-types span:nth-child(3)', 'Collaboration'],
    ['.feedback-types span:nth-child(4)', 'Visitor Message'],
    ['.feedback-types span:nth-child(5)', 'Work Review'],
    ['#feedbackCategory option:nth-child(1)', 'Site Suggestion'],
    ['#feedbackCategory option:nth-child(2)', 'Content Correction'],
    ['#feedbackCategory option:nth-child(3)', 'Collaboration'],
    ['#feedbackCategory option:nth-child(4)', 'Visitor Message'],
    ['#feedbackCategory option:nth-child(5)', 'Work Review'],
    ['.feedback-meta span:first-child', 'Do not enter passwords or other sensitive information'],
    ['.feedback-visibility strong', 'Allow this message to be displayed publicly'],
    ['.feedback-visibility small', 'Publicly shows your display name, message type, content and date; title and contact details stay private.'],
    ['#feedbackSubmit', 'Send Message'],
    ['#commentsTitle', 'Visitor Comments'],
    ['#commentsRefresh', 'Refresh Comments'],
    ['#commentsStatus', 'Loading public comments…'],
    ['#contact h2', 'Grow Together'],
    ['#contact p', 'Feel free to contact me through my university email, and to share feedback or ideas about my work.']
  ];

  var htmlRules = [
    ['.feedback-intro h3', 'Leave a thought,<br>and let the conversation be seen.'],
    ['label[for="feedbackName"]', 'Display Name <small>(optional)</small>'],
    ['label[for="feedbackTitle"]', 'Message Title <b>*</b>'],
    ['label[for="feedbackCategory"]', 'Message Type <b>*</b>'],
    ['label[for="feedbackContent"]', 'Message <b>*</b>'],
    ['label[for="feedbackContact"]', 'Contact <small>(optional, visible only to me)</small>']
  ];

  var attributeRules = [
    ['.nav', 'aria-label', 'Main navigation'],
    ['.hero .tags', 'aria-label', 'Personal information'],
    ['#avatarStage', 'aria-label', "Aurora's animated 3D avatar stage"],
    ['#avatarOrbit', 'aria-label', "Aurora's animated 3D avatar"],
    ['.avatar-controls', 'aria-label', 'Avatar actions'],
    ['#dwPanel', 'aria-label', 'ae果 chat panel'],
    ['#dwClose', 'aria-label', 'Close chat panel'],
    ['#dwPrompts', 'aria-label', 'Quick questions'],
    ['#dwInput', 'placeholder', 'Ask ae果 something…'],
    ['#dwInput', 'aria-label', 'Enter a message'],
    ['.dw-send', 'aria-label', 'Send message'],
    ['#dwAvatar', 'aria-label', 'Open AI chat: talk with ae果'],
    ['#feedbackName', 'placeholder', 'Leave blank to appear as Anonymous Visitor'],
    ['#feedbackTitle', 'placeholder', 'Summarise your message in one sentence'],
    ['#feedbackContent', 'placeholder', 'Write your suggestion, idea or topic you would like to discuss…'],
    ['#feedbackContact', 'placeholder', 'Email or another convenient way to contact you']
  ];

  var originalText = new Map();
  var originalHtml = new Map();
  var originalAttributes = new Map();

  function applyContent(rules, originals, property, english) {
    rules.forEach(function (rule) {
      var element = document.querySelector(rule[0]);
      if (!element) return;
      if (!originals.has(element)) originals.set(element, element[property]);
      element[property] = english ? rule[1] : originals.get(element);
    });
  }

  function applyLanguage(language) {
    var english = language === 'en';
    document.documentElement.lang = english ? 'en' : 'zh-CN';
    document.title = english ? 'Aurora · Xinyao Zhao | Personal Homepage V3.5 Local Development' : 'Aurora · 赵昕瑶｜个人主页 V3.5 本地开发版';

    applyContent(textRules, originalText, 'textContent', english);
    applyContent(htmlRules, originalHtml, 'innerHTML', english);

    attributeRules.forEach(function (rule) {
      var element = document.querySelector(rule[0]);
      if (!element) return;
      if (!originalAttributes.has(element)) originalAttributes.set(element, {});
      var values = originalAttributes.get(element);
      if (!(rule[1] in values)) values[rule[1]] = element.getAttribute(rule[1]);
      var value = english ? rule[2] : values[rule[1]];
      if (value === null) element.removeAttribute(rule[1]);
      else element.setAttribute(rule[1], value);
    });

    button.textContent = english ? '中' : 'EN';
    button.setAttribute('aria-label', english ? '切换到中文' : 'Switch to English');
    button.setAttribute('title', english ? '切换到中文' : 'Switch to English');
    button.setAttribute('aria-pressed', english ? 'true' : 'false');
    try { localStorage.setItem('aurora-language', language); } catch (error) {}
  }

  var initialLanguage = 'zh';
  try { initialLanguage = localStorage.getItem('aurora-language') === 'en' ? 'en' : 'zh'; } catch (error) {}
  applyLanguage(initialLanguage);

  button.addEventListener('click', function () {
    applyLanguage(document.documentElement.lang === 'en' ? 'zh' : 'en');
  });
})();
