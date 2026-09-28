/**
 * MamaPedia answer contract 3.1 — Geburtstagsparty cases A / B / C.
 *
 * Run: node tests/birthday-answer-contract.test.js
 *
 * A  下周日、10 个孩子、没有年龄/预算 → 先问一句，不丢通用名单
 * B  再加约 8 岁、每人不超过 15 € → 名单必须和 A 不同；超预算/年龄不符的不进推荐；
 *    每条写出年龄和价格，缺字段标「未核实」
 * C  预算低到没有核实命中 → 说明卡在预算上，并建议放宽，不编造场馆
 */
var assert = require('assert');
var birthday = require('../js/birthday-answer.js');
var catalog = require('../data/geburtstagsparty.json');
var listings = catalog.listings;

var Q_A = '我想下周日办个生日Party，邀请10个孩子，你有什么建议';
var Q_B = '我想下周日办个生日Party，邀请10个孩子，每个孩子预算不超过15欧，孩子的年龄大概8岁，你有什么建议';
var Q_C = '我想下周日办个生日Party，邀请10个孩子，每个孩子预算不超过1欧，孩子的年龄大概8岁，你有什么建议';

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

function ids(result) {
  return (result.shown || []).map(function (item) { return item.id; });
}

function excluded(result, id) {
  return (result.excluded || []).filter(function (item) { return item.id === id; })[0];
}

test('parser reads Chinese age, guests, budget and Sunday', function () {
  var c = birthday.parseConstraints(Q_B);
  assert.strictEqual(c.age, 8);
  assert.strictEqual(c.guests, 10);
  assert.strictEqual(c.budgetCents, 1500);
  assert.strictEqual(c.sunday, true);
});

test('parser reads Chinese numerals and does not treat the budget as age', function () {
  var c = birthday.parseConstraints('下周日请十个孩子，大概八岁，每人不超过十五欧');
  assert.strictEqual(c.guests, 10);
  assert.strictEqual(c.age, 8);
  assert.strictEqual(c.budgetCents, 1500);
});

test('parser reads German and English', function () {
  var de = birthday.parseConstraints('Ich möchte nächsten Sonntag eine Geburtstagsparty für 10 Kinder feiern. Etwa 8 Jahre, maximal 15 Euro pro Kind.');
  assert.strictEqual(de.age, 8);
  assert.strictEqual(de.guests, 10);
  assert.strictEqual(de.budgetCents, 1500);
  assert.strictEqual(de.sunday, true);
  var en = birthday.parseConstraints('Birthday party next Sunday for 10 kids, about 8 years old, no more than 15 euros per child. Any suggestions?');
  assert.strictEqual(en.age, 8);
  assert.strictEqual(en.guests, 10);
  assert.strictEqual(en.budgetCents, 1500);
  assert.strictEqual(en.sunday, true);
});

test('A asks for age and budget instead of dumping the venue list', function () {
  var a = birthday.buildBirthdayAnswer(Q_A, { lang: 'zh', listings: listings });
  assert.strictEqual(a.mode, 'clarify');
  assert.deepStrictEqual(ids(a), []);
  assert.ok(/10/.test(a.text), 'restates 10 kids');
  assert.ok(/几岁/.test(a.text));
  assert.ok(/预算/.test(a.text));
  assert.ok(!/Superfly/.test(a.text));
  assert.ok(!/Bobolino/.test(a.text));
  assert.ok(!/适合年龄/.test(a.text));
});

test('B differs from A and keeps only venues verified inside the constraints', function () {
  var a = birthday.buildBirthdayAnswer(Q_A, { lang: 'zh', listings: listings });
  var b = birthday.buildBirthdayAnswer(Q_B, { lang: 'zh', listings: listings });
  assert.strictEqual(b.mode, 'matches');
  assert.notDeepStrictEqual(ids(a), ids(b));
  assert.ok(ids(b).indexOf('ginos') >= 0, 'Gino entry price is 12 €');
  ['superfly', 'bobolino', 'trampolino', 'einstein', 'duesselstrand', 'aquazoo', 'benrath', 'kunstpalast', 'happykids'].forEach(function (id) {
    assert.ok(ids(b).indexOf(id) < 0, id + ' must not be recommended at ≤15 €');
  });
  assert.ok(excluded(b, 'superfly').reasons.indexOf('budget') >= 0);
  assert.ok(excluded(b, 'bobolino').reasons.indexOf('budget') >= 0);
  assert.ok(excluded(b, 'aquazoo').reasons.indexOf('sunday') >= 0);
  assert.ok(/大约 10 个孩子/.test(b.text));
  assert.ok(/大约 8 岁/.test(b.text));
  assert.ok(/15 €/.test(b.text));
  assert.ok(!/几岁/.test(b.text), 'does not re-ask a constraint the user already gave');
  b.shown.forEach(function (item) {
    assert.ok(item.ageText && item.ageText.length, item.id + ' age');
    assert.ok(item.priceText && /€|未核实/.test(item.priceText), item.id + ' price');
    assert.ok(/适合年龄/.test(b.text));
    assert.ok(/人均/.test(b.text));
    if (item.ageStatus !== 'pass') assert.ok(/未核实/.test(item.ageText));
    if (item.priceStatus !== 'pass') assert.ok(/未核实/.test(item.priceText));
  });
  var gino = b.shown.filter(function (item) { return item.id === 'ginos'; })[0];
  assert.ok(/1.8|1–18|1-18/.test(gino.ageText));
  assert.ok(/12/.test(gino.priceText));
  assert.strictEqual(gino.guestStatus, 'unknown');
  assert.ok(/未核实/.test(gino.guestText));
  assert.ok(/未核实/.test(b.text));
  assert.ok(!/Superfly/.test(b.text));
});

test('B is the same filter in German and English', function () {
  var de = birthday.buildBirthdayAnswer(
    'Ich möchte nächsten Sonntag eine Geburtstagsparty für 10 Kinder feiern. Etwa 8 Jahre, maximal 15 Euro pro Kind. Was empfiehlst du?',
    { lang: 'de', listings: listings }
  );
  var en = birthday.buildBirthdayAnswer(
    'Birthday party next Sunday for 10 kids, about 8 years old, no more than 15 euros per child. Any suggestions?',
    { lang: 'en', listings: listings }
  );
  assert.deepStrictEqual(ids(de), ['ginos']);
  assert.deepStrictEqual(ids(en), ['ginos']);
  assert.ok(/Alter:/.test(de.text));
  assert.ok(/Ages:/.test(en.text));
  assert.ok(/12/.test(de.text) && /12/.test(en.text));
});

test('C explains the budget blocker and does not invent matches', function () {
  var c = birthday.buildBirthdayAnswer(Q_C, { lang: 'zh', listings: listings });
  assert.strictEqual(c.mode, 'none');
  assert.deepStrictEqual(ids(c), []);
  assert.strictEqual(c.relaxPerChildCents, 1200);
  assert.ok(/1 €/.test(c.text));
  assert.ok(/12/.test(c.text));
  assert.ok(/放宽|放到/.test(c.text));
  assert.ok(!/适合年龄/.test(c.text), 'no recommendation cards');
  assert.ok(!/Superfly/.test(c.text));
});

test('a follow-up with age and budget uses the earlier birthday request', function () {
  var history = [
    { role: 'user', content: Q_A },
    { role: 'assistant', content: '孩子大约几岁？' }
  ];
  var follow = birthday.buildBirthdayAnswer('大概8岁，每人不超过15欧', {
    lang: 'zh',
    listings: listings,
    history: history
  });
  var direct = birthday.buildBirthdayAnswer(Q_B, { lang: 'zh', listings: listings });
  assert.deepStrictEqual(ids(follow), ids(direct));
  var tightened = birthday.buildBirthdayAnswer('每人不超过1欧', {
    lang: 'zh',
    listings: listings,
    history: history.concat([
      { role: 'user', content: '大概8岁，每人不超过15欧' },
      { role: 'assistant', content: '按 15 € 筛过了' }
    ])
  });
  assert.strictEqual(tightened.mode, 'none');
  assert.strictEqual(tightened.constraints.budgetCents, 100);
  assert.strictEqual(tightened.constraints.guests, 10);
});

test('non-birthday questions are left to the normal chat path', function () {
  assert.strictEqual(birthday.buildBirthdayAnswer('怎么找儿科医生？', { lang: 'zh', listings: listings }), null);
  assert.strictEqual(birthday.buildBirthdayAnswer('Elterngeld 怎么申请', { lang: 'zh', listings: listings }), null);
});

test('wrong age and too-small groups are excluded when the fields exist', function () {
  var young = birthday.buildBirthdayAnswer('生日派对，5岁，10个孩子，每人不超过30欧', {
    lang: 'zh',
    listings: listings
  });
  assert.ok(ids(young).indexOf('superfly') < 0);
  assert.ok(excluded(young, 'superfly').reasons.indexOf('age') >= 0);
  assert.ok(ids(young).indexOf('ginos') >= 0);
  var small = birthday.buildBirthdayAnswer('生日派对，8岁，4个孩子，每人不超过20欧', {
    lang: 'zh',
    listings: listings
  });
  assert.ok(ids(small).indexOf('bobolino') < 0);
  assert.ok(excluded(small, 'bobolino').reasons.indexOf('guests') >= 0);
  assert.ok(ids(small).indexOf('ginos') >= 0);
});

test('price_per_child is used even when price_tiers are also present', function () {
  var mixed = {
    id: 'mixed',
    name: 'Mixed Price Venue',
    city: 'Düsseldorf',
    geo: 'duesseldorf',
    party: {
      min_age: 6,
      max_age: 10,
      price_per_child: 12,
      price_complete: true,
      price_tiers: [{ max_guests: 8, price_flat: 200 }]
    }
  };
  var result = birthday.buildBirthdayAnswer('生日派对建议，8岁，8个孩子，每人不超过15欧', {
    lang: 'zh',
    listings: [mixed]
  });
  assert.deepStrictEqual(ids(result), ['mixed']);
  assert.ok(/12/.test(result.shown[0].priceText));
  assert.ok(/6.10|6–10|6-10/.test(result.shown[0].ageText));
  assert.ok(/至 8/.test(result.shown[0].priceText), 'tiers stay visible beside price_per_child');
});

test('twenty children excludes venues with a published max of 10', function () {
  var result = birthday.buildBirthdayAnswer('生日派对，8岁，20个孩子，每人不超过40欧', {
    lang: 'zh',
    listings: listings
  });
  assert.ok(ids(result).indexOf('kunstpalast') < 0);
  assert.ok(excluded(result, 'kunstpalast').reasons.indexOf('guests') >= 0);
  assert.ok(excluded(result, 'aquazoo').reasons.indexOf('sunday') >= 0 || excluded(result, 'aquazoo').reasons.indexOf('guests') >= 0);
});

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nall birthday answer contract checks passed');
