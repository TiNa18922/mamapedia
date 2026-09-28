/*
 * MamaPedia answer contract — Geburtstagsparty only.
 *
 * Flow: parse hard/soft constraints → hard-filter on structured party fields
 * → answer that restates the filters and shows age, price, and guest range.
 * Missing fields stay 「未核实」 and never count as a satisfied hard constraint.
 * The model is not asked to invent or re-rank venues for this intent.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MamaPediaBirthday = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var ZH_DIGIT = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

  var STR = {
    zh: {
      unverified: '未核实',
      age: '适合年龄',
      price: '人均',
      guests: '人数',
      sunday: '周日',
      indoor: '室内',
      outdoor: '户外',
      phone: '电话',
      web: '官网',
      years: '岁',
      people: '名儿童',
      fromAge: function (n) { return n + ' 岁起'; },
      toAge: function (n) { return '最多 ' + n + ' 岁'; },
      rangeAge: function (a, b) { return a + '–' + b + ' 岁'; },
      atLeast: function (n) { return '至少 ' + n + ' 名'; },
      atMost: function (n) { return '最多 ' + n + ' 名'; },
      guestRange: function (a, b) { return a + '–' + b + ' 名'; },
      clarify: function (c) {
        var when = c.sunday ? '下周日' : '';
        var who = c.guests ? '给大约 ' + c.guests + ' 个孩子' : '';
        var known = (when || who) ? ('你想' + when + who + '办一场生日。') : '你想办一场儿童生日。';
        return known + '年龄和人均预算会改掉能推荐的场地，所以我先不丢一份通用名单。\n\n孩子大约几岁？每人预算上限大概多少欧元？有了这两点，我就按目录里的适龄和价格来筛。';
      },
      opening: function (c) {
        var bits = [];
        if (c.sunday) bits.push('下周日');
        if (c.guests) bits.push('大约 ' + c.guests + ' 个孩子');
        if (c.age != null) bits.push('大约 ' + c.age + ' 岁');
        if (c.budgetCents != null) bits.push('每人不超过 ' + formatMoney(c.budgetCents, 'zh'));
        return '这次按这些条件筛生日场地：' + bits.join('、') + '。只保留结构化字段对得上的；对不上的不放进推荐。价格、适龄或人数没写清的，会标成「未核实」，不当成已经符合。';
      },
      sundayNote: '下周日有没有空档，目录里没有实时预约，所以还要电话确认。已经写明周末不开放的，这次排除了。',
      cardOk: '价格和适龄对得上',
      cardGap: '有未核实项',
      noMatch: function (c, cheapest) {
        var bits = [];
        if (c.sunday) bits.push('下周日');
        if (c.guests) bits.push('大约 ' + c.guests + ' 个孩子');
        if (c.age != null) bits.push('大约 ' + c.age + ' 岁');
        if (c.budgetCents != null) bits.push('每人不超过 ' + formatMoney(c.budgetCents, 'zh'));
        var head = '按' + bits.join('、') + '筛下来，没有场地能核实落在这个预算里。';
        var relax = '';
        if (cheapest) {
          relax = '已核实的最低花费是 ' + cheapest.label + '，仍然高于你说的上限。可以把人均预算放到大约 ' +
            formatMoney(cheapest.cents, 'zh') + ' 再看，或者再高一点把含餐场地也纳入。要不要按放宽后的预算再筛一次？';
        } else {
          relax = '目录里也没有核实到的人均价格，不能假装有这个预算内的场馆。可以先放宽预算，或打电话问具体报价。';
        }
        return head + '\n\n' + relax + '\n\n没有公布价格的场地，不能当成符合这个预算的推荐。';
      },
      footer: function (nHidden) {
        var s = '已核实超预算、年龄不符、人数超出或周日不开放的场地没有放进这份名单。';
        if (nHidden) s += '另外 ' + nHidden + ' 家没有核实到能对上预算的价格，所以也没有列在这里。';
        return s;
      },
      sundayOpen: '周日不打烊，具体空档未核实',
      sundayUnknown: '周日是否可订未核实',
      guestsFitUnknown: '目录没有最少/最多人数',
      ageRecommended: '节目年龄只是场馆建议，不当作硬性适龄'
    },
    de: {
      unverified: 'nicht verifiziert',
      age: 'Alter',
      price: 'Preis pro Kind',
      guests: 'Personenzahl',
      sunday: 'Sonntag',
      indoor: 'drinnen',
      outdoor: 'draußen',
      phone: 'Telefon',
      web: 'Website',
      years: 'Jahre',
      people: 'Kinder',
      fromAge: function (n) { return 'ab ' + n + ' Jahren'; },
      toAge: function (n) { return 'bis ' + n + ' Jahre'; },
      rangeAge: function (a, b) { return a + '–' + b + ' Jahre'; },
      atLeast: function (n) { return 'mindestens ' + n; },
      atMost: function (n) { return 'höchstens ' + n; },
      guestRange: function (a, b) { return a + '–' + b; },
      clarify: function (c) {
        var bits = [];
        if (c.sunday) bits.push('am nächsten Sonntag');
        if (c.guests) bits.push('für etwa ' + c.guests + ' Kinder');
        var known = bits.length ? ('Du möchtest ' + bits.join(' ') + ' Geburtstag feiern. ') : 'Du möchtest einen Kindergeburtstag planen. ';
        return known + 'Alter und Budget pro Kind ändern die Liste, deshalb schicke ich noch keine allgemeine Auswahl.\n\nWie alt ist das Kind ungefähr, und wie viel Euro pro Kind ist die Obergrenze?';
      },
      opening: function (c) {
        var bits = [];
        if (c.sunday) bits.push('nächster Sonntag');
        if (c.guests) bits.push('etwa ' + c.guests + ' Kinder');
        if (c.age != null) bits.push('etwa ' + c.age + ' Jahre');
        if (c.budgetCents != null) bits.push('höchstens ' + formatMoney(c.budgetCents, 'de') + ' pro Kind');
        return 'Ich filtere Geburtstagsorte nach: ' + bits.join(', ') + '. Nur Einträge mit passenden strukturierten Feldern kommen in die Liste. Fehlende Angaben stehen als „nicht verifiziert“ und gelten nicht als erfüllt.';
      },
      sundayNote: 'Ob nächsten Sonntag noch ein Termin frei ist, steht nicht im Katalog und muss telefonisch geprüft werden. Orte, die am Wochenende geschlossen sind, sind raus.',
      cardOk: 'Preis und Alter passen',
      cardGap: 'mit offener Angabe',
      noMatch: function (c, cheapest) {
        var bits = [];
        if (c.sunday) bits.push('nächster Sonntag');
        if (c.guests) bits.push('etwa ' + c.guests + ' Kinder');
        if (c.age != null) bits.push('etwa ' + c.age + ' Jahre');
        if (c.budgetCents != null) bits.push('höchstens ' + formatMoney(c.budgetCents, 'de') + ' pro Kind');
        var head = 'Mit ' + bits.join(', ') + ' bleibt kein Ort übrig, dessen Preis nachweislich ins Budget passt.';
        var relax = cheapest
          ? 'Der niedrigste verifizierte Preis ist ' + cheapest.label + ' und liegt über deiner Grenze. Soll ich noch einmal mit etwa ' + formatMoney(cheapest.cents, 'de') + ' pro Kind schauen?'
          : 'Im Katalog fehlt ein verifizierter Preis pro Kind. Ich kann keine Orte innerhalb dieses Budgets behaupten.';
        return head + '\n\n' + relax + '\n\nOrte ohne veröffentlichten Preis zählen nicht als Treffer.';
      },
      footer: function (nHidden) {
        var s = 'Was nachweislich über dem Budget liegt, vom Alter oder der Personenzahl abweicht oder sonntags geschlossen ist, steht nicht in dieser Liste.';
        if (nHidden) s += ' ' + nHidden + ' weitere Orte haben keinen verifizierten Preis im Budget und fehlen deshalb.';
        return s;
      },
      sundayOpen: 'sonntags geöffnet, konkreter Termin nicht verifiziert',
      sundayUnknown: 'Sonntagstermin nicht verifiziert',
      guestsFitUnknown: 'keine Mindest- oder Höchstzahl im Katalog',
      ageRecommended: 'Altersangaben sind nur Empfehlungen der Location'
    },
    en: {
      unverified: 'unverified',
      age: 'Ages',
      price: 'Per child',
      guests: 'Guests',
      sunday: 'Sunday',
      indoor: 'indoor',
      outdoor: 'outdoor',
      phone: 'Phone',
      web: 'Website',
      years: 'years',
      people: 'children',
      fromAge: function (n) { return 'from ' + n; },
      toAge: function (n) { return 'up to ' + n; },
      rangeAge: function (a, b) { return a + '–' + b + ' years'; },
      atLeast: function (n) { return 'at least ' + n; },
      atMost: function (n) { return 'at most ' + n; },
      guestRange: function (a, b) { return a + '–' + b; },
      clarify: function (c) {
        var bits = [];
        if (c.sunday) bits.push('next Sunday');
        if (c.guests) bits.push('for about ' + c.guests + ' kids');
        var known = bits.length ? ('You want a birthday party ' + bits.join(' ') + '. ') : 'You want a children\'s birthday party. ';
        return known + 'Age and the per-child budget change which venues fit, so I will not send a generic list yet.\n\nAbout how old is the child, and what is the maximum in euros per child?';
      },
      opening: function (c) {
        var bits = [];
        if (c.sunday) bits.push('next Sunday');
        if (c.guests) bits.push('about ' + c.guests + ' kids');
        if (c.age != null) bits.push('about ' + c.age + ' years old');
        if (c.budgetCents != null) bits.push('no more than ' + formatMoney(c.budgetCents, 'en') + ' per child');
        return 'I filtered birthday venues by: ' + bits.join(', ') + '. Only structured fields decide the list. Anything missing is marked unverified and does not count as a match.';
      },
      sundayNote: 'The catalog has no live availability, so next Sunday still needs a phone check. Venues that are closed on weekends are excluded.',
      cardOk: 'price and age match',
      cardGap: 'something unverified',
      noMatch: function (c, cheapest) {
        var bits = [];
        if (c.sunday) bits.push('next Sunday');
        if (c.guests) bits.push('about ' + c.guests + ' kids');
        if (c.age != null) bits.push('about ' + c.age);
        if (c.budgetCents != null) bits.push('no more than ' + formatMoney(c.budgetCents, 'en') + ' per child');
        var head = 'With ' + bits.join(', ') + ', no venue has a verified price inside that budget.';
        var relax = cheapest
          ? 'The lowest verified price is ' + cheapest.label + ', which is still above your cap. I can filter again at about ' + formatMoney(cheapest.cents, 'en') + ' per child if you want to relax it.'
          : 'There is no verified per-child price in the catalog, so I will not pretend a venue fits this budget.';
        return head + '\n\n' + relax + '\n\nVenues with no published price are not listed as matches.';
      },
      footer: function (nHidden) {
        var s = 'Venues that are verified over budget, the wrong age, the wrong group size, or closed on Sunday are not in this list.';
        if (nHidden) s += ' ' + nHidden + ' more have no verified price inside the budget, so they are left out too.';
        return s;
      },
      sundayOpen: 'open on Sundays, the actual slot is unverified',
      sundayUnknown: 'Sunday availability unverified',
      guestsFitUnknown: 'no min or max guests in the catalog',
      ageRecommended: 'published ages are recommendations, not a hard limit'
    }
  };
  STR.es = STR.en;

  function strings(lang) {
    return STR[lang] || STR.en;
  }

  function formatMoney(cents, lang) {
    var euros = cents / 100;
    var digits = (cents % 100) ? euros.toFixed(2) : String(euros);
    if (lang === 'de' || lang === 'es') digits = digits.replace('.', ',');
    return digits + ' €';
  }

  function parseZhNumber(token) {
    if (token == null) return null;
    var s = String(token).trim();
    if (!s) return null;
    if (/^\d+(?:[.,]\d+)?$/.test(s)) return Number(s.replace(',', '.'));
    if (!/^[零一二两三四五六七八九十]+$/.test(s)) return null;
    if (s === '十') return 10;
    var ten = s.indexOf('十');
    if (ten === -1) return ZH_DIGIT[s] != null ? ZH_DIGIT[s] : null;
    var hi = ten === 0 ? 1 : ZH_DIGIT[s.slice(0, ten)];
    var lo = ten === s.length - 1 ? 0 : ZH_DIGIT[s.slice(ten + 1)];
    if (hi == null || lo == null) return null;
    return hi * 10 + lo;
  }

  var NUM = '([0-9]+(?:[.,][0-9]+)?|[零一二两三四五六七八九十]+)';

  function isBirthdayIntent(text) {
    var t = String(text || '').toLowerCase();
    if (!t.trim()) return false;
    if (/elterngeld|kindergeld|geburtsurkunde|standesamt|kita|产检|怀孕|儿科|kinderarzt/.test(t)) return false;
    if (/生日/.test(t) && /party|派对|办|建议|推荐|庆祝|场地|场馆|哪里|哪儿|怎么过/.test(t)) return true;
    if (/kindergeburtstag|geburtstagsparty|geburtstagsfeier/.test(t)) return true;
    if (/geburtstag/.test(t) && /party|feier|feiern|empfehl|vorschlag|ort|location/.test(t)) return true;
    if (/birthday/.test(t) && /party|suggest|recommend|idea|venue|where|plan/.test(t)) return true;
    return false;
  }

function parseConstraints(text) {
  var parts = String(text || '').split(/\n+/).filter(function (part) { return part.trim(); });
  if (parts.length <= 1) return parseConstraintText(text);
  var merged = parseConstraintText('');
  parts.forEach(function (part) {
    var one = parseConstraintText(part);
    if (one.age != null) merged.age = one.age;
    if (one.guests != null) merged.guests = one.guests;
    if (one.budgetCents != null) {
      merged.budgetCents = one.budgetCents;
      merged.budgetInclusive = one.budgetInclusive;
    }
    if (one.sunday) merged.sunday = true;
    if (one.indoor != null) merged.indoor = one.indoor;
    if (one.outdoor != null) merged.outdoor = one.outdoor;
    if (one.food != null) merged.food = one.food;
  });
  return merged;
}

function parseConstraintText(text) {
  var raw = String(text || '');
    var t = raw.toLowerCase();
    var constraints = {
      age: null,
      guests: null,
      budgetCents: null,
      budgetInclusive: true,
      sunday: false,
      indoor: null,
      outdoor: null,
      food: null
    };

    var budgetRes = [
      new RegExp('(?:不超过|最多|以内|上限|预算)[^0-9零一二两三四五六七八九十]{0,8}' + NUM + '\\s*(?:欧|欧元|€|euros?)', 'i'),
      new RegExp(NUM + '\\s*(?:欧|欧元|€|euros?)\\s*(?:\\/|每|pro|per|je)\\s*(?:人|孩子|kind|child)', 'i'),
      new RegExp('(?:每人|每个孩子|人均|pro\\s*kind|per\\s*child|je\\s*kind).{0,16}?' + NUM, 'i'),
      new RegExp('(?:maximal|höchstens|hoechstens|bis(?:\\s*zu)?|under|no more than|at most|max)\\s*' + NUM + '\\s*(?:€|euros?)', 'i'),
      new RegExp(NUM + '\\s*(?:€|euros?)\\s*(?:pro|per|je)\\s*(?:kind|child)', 'i')
    ];
    for (var i = 0; i < budgetRes.length; i++) {
      var bm = raw.match(budgetRes[i]) || t.match(budgetRes[i]);
      if (bm) {
        var budget = parseZhNumber(bm[1]);
        if (budget != null && budget >= 0 && budget < 10000) {
          constraints.budgetCents = Math.round(budget * 100);
          if (/低于|unter|weniger als|less than/.test(t) && !/不超过|最多|maximal|at most|no more than/.test(t)) {
            constraints.budgetInclusive = false;
          }
          break;
        }
      }
    }

    var ageMatch = raw.match(new RegExp(NUM + '\\s*岁')) ||
      t.match(new RegExp(NUM + '\\s*(?:years?\\s*old|jahre?n?)')) ||
      raw.match(new RegExp('年龄[^0-9零一二两三四五六七八九十]{0,6}' + NUM));
    if (ageMatch) {
      var age = parseZhNumber(ageMatch[1]);
      if (age != null && age > 0 && age < 30) constraints.age = age;
    }

    var guestMatch = raw.match(new RegExp(NUM + '\\s*个\\s*(?:孩子|小朋友|儿童|小孩)')) ||
      t.match(/(\d+)\s*(?:kinder|kids|children)\b/) ||
      t.match(/(?:für|for)\s*(\d+)\s*(?:kinder|kids|children)\b/);
    if (guestMatch) {
      var guests = parseZhNumber(guestMatch[1]);
      if (guests != null && guests > 0 && guests < 500) constraints.guests = guests;
    }

    constraints.sunday = /下周日|这周日|下个周日|下星期天|星期天|周日|sonntag|sunday/.test(t);
    if (/室内|indoor|drinnen/.test(t)) constraints.indoor = true;
    if (/户外|室外|outdoor|draußen|draussen/.test(t)) constraints.outdoor = true;
    if (/含餐|带餐|包餐|含吃|verpflegung|mit essen|food included|inkl\.?\s*essen/.test(t)) constraints.food = true;
    return constraints;
  }

function combineMessage(message, history) {
  if (isBirthdayIntent(message)) return message;
  var extra = parseConstraints(message);
  var adds = extra.age != null || extra.budgetCents != null || extra.guests != null || extra.sunday;
  if (!adds) return null;
  var list = history || [];
  var start = -1;
  for (var i = list.length - 1; i >= 0; i--) {
    if (list[i] && list[i].role === 'user' && isBirthdayIntent(list[i].content)) {
      start = i;
      break;
    }
  }
  if (start < 0) return null;
  var chunks = [list[start].content];
  for (var j = start + 1; j < list.length; j++) {
    if (!list[j] || list[j].role !== 'user') continue;
    var parsed = parseConstraints(list[j].content);
    if (parsed.age != null || parsed.budgetCents != null || parsed.guests != null || parsed.sunday) {
      chunks.push(list[j].content);
    }
  }
  chunks.push(message);
  return chunks.join('\n');
}

  function needsClarification(c) {
    return c.age == null || c.budgetCents == null;
  }

  function eurosToCents(n) {
    return Math.round(Number(n) * 100);
  }

  function noteOf(party, lang) {
    if (!party || !party.note) return '';
    return party.note[lang] || party.note.en || party.note.de || party.note.zh || '';
  }

  function ageSpan(party) {
    var min = party.min_age != null ? party.min_age : null;
    var max = party.max_age != null ? party.max_age : null;
    var programs = party.programs || [];
    if (!programs.length) return { min: min, max: max, hard: min != null || max != null };
    var hardMin = null;
    var hardMax = null;
    var anyOpenMax = false;
    programs.forEach(function (p) {
      if (p.min_age == null && p.max_age == null) return;
      if (p.min_age != null) hardMin = hardMin == null ? p.min_age : Math.min(hardMin, p.min_age);
      if (p.max_age == null) anyOpenMax = true;
      else hardMax = hardMax == null ? p.max_age : Math.max(hardMax, p.max_age);
    });
    return {
      min: hardMin != null ? hardMin : min,
      max: anyOpenMax ? null : (hardMax != null ? hardMax : max),
      hard: hardMin != null || hardMax != null || min != null || max != null
    };
  }

  function guestSpan(party) {
    var min = party.min_guests != null ? party.min_guests : null;
    var max = party.max_guests != null ? party.max_guests : null;
    (party.programs || []).forEach(function (p) {
      if (p.min_guests != null) min = min == null ? p.min_guests : Math.min(min, p.min_guests);
      if (p.max_guests != null) max = max == null ? p.max_guests : Math.max(max, p.max_guests);
    });
    (party.price_tiers || []).forEach(function (tier) {
      if (tier.max_guests != null) max = max == null ? tier.max_guests : Math.max(max, tier.max_guests);
    });
    if (party.price_surcharge_over) max = null;
    return { min: min, max: max, hard: min != null || max != null || !!(party.programs && party.programs.length) || !!(party.price_tiers && party.price_tiers.length) };
  }

  function formatAge(party, lang) {
    var S = strings(lang);
    var span = ageSpan(party);
    if (!span.hard) {
      var extra = noteOf(party, lang);
      if (extra && /empfehl|recommend|建议|recomend/i.test(extra)) return S.unverified + '（' + S.ageRecommended + '）';
      return S.unverified;
    }
    if (span.min != null && span.max != null) return S.rangeAge(span.min, span.max);
    if (span.min != null) return S.fromAge(span.min);
    return S.toAge(span.max);
  }

  function formatGuests(party, lang) {
    var S = strings(lang);
    var span = guestSpan(party);
    if (span.min == null && span.max == null) return S.unverified;
    if (span.min != null && span.max != null) return S.guestRange(span.min, span.max);
    if (span.min != null) return S.atLeast(span.min);
    return S.atMost(span.max);
  }

  function programFits(program, constraints) {
    if (constraints.age != null && program.min_age != null && constraints.age < program.min_age) return false;
    if (constraints.age != null && program.max_age != null && constraints.age > program.max_age) return false;
    if (constraints.guests != null && program.min_guests != null && constraints.guests < program.min_guests) return false;
    if (constraints.guests != null && program.max_guests != null && constraints.guests > program.max_guests) return false;
    return program.price_flat != null || program.price_per_child != null;
  }

  function resolvePrice(listing, constraints) {
    var party = listing.party || {};
    var guests = constraints.guests;
    if (party.price_per_child != null && party.price_complete !== false) {
      return {
        cents: eurosToCents(party.price_per_child),
        complete: true,
        floorCents: eurosToCents(party.price_per_child)
      };
    }
    if (party.programs && party.programs.length) {
      var fits = party.programs.filter(function (p) { return programFits(p, constraints) && p.price_complete !== false; });
      if (!fits.length) return { cents: null, complete: false, floorCents: null, noProgram: true };
      var best = null;
      fits.forEach(function (p) {
        var flat = p.price_flat != null ? eurosToCents(p.price_flat) : null;
        var per = p.price_per_child != null ? eurosToCents(p.price_per_child) : (flat != null && guests ? Math.round(flat / guests) : null);
        if (per == null) return;
        if (!best || per < best.cents) best = { cents: per, complete: true, floorCents: per, flatCents: flat, program: p.name };
      });
      return best || { cents: null, complete: false, floorCents: null, noProgram: true };
    }
    if (party.price_tiers && party.price_tiers.length && guests) {
      var tiers = party.price_tiers.slice().sort(function (a, b) { return a.max_guests - b.max_guests; });
      var tier = null;
      for (var i = 0; i < tiers.length; i++) {
        if (guests <= tiers[i].max_guests) { tier = tiers[i]; break; }
      }
      var flatCents = null;
      if (tier) flatCents = eurosToCents(tier.price_flat);
      else if (party.price_surcharge_over && guests > party.price_surcharge_over.guests) {
        flatCents = eurosToCents(tiers[tiers.length - 1].price_flat + party.price_surcharge_over.flat);
      }
      if (flatCents == null) return { cents: null, complete: false, floorCents: null };
      var perTier = Math.round(flatCents / guests);
      return { cents: perTier, complete: party.price_complete !== false, floorCents: perTier, flatCents: flatCents };
    }
    if (party.price_flat != null && guests) {
      var flat = eurosToCents(party.price_flat);
      var perFlat = Math.round(flat / guests);
      return { cents: perFlat, complete: party.price_complete !== false, floorCents: perFlat, flatCents: flat };
    }
    if (party.price_floor_per_child != null) {
      return { cents: null, complete: false, floorCents: eurosToCents(party.price_floor_per_child) };
    }
    return { cents: null, complete: false, floorCents: null };
  }

  function withinBudget(price, constraints) {
    if (constraints.budgetCents == null) return 'unknown';
    var cap = constraints.budgetCents;
    if (price.complete && price.cents != null) {
      if (constraints.budgetInclusive ? price.cents <= cap : price.cents < cap) return 'pass';
      return 'fail';
    }
    if (price.floorCents != null && price.floorCents > cap) return 'fail';
    if (price.floorCents != null && !constraints.budgetInclusive && price.floorCents >= cap) return 'fail';
    return 'unknown';
  }

  function judgeAge(listing, constraints) {
    var party = listing.party || {};
    if (constraints.age == null) return 'pass';
    if (party.programs && party.programs.length) {
      var ageOk = party.programs.some(function (p) {
        if (p.min_age != null && constraints.age < p.min_age) return false;
        if (p.max_age != null && constraints.age > p.max_age) return false;
        return p.min_age != null || p.max_age != null;
      });
      var ageBounded = party.programs.some(function (p) { return p.min_age != null || p.max_age != null; });
      if (!ageBounded) return 'unknown';
      return ageOk ? 'pass' : 'fail';
    }
    if (party.min_age == null && party.max_age == null) return 'unknown';
    if (party.min_age != null && constraints.age < party.min_age) return 'fail';
    if (party.max_age != null && constraints.age > party.max_age) return 'fail';
    return 'pass';
  }

  function judgeGuests(listing, constraints) {
    var party = listing.party || {};
    if (constraints.guests == null) return 'pass';
    if (party.programs && party.programs.length) {
      var bounded = party.programs.some(function (p) { return p.min_guests != null || p.max_guests != null; });
      if (!bounded) return 'unknown';
      var ok = party.programs.some(function (p) {
        if (p.min_guests != null && constraints.guests < p.min_guests) return false;
        if (p.max_guests != null && constraints.guests > p.max_guests) return false;
        return true;
      });
      return ok ? 'pass' : 'fail';
    }
    if (party.price_tiers && party.price_tiers.length) {
      var top = 0;
      party.price_tiers.forEach(function (tier) { if (tier.max_guests > top) top = tier.max_guests; });
      if (party.price_surcharge_over && constraints.guests > party.price_surcharge_over.guests) return 'pass';
      if (constraints.guests <= top) return 'pass';
      return 'fail';
    }
    if (party.min_guests == null && party.max_guests == null) return 'unknown';
    if (party.min_guests != null && constraints.guests < party.min_guests) return 'fail';
    if (party.max_guests != null && constraints.guests > party.max_guests) return 'fail';
    return 'pass';
  }

  function judgeSunday(listing, constraints) {
    if (!constraints.sunday) return 'pass';
    if (listing.closed_sunday === true) return 'fail';
    return 'unknown';
  }

  function priceLine(listing, price, lang) {
    var S = strings(lang);
    var party = listing.party || {};
    var bits = [];
    if (party.price_per_child != null) bits.push(formatMoney(eurosToCents(party.price_per_child), lang));
    if (price && price.flatCents != null && party.price_per_child == null) {
      bits.push(formatMoney(price.flatCents, lang) + (price.program ? ' ' + price.program : ''));
      if (price.cents != null) bits.push(formatMoney(price.cents, lang) + '/' + (lang === 'zh' ? '人' : lang === 'de' ? 'Kind' : 'child'));
    } else if (price && price.cents != null && party.price_per_child == null) {
      bits.push(formatMoney(price.cents, lang));
    }
    if (party.price_floor_per_child != null && party.price_per_child == null) {
      var floor = (lang === 'zh' ? '起价 ' : lang === 'de' ? 'ab ' : 'from ') + formatMoney(eurosToCents(party.price_floor_per_child), lang);
      bits.push(floor);
    }
    if (party.price_tiers && party.price_tiers.length) {
      var tierTxt = party.price_tiers.map(function (tier) {
        return (lang === 'zh' ? '至 ' : lang === 'de' ? 'bis ' : 'up to ') + tier.max_guests + ' / ' + formatMoney(eurosToCents(tier.price_flat), lang);
      }).join(lang === 'zh' ? '，' : ', ');
      bits.push(tierTxt);
    }
    if (!bits.length) return S.unverified;
    var line = bits.join(lang === 'zh' ? '；' : '; ');
    if (price && !price.complete) line += lang === 'zh' ? '（未核实是否含全部费用）' : (lang === 'de' ? ' (Gesamtpreis nicht verifiziert)' : ' (full price unverified)');
    return line;
  }

  function judgeListing(listing, constraints) {
    var party = listing.party || {};
    var price = resolvePrice(listing, constraints);
    var age = judgeAge(listing, constraints);
    var guests = judgeGuests(listing, constraints);
    var sunday = judgeSunday(listing, constraints);
    var priceStatus = withinBudget(price, constraints);
    var fail = [];
    if (age === 'fail') fail.push('age');
    if (guests === 'fail') fail.push('guests');
    if (priceStatus === 'fail') fail.push('budget');
    if (sunday === 'fail') fail.push('sunday');
    return {
      listing: listing,
      fail: fail,
      age: age,
      guests: guests,
      price: priceStatus,
      sunday: sunday,
      offer: price,
      ageText: formatAge(party, 'zh'),
      guestText: formatGuests(party, 'zh')
    };
  }

  function geoRank(listing) {
    if (listing.geo === 'nearby') return 1;
    if (listing.geo === 'far') return 2;
    return 0;
  }

  function softScore(listing, constraints) {
    var score = 0;
    if (constraints.indoor && listing.indoor) score += 2;
    if (constraints.outdoor && listing.outdoor) score += 2;
    if (constraints.food && listing.food) score += 2;
    if (listing.phone) score += 1;
    if (listing.url) score += 1;
    return score;
  }

  function compareJudged(a, b, constraints) {
    var geo = geoRank(a.listing) - geoRank(b.listing);
    if (geo) return geo;
    var soft = softScore(b.listing, constraints) - softScore(a.listing, constraints);
    if (soft) return soft;
    var pa = a.offer && a.offer.cents != null ? a.offer.cents : 999999;
    var pb = b.offer && b.offer.cents != null ? b.offer.cents : 999999;
    if (pa !== pb) return pa - pb;
    return String(a.listing.name).localeCompare(String(b.listing.name));
  }

  function cheapestVerified(judged, constraints) {
    var best = null;
    judged.forEach(function (j) {
      var cents = j.offer && (j.offer.complete ? j.offer.cents : j.offer.floorCents);
      if (cents == null) return;
      if (j.fail.indexOf('age') >= 0 || j.fail.indexOf('guests') >= 0 || j.fail.indexOf('sunday') >= 0) return;
      if (!best || cents < best.cents) {
        best = {
          cents: cents,
          id: j.listing.id,
          name: j.listing.name,
          label: j.listing.name + ' ' + formatMoney(cents, 'zh')
        };
      }
    });
    if (!best) return null;
    return {
      cents: best.cents,
      id: best.id,
      name: best.name,
      label: best.name + '，' + (constraints.lang === 'de' ? 'ca. ' : constraints.lang === 'zh' ? '大约 ' : 'about ') + formatMoney(best.cents, constraints.lang || 'zh') +
        (constraints.lang === 'zh' ? '/人' : constraints.lang === 'de' ? ' pro Kind' : ' per child')
    };
  }

  function sundayLine(listing, lang) {
    var S = strings(lang);
    if (listing.closed_sunday === false) return S.sundayOpen;
    return S.sundayUnknown;
  }

  function cardBlock(judged, lang) {
    var S = strings(lang);
    var listing = judged.listing;
    var party = listing.party || {};
    var gaps = [];
    if (judged.age !== 'pass') gaps.push(S.age);
    if (judged.guests !== 'pass') gaps.push(S.guests);
    if (judged.price !== 'pass') gaps.push(S.price);
    if (judged.sunday !== 'pass') gaps.push(S.sunday);
    var head = '**' + listing.name + '**';
    head += lang === 'zh'
      ? '（' + (gaps.length ? S.cardGap + '：' + gaps.join('、') : S.cardOk) + '）'
      : ' (' + (gaps.length ? S.cardGap + ': ' + gaps.join(', ') : S.cardOk) + ')';
    var lines = [head];
    lines.push(S.age + '：' + formatAge(party, lang).replace(/^/, '') );
    if (lang !== 'zh') lines[lines.length - 1] = S.age + ': ' + formatAge(party, lang);
    lines.push((lang === 'zh' ? S.price + '：' : S.price + ': ') + priceLine(listing, judged.offer, lang));
    lines.push((lang === 'zh' ? S.guests + '：' : S.guests + ': ') + formatGuests(party, lang));
    if (judged.sunday !== 'pass') {
      lines.push((lang === 'zh' ? S.sunday + '：' : S.sunday + ': ') + sundayLine(listing, lang));
    }
    if (listing.indoor === true) lines.push(lang === 'zh' ? '场地：室内' : (lang === 'de' ? 'Ort: drinnen' : 'Setting: indoor'));
    else if (listing.outdoor === true && listing.indoor !== true) lines.push(lang === 'zh' ? '场地：户外' : (lang === 'de' ? 'Ort: draußen' : 'Setting: outdoor'));
    var detail = noteOf(party, lang);
    if (detail) lines.push(detail);
    if (listing.phone) lines.push(S.phone + (lang === 'zh' ? '：' : ': ') + listing.phone);
    if (listing.url) lines.push(S.web + (lang === 'zh' ? '：' : ': ') + listing.url);
    return lines.join('\n');
  }

  function shownRecord(judged, lang) {
    var party = judged.listing.party || {};
    return {
      id: judged.listing.id,
      name: judged.listing.name,
      ageStatus: judged.age,
      guestStatus: judged.guests,
      priceStatus: judged.price,
      sundayStatus: judged.sunday,
      ageText: formatAge(party, lang),
      priceText: priceLine(judged.listing, judged.offer, lang),
      guestText: formatGuests(party, lang),
      perChildCents: judged.offer && judged.offer.cents != null ? judged.offer.cents : null
    };
  }

  function buildBirthdayAnswer(message, options) {
    options = options || {};
    var lang = options.lang || 'zh';
    if (STR[lang] == null && lang !== 'es') lang = 'en';
    var listings = options.listings || [];
    var combined = combineMessage(message, options.history || []);
    if (!combined) return null;
    var constraints = parseConstraints(combined);
    constraints.lang = lang;
    var S = strings(lang);

    if (needsClarification(constraints)) {
      return {
        handled: true,
        mode: 'clarify',
        constraints: constraints,
        shown: [],
        excluded: [],
        text: S.clarify(constraints)
      };
    }

    var judged = listings.map(function (listing) { return judgeListing(listing, constraints); });
    var eligible = judged.filter(function (j) { return j.fail.length === 0 && j.price === 'pass'; });
    eligible.sort(function (a, b) { return compareJudged(a, b, constraints); });
    var hiddenUnknown = judged.filter(function (j) {
      return j.fail.length === 0 && j.price !== 'pass';
    }).length;

    if (!eligible.length) {
      var cheap = cheapestVerified(judged, constraints);
      return {
        handled: true,
        mode: 'none',
        constraints: constraints,
        shown: [],
        excluded: judged.filter(function (j) { return j.fail.length; }).map(function (j) {
          return { id: j.listing.id, name: j.listing.name, reasons: j.fail.slice() };
        }),
        relaxPerChildCents: cheap ? cheap.cents : null,
        relaxListingId: cheap ? cheap.id : null,
        text: S.noMatch(constraints, cheap)
      };
    }

    var top = eligible.slice(0, 8);
    var blocks = top.map(function (j) { return cardBlock(j, lang); });
    var text = S.opening(constraints);
    if (constraints.sunday) text += '\n\n' + S.sundayNote;
    text += '\n\n' + blocks.join('\n\n');
    text += '\n\n' + S.footer(hiddenUnknown);
    return {
      handled: true,
      mode: 'matches',
      constraints: constraints,
      shown: top.map(function (j) { return shownRecord(j, lang); }),
      excluded: judged.filter(function (j) { return j.fail.length; }).map(function (j) {
        return { id: j.listing.id, name: j.listing.name, reasons: j.fail.slice() };
      }),
      text: text
    };
  }

  var catalogCache = null;
  var catalogPromise = null;

  function setCatalog(listings) {
    catalogCache = listings;
    catalogPromise = Promise.resolve(listings);
  }

  function loadCatalog(url) {
    if (catalogCache) return Promise.resolve(catalogCache);
    if (typeof fetch !== 'function') return Promise.resolve(null);
    if (!catalogPromise) {
      catalogPromise = fetch(url || 'data/geburtstagsparty.json').then(function (res) {
        if (!res.ok) throw new Error('catalog ' + res.status);
        return res.json();
      }).then(function (data) {
        catalogCache = data.listings || data;
        return catalogCache;
      }).catch(function () {
        catalogPromise = null;
        return null;
      });
    }
    return catalogPromise;
  }

  function respond(message, opts) {
    opts = opts || {};
    var listings = opts.listings;
    var ready = listings ? Promise.resolve(listings) : loadCatalog(opts.catalogUrl);
    return ready.then(function (rows) {
      if (!rows) return null;
      return buildBirthdayAnswer(message, {
        lang: opts.lang || 'zh',
        listings: rows,
        history: opts.history || []
      });
    });
  }

function directoryAttrText(listing, lang) {
  var S = strings(lang);
  var party = (listing && listing.party) || {};
  var sep = lang === 'zh' ? '：' : ': ';
  var offer = {
    cents: party.price_per_child != null ? eurosToCents(party.price_per_child) : null,
    complete: party.price_complete !== false && party.price_floor_per_child == null,
    flatCents: party.price_flat != null ? eurosToCents(party.price_flat) : null
  };
  var age = S.age + sep + formatAge(party, lang);
  var price = S.price + sep + priceLine(listing || { party: {} }, offer, lang);
  if (party.price_flat != null && party.price_per_child == null && !(party.price_tiers && party.price_tiers.length) && !(party.programs && party.programs.length)) {
    var flatLabel = formatMoney(eurosToCents(party.price_flat), lang);
    price = S.price + sep + flatLabel + (lang === 'zh' ? ' 整场' : lang === 'de' ? ' pauschal' : ' flat');
    if (party.max_guests) {
      price += lang === 'zh'
        ? '（最多 ' + party.max_guests + ' 名，约 ' + formatMoney(Math.round(eurosToCents(party.price_flat) / party.max_guests), lang) + '/人）'
        : ' (max ' + party.max_guests + ')';
    }
    if (party.price_complete === false) price += lang === 'zh' ? '（未核实）' : ' (' + S.unverified + ')';
  }
  var guests = S.guests + sep + formatGuests(party, lang);
  return [age, price, guests].join('\n');
}

function paintDirectory(lang) {
  if (typeof document === 'undefined' || !catalogCache) return;
  var useLang = lang || 'zh';
  // openSub clones the subcategory into #s2, so the entries id can exist twice.
  var roots = document.querySelectorAll('[id="entries-sub-Freizeit___Leben-Geburtstagsparty"]');
  Array.prototype.forEach.call(roots, function (rootEl) {
    paintDirectoryRoot(rootEl, useLang);
  });
}

function paintDirectoryRoot(rootEl, useLang) {
  var cards = rootEl.querySelectorAll('.entry-card');
  Array.prototype.forEach.call(cards, function (card) {
      var nameEl = card.querySelector('.entry-name');
      var name = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : '';
      var listing = null;
      for (var i = 0; i < catalogCache.length; i++) {
        if (catalogCache[i].name === name) { listing = catalogCache[i]; break; }
      }
      var prev = card.querySelector('.party-attrs');
      if (prev) prev.remove();
      var div = document.createElement('div');
      div.className = 'party-attrs';
      div.style.cssText = 'font-size:11px;color:var(--t2);margin:4px 0 6px;line-height:1.45;white-space:pre-line;';
      div.textContent = directoryAttrText(listing, useLang);
      if (nameEl && nameEl.nextSibling) card.insertBefore(div, nameEl.nextSibling);
      else card.appendChild(div);
    });
  }

  return {
    parseConstraints: parseConstraints,
    isBirthdayIntent: isBirthdayIntent,
    buildBirthdayAnswer: buildBirthdayAnswer,
    loadCatalog: loadCatalog,
    setCatalog: setCatalog,
    respond: respond,
    paintDirectory: paintDirectory,
    formatMoney: formatMoney
  };
});
