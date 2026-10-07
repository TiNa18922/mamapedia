/**
 * MamaPedia Community — 家长互助问答.
 * Default path: mamapedia-chat `/community` (MARKT KV, prefix community:).
 * If that API is down, show sample questions and an offline note. Nothing is saved locally.
 */
(function () {
  var Api = (typeof CommunityApi !== 'undefined' && CommunityApi) ? CommunityApi : {
    API_BASE: 'https://mamapedia-chat.golightly2004.workers.dev',
    AUTHOR_KEY: 'mamapedia_community_author',
    questionsUrl: function (q) {
      q = q || {};
      var params = [];
      if (q.category && q.category !== 'all') params.push('category=' + encodeURIComponent(q.category));
      if (q.q) params.push('q=' + encodeURIComponent(q.q));
      if (q.sort) params.push('sort=' + encodeURIComponent(q.sort));
      if (q.mine) params.push('mine=1');
      return '/community/questions' + (params.length ? '?' + params.join('&') : '');
    },
    mapStatus: function (row) { return (row && row.status) || 'published'; },
    needsDisclaimer: function (row) {
      return !!(row && (row.category === 'medical' || row.category === 'legal' || row.needsDisclaimer || row.disclaimer));
    },
    newAuthorId: function () { return ('web_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).slice(0, 80); },
    isPublicStatus: function (status) { return status === 'published' || status === 'flagged'; }
  };

  var COMMUNITY_API_BASE = Api.API_BASE;
  var activeFilter = 'all';
  var comQuery = '';
  var comDetailId = null;
  var comOffline = false;
  var comQuestions = [];
  var comPending = [];
  var comSearchTimer = null;
  var comLoadToken = 0;

  var FALLBACK_QUESTIONS = [
    {
      id: 'seed-kita', category: 'kita_school', title: '杜塞尔多夫 Kita 申请，要不要一出生就登记？',
      body: '宝宝下个月出生，住 Bilk。听说 Kita-Navigator 要尽早填。有人是出生后马上申请的吗？当时准备了哪些材料？',
      displayName: '小王妈妈', anonymous: false, status: 'published', createdAt: '2026-10-05T08:00:00.000Z', answerCount: 2, topLikes: 8,
      answers: [
        { id: 'seed-kita-a1', body: '我们出生后一周就在 Kita-Navigator 登记了，同时填了好几所。材料主要是出生证明、住址证明和父母的证件。名额仍要等，但越早排队越安心。', displayName: 'Bilk妈妈', anonymous: false, likeCount: 8, disclaimer: false, createdAt: '2026-10-05T09:00:00.000Z' },
        { id: 'seed-kita-a2', body: '可以先用预产期占位，出生后再补文件。我当时同时申请了 6 所，最后拿到 2 个位置。', displayName: '匿名家长', anonymous: true, likeCount: 5, disclaimer: false, createdAt: '2026-10-05T09:20:00.000Z' }
      ]
    },
    {
      id: 'seed-fever', category: 'medical', title: '孩子夜里发烧，大家一般去哪家儿科急诊？',
      body: '两岁，住 Oberkassel，夜里突然发烧。想问问大家是去大学医院，还是就近的儿科急诊，排队大概多久？只想听过来人的经历。',
      displayName: '花园妈妈', anonymous: false, status: 'published', createdAt: '2026-10-04T18:00:00.000Z', needsDisclaimer: true, answerCount: 1, topLikes: 4,
      answers: [
        { id: 'seed-fever-a1', body: '我们去过大学医院儿科急诊，夜里人不少，等了大约两小时。这只是我们家的一次经历，具体要不要就医还是请联系医生或急救。', displayName: '小陈', anonymous: false, likeCount: 4, disclaimer: true, createdAt: '2026-10-04T20:00:00.000Z' }
      ]
    },
    {
      id: 'seed-eltern', category: 'paperwork', title: '外国人申请 Elterngeld，大家实际交过哪些材料？',
      body: '我有居留许可，之前在德国工作过。想收集家长实际提交过的文件清单，方便自己对照，不是要替代官方说明。',
      displayName: '匿名家长', anonymous: true, status: 'published', createdAt: '2026-10-02T10:00:00.000Z', answerCount: 1, topLikes: 11,
      answers: [
        { id: 'seed-eltern-a1', body: '我交过护照和居留、孩子出生证明、近 12 个月工资单、银行账户。Elterngeldstelle 的窗口也可以当面问。这是我的办理经历，不是法律意见。', displayName: 'Pempelfort妈妈', anonymous: false, likeCount: 11, disclaimer: false, createdAt: '2026-10-03T10:00:00.000Z' }
      ]
    },
    {
      id: 'seed-indoor', category: 'activities', title: '下雨天，Oberkassel 有适合 3 岁孩子的室内馆吗？',
      body: '想找个可以待一下午的地方，不用太闹。欢迎分享你常去的馆或咖啡馆。',
      displayName: '小李', anonymous: false, status: 'published', createdAt: '2026-09-28T12:00:00.000Z', answerCount: 0, topLikes: 0, answers: []
    }
  ];

  var COM_UI = {
    zh: {
      hero: '家长互助', sub: '家长互助问答 · 杜塞尔多夫', fab: '提问',
      homeTitle: '家长互助问答', homeSub: '实名或昵称 · 经验分享', nav: '互助',
      search: '搜索问题…', all: '全部',
      parenting: '育儿', kita_school: '幼儿园/学校', housing: '租房', paperwork: '办证',
      medical: '医疗', legal: '法律', activities: '活动', life: '生活', review: '审核中',
      askTitle: '提问', cancel: '取消', submit: '发布问题',
      lTitle: '问题标题', lBody: '详细说明', lName: '显示名（实名或昵称）',
      namePh: '例如：小王妈妈', titlePh: '用一句话写出你的问题（5–60字）',
      bodyPh: '补充年龄、城区和你已经试过的办法（至少 10 字）。',
      formNote: '欢迎提问！这里的回答来自其他家长的亲身经验，温暖互助，但不代表专业意见。',
      anon: '匿名发帖',
      anonHint: '匿名发布：其他用户只会看到「匿名家长」。匿名内容同样需要遵守社区规则。',
      topic: '分类',
      sensitive: '敏感内容（提交后进入审核，不会立即公开）',
      rulesBox: '我已阅读《社区规则》，不在提问中留联系方式、不发广告。',
      replyRules: '我的回答基于个人经验，不含广告、联系方式或私下交易信息。',
      medicalHint: '温馨提示：医疗和法律类问题的回答仅为家长经验分享，非专业意见。紧急情况请拨打 112，儿童急诊夜间可拨 116 117。',
      replyNote: '谢谢你愿意分享！请写下你的真实经历。请不要留联系方式、不要推销、不要引导私聊。',
      rulesNote: '',
      back: '返回', answers: '条回答', write: '写下你的经验',
      replyPh: '分享你的经历。请勿广告或人身攻击。', replyBtn: '发布回答',
      likeHint: '可以为回答点赞。禁止通过私信售卖。',
      emptyReviewTitle: '还没有待审核的内容',
      emptyReviewBody: '敏感内容需审核后才会公开。通过之前不会出现在问答列表里。',
      emptySearchTitle: '没有找到相关问题',
      emptySearchBody: '换个关键词，或直接发起一个新问题。',
      emptyListTitle: '还没有问题',
      emptyListBody: '来提第一个问题吧。实名或昵称都可以，也可以匿名。',
      emptyAnswers: '还没有回答。来分享你的经验吧。',
      pendingBanner: '这条内容正在审核，尚未公开。',
      rejectedBanner: '这条内容未通过审核。',
      loading: '正在加载问题…',
      offline: '社区服务暂时连不上，先显示本地示例。新提问和点赞不会保存。',
      askCta: '提问',
      publishedToast: '问题已发布',
      reviewToast: '你的问题已提交，正在审核中（通常 24 小时内）。审核通过后其他家长就能看到啦。',
      answerToast: '回答已发布',
      answerReviewToast: '回答已提交，正在审核中。通过后才会公开。',
      offlineSave: '社区暂时连不上，这次内容没有保存。',
      offlineLike: '社区暂时连不上，点赞没有保存。',
      needTitle: '标题请写 5–60 个字',
      needBody: '正文请写 10–2000 个字',
      needName: '请填写实名或昵称（2–20字），或选择匿名发帖',
      needReply: '回答请写 10–2000 个字',
      needRules: '请先勾选已阅读社区规则',
      reportToast: '已收到举报，我们会尽快处理。',
      anonName: '匿名家长',
      unanswered: '待回答',
      rejected: '未通过'
    }
  };

  function ui() { return COM_UI.zh; }

  function comEsc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function comAttr(id) {
    return String(id || '').replace(/[^A-Za-z0-9_.:-]/g, '');
  }

  function topicLabel(topic) {
    var t = ui();
    return t[topic] || topic || '';
  }

  function authorLabel(item) {
    if (!item || item.anonymous) return ui().anonName;
    return item.displayName || item.author || ui().anonName;
  }

  function comTime(iso) {
    if (!iso) return '';
    var t = new Date(iso).getTime();
    if (isNaN(t)) return String(iso);
    var mins = Math.round((Date.now() - t) / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return mins + '分钟前';
    var hours = Math.round(mins / 60);
    if (hours < 24) return hours + '小时前';
    var days = Math.round(hours / 24);
    if (days === 1) return '昨天';
    if (days < 30) return days + '天前';
    return String(iso).slice(0, 10);
  }

  function toast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node && text != null) node.textContent = text;
  }

  function comAuthorId() {
    var key = Api.AUTHOR_KEY;
    try {
      var existing = localStorage.getItem(key);
      if (existing && /^[A-Za-z0-9_.:-]{8,80}$/.test(existing)) return existing;
      var id = Api.newAuthorId();
      localStorage.setItem(key, id);
      return id;
    } catch (err) {
      return 'web_session_local';
    }
  }

  function comFetch(path, options) {
    var opts = options || {};
    var headers = {
      'Accept': 'application/json',
      'X-Community-Author': comAuthorId()
    };
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(COMMUNITY_API_BASE + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) {
          var error = new Error((data && data.error) || ('HTTP ' + res.status));
          error.status = res.status;
          error.data = data;
          throw error;
        }
        comOffline = false;
        comSetOffline(false);
        return data;
      });
    });
  }

  function comSetOffline(on) {
    comOffline = !!on;
    var el = document.getElementById('com-offline-note');
    if (!el) return;
    if (!on) {
      el.style.display = 'none';
      el.textContent = '';
      return;
    }
    el.textContent = ui().offline;
    el.style.display = 'block';
  }

  function currentList() {
    if (activeFilter === 'review') return comPending;
    return comQuestions.filter(function (post) {
      if (activeFilter !== 'all' && post.category !== activeFilter && post.topic !== activeFilter) return false;
      if (!comQuery) return true;
      var hay = (post.title + ' ' + post.body + ' ' + authorLabel(post)).toLowerCase();
      return hay.indexOf(comQuery.trim().toLowerCase()) !== -1;
    });
  }

  function findPost(id) {
    var lists = [comQuestions, comPending];
    for (var i = 0; i < lists.length; i++) {
      for (var j = 0; j < lists[i].length; j++) {
        if (String(lists[i][j].id) === String(id)) return lists[i][j];
      }
    }
    return null;
  }

  function comApplyLabels() {
    var t = ui();
    setText('com-hero-title', t.hero);
    setText('com-hero-sub', t.sub);
    setText('com-post-fab', t.fab);
    setText('com-home-title', t.homeTitle);
    setText('com-home-sub', t.homeSub);
    setText('bnav-lbl-community', t.nav);
    ['all', 'parenting', 'kita_school', 'housing', 'paperwork', 'medical', 'legal', 'activities', 'life', 'review'].forEach(function (key) {
      setText('ctab-' + key, t[key]);
    });
    setText('npm-title', t.askTitle);
    setText('npm-cancel', t.cancel);
    setText('npm-submit', t.submit);
    setText('npm-l-title', t.lTitle);
    setText('npm-l-body', t.lBody);
    setText('npm-l-name', t.lName);
    setText('npm-l-topic', t.topic);
    setText('npm-anon-label', t.anon);
    setText('com-anon-hint', t.anonHint);
    setText('npm-sensitive-label', t.sensitive);
    setText('npm-rules-label', t.rulesBox);
    setText('com-form-note', t.formNote);
    setText('com-medical-hint', t.medicalHint);
    setText('detail-back-label', t.back);
    var search = document.getElementById('com-search');
    if (search) search.placeholder = t.search;
    var title = document.getElementById('post-title');
    if (title) title.placeholder = t.titlePh;
    var body = document.getElementById('post-body');
    if (body) body.placeholder = t.bodyPh;
    var name = document.getElementById('post-name');
    if (name) name.placeholder = t.namePh;
    renderPosts(activeFilter);
    if (typeof comRefresh === 'function') comRefresh();
    if (comDetailId != null) {
      var open = findPost(comDetailId);
      if (open) renderDetail(open);
    }
  }

  function comEmptyHtml() {
    var t = ui();
    var title = t.emptyListTitle;
    var body = t.emptyListBody;
    var icon = '💬';
    if (comQuery) {
      title = t.emptySearchTitle;
      body = t.emptySearchBody;
      icon = '🔍';
    } else if (activeFilter === 'review') {
      title = t.emptyReviewTitle;
      body = t.emptyReviewBody;
      icon = '🛡️';
    }
    return '<div class="com-empty" id="com-empty">' +
      '<div class="com-empty-ico">' + icon + '</div>' +
      '<h3>' + comEsc(title) + '</h3>' +
      '<p>' + comEsc(body) + '</p>' +
      '<button type="button" class="com-empty-btn" onclick="openNewPost()">' + comEsc(t.askCta) + '</button>' +
      '</div>';
  }

  function comCardHtml(post) {
    var t = ui();
    var pending = post.status === 'pending';
    var rejected = post.status === 'rejected';
    var advice = Api.needsDisclaimer(post) ? '<span class="com-badge-advice">经验分享，非专业意见</span>' : '';
    var review = pending ? '<span class="com-badge-review">审核中</span>' : '';
    var reject = rejected ? '<span class="com-badge-review">' + comEsc(t.rejected) + '</span>' : '';
    var count = post.answerCount != null ? post.answerCount : (post.answers || []).length;
    var wait = count === 0 && !pending ? '<span class="com-badge-review">' + comEsc(t.unanswered) + '</span>' : '';
    return '<article class="com-post2" onclick="openPostDetail(\'' + comAttr(post.id) + '\')">' +
      '<div class="com-card-tags"><span class="com-post2-type ' + comEsc(post.category || post.topic) + '">' + comEsc(topicLabel(post.category || post.topic)) + '</span>' +
      advice + review + reject + wait + '</div>' +
      '<div class="com-post2-title">' + comEsc(post.title) + '</div>' +
      '<div class="com-post2-body">' + comEsc(post.body) + '</div>' +
      '<div class="com-post2-footer">' +
      '<span class="com-post2-stat">👤 ' + comEsc(authorLabel(post)) + '</span>' +
      '<span class="com-post2-stat">· ' + comEsc(post.time || comTime(post.createdAt)) + '</span>' +
      '<span class="com-post2-stat">💬 ' + count + ' ' + comEsc(t.answers) + '</span>' +
      '</div></article>';
  }

  function renderPosts(filter) {
    if (typeof filter === 'string') activeFilter = filter;
    var body = document.getElementById('com-body');
    if (!body) return;
    var posts = currentList();
    if (!posts.length) {
      body.innerHTML = comEmptyHtml();
      return;
    }
    body.innerHTML = posts.map(comCardHtml).join('');
  }

  function filterPosts(filter, btn) {
    document.querySelectorAll('.com-tab').forEach(function (tab) { tab.classList.remove('on'); });
    if (btn) btn.classList.add('on');
    activeFilter = filter;
    renderPosts(filter);
    comRefresh();
  }

  function comSearch(value) {
    comQuery = value || '';
    if (comSearchTimer) clearTimeout(comSearchTimer);
    comSearchTimer = setTimeout(function () { comRefresh(); }, 280);
    renderPosts(activeFilter);
  }

  function comDefaultName() {
    try {
      var saved = localStorage.getItem('mamapedia_community_name');
      if (saved) return saved;
    } catch (err) {}
    var node = document.getElementById('prof-name');
    var name = node ? node.textContent.trim() : '';
    if (!name || name === 'Mama') return '';
    return name;
  }

  function rememberName(name) {
    if (!name) return;
    try { localStorage.setItem('mamapedia_community_name', name); } catch (err) {}
  }

  function showLoading() {
    var body = document.getElementById('com-body');
    if (!body || currentList().length) return;
    body.innerHTML = '<div class="com-empty" id="com-loading"><div class="com-empty-ico">🔄</div><h3>' + comEsc(ui().loading) + '</h3></div>';
  }

  function useFallback() {
    comQuestions = FALLBACK_QUESTIONS.map(function (item) { return JSON.parse(JSON.stringify(item)); });
    comPending = [];
    comSetOffline(true);
    renderPosts(activeFilter);
  }

  function comRefresh() {
    var token = ++comLoadToken;
    var mine = activeFilter === 'review';
    var category = (!mine && activeFilter !== 'all') ? activeFilter : '';
    var path = Api.questionsUrl({
      category: category,
      q: mine ? '' : comQuery.trim(),
      mine: mine,
      sort: 'new'
    });
    showLoading();
    comFetch(path).then(function (data) {
      if (token !== comLoadToken) return;
      var rows = (data && data.questions) || [];
      if (mine) comPending = rows.filter(function (row) { return row.status === 'pending' || row.status === 'rejected'; });
      else comQuestions = rows;
      comSetOffline(false);
      renderPosts(activeFilter);
      if (comDetailId != null) loadDetail(comDetailId, true);
    }).catch(function () {
      if (token !== comLoadToken) return;
      if (!mine) useFallback();
      else {
        comPending = [];
        comSetOffline(true);
        renderPosts('review');
      }
    });
  }

  function openNewPost() {
    var title = document.getElementById('post-title');
    var body = document.getElementById('post-body');
    var name = document.getElementById('post-name');
    var anon = document.getElementById('post-anon');
    var sensitive = document.getElementById('post-sensitive');
    var topic = document.getElementById('post-topic');
    var rules = document.getElementById('post-rules');
    var district = document.getElementById('post-stadtteil');
    if (title) title.value = '';
    if (body) body.value = '';
    if (name) {
      name.disabled = false;
      name.value = comDefaultName();
    }
    if (anon) anon.checked = false;
    if (sensitive) sensitive.checked = false;
    if (rules) rules.checked = false;
    if (topic) topic.value = 'parenting';
    if (district) district.value = '';
    comTopicChanged();
    var modal = document.getElementById('post-modal');
    if (modal) modal.classList.add('open');
    if (title) {
      try { title.focus(); } catch (err) {}
    }
  }

  function closeNewPost() {
    var modal = document.getElementById('post-modal');
    if (modal) modal.classList.remove('open');
  }

  function comToggleAnon() {
    var anon = document.getElementById('post-anon');
    var name = document.getElementById('post-name');
    if (!anon || !name) return;
    name.disabled = !!anon.checked;
    if (anon.checked) name.value = '';
  }

  function comTopicChanged() {
    var topic = document.getElementById('post-topic');
    var hint = document.getElementById('com-medical-hint');
    if (!topic || !hint) return;
    var show = topic.value === 'medical' || topic.value === 'legal';
    if (show) hint.removeAttribute('hidden');
    else hint.setAttribute('hidden', '');
  }

  function charLen(value) {
    return Array.from(String(value || '').trim()).length;
  }

  function submitPost() {
    var t = ui();
    var title = document.getElementById('post-title').value.trim();
    var body = document.getElementById('post-body').value.trim();
    var anon = document.getElementById('post-anon').checked;
    var name = document.getElementById('post-name').value.trim();
    var topic = document.getElementById('post-topic').value || 'parenting';
    var sensitive = document.getElementById('post-sensitive').checked;
    var rules = document.getElementById('post-rules');
    var district = document.getElementById('post-stadtteil');
    if (!rules || !rules.checked) { toast(t.needRules); return; }
    if (charLen(title) < 5 || charLen(title) > 60) { toast(t.needTitle); return; }
    if (charLen(body) < 10 || charLen(body) > 2000) { toast(t.needBody); return; }
    if (!anon && (charLen(name) < 2 || charLen(name) > 20)) { toast(t.needName); return; }
    if (!anon) rememberName(name);
    var btn = document.getElementById('npm-submit');
    if (btn) btn.disabled = true;
    comFetch('/community/questions', {
      method: 'POST',
      body: {
        title: title,
        body: body,
        category: topic,
        displayName: name,
        anonymous: anon,
        sensitive: sensitive,
        forceDisclaimer: topic === 'medical' || topic === 'legal',
        stadtteil: district ? district.value.trim() : ''
      }
    }).then(function (data) {
      if (btn) btn.disabled = false;
      closeNewPost();
      var status = Api.mapStatus(data);
      if (status === 'pending') {
        toast(t.reviewToast);
        filterPosts('review', document.getElementById('ctab-review'));
      } else {
        toast(t.publishedToast);
        filterPosts('all', document.getElementById('ctab-all'));
      }
    }).catch(function (err) {
      if (btn) btn.disabled = false;
      toast(err && err.status ? (err.message || t.offlineSave) : t.offlineSave);
    });
  }

  function loadDetail(postId, silent) {
    var mine = activeFilter === 'review' ? '?mine=1' : '';
    var cached = findPost(postId);
    if (cached && cached.answers && !silent) renderDetail(cached);
    comFetch('/community/questions/' + encodeURIComponent(postId) + mine).then(function (data) {
      var question = data.question || data;
      if (!question || !question.id) return;
      var list = question.status === 'pending' || question.status === 'rejected' ? comPending : comQuestions;
      var idx = -1;
      list.forEach(function (item, i) { if (String(item.id) === String(question.id)) idx = i; });
      if (idx >= 0) list[idx] = question;
      if (String(comDetailId) === String(question.id)) renderDetail(question);
    }).catch(function () {
      if (!silent && cached) renderDetail(cached);
    });
  }

  function renderDetail(post) {
    comDetailId = post.id;
    var t = ui();
    var panel = document.getElementById('post-detail-panel');
    var body = document.getElementById('post-detail-body');
    if (!panel || !body) return;
    var pending = post.status === 'pending';
    var rejected = post.status === 'rejected';
    var advice = Api.needsDisclaimer(post)
      ? '<div class="com-disclaimer com-disclaimer-inline"><strong>经验分享，非专业意见</strong><span>法律与医疗内容是家长经验，不是专业意见。</span></div>'
      : '';
    var pendingBanner = pending ? '<div class="com-review-banner">' + comEsc(t.pendingBanner) + '</div>' : '';
    var rejectedBanner = rejected ? '<div class="com-review-banner">' + comEsc(t.rejectedBanner) + '</div>' : '';
    var answers = post.answers || [];
    var answerHtml = answers.length
      ? answers.map(function (answer) {
        var label = answer.disclaimer ? '<div class="com-badge-advice">经验分享，非专业意见</div>' : '';
        return '<div class="com-reply-box">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
          '<span class="com-reply-author">' + comEsc(authorLabel(answer)) + '</span>' +
          '<span class="com-reply-time">· ' + comEsc(comTime(answer.createdAt) || answer.time || '') + '</span></div>' +
          label +
          '<div class="com-reply-text">' + comEsc(answer.body || answer.text) + '</div>' +
          '<button type="button" class="com-like' + (answer.liked ? ' liked' : '') + '" onclick="toggleAnswerLike(\'' + comAttr(post.id) + '\',\'' + comAttr(answer.id) + '\')">' +
          (answer.liked ? '❤️' : '🤍') + ' ' + (answer.likeCount != null ? answer.likeCount : (answer.likes || 0)) + '</button></div>';
      }).join('')
      : '<div class="com-empty com-empty-compact"><h3>' + comEsc(t.emptyAnswers) + '</h3></div>';
    var replyBox = (pending || rejected) ? '' : (
      '<div class="com-reply-form">' +
      '<div class="com-reply-label">' + comEsc(t.write) + '</div>' +
      '<p class="com-form-note">' + comEsc(t.replyNote) + '</p>' +
      (Api.needsDisclaimer(post) ? '<p class="com-form-note">本问题属于医疗/法律类。你的回答会自动带上「经验分享，非专业意见」标签。</p>' : '') +
      '<div class="post-field"><label>' + comEsc(t.lName) + '</label>' +
      '<input id="reply-name" placeholder="' + comEsc(t.namePh) + '" value="' + comEsc(comDefaultName()) + '"/></div>' +
      '<label class="com-check"><input type="checkbox" id="reply-anon" onchange="comToggleReplyAnon()"/> <span>' + comEsc(t.anon) + '</span></label>' +
      '<p class="com-anon-hint">' + comEsc(t.anonHint) + '</p>' +
      '<textarea id="reply-input" placeholder="' + comEsc(t.replyPh) + '" rows="3"></textarea>' +
      '<label class="com-check"><input type="checkbox" id="reply-rules"/> <span>' + comEsc(t.replyRules) + '</span></label>' +
      '<button type="button" id="reply-submit-btn" onclick="submitReply(\'' + comAttr(post.id) + '\')">' + comEsc(t.replyBtn) + '</button>' +
      '</div>'
    );
    body.innerHTML =
      pendingBanner + rejectedBanner + advice +
      '<span class="com-post2-type ' + comEsc(post.category || post.topic) + '">' + comEsc(topicLabel(post.category || post.topic)) + '</span>' +
      '<h2 class="com-detail-title">' + comEsc(post.title) + '</h2>' +
      '<div class="com-detail-meta"><span>' + comEsc(authorLabel(post)) + '</span><span>· ' + comEsc(comTime(post.createdAt) || post.time || '') + '</span></div>' +
      '<p class="com-detail-body">' + comEsc(post.body) + '</p>' +
      '<div class="com-detail-count">' + answers.length + ' ' + comEsc(t.answers) + '</div>' +
      answerHtml +
      '<p class="com-form-note">' + comEsc(t.likeHint) + '</p>' +
      '<button type="button" class="com-report" onclick="comReport(\'question\',\'' + comAttr(post.id) + '\')">举报</button>' +
      replyBox;
    panel.style.display = 'flex';
    setTimeout(function () { panel.style.transform = 'translateX(0)'; }, 10);
  }

  function openPostDetail(postId) {
    var cached = findPost(postId);
    if (cached) renderDetail(cached);
    else {
      var panel = document.getElementById('post-detail-panel');
      var body = document.getElementById('post-detail-body');
      if (panel && body) {
        body.innerHTML = '<div class="com-empty"><h3>' + comEsc(ui().loading) + '</h3></div>';
        panel.style.display = 'flex';
        setTimeout(function () { panel.style.transform = 'translateX(0)'; }, 10);
      }
    }
    comDetailId = postId;
    if (!comOffline) loadDetail(postId, true);
  }

  function closePostDetail() {
    var panel = document.getElementById('post-detail-panel');
    if (!panel) return;
    comDetailId = null;
    panel.style.transform = 'translateX(100%)';
    setTimeout(function () { panel.style.display = 'none'; }, 350);
  }

  function comToggleReplyAnon() {
    var anon = document.getElementById('reply-anon');
    var name = document.getElementById('reply-name');
    if (!anon || !name) return;
    name.disabled = !!anon.checked;
    if (anon.checked) name.value = '';
  }

  function submitReply(postId) {
    var t = ui();
    var input = document.getElementById('reply-input');
    var text = input ? input.value.trim() : '';
    var anon = document.getElementById('reply-anon') && document.getElementById('reply-anon').checked;
    var name = document.getElementById('reply-name') ? document.getElementById('reply-name').value.trim() : '';
    var rules = document.getElementById('reply-rules');
    if (!rules || !rules.checked) { toast(t.needRules); return; }
    if (charLen(text) < 10 || charLen(text) > 2000) { toast(t.needReply); return; }
    if (!anon && (charLen(name) < 2 || charLen(name) > 20)) { toast(t.needName); return; }
    if (!anon) rememberName(name);
    var btn = document.getElementById('reply-submit-btn');
    if (btn) btn.disabled = true;
    comFetch('/community/questions/' + encodeURIComponent(postId) + '/answers', {
      method: 'POST',
      body: { body: text, displayName: name, anonymous: !!anon }
    }).then(function (data) {
      if (btn) btn.disabled = false;
      var status = data && (data.status || (data.answer && data.answer.status));
      toast(status === 'pending' ? t.answerReviewToast : t.answerToast);
      loadDetail(postId, true);
      comRefresh();
    }).catch(function (err) {
      if (btn) btn.disabled = false;
      toast(err && err.status ? (err.message || t.offlineSave) : t.offlineSave);
    });
  }

  function toggleAnswerLike(questionId, answerId) {
    var post = findPost(questionId);
    var answer = null;
    if (post) {
      (post.answers || []).forEach(function (item) {
        if (String(item.id) === String(answerId)) answer = item;
      });
    }
    var liked = !(answer && answer.liked);
    var path = '/community/answers/' + encodeURIComponent(answerId) + '/like';
    var req = liked
      ? comFetch(path, { method: 'POST', body: { liked: true } })
      : comFetch(path, { method: 'DELETE' });
    req.then(function (data) {
      if (answer) {
        answer.liked = !!data.liked;
        answer.likeCount = data.likeCount;
      }
      if (post) renderDetail(post);
    }).catch(function (err) {
      toast(err && err.status === 403 ? err.message : ui().offlineLike);
    });
  }

  function comReport(targetType, targetId) {
    var reason = '其他';
    try {
      var typed = window.prompt('举报原因（广告、人身攻击、联系方式、其他）', '其他');
      if (typed == null) return;
      reason = typed.trim() || '其他';
    } catch (err) {}
    comFetch('/community/report', {
      method: 'POST',
      body: { targetType: targetType, targetId: targetId, reason: reason }
    }).then(function () {
      toast(ui().reportToast);
    }).catch(function () {
      toast(ui().offlineSave);
    });
  }

  function comOpenFromHash() {
    var hash = (location.hash || '').toLowerCase();
    if (hash === '#community' || hash === '#/community') {
      if (typeof switchTab === 'function') {
        switchTab('community', document.getElementById('bnav-community'));
      }
    }
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var modal = document.getElementById('post-modal');
    if (modal && modal.classList.contains('open')) closeNewPost();
  });
  window.addEventListener('hashchange', comOpenFromHash);

  window.comApplyLabels = comApplyLabels;
  window.renderPosts = renderPosts;
  window.filterPosts = filterPosts;
  window.comSearch = comSearch;
  window.comRefresh = comRefresh;
  window.openNewPost = openNewPost;
  window.closeNewPost = closeNewPost;
  window.comToggleAnon = comToggleAnon;
  window.comTopicChanged = comTopicChanged;
  window.submitPost = submitPost;
  window.openPostDetail = openPostDetail;
  window.closePostDetail = closePostDetail;
  window.toggleAnswerLike = toggleAnswerLike;
  window.submitReply = submitReply;
  window.comToggleReplyAnon = comToggleReplyAnon;
  window.comReport = comReport;
  window.COMMUNITY_API_BASE = COMMUNITY_API_BASE;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      comRefresh();
      comOpenFromHash();
    });
  } else {
    comRefresh();
    comOpenFromHash();
  }
})();
