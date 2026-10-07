/*
 * MamaPedia answer contract — Mietrecht consult (Düsseldorf tenants).
 *
 * Rental questions retrieve from data/KB/_pack_for_chat and answer with
 * 5–8 points from that article's 「聊天用途」 section. They do not fall
 * through to a Freizeit / Essen directory list.
 * Facts below are copied from the packed article; anchors are checked in tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MamaPediaMietrecht = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var SOURCE = 'kb-mietrecht';

  var CLOSING = {
    zh: '这是一般信息，不是针对你这套房的法律意见。拿不准时，把合同或信件交给 Mieterverein Düsseldorf 看一看（Oststraße 47，40211，电话 0211 16 99 6-0）。',
    de: 'Das ist eine allgemeine Information und keine Rechtsberatung für deinen Fall. Unsicher? Zeig den Vertrag oder den Brief dem Mieterverein Düsseldorf (Oststraße 47, 40211, Tel. 0211 16 99 6-0).'
  };

  // Each point's anchor must appear in kb_mietrecht_mieter_duesseldorf.txt.
  var TOPICS = [
    {
      id: 'wohnungsgeber',
      intro: {
        zh: '没有房东确认书，市民局通常办不了 Anmeldung。可以按这几步来。',
        de: 'Ohne Wohnungsgeberbestätigung kommt die Anmeldung beim Bürgerbüro meist nicht durch. So kannst du vorgehen.'
      },
      points: {
        zh: [
          '房东或物业有法定义务出具 Wohnungsgeberbestätigung，光有租房合同不够。',
          '搬入新住址后 2 周内要去 Bürgerbüro 登记，最早入住当天就可以。',
          '先书面提醒房东，并附上 duesseldorf.de 上 Einwohnermeldeamt 的表格请对方签。',
          '仍然拒绝的话，向 Einwohnermeldeamt 说明情况。',
          '全家人包括孩子都要登记，Kindergeld、Kita 和学校报名都会用到。'
        ],
        de: [
          'Vermieter oder Hausverwaltung müssen die Wohnungsgeberbestätigung ausstellen. Der Mietvertrag allein reicht nicht.',
          'Nach dem Einzug hast du zwei Wochen Zeit für die Anmeldung beim Bürgerbüro, frühestens am Einzugstag.',
          'Erinnere schriftlich und leg das Formular des Einwohnermeldeamts von duesseldorf.de bei.',
          'Wenn weiter nichts kommt, sag dem Einwohnermeldeamt Bescheid.',
          'Die ganze Familie, auch die Kinder, anmelden. Kindergeld, Kita und Schule brauchen das.'
        ]
      },
      anchors: [
        'Wohnungsgeberbestätigung',
        '光有租房合同不够',
        '2 周内',
        'Einwohnermeldeamt',
        'Kindergeld'
      ]
    },
    {
      id: 'eigenbedarf',
      intro: {
        zh: '收到自住解约先别慌，也先别在同意搬走的文件上签字。先核对这些地方。',
        de: 'Bei Eigenbedarf erst einmal nichts unterschreiben, was den Auszug akzeptiert. Prüf diese Punkte.'
      },
      points: {
        zh: [
          '先别签任何同意搬走的文件，把解约信拿去核对是否有效。',
          '看是不是亲笔签名的纸质信，有没有写明为谁自住、为什么，期限是 3、6 还是 9 个月。',
          '若房子是改为产权后卖给新业主，Düsseldorf 一般 8 年内不能以 Eigenbedarf 解约；2025-03-01 前的转换仍按旧规则。',
          '家庭特别困难（怀孕、重病、孩子临考、找不到合适的房子）可以最迟在租期结束前 2 个月书面提出 Widerspruch。',
          '虚假自住可能要赔偿，这要看具体信件，不要自己下结论。',
          '立刻带信去 Mieterverein；收入低的话可以了解 Beratungshilfe。'
        ],
        de: [
          'Unterschreib nichts, worin du dem Auszug zustimmst. Lass das Kündigungsschreiben prüfen.',
          'Liegt ein unterschriebener Brief vor, mit Person und Grund? Die Frist ist 3, 6 oder 9 Monate.',
          'Nach Umwandlung in Eigentum und Verkauf gilt in Düsseldorf in der Regel eine Sperrfrist von 8 Jahren. Eine Umwandlung vor dem 01.03.2025 folgt der alten Frist.',
          'Bei besonderer Härte (Schwangerschaft, Krankheit, Schulprüfung, keine passende Wohnung) kannst du bis 2 Monate vor Mietende schriftlich Widerspruch einlegen.',
          'Vorgeäuschter Eigenbedarf kann Schadensersatz auslösen. Das hängt am konkreten Schreiben.',
          'Bring den Brief gleich zum Mieterverein. Bei wenig Einkommen gibt es Beratungshilfe.'
        ]
      },
      anchors: [
        '先别签任何同意搬走',
        '3 个月；满 5 年 6 个月；满 8 年 9 个月',
        '8 年',
        '2025 年 3 月 1 日之前',
        '2 个月',
        'vorgetäuschter Eigenbedarf',
        'Beratungshilfe'
      ]
    },
    {
      id: 'maengel',
      intro: {
        zh: '漏水或发霉，先留证据。房租先别自己大额扣掉。',
        de: 'Bei Schimmel oder einem Wasserschaden erst dokumentieren. Kürz die Miete nicht einfach um einen großen Betrag.'
      },
      points: {
        zh: [
          '发现缺陷后立即书面通知房东或物业，写明问题和开始日期，附上照片，并给一个合理的修理期限。',
          '不通知的话，减租可能会受影响，损失扩大还可能要自己承担。',
          '比较稳妥的是按合同继续付款，同时书面声明有保留地付款（unter Vorbehalt）。',
          '减租比例各法院差很多，请 Mieterverein 帮你估。',
          '不要随意大额扣租，欠租多了房东可能拿来解约。',
          '发霉的话记下室内温湿度和通风（Stoßlüften），方便以后说明。'
        ],
        de: [
          'Melde den Mangel sofort schriftlich, mit Beginn, Fotos und einer angemessenen Frist zur Reparatur.',
          'Ohne Anzeige kann die Minderung leiden, und ein größerer Schaden kann an dir hängen bleiben.',
          'Sicherer ist, weiter nach Vertrag zu zahlen und schriftlich „unter Vorbehalt“ zu erklären.',
          'Wie viel gemindert werden darf, sehen Gerichte sehr unterschiedlich. Lass den Mieterverein schätzen.',
          'Behalt nicht einfach einen großen Betrag ein. Mietrückstand kann ein Kündigungsgrund werden.',
          'Bei Schimmel Temperatur, Feuchte und Stoßlüften notieren.'
        ]
      },
      anchors: [
        '立即书面通知房东',
        '不通知可能失去减租权',
        'unter Vorbehalt',
        '比例多少是争议焦点',
        '不要自行大幅扣租',
        'Stoßlüften'
      ]
    },
    {
      id: 'kaution',
      intro: {
        zh: '押金能不能顺利退回来，主要看金额、有没有分开存放，以及交房记录。可以按这几步看。',
        de: 'Ob die Kaution zurückkommt, hängt an der Höhe, der getrennten Verwahrung und dem Übergabeprotokoll.'
      },
      points: {
        zh: [
          '押金最多 3 个月冷租，可以分成 3 期付，不必被一次付清绑死。',
          '钱必须跟房东自己的财产分开存放，并计息，利息归你。',
          '交钥匙时再做一次交房记录，拍照，留下新地址和银行账号。',
          '正常磨损不能扣，比如轻微使用痕迹。',
          '法律没有固定天数，房东通常有 3–6 个月的审查期。',
          '当年杂费还没结清时，只能扣留合理的一部分，不能把整笔押金都扣下。',
          '超过半年没消息，就书面催告并设定期限，然后找 Mieterverein。'
        ],
        de: [
          'Die Kaution beträgt höchstens 3 Nettokaltmieten und darf in 3 Raten gezahlt werden.',
          'Sie muss getrennt vom Vermögen des Vermieters liegen und verzinst werden. Die Zinsen gehören dir.',
          'Beim Auszug noch einmal ein Protokoll machen, fotografieren, neue Adresse und Konto dalassen.',
          'Normale Abnutzung darf nicht einbehalten werden.',
          'Eine feste Frist in Tagen gibt es nicht. Üblich sind 3–6 Monate Prüfungszeit.',
          'Sind die Nebenkosten noch offen, darf nur ein angemessener Teil einbehalten werden, nicht die ganze Kaution.',
          'Nach mehr als einem halben Jahr ohne Nachricht schriftlich mahnen, eine Frist setzen, dann zum Mieterverein.'
        ]
      },
      anchors: [
        '3 个月冷租',
        '分 3 期',
        '利息归租客',
        '正常磨损不能扣',
        '3–6 个月',
        '只能扣留合理的一部分',
        '书面催告并设定期限'
      ]
    },
    {
      id: 'nebenkosten',
      intro: {
        zh: '杂费账单不是房东说了算。你有时间和查阅原始单据的权利。',
        de: 'Die Nebenkostenabrechnung ist nicht nur die Zahl des Vermieters. Du hast Fristen und ein Recht auf die Belege.'
      },
      points: {
        zh: [
          '房东要在结算期结束后 12 个月内把账单送达，过了一般就不能再要补缴。',
          '你收到账单后再有 12 个月可以提出异议。',
          '你有权查阅原始单据，看账单、合同和分摊方式。',
          '管理费、维修保养费和银行手续费不能摊进杂费。',
          '2024 年 7 月 1 日起，有线电视费也不能再摊给租客。',
          '暖气要按用量为主来分；没按用量时，通常可以扣减你那部分暖气费的 15%。',
          '有大额补缴时，先付没有争议的部分，其余书面提出异议，并尽快请 Mieterverein 帮看。'
        ],
        de: [
          'Die Abrechnung muss innerhalb von 12 Monaten nach Ende des Abrechnungszeitraums ankommen. Danach ist eine Nachforderung meist ausgeschlossen.',
          'Nach Zugang hast du 12 Monate für Einwände.',
          'Du darfst die Belege einsehen: Rechnungen, Verträge und den Umlageschlüssel.',
          'Verwaltungskosten, Instandhaltung und Bankgebühren dürfen nicht umgelegt werden.',
          'Seit dem 1. Juli 2024 dürfen Kabelgebühren nicht mehr auf die Miete umgelegt werden.',
          'Heizung wird überwiegend nach Verbrauch umgelegt. Fehlt das, kannst du deinen Heizkostenanteil oft um 15 % kürzen.',
          'Bei einer hohen Nachzahlung den unstrittigen Teil zahlen, den Rest schriftlich beanstanden und den Mieterverein draufschauen lassen.'
        ]
      },
      anchors: [
        '12 个月内',
        '12 个月',
        'Belegeinsicht',
        '算进杂费',
        '2024 年 7 月 1 日',
        '扣减 15%',
        '先付无争议部分'
      ]
    },
    {
      id: 'increase',
      intro: {
        zh: '房东涨租要先看合同是哪一种，再看有没有走法定程序。',
        de: 'Eine Mieterhöhung kann erlaubt sein. Zuerst die Vertragsart, dann das Verfahren.'
      },
      points: {
        zh: [
          '先看合同是 Staffelmiete、Indexmiete，还是普通租金。阶梯和指数租金按合同自己的规则走。',
          '普通合同按 Mietspiegel 涨时，15 个月内不能生效，涨完也不能超过当地比较租金。',
          'Düsseldorf 3 年内累计最多涨 15%，这条规定到 2030-02-28。',
          '房东必须书面说明理由。你有时间考虑到收到信后第二个月月底，不必当场同意。',
          '现代化涨租每年最多加改造费用的 8%，而且 6 年内每平方米最多加 3 欧，租金较低时是 2 欧。',
          '新租约的起始租金如果超过 Mietpreisbremse，可以用文字形式提出 Rüge。',
          '把信件拍照或扫描，交给 Mieterverein 帮你核算。'
        ],
        de: [
          'Zuerst schauen: Staffelmiete, Indexmiete oder normale Miete. Staffel und Index laufen nach dem Vertrag.',
          'Eine Erhöhung nach Mietspiegel kann nicht innerhalb von 15 Monaten wirken und nicht über die ortsübliche Vergleichsmiete hinaus.',
          'In Düsseldorf sind es in 3 Jahren höchstens 15 %, diese Grenze gilt bis zum 28.02.2030.',
          'Der Vermieter muss schriftlich begründen. Du hast Bedenkzeit bis zum Ende des übernächsten Monats und musst nicht sofort zustimmen.',
          'Bei Modernisierung höchstens 8 % der Kosten im Jahr, und in 6 Jahren höchstens 3 €/m², bei niedriger Miete 2 €/m².',
          'Liegt die Anfangsmiete über der Mietpreisbremse, kannst du in Textform rügen.',
          'Fotografier oder scanne das Schreiben und lass es vom Mieterverein nachrechnen.'
        ]
      },
      anchors: [
        'Staffelmiete',
        '15 个月',
        '15%',
        '2030 年 2 月 28 日',
        '第二个完整月月底',
        '每年最多可加改造费用的 8%',
        'Rüge'
      ]
    },
    {
      id: 'kuendigung',
      intro: {
        zh: '解约要看是谁提出来的。形式不对的信，常常不生效。',
        de: 'Bei einer Kündigung zählt, wer sie ausspricht. An der Form scheitert sie oft.'
      },
      points: {
        zh: [
          '租客普通解约一般是 3 个月，而且必须是亲笔签名的纸质信，邮件和 WhatsApp 不算。',
          '房东普通解约需要法定理由，不能为了涨租把人请走。',
          '房东的期限随租期变长：3 个月，满 5 年是 6 个月，满 8 年是 9 个月。',
          '合同里如果有 Kündigungsverzicht，先看它有没有超过通常有效的 4 年。',
          '搬家对家庭特别困难的，最迟可以在租期结束前 2 个月书面提出 Widerspruch。',
          '先别签同意搬走的文件，把信交给 Mieterverein 看形式、理由和期限。'
        ],
        de: [
          'Als Mieterin oder Mieter gilt meist eine Frist von 3 Monaten, und nur ein unterschriebener Brief. E-Mail und WhatsApp reichen nicht.',
          'Der Vermieter braucht einen gesetzlichen Grund. Eine Kündigung nur zum Zweck der Mieterhöhung ist unzulässig.',
          'Seine Frist wächst mit der Mietdauer: 3 Monate, nach 5 Jahren 6 Monate, nach 8 Jahren 9 Monate.',
          'Steht ein Kündigungsverzicht im Vertrag, prüf ob er die meist wirksamen 4 Jahre überschreitet.',
          'Bei besonderer Härte für die Familie ist ein schriftlicher Widerspruch bis 2 Monate vor Mietende möglich.',
          'Nichts zum Auszug unterschreiben. Der Mieterverein prüft Form, Grund und Frist.'
        ]
      },
      anchors: [
        '3 个月',
        'WhatsApp',
        '为了涨租而解约',
        '满 5 年 6 个月',
        '超过 4 年通常无效',
        '2 个月'
      ]
    },
    {
      id: 'contract',
      intro: {
        zh: '签租房合同之前，把这几处看清楚就好，不用把整篇租赁法背下来。',
        de: 'Bevor du unterschreibst, reichen diese Punkte. Du musst nicht das ganze Mietrecht auswendig lernen.'
      },
      points: {
        zh: [
          '看清冷租、杂费和暖气预付，自己算出暖租。',
          '看是不是 Staffelmiete 或 Indexmiete，涨租方式要心里有数。',
          '看 Kündigungsverzicht 写了多长，超过 4 年通常无效。',
          '装修和小修条款要有具体上限，死板的期限条款常常无效。',
          '中介如果是房东找的，按 Bestellerprinzip 你不用付中介费。',
          '新租金看有没有超过 Mietspiegel 再加 10%，Düsseldorf 适用 Mietpreisbremse。',
          '入住时做 Übergabeprotokoll，拍照，记下水电表数字。',
          '拿不准，就请 Mieterverein 在签字前帮你看一遍合同。'
        ],
        de: [
          'Kaltmiete, Nebenkosten und Heizkostenvorauszahlung auseinandernehmen und die Warmmiete selbst ausrechnen.',
          'Steht Staffelmiete oder Indexmiete im Vertrag, läuft die Erhöhung danach und nicht frei nach Mietspiegel.',
          'Wie lang ist der Kündigungsverzicht? Mehr als 4 Jahre ist meist unwirksam.',
          'Schönheitsreparaturen und Kleinreparaturen brauchen klare Obergrenzen. Starre Fristen sind oft unwirksam.',
          'Hat der Vermieter den Makler beauftragt, zahlst du nach dem Bestellerprinzip keine Provision.',
          'Bei einer neuen Miete prüfen, ob sie mehr als 10 % über dem Mietspiegel liegt. In Düsseldorf gilt die Mietpreisbremse.',
          'Beim Einzug ein Übergabeprotokoll machen, fotografieren und die Zählerstände notieren.',
          'Unsicher vor der Unterschrift? Den Mieterverein den Vertrag ansehen lassen.'
        ]
      },
      anchors: [
        '暖租',
        'Staffelmiete',
        '超过 4 年通常无效',
        '死板期限',
        'Bestellerprinzip',
        '高 10%',
        'Übergabeprotokoll',
        '签前'
      ]
    }
  ];

  var BY_ID = {};
  TOPICS.forEach(function (topic) { BY_ID[topic.id] = topic; });

  function has(text, re) { return re.test(text); }

  function detectTopic(message) {
    var t = String(message || '');
    if (has(t, /Wohnungsgeberbestätigung|Wohnungsgeber|登记证明|房东不给登记|不给登记/i)) return 'wohnungsgeber';
    if (has(t, /Eigenbedarf|自住|被赶|赶出去|赶人|产权房|Umwandlung/i)) return 'eigenbedarf';
    if (has(t, /发霉|霉斑|漏水|少交租|减租|Mietminderung|Schimmel|Wasserschaden/i)) return 'maengel';
    if (has(t, /押金|Kaution/i)) return 'kaution';
    if (has(t, /Nebenkosten|Betriebskosten|杂费|Heizkostenabrechnung|Nebenkostenabrechnung/i)) return 'nebenkosten';
    if (has(t, /涨租|Mieterhöhung|Mieterhoehung|Mietpreisbremse|Kappungsgrenze|租金刹车|租金上限/i)) return 'increase';
    if (has(t, /Kündigung|Kuendigung|解约/i)) return 'kuendigung';
    if (has(t, /租房合同| Mietvertrag|Mietvertrag|合同要注意|签约|Unterschrift/i)) return 'contract';
    if (has(t, /租房|租房子|房租|Mietwohnung|Wohnung mieten|mieten/i)) return 'contract';
    return null;
  }

  function replyLang(message, opts) {
    var text = String(message || '');
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    if (/[äöüÄÖÜß]/.test(text) || /\b(der|die|das|und|nicht|ist|kann|vertrag|miete|ich|wir|beim|vor)\b/i.test(text)) return 'de';
    if (opts && (opts.lang === 'zh' || opts.lang === 'de')) return opts.lang;
    return 'de';
  }

  function render(topic, lang) {
    var points = topic.points[lang] || topic.points.zh;
    var intro = (topic.intro[lang] || topic.intro.zh);
    var lines = [intro, ''];
    for (var i = 0; i < points.length; i++) lines.push((i + 1) + '. ' + points[i]);
    lines.push('');
    lines.push(CLOSING[lang] || CLOSING.zh);
    return lines.join('\n');
  }

  function countPoints(text) {
    return String(text || '').split('\n').filter(function (line) {
      return /^\d+\.\s/.test(line);
    }).length;
  }

  function answer(message, opts) {
    opts = opts || {};
    var topicId = detectTopic(message);
    if (!topicId) return { handled: false, source: null, topic: null, text: '' };
    var topic = BY_ID[topicId];
    var lang = replyLang(message, opts);
    var text = render(topic, lang);
    return {
      handled: true,
      source: SOURCE,
      intent: 'consult',
      topic: topicId,
      lang: lang,
      points: countPoints(text),
      text: text
    };
  }

  return {
    SOURCE: SOURCE,
    TOPICS: TOPICS,
    detectTopic: detectTopic,
    isRentalIntent: function (message) { return !!detectTopic(message); },
    answer: answer,
    countPoints: countPoints,
    CLOSING: CLOSING
  };
});
