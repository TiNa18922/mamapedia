/**
 * Community Q&A slice — rules copy, nav, and front-end-only boundary.
 * Run: node tests/community-qa.test.js
 */
var assert = require('assert');
var fs = require('fs');
var path = require('path');

var root = path.join(__dirname, '..');
var html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
var js = fs.readFileSync(path.join(root, 'js', 'community.js'), 'utf8');

var failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('ok  ' + name);
  } catch (err) {
    failed += 1;
    console.error('FAIL ' + name);
    console.error(err && err.stack ? err.stack : err);
  }
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
});

test('Front-end slice does not call a Community worker', function () {
  assert.ok(js.indexOf('TODO(community-api)') !== -1);
  assert.ok(js.indexOf('mamapedia-chat') !== -1);
  assert.ok(!/fetch\s*\(/.test(js), 'community.js should not fetch');
  assert.ok(js.indexOf('function openNewPost') !== -1);
  assert.ok(js.indexOf('showGate') === -1);
  assert.ok(html.indexOf('src="js/community.js"') !== -1);
});

test('Empty states and answer likes exist', function () {
  assert.ok(js.indexOf('id="com-empty"') !== -1);
  assert.ok(js.indexOf('function toggleAnswerLike') !== -1);
  assert.ok(js.indexOf('communityPending') !== -1);
  assert.ok(html.indexOf("filterPosts('review'") !== -1);
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('community-qa: all passed');
