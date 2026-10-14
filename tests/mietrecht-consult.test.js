/**
 * Mietrecht consult: rental questions use the packed KB, 5–8 points,
 * and do not fall through to a Freizeit / Essen directory answer.
 *
 * Run: node tests/mietrecht-consult.test.js
 */
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var consult = require('../js/mietrecht-consult.js');

var KB_PATH = path.join(__dirname, '../data/KB/_pack_for_chat/kb_mietrecht_mieter_duesseldorf.txt');
var kb = fs.readFileSync(KB_PATH, 'utf8');

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

function pointsOf(result) {
  return result.text.split('\n').filter(function (line) { return /^\d+\.\s/.test(line); });
}

test('every Chinese anchor is a phrase from the packed article', function () {
  consult.TOPICS.forEach(function (topic) {
    topic.anchors.forEach(function (anchor) {
      assert.ok(kb.indexOf(anchor) !== -1, topic.id + ' missing anchor: ' + anchor);
    });
  });
});

test('contract question returns 5–8 KB points and names Mieterverein', function () {
  var result = consult.answer('杜塞租房合同要注意什么');
  assert.strictEqual(result.handled, true);
  assert.strictEqual(result.source, 'kb-mietrecht');
  assert.strictEqual(result.topic, 'contract');
  assert.strictEqual(result.lang, 'zh');
  assert.ok(result.points >= 5 && result.points <= 8, 'points ' + result.points);
  assert.ok(/暖租|冷租/.test(result.text));
  assert.ok(/Mietpreisbremse/.test(result.text));
  assert.ok(/Übergabeprotokoll/.test(result.text));
  assert.ok(/Mieterverein/.test(result.text));
  assert.ok(/一般信息/.test(result.text));
  assert.ok(!/Freizeit/.test(result.text));
  assert.ok(!/我找到这/.test(result.text));
});

test('deposit question stays on Kaution facts from the KB', function () {
  var result = consult.answer('押金怎么退');
  assert.strictEqual(result.topic, 'kaution');
  assert.ok(result.points >= 5 && result.points <= 8);
  assert.ok(/3 个月冷租/.test(result.text));
  assert.ok(/3–6 个月/.test(result.text));
  assert.ok(/正常磨损/.test(result.text));
  assert.ok(/分开存放|利息/.test(result.text));
});

test('rent increase question uses the Düsseldorf cap from the KB', function () {
  var result = consult.answer('房东涨租合法吗');
  assert.strictEqual(result.topic, 'increase');
  assert.ok(result.points >= 5 && result.points <= 8);
  assert.ok(/15%|15 个月/.test(result.text));
  assert.ok(/Mietpreisbremse|Rüge/.test(result.text));
  assert.ok(/不必当场/.test(result.text));
});

test('Eigenbedarf question warns not to sign and mentions the 8-year rule', function () {
  var result = consult.answer('被 Eigenbedarf 赶怎么办');
  assert.strictEqual(result.topic, 'eigenbedarf');
  assert.strictEqual(result.lang, 'zh');
  assert.ok(result.points >= 5 && result.points <= 8);
  assert.ok(/别签|先别签/.test(result.text));
  assert.ok(/8 年/.test(result.text));
  assert.ok(/Widerspruch/.test(result.text));
  assert.ok(/Mieterverein/.test(result.text));
});

test('German Kaution and Mietpreisbremse stay in German and on the KB', function () {
  var kaution = consult.answer('Wie bekomme ich die Kaution zurück?');
  assert.strictEqual(kaution.topic, 'kaution');
  assert.strictEqual(kaution.lang, 'de');
  assert.ok(kaution.points >= 5 && kaution.points <= 8);
  assert.ok(/3 Nettokaltmieten/.test(kaution.text));
  assert.ok(/3–6 Monate/.test(kaution.text));
  assert.ok(/keine Rechtsberatung/.test(kaution.text));

  var bremse = consult.answer('Ist die Mieterhöhung wegen Mietpreisbremse in Düsseldorf erlaubt?');
  assert.strictEqual(bremse.topic, 'increase');
  assert.strictEqual(bremse.lang, 'de');
  assert.ok(/15 %/.test(bremse.text));
  assert.ok(/Mietpreisbremse/.test(bremse.text));
});

test('Nebenkosten and Wohnungsgeberbestätigung hit consult, not a directory', function () {
  var neben = consult.answer('Nebenkostenabrechnung 看不懂，杂费能查吗');
  assert.strictEqual(neben.topic, 'nebenkosten');
  assert.strictEqual(neben.lang, 'zh');
  assert.ok(neben.points >= 5 && neben.points <= 8);
  assert.ok(/12 个月/.test(neben.text));
  assert.ok(/15%/.test(neben.text));

  var wgb = consult.answer('房东不给 Wohnungsgeberbestätigung 怎么办');
  assert.strictEqual(wgb.topic, 'wohnungsgeber');
  assert.ok(/法定义务/.test(wgb.text));
  assert.ok(/合同不够/.test(wgb.text));
});

test('Freizeit and plain Anmeldung are not captured by the rental KB', function () {
  assert.strictEqual(consult.answer('这周末带孩子去 Südpark 玩什么').handled, false);
  assert.strictEqual(consult.answer('附近有什么好吃的').handled, false);
  assert.strictEqual(consult.answer('办 Anmeldung 大概要准备些什么呀').handled, false);
  assert.strictEqual(consult.answer('孩子生日去哪办').handled, false);
});

test('closing phone is the Mieterverein number already in the article', function () {
  assert.ok(kb.indexOf('0211 / 16 99 6-0') !== -1);
  var result = consult.answer('租房合同要注意什么');
  assert.ok(result.text.indexOf('0211 16 99 6-0') !== -1);
  assert.ok(result.text.indexOf('710649') === -1);
  assert.ok(result.text.indexOf('89-90141') === -1);
});

test('sample answers stay crisp', function () {
  ['杜塞租房合同要注意什么', '押金怎么退', '房东涨租合法吗', '被 Eigenbedarf 赶怎么办'].forEach(function (q) {
    var result = consult.answer(q);
    assert.ok(result.handled, q);
    assert.ok(result.text.length < 1200, q + ' too long: ' + result.text.length);
    assert.ok(pointsOf(result).length >= 5 && pointsOf(result).length <= 8);
  });
});

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nall mietrecht consult checks passed');
