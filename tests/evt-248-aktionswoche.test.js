/**
 * evt-248 Aktionswoche — calendar record only.
 * Run: node tests/evt-248-aktionswoche.test.js
 *
 * The Worker calendar parser keeps a span only when `when` contains
 * `d.m.–d.m.yyyy`. "Sa 14.11.–So 22.11.2026" collapses to the 14th and the 22nd,
 * so mid-week November days would not list the event.
 */
var assert = require('assert');
var events = require('../data/events.json');

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

function byId(id) {
  return events.filter(function (e) { return e.id === id; })[0];
}

function userStrings(event) {
  var out = [event.name, event.when, event.place, event.cost, event.website];
  var i18n = event.i18n || {};
  Object.keys(i18n).forEach(function (lang) {
    var block = i18n[lang] || {};
    ['name', 'when', 'place', 'cost'].forEach(function (key) {
      if (block[key]) out.push(block[key]);
    });
  });
  return out;
}

test('catalog keeps evt-247 and adds only evt-248', function () {
  assert.strictEqual(events.length, 248);
  assert.ok(byId('evt-247'));
  assert.strictEqual(byId('evt-247').name, 'Martinszug Gerresheim (Am Poth)');
  assert.strictEqual(events.filter(function (e) { return e.id === 'evt-248'; }).length, 1);
  assert.strictEqual(byId('evt-249'), undefined);
  assert.strictEqual(events[events.length - 1].id, 'evt-248');
});

test('evt-248 is a confirmed November family week, type J like neighboring week programmes', function () {
  var e = byId('evt-248');
  assert.strictEqual(e.type, 'J');
  assert.strictEqual(e.month, 11);
  assert.strictEqual(e.confirmed, true);
  assert.strictEqual(e.name, 'Aktionswoche für Allein- und Getrennterziehende');
  assert.strictEqual(e.place, 'verschiedene Orte in allen Düsseldorfer Stadtteilen (siehe Programm)');
  assert.strictEqual(e.cost, 'kostenlos, sofern nicht anders angegeben; teils Anmeldung nötig');
  assert.strictEqual(e.website, 'https://www.duesseldorf.de/familie/alleine-erziehen/aktionswoche');
  assert.strictEqual(e.description, undefined);
  assert.strictEqual(e.i18n.zh.name, '单亲家庭行动周');
  assert.strictEqual(e.i18n.en.name, 'Action week for single and separated parents');
});

test('German when is one 14–22 Nov 2026 span the calendar can expand', function () {
  var when = byId('evt-248').when;
  var norm = String(when).replace(/[－–—−]/g, '-');
  var m = /(\d{1,2})\.(?:(\d{1,2})\.)?(?:(\d{4}))?\s*-\s*(\d{1,2})\.(\d{1,2})\.(?:(\d{4}))?/.exec(norm);
  assert.ok(m, 'missing d.m.–d.m.yyyy range');
  assert.strictEqual(m[1], '14');
  assert.strictEqual(m[2], '11');
  assert.strictEqual(m[4], '22');
  assert.strictEqual(m[5], '11');
  assert.strictEqual(m[6], '2026');
  var dates = norm.match(/\d{1,2}\.\d{1,2}\./g) || [];
  assert.deepStrictEqual(dates, ['14.11.', '22.11.']);
  assert.ok(when.indexOf('Programm in allen Stadtteilen') !== -1);
  assert.ok(when.indexOf('Efa') !== -1);
});

test('user-facing fields do not contain the internal id or editor notes', function () {
  var banned = ['evt-', 'geprüft', '官网已核', 'Entwurf', 'Draft', 'verified', '已核'];
  userStrings(byId('evt-248')).forEach(function (text) {
    banned.forEach(function (word) {
      assert.ok(text.toLowerCase().indexOf(word.toLowerCase()) === -1, text + ' contains ' + word);
    });
  });
  assert.strictEqual(byId('evt-248').id, 'evt-248');
});

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('all evt-248 checks passed');
