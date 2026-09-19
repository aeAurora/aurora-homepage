(function () {
  var form = document.getElementById('feedbackForm');
  if (!form) return;

  if (!document.querySelector('link[data-feedback-split-style]')) {
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'feedback-split.css?v=3.5.8';
    stylesheet.setAttribute('data-feedback-split-style', '');
    document.head.appendChild(stylesheet);
  }

  var submitButton = document.getElementById('feedbackSubmit');
  var message = document.getElementById('feedbackMessage');
  var contentInput = document.getElementById('feedbackContent');
  var contentCount = document.getElementById('feedbackCount');
  var imageInput = document.getElementById('feedbackImage');
  var imagePreview = document.getElementById('feedbackImagePreview');
  var imagePreviewImg = document.getElementById('feedbackImagePreviewImg');
  var imageRemove = document.getElementById('feedbackImageRemove');
  var commentsList = document.getElementById('commentsList');
  var commentsStatus = document.getElementById('commentsStatus');
  var refreshButton = document.getElementById('commentsRefresh');
  var selectedImage = null;
  var previewUrl = '';
  var client = null;
  var allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  var maxImageBytes = 10 * 1024 * 1024;

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

  function clearImage() {
    selectedImage = null;
    imageInput.value = '';
    imagePreview.hidden = true;
    imagePreviewImg.removeAttribute('src');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
  }

  function setImage(file) {
    if (!file) {
      clearImage();
      return;
    }
    if (allowedImageTypes.indexOf(file.type) === -1) {
      clearImage();
      showMessage('图片格式仅支持 JPG、PNG、WebP 或 GIF。', 'error');
      return;
    }
    if (file.size > maxImageBytes) {
      clearImage();
      showMessage('图片不能超过 10 MB。', 'error');
      return;
    }
    selectedImage = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    imagePreviewImg.src = previewUrl;
    imagePreview.hidden = false;
    showMessage('', '');
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('无法读取所选图片。'));
      };
      image.src = url;
    });
  }

  async function prepareImage(file) {
    if (!file || file.type === 'image/gif') return file;
    var image = await loadImage(file);
    var maxEdge = 1800;
    var scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    var context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    var blob = await new Promise(function (resolve) {
      canvas.toBlob(resolve, 'image/webp', 0.84);
    });
    if (!blob) throw new Error('图片处理失败，请换一张图片重试。');
    return new File([blob], 'feedback-image.webp', { type: 'image/webp' });
  }

  function renderComments(comments, replies) {
    commentsList.replaceChildren();
    replies = replies || [];
    var repliesByComment = {};
    replies.forEach(function (reply) {
      repliesByComment[reply.comment_source + ':' + reply.comment_id] = reply;
    });
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
      identity.appendChild(name);

      if (comment.category) {
        var category = document.createElement('span');
        category.className = 'comment-category';
        category.textContent = comment.category;
        identity.appendChild(category);
      }
      if (comment.device_type) {
        var device = document.createElement('span');
        device.className = 'comment-device';
        device.textContent = comment.device_type;
        identity.appendChild(device);
      }

      var date = document.createElement('time');
      date.dateTime = comment.created_at;
      date.textContent = formatDate(comment.created_at);
      head.append(identity, date);

      var body = document.createElement('p');
      body.textContent = comment.content;
      article.append(head, body);

      if (comment.image_path) {
        var publicImage = getClient().storage.from('feedback-images').getPublicUrl(comment.image_path).data.publicUrl;
        var imageLink = document.createElement('a');
        imageLink.className = 'comment-image-link';
        imageLink.href = publicImage;
        imageLink.target = '_blank';
        imageLink.rel = 'noopener noreferrer';
        var image = document.createElement('img');
        image.className = 'comment-image';
        image.src = publicImage;
        image.alt = (comment.display_name || '匿名访客') + '添加的留言图片';
        image.loading = 'lazy';
        imageLink.appendChild(image);
        article.appendChild(imageLink);
      }

      var reply = repliesByComment[comment.source + ':' + comment.id];
      if (reply) {
        var replyBox = document.createElement('div');
        replyBox.className = 'comment-owner-reply';
        var replyHead = document.createElement('div');
        replyHead.className = 'comment-owner-reply-head';
        var replyLabel = document.createElement('strong');
        replyLabel.textContent = 'Aurora 的回复';
        var replyDate = document.createElement('time');
        replyDate.dateTime = reply.updated_at || reply.created_at;
        replyDate.textContent = formatDate(reply.updated_at || reply.created_at);
        replyHead.append(replyLabel, replyDate);
        var replyBody = document.createElement('p');
        replyBody.textContent = reply.reply_content;
        replyBox.append(replyHead, replyBody);
        article.appendChild(replyBox);
      }
      commentsList.appendChild(article);
    });
  }

  async function loadComments() {
    if (!commentsList || !commentsStatus) return;
    commentsStatus.textContent = '正在加载公开评论……';
    if (refreshButton) refreshButton.disabled = true;

    try {
      var supabase = getClient();
      var oldRequest = supabase
        .from('public_comments')
        .select('id, display_name, category, content, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      var newRequest = supabase
        .from('public_comments_v2')
        .select('id, display_name, category, device_type, content, image_path, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      var results = await Promise.all([oldRequest, newRequest, supabase.from('public_feedback_replies').select('comment_source, comment_id, reply_content, created_at, updated_at')]);
      var oldResult = results[0];
      var newResult = results[1];
      var repliesResult = results[2];
      if (oldResult.error && newResult.error) throw newResult.error;
      var comments = (!oldResult.error ? (oldResult.data || []) : []).map(function (item) {
        item.source = 'legacy';
        return item;
      });
      if (!newResult.error) {
        comments = comments.concat((newResult.data || []).map(function (item) {
          item.source = 'v2';
          return item;
        }));
      }
      comments.sort(function (a, b) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      comments = comments.slice(0, 50);
      renderComments(comments, repliesResult && !repliesResult.error ? (repliesResult.data || []) : []);
      commentsStatus.textContent = comments.length
        ? '共显示最近 ' + comments.length + ' 条公开评论'
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
  imageInput.addEventListener('change', function () {
    setImage(imageInput.files && imageInput.files[0]);
  });
  imageRemove.addEventListener('click', clearImage);
  if (refreshButton) refreshButton.addEventListener('click', loadComments);

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    submitButton.textContent = selectedImage ? '正在处理图片……' : '正在发送……';
    showMessage('', '');

    try {
      var formData = new FormData(form);
      var wantsPublic = formData.get('wants_public') === 'on';
      if (selectedImage && !wantsPublic) {
        throw new Error('添加图片时请勾选“允许公开展示这条留言”。');
      }
      var supabase = getClient();
      var result = await supabase.rpc('submit_feedback_v2', {
        p_category: String(formData.get('category') || ''),
        p_content: String(formData.get('content') || '').trim(),
        p_contact: String(formData.get('contact') || '').trim() || null,
        p_display_name: String(formData.get('display_name') || '').trim() || null,
        p_wants_public: wantsPublic,
        p_device_type: String(formData.get('device_type') || '')
      });
      if (result.error) {
        if (result.error.code === 'PGRST202' || /submit_feedback_v2/.test(result.error.message || '')) {
          throw new Error('评论区数据库尚未升级，请先执行 docs/supabase-feedback-v2.sql。');
        }
        throw result.error;
      }

      var submission = Array.isArray(result.data) ? result.data[0] : result.data;
      var imageWarning = '';
      if (selectedImage && submission && submission.feedback_id && submission.upload_token) {
        submitButton.textContent = '正在上传图片……';
        try {
          var uploadFile = await prepareImage(selectedImage);
          var extension = uploadFile.type === 'image/gif' ? 'gif' : 'webp';
          var imagePath = submission.feedback_id + '/' + submission.upload_token + '.' + extension;
          var uploadResult = await supabase.storage
            .from('feedback-images')
            .upload(imagePath, uploadFile, { cacheControl: '3600', upsert: false, contentType: uploadFile.type });
          if (uploadResult.error) throw uploadResult.error;
          var attachResult = await supabase.rpc('attach_feedback_image_v2', {
            p_feedback_id: submission.feedback_id,
            p_upload_token: submission.upload_token,
            p_image_path: imagePath
          });
          if (attachResult.error) throw attachResult.error;
        } catch (imageError) {
          console.error('留言图片上传失败：', imageError);
          imageWarning = '，但图片上传失败；文字留言已经保存';
        }
      }

      form.reset();
      clearImage();
      contentCount.textContent = '0 / 1000';
      showMessage(
        wantsPublic
          ? '发送成功，这条留言已显示在公开评论区' + imageWarning + '。'
          : '发送成功，这条留言仅我可见' + imageWarning + '。',
        imageWarning ? 'error' : 'success'
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
