(function () {
  var form = document.getElementById('feedbackForm');
  if (!form) return;

  if (!document.querySelector('link[data-feedback-split-style]')) {
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'feedback-split.css';
    stylesheet.setAttribute('data-feedback-split-style', '');
    document.head.appendChild(stylesheet);
  }

  var submitButton = document.getElementById('feedbackSubmit');
  var message = document.getElementById('feedbackMessage');
  var contentInput = document.getElementById('feedbackContent');
  var contentCount = document.getElementById('feedbackCount');
  var commentsList = document.getElementById('commentsList');
  var commentsStatus = document.getElementById('commentsStatus');
  var refreshButton = document.getElementById('commentsRefresh');
  var client = null;

  function showMessage(text, type) {
    message.textContent = text;
    message.className = 'feedback-message ' + (type || '');
  }

  function getClient() {
    var config = window.SUPABASE_CONFIG || {};
    if (!config.url || !config.publishableKey || config.publishableKey.indexOf('请粘贴') !== -1) {
      throw new Error('留言服务尚未配置，请稍后再试。');
    }
    if (!window.supabase) {
      throw new Error('留言服务加载失败，请检查网络后重试。');
    }
    if (!client) client = window.supabase.createClient(config.url, config.publishableKey);
    return client;
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(value));
    } catch (_) {
      return '';
    }
  }

  function renderComments(comments) {
    commentsList.replaceChildren();
    if (!comments.length) {
      var empty = document.createElement('div');
      empty.className = 'comments-empty';
      empty.textContent = '还没有公开评论，欢迎留下第一条。';
      commentsList.appendChild(empty);
      return;
    }

    comments.forEach(function (comment) {
      var article = document.createElement('article');
      article.className = 'comment-card';

      var head = document.createElement('div');
      head.className = 'comment-head';

      var identity = document.createElement('div');
      var name = document.createElement('strong');
      name.textContent = comment.display_name || '匿名访客';
      var category = document.createElement('span');
      category.className = 'comment-category';
      category.textContent = comment.category;
      identity.append(name, category);

      var date = document.createElement('time');
      date.dateTime = comment.created_at;
      date.textContent = formatDate(comment.created_at);
      head.append(identity, date);

      var body = document.createElement('p');
      body.textContent = comment.content;
      article.append(head, body);
      commentsList.appendChild(article);
    });
  }

  async function loadComments() {
    if (!commentsList || !commentsStatus) return;
    commentsStatus.textContent = '正在加载公开评论……';
    if (refreshButton) refreshButton.disabled = true;

    try {
      var result = await getClient()
        .from('public_comments')
        .select('id, display_name, category, content, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (result.error) throw result.error;
      renderComments(result.data || []);
      commentsStatus.textContent = result.data && result.data.length
        ? '共显示最近 ' + result.data.length + ' 条公开评论'
        : '';
    } catch (error) {
      console.error('公开评论加载失败：', error);
      commentsStatus.textContent = '评论区尚未启用或暂时无法加载。';
    } finally {
      if (refreshButton) refreshButton.disabled = false;
    }
  }

  contentInput.addEventListener('input', function () {
    contentCount.textContent = contentInput.value.length + ' / 1000';
  });

  if (refreshButton) refreshButton.addEventListener('click', loadComments);

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    submitButton.textContent = '正在发送……';
    showMessage('', '');

    try {
      var formData = new FormData(form);
      var wantsPublic = formData.get('wants_public') === 'on';
      var result = await getClient().rpc('submit_feedback', {
        p_title: String(formData.get('title') || '').trim(),
        p_category: String(formData.get('category') || ''),
        p_content: String(formData.get('content') || '').trim(),
        p_contact: String(formData.get('contact') || '').trim() || null,
        p_display_name: String(formData.get('display_name') || '').trim() || null,
        p_wants_public: wantsPublic
      });
      if (result.error) throw result.error;

      form.reset();
      contentCount.textContent = '0 / 1000';
      showMessage(
        wantsPublic
          ? '发送成功，这条留言已显示在公开评论区。'
          : '发送成功，这条留言仅我可见。',
        'success'
      );
      if (wantsPublic) await loadComments();
    } catch (error) {
      console.error('留言发送失败：', error);
      var detail = error && error.message ? error.message : '请稍后重试';
      showMessage('发送失败：' + detail, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = '发送留言';
    }
  });

  loadComments();
})();
