/**
 * MamaPedia Community — 家长互助问答 (front-end slice).
 *
 * TODO(community-api): This Netlify repo has no Community backend.
 * Questions, answers, and likes stay in memory for this page load only.
 * Later, persist with KV or a mamapedia-chat API, for example:
 *   GET  /community/questions
 *   POST /community/questions
 *   POST /community/questions/:id/answers
 *   POST /community/answers/:id/like
 * Do not replace the mamapedia-chat Worker deploy from this repo.
 * Sensitive posts must stay unpublished until a review step accepts them.
 */
(function () {
  var COMMUNITY_QUESTIONS = [
    {
      id: 1,
      topic: 'care',
      title: '杜塞尔多夫 Kita 申请，要不要一出生就登记？',
      body: '宝宝下个月出生，住 Bilk。听说 Kita-Navigator 要尽早填。有人是出生后马上申请的吗？当时准备了哪些材料？',
      author: '小王妈妈',
      anonymous: false,
      advice: false,
      time: '2小时前',
      answers: [
        {
          id: 11,
          author: 'Bilk妈妈',
          anonymous: false,
          text: '我们出生后一周就在 Kita-Navigator 登记了，同时填了好几所。材料主要是出生证明、住址证明和父母的证件。名额仍要等，但越早排队越安心。',
          likes: 8,
          time: '1小时前'
        },
        {
          id: 12,
          author: '匿名',
          anonymous: true,
          text: '可以先用预产期占位，出生后再补文件。我当时同时申请了 6 所，最后拿到 2 个位置。',
          likes: 5,
          time: '40分钟前'
        }
      ]
    },
    {
      id: 2,
      topic: 'health',
      title: '孩子夜里发烧，大家一般去哪家儿科急诊？',
      body: '两岁，住 Oberkassel，夜里突然发烧。想问问大家是去大学医院，还是就近的儿科急诊，排队大概多久？只想听过来人的经历。',
      author: '花园妈妈',
      anonymous: false,
      advice: true,
      time: '昨天',
      answers: [
        {
          id: 21,
          author: '小陈',
          anonymous: false,
          text: '我们去过大学医院儿科急诊，夜里人不少，等了大约两小时。这只是我们家的一次经历，具体要不要就医还是请联系医生或急救。',
          likes: 4,
          time: '昨天'
        }
      ]
    },
    {
      id: 3,
      topic: 'legal',
      title: '外国人申请 Elterngeld，大家实际交过哪些材料？',
      body: '我有居留许可，之前在德国工作过。想收集家长实际提交过的文件清单，方便自己对照，不是要替代官方说明。',
      author: '匿名',
      anonymous: true,
      advice: true,
      time: '3天前',
      answers: [
        {
          id: 31,
          author: 'Pempelfort妈妈',
          anonymous: false,
          text: '我交过护照和居留、孩子出生证明、近 12 个月工资单、银行账户。Elterngeldstelle 的窗口也可以当面问。这是我的办理经历，不是法律意见。',
          likes: 11,
          time: '2天前'
        }
      ]
    },
    {
      id: 4,
      topic: 'daily',
      title: '下雨天，Oberkassel 有适合 3 岁孩子的室内馆吗？',
      body: '想找个可以待一下午的地方，不用太闹。欢迎分享你常去的馆或咖啡馆。',
      author: '小李',
      anonymous: false,
      advice: false,
      time: '5天前',
      answers: []
    }
  ];

  var communityPending = [];
  var activeFilter = 'all';
  var comQuery = '';
  var comDetailId = null;

  var COM_UI = {
    zh: {
      hero: '家长互助',
      sub: '家长互助问答 · 杜塞尔多夫',
      fab: '提问',
      homeTitle: '家长互助问答',
      homeSub: '实名或昵称 · 经验分享',
      nav: '互助',
      search: '搜索问题…',
      all: '全部',
      daily: '日常',
      care: '托育教育',
      health: '医疗经验',
      legal: '法律经验',
      review: '审核中',
      askTitle: '提问',
      cancel: '取消',
      submit: '发布问题',
      lTitle: '问题标题',
      lBody: '详细说明',
      lName: '显示名（实名或昵称）',
      namePh: '例如：小王妈妈',
      titlePh: '用一句话写出你的问题',
      bodyPh: '补充年龄、城区和你已经试过的办法。越具体，越容易得到经验。',
      formNote: '可用实名或昵称，也可以匿名发帖。禁止广告、人身攻击、私信推销。',
      anon: '匿名发帖',
      topic: '话题',
      advice: '涉及法律或医疗，请标注：经验分享，非专业意见',
      sensitive: '敏感内容（提交后进入审核，不会立即公开）',
      rulesNote: '',
      back: '返回',
      answers: '条回答',
      write: '写下你的经验',
      replyPh: '分享你的经历。请勿广告或人身攻击。',
      replyBtn: '发布回答',
      likeHint: '可以为回答点赞。禁止通过私信售卖。',
      emptyReviewTitle: '还没有待审核的内容',
      emptyReviewBody: '敏感内容需审核后才会公开。通过之前不会出现在问答列表里。',
      emptySearchTitle: '没有找到相关问题',
      emptySearchBody: '换个关键词，或直接发起一个新问题。',
      emptyListTitle: '还没有问题',
      emptyListBody: '来提第一个问题吧。实名或昵称都可以，也可以匿名。',
      emptyAnswers: '还没有回答。来分享你的经验吧。',
      pendingBanner: '这条内容正在审核，尚未公开。',
      localNote: '示例问题为占位数据。新提问、回答和点赞只留在本页，尚未写入服务器。',
      askCta: '提问',
      previewToast: '问题已出现在列表中（仅本机预览）',
      reviewToast: '已提交审核。敏感内容通过后才会公开。',
      needTitle: '请填写问题标题',
      needBody: '请填写问题内容',
      needName: '请填写实名或昵称，或选择匿名发帖',
      needReply: '请先写下你的经验',
      replyToast: '回答已加上（仅本机预览）',
      anonName: '匿名'
    },
    en: {
      hero: 'Community',
      sub: 'Parent Q&A · Düsseldorf',
      fab: 'Ask',
      homeTitle: 'Parent Q&A',
      homeSub: 'Real name or nickname · shared experience',
      nav: 'Q&A',
      search: 'Search questions…',
      all: 'All',
      daily: 'Daily',
      care: 'Care & school',
      health: 'Health stories',
      legal: 'Paperwork stories',
      review: 'In review',
      askTitle: 'Ask a question',
      cancel: 'Cancel',
      submit: 'Post question',
      lTitle: 'Title',
      lBody: 'Details',
      lName: 'Name shown (real name or nickname)',
      namePh: 'e.g. Mama Wang',
      titlePh: 'Your question in one line',
      bodyPh: 'Add age, district, and what you already tried.',
      formNote: 'Real name or nickname is fine. Anonymous posts are optional. No ads, attacks, or selling in DMs.',
      anon: 'Post anonymously',
      topic: 'Topic',
      advice: 'Legal or medical topic — label it: 经验分享，非专业意见',
      sensitive: 'Sensitive (goes to review and is not public yet)',
      rulesNote: '规则以中文为准：实名或昵称、可匿名、经验分享非专业意见、敏感内容需审核、禁止广告 / 人身攻击 / 私信推销与售卖、回答可以点赞。',
      back: 'Back',
      answers: 'answers',
      write: 'Share your experience',
      replyPh: 'What worked for your family. No ads or personal attacks.',
      replyBtn: 'Post answer',
      likeHint: 'Likes are on answers. No selling via private message.',
      emptyReviewTitle: 'Nothing waiting for review',
      emptyReviewBody: 'Sensitive posts stay hidden until moderation accepts them.',
      emptySearchTitle: 'No matching questions',
      emptySearchBody: 'Try another word, or ask a new question.',
      emptyListTitle: 'No questions yet',
      emptyListBody: 'Ask the first one. A real name, nickname, or anonymous post is fine.',
      emptyAnswers: 'No answers yet. Share what you have learned.',
      pendingBanner: 'This post is in review and is not public.',
      localNote: 'Sample questions are placeholders. New posts, answers, and likes stay on this page only.',
      askCta: 'Ask',
      previewToast: 'Shown in the list (this browser only)',
      reviewToast: 'Sent for review. Sensitive posts are not public yet.',
      needTitle: 'Add a title',
      needBody: 'Add some details',
      needName: 'Add a real name or nickname, or post anonymously',
      needReply: 'Write your experience first',
      replyToast: 'Answer added (this browser only)',
      anonName: 'Anonymous'
    },
    es: {
      hero: 'Comunidad',
      sub: 'Preguntas entre padres · Düsseldorf',
      fab: 'Preguntar',
      homeTitle: 'Preguntas entre padres',
      homeSub: 'Nombre real o apodo · experiencia',
      nav: 'Dudas',
      search: 'Buscar preguntas…',
      all: 'Todo',
      daily: 'Día a día',
      care: 'Guardería',
      health: 'Salud',
      legal: 'Trámites',
      review: 'En revisión',
      askTitle: 'Hacer una pregunta',
      cancel: 'Cancelar',
      submit: 'Publicar',
      lTitle: 'Título',
      lBody: 'Detalle',
      lName: 'Nombre visible (real o apodo)',
      namePh: 'p. ej. Mamá Wang',
      titlePh: 'La pregunta en una frase',
      bodyPh: 'Edad, barrio y lo que ya intentaste.',
      formNote: 'Vale el nombre real o un apodo, y también el anonimato. Sin anuncios, ataques ni ventas por mensaje privado.',
      anon: 'Publicar en anónimo',
      topic: 'Tema',
      advice: 'Tema legal o médico — marcar: 经验分享，非专业意见',
      sensitive: 'Contenido sensible (pasa a revisión y no es público aún)',
      rulesNote: 'Las reglas oficiales están en chino: nombre real o apodo, anonimato opcional, experiencia y no consejo profesional, revisión si es sensible, sin anuncios, ataques ni ventas por mensaje, y me gusta en las respuestas.',
      back: 'Volver',
      answers: 'respuestas',
      write: 'Cuenta tu experiencia',
      replyPh: 'Lo que te sirvió. Sin anuncios ni ataques.',
      replyBtn: 'Publicar respuesta',
      likeHint: 'Los me gusta son para las respuestas. Prohibido vender por mensaje privado.',
      emptyReviewTitle: 'Nada en revisión',
      emptyReviewBody: 'Lo sensible no se muestra hasta que pase la moderación.',
      emptySearchTitle: 'Sin resultados',
      emptySearchBody: 'Prueba otra palabra o haz una pregunta.',
      emptyListTitle: 'Todavía no hay preguntas',
      emptyListBody: 'Puedes usar nombre real, apodo o publicar en anónimo.',
      emptyAnswers: 'Aún no hay respuestas.',
      pendingBanner: 'Esta publicación está en revisión y no es pública.',
      localNote: 'Las preguntas de ejemplo son de muestra. Lo nuevo solo vive en esta página.',
      askCta: 'Preguntar',
      previewToast: 'Visible en la lista (solo en este navegador)',
      reviewToast: 'Enviado a revisión. Lo sensible aún no es público.',
      needTitle: 'Escribe un título',
      needBody: 'Escribe el detalle',
      needName: 'Pon nombre real o apodo, o publica en anónimo',
      needReply: 'Escribe tu experiencia primero',
      replyToast: 'Respuesta añadida (solo en este navegador)',
      anonName: 'Anónimo'
    }
  };

  function ui() {
    var l = (typeof aiLang !== 'undefined' && aiLang) ? aiLang : 'zh';
    if (l === 'de' || !COM_UI[l]) return COM_UI.zh;
    return COM_UI[l];
  }

  function comEsc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function topicLabel(topic) {
    var t = ui();
    return t[topic] || topic;
  }

  function authorLabel(item) {
    if (!item || item.anonymous) return ui().anonName;
    return item.author || ui().anonName;
  }

  function isPending(post) {
    return communityPending.indexOf(post) !== -1;
  }

  function findPost(id) {
    id = Number(id);
    var lists = [COMMUNITY_QUESTIONS, communityPending];
    for (var i = 0; i < lists.length; i++) {
      for (var j = 0; j < lists[i].length; j++) {
        if (lists[i][j].id === id) return lists[i][j];
      }
    }
    return null;
  }

  function toast(msg) {
    if (typeof showToast === 'function') showToast(msg);
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function comApplyLabels() {
    var t = ui();
    setText('com-hero-title', t.hero);
    setText('com-hero-sub', t.sub);
    setText('com-post-fab', t.fab);
    setText('com-home-title', t.homeTitle);
    setText('com-home-sub', t.homeSub);
    setText('bnav-lbl-community', t.nav);
    setText('ctab-all', t.all);
    setText('ctab-daily', t.daily);
    setText('ctab-care', t.care);
    setText('ctab-health', t.health);
    setText('ctab-legal', t.legal);
    setText('ctab-review', t.review);
    setText('npm-title', t.askTitle);
    setText('npm-cancel', t.cancel);
    setText('npm-submit', t.submit);
    setText('npm-l-title', t.lTitle);
    setText('npm-l-body', t.lBody);
    setText('npm-l-name', t.lName);
    setText('npm-l-topic', t.topic);
    setText('npm-anon-label', t.anon);
    setText('npm-advice-label', t.advice);
    setText('npm-sensitive-label', t.sensitive);
    setText('com-form-note', t.formNote);
    setText('com-rules-note', t.rulesNote);
    setText('detail-back-label', t.back);
    var search = document.getElementById('com-search');
    if (search) search.placeholder = t.search;
    var title = document.getElementById('post-title');
    if (title) title.placeholder = t.titlePh;
    var body = document.getElementById('post-body');
    if (body) body.placeholder = t.bodyPh;
    var name = document.getElementById('post-name');
    if (name) name.placeholder = t.namePh;
    var note = document.getElementById('com-rules-note');
    if (note) note.style.display = t.rulesNote ? 'block' : 'none';
    renderPosts(activeFilter);
    if (comDetailId != null) openPostDetail(comDetailId);
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
      '<p class="com-local-note">' + comEsc(t.localNote) + '</p>' +
      '</div>';
  }

  function comCardHtml(post) {
    var t = ui();
    var pending = isPending(post);
    var advice = post.advice ? '<span class="com-badge-advice">经验分享，非专业意见</span>' : '';
    var review = pending ? '<span class="com-badge-review">审核中</span>' : '';
    var count = (post.answers || []).length;
    return '<article class="com-post2" onclick="openPostDetail(' + post.id + ')">' +
      '<div class="com-card-tags"><span class="com-post2-type ' + comEsc(post.topic) + '">' + comEsc(topicLabel(post.topic)) + '</span>' +
      advice + review + '</div>' +
      '<div class="com-post2-title">' + comEsc(post.title) + '</div>' +
      '<div class="com-post2-body">' + comEsc(post.body) + '</div>' +
      '<div class="com-post2-footer">' +
      '<span class="com-post2-stat">👤 ' + comEsc(authorLabel(post)) + '</span>' +
      '<span class="com-post2-stat">· ' + comEsc(post.time) + '</span>' +
      '<span class="com-post2-stat">💬 ' + count + ' ' + comEsc(t.answers) + '</span>' +
      '</div></article>';
  }

  function renderPosts(filter) {
    if (typeof filter === 'string') activeFilter = filter;
    var body = document.getElementById('com-body');
    if (!body) return;
    var q = (comQuery || '').trim().toLowerCase();
    var source = activeFilter === 'review' ? communityPending : COMMUNITY_QUESTIONS;
    var posts = source.filter(function (post) {
      if (activeFilter !== 'all' && activeFilter !== 'review' && post.topic !== activeFilter) return false;
      if (!q) return true;
      var hay = (post.title + ' ' + post.body + ' ' + authorLabel(post)).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    if (!posts.length) {
      body.innerHTML = comEmptyHtml();
      return;
    }
    var note = '<p class="com-local-note">' + comEsc(ui().localNote) + '</p>';
    body.innerHTML = posts.map(comCardHtml).join('') + note;
  }

  function filterPosts(filter, btn) {
    document.querySelectorAll('.com-tab').forEach(function (tab) { tab.classList.remove('on'); });
    if (btn) btn.classList.add('on');
    renderPosts(filter);
  }

  function comSearch(value) {
    comQuery = value || '';
    renderPosts(activeFilter);
  }

  function comDefaultName() {
    var node = document.getElementById('prof-name');
    var name = node ? node.textContent.trim() : '';
    if (!name || name === 'Mama') return '';
    return name;
  }

  function openNewPost() {
    var title = document.getElementById('post-title');
    var body = document.getElementById('post-body');
    var name = document.getElementById('post-name');
    var anon = document.getElementById('post-anon');
    var advice = document.getElementById('post-advice');
    var sensitive = document.getElementById('post-sensitive');
    var topic = document.getElementById('post-topic');
    if (title) title.value = '';
    if (body) body.value = '';
    if (name) {
      name.disabled = false;
      name.value = comDefaultName();
    }
    if (anon) anon.checked = false;
    if (advice) advice.checked = false;
    if (sensitive) sensitive.checked = false;
    if (topic) topic.value = 'daily';
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
    var advice = document.getElementById('post-advice');
    if (!topic || !advice) return;
    if (topic.value === 'health' || topic.value === 'legal') advice.checked = true;
  }

  function submitPost() {
    var t = ui();
    var title = document.getElementById('post-title').value.trim();
    var body = document.getElementById('post-body').value.trim();
    var anon = document.getElementById('post-anon').checked;
    var name = document.getElementById('post-name').value.trim();
    var topic = document.getElementById('post-topic').value || 'daily';
    var advice = document.getElementById('post-advice').checked || topic === 'health' || topic === 'legal';
    var sensitive = document.getElementById('post-sensitive').checked;
    if (!title) { toast(t.needTitle); return; }
    if (!body) { toast(t.needBody); return; }
    if (!anon && !name) { toast(t.needName); return; }
    var post = {
      id: Date.now(),
      topic: topic,
      title: title,
      body: body,
      author: anon ? t.anonName : name,
      anonymous: anon,
      advice: advice,
      time: '刚刚',
      answers: []
    };
    closeNewPost();
    if (sensitive) {
      communityPending.unshift(post);
      toast(t.reviewToast);
      filterPosts('review', document.getElementById('ctab-review'));
      return;
    }
    COMMUNITY_QUESTIONS.unshift(post);
    toast(t.previewToast);
    filterPosts('all', document.getElementById('ctab-all'));
  }

  function toggleAnswerLike(questionId, answerId) {
    var post = findPost(questionId);
    if (!post) return;
    var answer = (post.answers || []).filter(function (item) { return item.id === Number(answerId); })[0];
    if (!answer) return;
    answer.liked = !answer.liked;
    answer.likes = (answer.likes || 0) + (answer.liked ? 1 : -1);
    if (answer.likes < 0) answer.likes = 0;
    openPostDetail(questionId);
  }

  function openPostDetail(postId) {
    var post = findPost(postId);
    if (!post) return;
    comDetailId = post.id;
    var t = ui();
    var panel = document.getElementById('post-detail-panel');
    var body = document.getElementById('post-detail-body');
    if (!panel || !body) return;
    var pending = isPending(post);
    var advice = post.advice
      ? '<div class="com-disclaimer com-disclaimer-inline"><strong>经验分享，非专业意见</strong><span>法律与医疗内容是家长经验，不是专业意见。</span></div>'
      : '';
    var pendingBanner = pending
      ? '<div class="com-review-banner">' + comEsc(t.pendingBanner) + '</div>'
      : '';
    var answers = post.answers || [];
    var answerHtml = answers.length
      ? answers.map(function (answer) {
        return '<div class="com-reply-box">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
          '<span class="com-reply-author">' + comEsc(authorLabel(answer)) + '</span>' +
          '<span class="com-reply-time">· ' + comEsc(answer.time) + '</span></div>' +
          '<div class="com-reply-text">' + comEsc(answer.text) + '</div>' +
          '<button type="button" class="com-like' + (answer.liked ? ' liked' : '') + '" onclick="toggleAnswerLike(' + post.id + ',' + answer.id + ')">' +
          (answer.liked ? '❤️' : '🤍') + ' ' + (answer.likes || 0) + '</button></div>';
      }).join('')
      : '<div class="com-empty com-empty-compact"><h3>' + comEsc(t.emptyAnswers) + '</h3></div>';
    var replyBox = pending ? '' : (
      '<div class="com-reply-form">' +
      '<div class="com-reply-label" id="reply-label">' + comEsc(t.write) + '</div>' +
      (post.advice ? '<p class="com-form-note"><strong>经验分享，非专业意见</strong></p>' : '') +
      '<div class="post-field"><label>' + comEsc(t.lName) + '</label>' +
      '<input id="reply-name" placeholder="' + comEsc(t.namePh) + '" value="' + comEsc(comDefaultName()) + '"/></div>' +
      '<label class="com-check"><input type="checkbox" id="reply-anon" onchange="comToggleReplyAnon()"/> <span>' + comEsc(t.anon) + '</span></label>' +
      '<textarea id="reply-input" placeholder="' + comEsc(t.replyPh) + '" rows="3"></textarea>' +
      '<button type="button" id="reply-submit-btn" onclick="submitReply(' + post.id + ')">' + comEsc(t.replyBtn) + '</button>' +
      '</div>'
    );
    body.innerHTML =
      pendingBanner + advice +
      '<span class="com-post2-type ' + comEsc(post.topic) + '">' + comEsc(topicLabel(post.topic)) + '</span>' +
      '<h2 class="com-detail-title">' + comEsc(post.title) + '</h2>' +
      '<div class="com-detail-meta"><span>' + comEsc(authorLabel(post)) + '</span><span>· ' + comEsc(post.time) + '</span></div>' +
      '<p class="com-detail-body">' + comEsc(post.body) + '</p>' +
      '<div class="com-detail-count">' + answers.length + ' ' + comEsc(t.answers) + '</div>' +
      answerHtml +
      '<p class="com-form-note">' + comEsc(t.likeHint) + '</p>' +
      replyBox;
    panel.style.display = 'flex';
    setTimeout(function () { panel.style.transform = 'translateX(0)'; }, 10);
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
    if (!text) { toast(t.needReply); return; }
    var post = findPost(postId);
    if (!post || isPending(post)) return;
    var anon = document.getElementById('reply-anon') && document.getElementById('reply-anon').checked;
    var name = document.getElementById('reply-name') ? document.getElementById('reply-name').value.trim() : '';
    if (!anon && !name) { toast(t.needName); return; }
    if (!post.answers) post.answers = [];
    post.answers.push({
      id: Date.now(),
      author: anon ? t.anonName : name,
      anonymous: !!anon,
      text: text,
      likes: 0,
      liked: false,
      time: '刚刚'
    });
    toast(t.replyToast);
    openPostDetail(postId);
    renderPosts(activeFilter);
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
  window.COMMUNITY_QUESTIONS = COMMUNITY_QUESTIONS;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderPosts('all');
      comOpenFromHash();
    });
  } else {
    renderPosts('all');
    comOpenFromHash();
  }
})();
