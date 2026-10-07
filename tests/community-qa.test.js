/**
 * Community Q&A — rules copy, API client helpers, and worker handler (memory KV).
 * Run: node tests/community-qa.test.js
 */
var assert = require('assert');
var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var js = fs.readFileSync(path.join(root, 'js', 'community.js'), 'utf8');
var api = require(path.join(root, 'js', 'community-api.js'));
var community = require(path.join(root, 'community-worker', 'shared', 'community.js'));

var failed = 0;
var pending = 0;

function finish() {
  if (pending) return;
  if (failed) {
    console.error(failed + ' failed');
    process.exit(1);
  }
  console.log('community-qa: all passed');
}

function test(name, fn) {
  pending += 1;
  Promise.resolve()
    .then(fn)
    .then(function () {
      console.log('ok  ' + name);
    })
    .catch(function (err) {
      failed += 1;
      console.error('FAIL ' + name);
      console.error(err && err.stack ? err.stack : err);
    })
    .then(function () {
      pending -= 1;
      finish();
    });
}

function req(pathname, options) {
  var opts = options || {};
  var headers = { Origin: opts.origin || 'http://localhost:8765' };
  if (opts.author) headers['X-Community-Author'] = opts.author;
  if (opts.secret) headers['X-Mod-Secret'] = opts.secret;
  if (opts.body != null) headers['Content-Type'] = 'application/json';
  return new Request('http://127.0.0.1' + pathname, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined
  });
}

test('Community nav is visible and opens the community tab', function () {
  assert.ok(!/#bnav-community\s*,/.test(html), 'CSS still hides #bnav-community');
  assert.ok(html.indexOf('id="bnav-community"') !== -1);
  var nav = html.split('id="bnav-community"')[1].slice(0, 220);
  assert.ok(nav.indexOf('display:none') === -1, nav);
  assert.ok(nav.indexOf("switchTab('community'") !== -1);
});

test('Home entry opens Community', function () {
  assert.ok(html.indexOf('id="com-home-entry"') !== -1);
  assert.ok(html.indexOf('家长互助问答') !== -1);
  var home = html.split('id="com-home-entry"')[1].slice(0, 280);
  assert.ok(home.indexOf("switchTab('community'") !== -1);
});

test('Locked rules are visible in the Community markup', function () {
  ['实名或昵称', '匿名发帖', '经验分享，非专业意见', '敏感内容需审核', '禁止广告、人身攻击、私信推销', '回答可以点赞', '禁止通过私信售卖'].forEach(function (phrase) {
    assert.ok(html.indexOf(phrase) !== -1, 'missing ' + phrase);
  });
  assert.ok(html.indexOf('id="com-disclaimer"') !== -1);
  assert.ok(html.indexOf('id="com-rules"') !== -1);
  assert.ok(html.indexOf('id="post-modal"') !== -1);
  assert.ok(html.indexOf('id="post-title"') !== -1);
  assert.ok(html.indexOf('id="post-anon"') !== -1);
  assert.ok(html.indexOf('id="post-rules"') !== -1);
  assert.ok(html.indexOf('匿名家长') !== -1);
  ['parenting', 'kita_school', 'housing', 'paperwork', 'medical', 'legal', 'activities', 'life'].forEach(function (key) {
    assert.ok(html.indexOf('filterPosts(\'' + key + '\'') !== -1, key);
  });
});

test('Frontend calls the live Community API and keeps an offline fallback', function () {
  assert.ok(js.indexOf('仅本机预览') === -1);
  assert.ok(html.indexOf('仅本机预览') === -1);
  assert.ok(js.indexOf('TODO(community-api)') === -1);
  assert.ok(/fetch\s*\(/.test(js));
  assert.ok(js.indexOf('https://mamapedia-chat.golightly2004.workers.dev') !== -1);
  assert.ok(api.API_BASE === 'https://mamapedia-chat.golightly2004.workers.dev');
  assert.ok(js.indexOf('社区服务暂时连不上') !== -1);
  assert.ok(js.indexOf('问题已发布') !== -1);
  assert.ok(html.indexOf('id="com-offline-note"') !== -1);
  assert.ok(html.indexOf('src="js/community-api.js"') !== -1);
  assert.ok(html.indexOf('src="js/community.js"') !== -1);
  assert.ok(js.indexOf('function openNewPost') !== -1);
  assert.ok(js.indexOf('function toggleAnswerLike') !== -1);
  assert.ok(js.indexOf('showGate') === -1);
  assert.ok(html.indexOf("filterPosts('review'") !== -1);
});

test('API client helpers map query, status, and disclaimer', function () {
  assert.strictEqual(api.questionsUrl(), '/community/questions');
  assert.strictEqual(
    api.questionsUrl({ category: 'medical', q: '发烧', sort: 'new', page: 2, mine: true }),
    '/community/questions?category=medical&q=%E5%8F%91%E7%83%A7&sort=new&page=2&mine=1'
  );
  assert.strictEqual(api.questionsUrl({ category: 'all', page: 1 }), '/community/questions');
  assert.strictEqual(api.isPublicStatus('published'), true);
  assert.strictEqual(api.isPublicStatus('flagged'), true);
  assert.strictEqual(api.isPublicStatus('pending'), false);
  assert.strictEqual(api.mapStatus({ status: 'rejected' }), 'rejected');
  assert.strictEqual(api.mapStatus({ status: 'nope' }), 'published');
  assert.strictEqual(api.needsDisclaimer({ category: 'legal' }), true);
  assert.strictEqual(api.needsDisclaimer({ category: 'activities' }), false);
  assert.ok(/^web_[A-Za-z0-9]+$/.test(api.newAuthorId()));
  assert.deepStrictEqual(api.CATEGORIES.length, 8);
});

test('Worker seeds once and hides pending from the public list', async function () {
  var env = { MARKT: community.createMemoryKv() };
  var res = await community.handleCommunity(req('/community/questions'), env);
  assert.strictEqual(res.status, 200);
  var data = await res.json();
  assert.strictEqual(data.total, 4);
  assert.ok(data.questions.every(function (row) { return !row.authorId; }));
  var again = await community.handleCommunity(req('/community/questions'), env);
  assert.strictEqual((await again.json()).total, 4);

  var pre = await community.handleCommunity(req('/community/questions', { method: 'OPTIONS' }), env);
  assert.strictEqual(pre.status, 204);
  assert.strictEqual(pre.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8765');

  var created = await community.handleCommunity(req('/community/questions', {
    method: 'POST',
    author: 'web_author_ok',
    body: {
      title: '周末室内可以去哪玩',
      body: '想找一个适合三岁孩子的室内地方，不要太吵。',
      category: 'activities',
      displayName: '测试妈妈',
      anonymous: false
    }
  }), env);
  assert.strictEqual(created.status, 201);
  var published = await created.json();
  assert.strictEqual(published.status, 'published');
  assert.strictEqual(published.authorIdEcho, 'web_author_ok');
  assert.ok(!published.authorId);

  var pendingRes = await community.handleCommunity(req('/community/questions', {
    method: 'POST',
    author: 'web_author_pending',
    body: {
      title: '孩子发烧要不要用药',
      body: '想问剂量，也可以加我微信细聊。',
      category: 'medical',
      displayName: '担心的妈妈',
      anonymous: false,
      sensitive: true
    }
  }), env);
  assert.strictEqual(pendingRes.status, 201);
  var pending = await pendingRes.json();
  assert.strictEqual(pending.status, 'pending');

  var listed = await (await community.handleCommunity(req('/community/questions'), env)).json();
  assert.ok(listed.questions.some(function (row) { return row.id === published.id; }));
  assert.ok(!listed.questions.some(function (row) { return row.id === pending.id; }));

  var hidden = await community.handleCommunity(req('/community/questions/' + pending.id), env);
  assert.strictEqual(hidden.status, 404);
  var mine = await (await community.handleCommunity(req('/community/questions?mine=1', { author: 'web_author_pending' }), env)).json();
  assert.ok(mine.questions.some(function (row) { return row.id === pending.id && row.status === 'pending'; }));
});

test('Medical answers get a disclaimer; high-risk words stay pending', async function () {
  var env = { MARKT: community.createMemoryKv(), COMMUNITY_MOD_SECRET: 'mod-secret-test' };
  var benign = await community.handleCommunity(req('/community/questions/seed-fever/answers', {
    method: 'POST',
    author: 'web_med_author',
    body: { body: '只是分享我们去急诊排队的经历，供其他家长参考。', displayName: '经验家长', anonymous: false }
  }), env);
  assert.strictEqual(benign.status, 201);
  var answer = await benign.json();
  assert.strictEqual(answer.status, 'published');
  assert.strictEqual(answer.answer.disclaimer, true);
  assert.strictEqual(answer.answer.disclaimerLabel, '经验分享，非专业意见');

  var risky = community.moderationDecision({
    category: 'medical',
    title: '',
    body: '不是诊断，只是提到了诊断这两个字。'
  });
  assert.strictEqual(risky.status, 'pending');
  assert.ok(risky.reasons.indexOf('high-risk') !== -1);

  var selfLike = await community.handleCommunity(req('/community/answers/' + answer.answer.id + '/like', {
    method: 'POST',
    author: 'web_med_author',
    body: { liked: true }
  }), env);
  assert.strictEqual(selfLike.status, 403);

  var like = await community.handleCommunity(req('/community/answers/' + answer.answer.id + '/like', {
    method: 'POST',
    author: 'web_liker_one',
    body: { liked: true }
  }), env);
  assert.strictEqual(like.status, 200);
  assert.deepStrictEqual(await like.json(), { likeCount: 1, liked: true });
  var again = await community.handleCommunity(req('/community/answers/' + answer.answer.id + '/like', {
    method: 'POST',
    author: 'web_liker_one',
    body: { liked: true }
  }), env);
  assert.deepStrictEqual(await again.json(), { likeCount: 1, liked: true });
  var unlike = await community.handleCommunity(req('/community/answers/' + answer.answer.id + '/like', {
    method: 'DELETE',
    author: 'web_liker_one'
  }), env);
  assert.deepStrictEqual(await unlike.json(), { likeCount: 0, liked: false });
});

test('Mod routes require COMMUNITY_MOD_SECRET and can publish a pending question', async function () {
  var env = { MARKT: community.createMemoryKv() };
  var open = await community.handleCommunity(req('/community/mod/queue'), env);
  assert.strictEqual(open.status, 503);

  env.COMMUNITY_MOD_SECRET = 'mod-secret-test';
  var denied = await community.handleCommunity(req('/community/mod/queue', { secret: 'wrong-secret' }), env);
  assert.strictEqual(denied.status, 401);

  var created = await community.handleCommunity(req('/community/questions', {
    method: 'POST',
    author: 'web_author_mod',
    body: {
      title: '签证材料想问清楚',
      body: '想了解家庭团聚签证大概要准备哪些材料。',
      category: 'legal',
      displayName: '新来的爸爸',
      anonymous: false
    }
  }), env);
  var row = await created.json();
  assert.strictEqual(row.status, 'pending');

  var queue = await (await community.handleCommunity(req('/community/mod/queue', { secret: 'mod-secret-test' }), env)).json();
  assert.ok(queue.questions.some(function (item) { return item.id === row.id; }));

  var approved = await community.handleCommunity(req('/community/mod/questions/' + row.id + '/approve', {
    method: 'POST',
    secret: 'mod-secret-test',
    body: {}
  }), env);
  assert.strictEqual(approved.status, 200);
  var listed = await (await community.handleCommunity(req('/community/questions'), env)).json();
  assert.ok(listed.questions.some(function (item) { return item.id === row.id; }));

  var rejected = await community.handleCommunity(req('/community/mod/questions/' + row.id + '/reject', {
    method: 'POST',
    secret: 'mod-secret-test',
    body: {}
  }), env);
  assert.strictEqual(rejected.status, 400);
});

test('Anonymous posts hide the author id and three reports hide a question', async function () {
  var env = { MARKT: community.createMemoryKv() };
  var created = await community.handleCommunity(req('/community/questions', {
    method: 'POST',
    author: 'web_anon_author',
    body: {
      title: '匿名问一个日常问题',
      body: '想问问附近哪里可以买到合适的儿童雨鞋。',
      category: 'life',
      anonymous: true
    }
  }), env);
  var row = await created.json();
  assert.strictEqual(row.status, 'published');
  assert.strictEqual(row.displayName, '匿名家长');
  assert.ok(!row.authorId);
  var detail = await (await community.handleCommunity(req('/community/questions/' + row.id), env)).json();
  assert.ok(!detail.question.authorId);
  assert.strictEqual(detail.question.displayName, '匿名家长');

  var reasons = ['广告', '重复', '不合适'];
  for (var i = 0; i < reasons.length; i++) {
    var report = await community.handleCommunity(req('/community/report', {
      method: 'POST',
      author: 'web_reporter_' + i,
      body: { targetType: 'question', targetId: row.id, reason: reasons[i] }
    }), env);
    var body = await report.json();
    assert.strictEqual(report.status, 201);
    assert.strictEqual(body.hidden, i === 2);
  }
  var gone = await community.handleCommunity(req('/community/questions/' + row.id), env);
  assert.strictEqual(gone.status, 404);
});
