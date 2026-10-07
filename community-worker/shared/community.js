/**
 * MamaPedia Community API — drop-in for the mamapedia-chat Worker.
 *
 * Persistence: existing MARKT KV, key prefix `community:`.
 * Do not deploy this folder from the Netlify repo. Copy it into the
 * mamapedia-chat tree and route `/community` before `/chat`.
 */

const KV_PREFIX = 'community:';

const CATEGORIES = [
  'parenting',
  'kita_school',
  'housing',
  'paperwork',
  'medical',
  'legal',
  'activities',
  'life'
];

const CATEGORY_ALIAS = {
  health: 'medical',
  care: 'kita_school',
  daily: 'life',
  kita: 'kita_school'
};

const PUBLIC_STATUSES = ['published', 'flagged'];
const DISCLAIMER = '经验分享，非专业意见';
const ANON_LABEL = '匿名家长';

const CONTACT_RE = /微信|whatsapp|@|https?:\/\/|电话|私聊|加我|\bDM\b/i;
const HIGH_RISK_RE = /用药|剂量|诊断|签证|离婚|Jugendamt|抚养|停药|处方|家暴|自伤|虐待/;
const NAME_BLOCK_RE = /医生|律师|管理员|官方|MamaPedia|mamapedia/i;

const SEED_QUESTIONS = [
  {
    id: 'seed-kita',
    authorId: 'seed-author-wang',
    displayName: '小王妈妈',
    anonymous: false,
    title: '杜塞尔多夫 Kita 申请，要不要一出生就登记？',
    body: '宝宝下个月出生，住 Bilk。听说 Kita-Navigator 要尽早填。有人是出生后马上申请的吗？当时准备了哪些材料？',
    category: 'kita_school',
    tags: ['Bilk'],
    stadtteil: 'Bilk',
    status: 'published',
    forceDisclaimer: false,
    createdAt: '2026-10-05T08:00:00.000Z',
    updatedAt: '2026-10-05T09:00:00.000Z',
    answers: [
      {
        id: 'seed-kita-a1',
        authorId: 'seed-author-bilk',
        displayName: 'Bilk妈妈',
        anonymous: false,
        body: '我们出生后一周就在 Kita-Navigator 登记了，同时填了好几所。材料主要是出生证明、住址证明和父母的证件。名额仍要等，但越早排队越安心。',
        disclaimer: false,
        status: 'published',
        likeCount: 8,
        likers: ['seed-like-1', 'seed-like-2', 'seed-like-3', 'seed-like-4', 'seed-like-5', 'seed-like-6', 'seed-like-7', 'seed-like-8'],
        createdAt: '2026-10-05T09:00:00.000Z'
      },
      {
        id: 'seed-kita-a2',
        authorId: 'seed-author-anon',
        displayName: '',
        anonymous: true,
        body: '可以先用预产期占位，出生后再补文件。我当时同时申请了 6 所，最后拿到 2 个位置。',
        disclaimer: false,
        status: 'published',
        likeCount: 5,
        likers: ['seed-like-9', 'seed-like-10', 'seed-like-11', 'seed-like-12', 'seed-like-13'],
        createdAt: '2026-10-05T09:20:00.000Z'
      }
    ],
    reports: []
  },
  {
    id: 'seed-fever',
    authorId: 'seed-author-garden',
    displayName: '花园妈妈',
    anonymous: false,
    title: '孩子夜里发烧，大家一般去哪家儿科急诊？',
    body: '两岁，住 Oberkassel，夜里突然发烧。想问问大家是去大学医院，还是就近的儿科急诊，排队大概多久？只想听过来人的经历。',
    category: 'medical',
    tags: ['Oberkassel'],
    stadtteil: 'Oberkassel',
    status: 'published',
    forceDisclaimer: false,
    createdAt: '2026-10-04T18:00:00.000Z',
    updatedAt: '2026-10-04T20:00:00.000Z',
    answers: [
      {
        id: 'seed-fever-a1',
        authorId: 'seed-author-chen',
        displayName: '小陈',
        anonymous: false,
        body: '我们去过大学医院儿科急诊，夜里人不少，等了大约两小时。这只是我们家的一次经历，具体要不要就医还是请联系医生或急救。',
        disclaimer: true,
        status: 'published',
        likeCount: 4,
        likers: ['seed-like-14', 'seed-like-15', 'seed-like-16', 'seed-like-17'],
        createdAt: '2026-10-04T20:00:00.000Z'
      }
    ],
    reports: []
  },
  {
    id: 'seed-eltern',
    authorId: 'seed-author-hidden',
    displayName: '',
    anonymous: true,
    title: '外国人申请 Elterngeld，大家实际交过哪些材料？',
    body: '我有居留许可，之前在德国工作过。想收集家长实际提交过的文件清单，方便自己对照，不是要替代官方说明。',
    category: 'paperwork',
    tags: [],
    stadtteil: '',
    status: 'published',
    forceDisclaimer: false,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
    answers: [
      {
        id: 'seed-eltern-a1',
        authorId: 'seed-author-pemp',
        displayName: 'Pempelfort妈妈',
        anonymous: false,
        body: '我交过护照和居留、孩子出生证明、近 12 个月工资单、银行账户。Elterngeldstelle 的窗口也可以当面问。这是我的办理经历，不是法律意见。',
        disclaimer: false,
        status: 'published',
        likeCount: 11,
        likers: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'],
        createdAt: '2026-10-03T10:00:00.000Z'
      }
    ],
    reports: []
  },
  {
    id: 'seed-indoor',
    authorId: 'seed-author-li',
    displayName: '小李',
    anonymous: false,
    title: '下雨天，Oberkassel 有适合 3 岁孩子的室内馆吗？',
    body: '想找个可以待一下午的地方，不用太闹。欢迎分享你常去的馆或咖啡馆。',
    category: 'activities',
    tags: ['Oberkassel'],
    stadtteil: 'Oberkassel',
    status: 'published',
    forceDisclaimer: false,
    createdAt: '2026-09-28T12:00:00.000Z',
    updatedAt: '2026-09-28T12:00:00.000Z',
    answers: [],
    reports: []
  }
];

function createMemoryKv() {
  const store = new Map();
  return {
    async get(key, type) {
      if (!store.has(key)) return null;
      const raw = store.get(key);
      if (type === 'json') {
        try { return JSON.parse(raw); } catch (err) { return null; }
      }
      return raw;
    },
    async put(key, value) {
      store.set(key, String(value));
    },
    async delete(key) {
      store.delete(key);
    }
  };
}

function normalizeCategory(value) {
  const raw = String(value || '').trim();
  if (CATEGORIES.indexOf(raw) !== -1) return raw;
  return CATEGORY_ALIAS[raw] || '';
}

function isPublicStatus(status) {
  return PUBLIC_STATUSES.indexOf(status) !== -1;
}

function moderationDecision(input) {
  const text = String((input && input.title) || '') + '\n' + String((input && input.body) || '');
  const reasons = [];
  if (input && input.sensitive) reasons.push('sensitive');
  if (CONTACT_RE.test(text)) reasons.push('contact');
  const category = normalizeCategory(input && input.category);
  if ((category === 'medical' || category === 'legal') && HIGH_RISK_RE.test(text)) reasons.push('high-risk');
  return {
    status: reasons.length ? 'pending' : 'published',
    reasons: reasons
  };
}

function charLen(value) {
  return Array.from(String(value || '')).length;
}

function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  const out = [];
  tags.forEach(function (tag) {
    const text = String(tag || '').trim();
    if (!text || charLen(text) > 20) return;
    if (out.indexOf(text) === -1) out.push(text);
  });
  return out.slice(0, 3);
}

function validateQuestion(input) {
  const src = input || {};
  const title = String(src.title || '').trim();
  const body = String(src.body || '').trim();
  const category = normalizeCategory(src.category);
  const anonymous = !!src.anonymous;
  const displayName = String(src.displayName || src.author || '').trim();
  const errors = [];
  if (charLen(title) < 5 || charLen(title) > 60) errors.push('标题请写 5–60 个字');
  if (charLen(body) < 10 || charLen(body) > 2000) errors.push('正文请写 10–2000 个字');
  if (!category) errors.push('请选择分类');
  if (!anonymous) {
    if (charLen(displayName) < 2 || charLen(displayName) > 20) errors.push('显示名请写 2–20 个字，或选择匿名');
    if (CONTACT_RE.test(displayName) || NAME_BLOCK_RE.test(displayName)) errors.push('显示名不能包含联系方式或冒充机构/专业身份');
  }
  return {
    ok: errors.length === 0,
    errors: errors,
    value: {
      title: title,
      body: body,
      category: category,
      anonymous: anonymous,
      displayName: anonymous ? '' : displayName,
      sensitive: !!src.sensitive,
      forceDisclaimer: !!src.forceDisclaimer,
      tags: cleanTags(src.tags),
      stadtteil: String(src.stadtteil || '').trim().slice(0, 40)
    }
  };
}

function validateAnswer(input) {
  const src = input || {};
  const body = String(src.body || src.text || '').trim();
  const anonymous = !!src.anonymous;
  const displayName = String(src.displayName || src.author || '').trim();
  const errors = [];
  if (charLen(body) < 10 || charLen(body) > 2000) errors.push('回答请写 10–2000 个字');
  if (!anonymous) {
    if (charLen(displayName) < 2 || charLen(displayName) > 20) errors.push('显示名请写 2–20 个字，或选择匿名');
    if (CONTACT_RE.test(displayName) || NAME_BLOCK_RE.test(displayName)) errors.push('显示名不能包含联系方式或冒充机构/专业身份');
  }
  return {
    ok: errors.length === 0,
    errors: errors,
    value: {
      body: body,
      anonymous: anonymous,
      displayName: anonymous ? '' : displayName
    }
  };
}

function newId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAuthorId(request) {
  const raw = String((request.headers.get('X-Community-Author') || '')).trim();
  if (/^[A-Za-z0-9_.:-]{8,80}$/.test(raw)) return raw;
  return '';
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = origin === 'https://mamapedia.netlify.app'
    || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://mamapedia.netlify.app',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Community-Author, X-Mod-Secret',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), { status: status, headers: cors });
}

async function kvGetJson(kv, key) {
  const value = await kv.get(key, 'json');
  if (value == null) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (err) { return null; }
  }
  return value;
}

async function readIds(kv) {
  const ids = await kvGetJson(kv, KV_PREFIX + 'ids');
  return Array.isArray(ids) ? ids : [];
}

async function writeIds(kv, ids) {
  await kv.put(KV_PREFIX + 'ids', JSON.stringify(ids));
}

async function readQuestion(kv, id) {
  return kvGetJson(kv, KV_PREFIX + 'q:' + id);
}

async function writeQuestion(kv, question) {
  await kv.put(KV_PREFIX + 'q:' + question.id, JSON.stringify(question));
  const answers = question.answers || [];
  for (let i = 0; i < answers.length; i++) {
    await kv.put(KV_PREFIX + 'a:' + answers[i].id, question.id);
  }
}

async function ensureSeed(kv) {
  const seeded = await kv.get(KV_PREFIX + 'seeded');
  if (seeded) return;
  const ids = await readIds(kv);
  if (ids.length) {
    await kv.put(KV_PREFIX + 'seeded', '1');
    return;
  }
  const seedIds = [];
  for (let i = 0; i < SEED_QUESTIONS.length; i++) {
    const question = JSON.parse(JSON.stringify(SEED_QUESTIONS[i]));
    await writeQuestion(kv, question);
    seedIds.push(question.id);
  }
  await writeIds(kv, seedIds);
  await kv.put(KV_PREFIX + 'seeded', '1');
}

function publishedAnswers(question) {
  return (question.answers || []).filter(function (answer) {
    return isPublicStatus(answer.status);
  });
}

function toPublicAnswer(answer, viewerId) {
  const liked = !!(viewerId && (answer.likers || []).indexOf(viewerId) !== -1);
  const row = {
    id: answer.id,
    body: answer.body,
    anonymous: !!answer.anonymous,
    displayName: answer.anonymous ? ANON_LABEL : (answer.displayName || ANON_LABEL),
    disclaimer: !!answer.disclaimer,
    disclaimerLabel: answer.disclaimer ? DISCLAIMER : '',
    likeCount: answer.likeCount || 0,
    liked: liked,
    createdAt: answer.createdAt,
    status: answer.status
  };
  return row;
}

function toPublicQuestion(question, viewerId, options) {
  const opts = options || {};
  const owner = !!(viewerId && question.authorId === viewerId);
  const answers = (question.answers || []).filter(function (answer) {
    if (isPublicStatus(answer.status)) return true;
    if (opts.ownerAnswers && answer.authorId === viewerId) return answer.status === 'pending' || answer.status === 'rejected';
    return false;
  }).map(function (answer) {
    const row = toPublicAnswer(answer, viewerId);
    if (!opts.includeStatus) delete row.status;
    return row;
  });
  answers.sort(function (a, b) {
    if ((b.likeCount || 0) !== (a.likeCount || 0)) return (b.likeCount || 0) - (a.likeCount || 0);
    return String(a.createdAt).localeCompare(String(b.createdAt));
  });
  const publicCount = publishedAnswers(question).length;
  const topLikes = publishedAnswers(question).reduce(function (max, answer) {
    return Math.max(max, answer.likeCount || 0);
  }, 0);
  const row = {
    id: question.id,
    title: question.title,
    body: question.body,
    category: question.category,
    tags: question.tags || [],
    stadtteil: question.stadtteil || '',
    anonymous: !!question.anonymous,
    displayName: question.anonymous ? ANON_LABEL : (question.displayName || ANON_LABEL),
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    answerCount: publicCount,
    topLikes: topLikes,
    needsDisclaimer: question.category === 'medical' || question.category === 'legal' || !!question.forceDisclaimer
  };
  if (opts.includeStatus || (owner && opts.ownerStatus)) row.status = question.status;
  if (!opts.summary) row.answers = answers;
  return row;
}

function toModQuestion(question) {
  return {
    id: question.id,
    authorId: question.authorId,
    displayName: question.displayName,
    anonymous: !!question.anonymous,
    title: question.title,
    body: question.body,
    category: question.category,
    status: question.status,
    createdAt: question.createdAt,
    reports: question.reports || [],
    answers: (question.answers || []).map(function (answer) {
      return {
        id: answer.id,
        authorId: answer.authorId,
        displayName: answer.displayName,
        anonymous: !!answer.anonymous,
        body: answer.body,
        status: answer.status,
        disclaimer: !!answer.disclaimer,
        likeCount: answer.likeCount || 0,
        createdAt: answer.createdAt
      };
    })
  };
}

async function loadAll(kv) {
  const ids = await readIds(kv);
  const questions = [];
  for (let i = 0; i < ids.length; i++) {
    const question = await readQuestion(kv, ids[i]);
    if (question) questions.push(question);
  }
  return questions;
}

function secretState(request, env) {
  const expected = env && env.COMMUNITY_MOD_SECRET ? String(env.COMMUNITY_MOD_SECRET) : '';
  if (!expected) return 'unset';
  const got = String(request.headers.get('X-Mod-Secret') || '');
  if (got.length !== expected.length) return 'bad';
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0 ? 'ok' : 'bad';
}

function kvOf(env) {
  return env && (env.MARKT || env.COMMUNITY);
}

async function readJsonBody(request) {
  const text = await request.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch (err) { return null; }
}

async function handleCommunity(request, env) {
  const cors = corsHeaders(request);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  const kv = kvOf(env);
  if (!kv) return json({ error: 'KV binding MARKT is not configured' }, 503, cors);

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const viewerId = readAuthorId(request);

  try {
    if (path === '/community/mod/queue' || path.indexOf('/community/mod/') === 0) {
      const gate = secretState(request, env);
      if (gate === 'unset') return json({ error: 'COMMUNITY_MOD_SECRET is not configured' }, 503, cors);
      if (gate !== 'ok') return json({ error: 'invalid mod secret' }, 401, cors);
    }

    await ensureSeed(kv);

    if (path === '/community/questions' && request.method === 'GET') {
      return listQuestions(url, kv, viewerId, cors);
    }
    if (path === '/community/questions' && request.method === 'POST') {
      return createQuestion(request, kv, viewerId, cors);
    }
    const questionMatch = path.match(/^\/community\/questions\/([^/]+)$/);
    if (questionMatch && request.method === 'GET') {
      return getQuestion(decodeURIComponent(questionMatch[1]), url, kv, viewerId, cors);
    }
    const answerMatch = path.match(/^\/community\/questions\/([^/]+)\/answers$/);
    if (answerMatch && request.method === 'POST') {
      return createAnswer(decodeURIComponent(answerMatch[1]), request, kv, viewerId, cors);
    }
    const likeMatch = path.match(/^\/community\/answers\/([^/]+)\/like$/);
    if (likeMatch && (request.method === 'POST' || request.method === 'DELETE')) {
      return toggleLike(decodeURIComponent(likeMatch[1]), request, kv, viewerId, cors);
    }
    if (path === '/community/report' && request.method === 'POST') {
      return createReport(request, kv, viewerId, cors);
    }
    if (path === '/community/mod/queue' && request.method === 'GET') {
      return modQueue(kv, cors);
    }
    const modMatch = path.match(/^\/community\/mod\/(questions|answers)\/([^/]+)\/(approve|reject)$/);
    if (modMatch && request.method === 'POST') {
      return modAction(modMatch[1], decodeURIComponent(modMatch[2]), modMatch[3], request, kv, cors);
    }
    return json({ error: 'not found' }, 404, cors);
  } catch (err) {
    return json({ error: 'community error' }, 500, cors);
  }
}

async function listQuestions(url, kv, viewerId, cors) {
  const mine = url.searchParams.get('mine') === '1';
  const category = normalizeCategory(url.searchParams.get('category') || '');
  const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
  const sort = url.searchParams.get('sort') || 'new';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const all = await loadAll(kv);
  let rows = all.filter(function (question) {
    if (question.status === 'deleted') return false;
    if (mine) return !!viewerId && question.authorId === viewerId;
    return isPublicStatus(question.status);
  });
  if (category) rows = rows.filter(function (question) { return question.category === category; });
  if (q) {
    rows = rows.filter(function (question) {
      return (question.title + '\n' + question.body).toLowerCase().indexOf(q) !== -1;
    });
  }
  rows.sort(function (a, b) {
    if (sort === 'hot') {
      const hot = function (question) {
        return publishedAnswers(question).reduce(function (sum, answer) { return sum + (answer.likeCount || 0); }, 0);
      };
      if (hot(b) !== hot(a)) return hot(b) - hot(a);
    } else if (sort === 'unanswered') {
      const emptyA = publishedAnswers(a).length === 0 ? 0 : 1;
      const emptyB = publishedAnswers(b).length === 0 ? 0 : 1;
      if (emptyA !== emptyB) return emptyA - emptyB;
    }
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
  const pageSize = 20;
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize).map(function (question) {
    return toPublicQuestion(question, viewerId, {
      summary: true,
      includeStatus: mine,
      ownerStatus: mine
    });
  });
  return json({ questions: slice, page: page, pageSize: pageSize, total: rows.length }, 200, cors);
}

async function createQuestion(request, kv, viewerId, cors) {
  const body = await readJsonBody(request);
  if (body == null) return json({ error: 'invalid JSON' }, 400, cors);
  const parsed = validateQuestion(body);
  if (!parsed.ok) return json({ error: parsed.errors[0], errors: parsed.errors }, 400, cors);
  const authorId = viewerId || ('srv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  const decision = moderationDecision(parsed.value);
  const now = new Date().toISOString();
  const question = {
    id: newId('q_'),
    authorId: authorId,
    displayName: parsed.value.displayName,
    anonymous: parsed.value.anonymous,
    title: parsed.value.title,
    body: parsed.value.body,
    category: parsed.value.category,
    tags: parsed.value.tags,
    stadtteil: parsed.value.stadtteil,
    status: decision.status,
    forceDisclaimer: parsed.value.forceDisclaimer,
    modReasons: decision.reasons,
    createdAt: now,
    updatedAt: now,
    answers: [],
    reports: []
  };
  await writeQuestion(kv, question);
  const ids = await readIds(kv);
  ids.unshift(question.id);
  await writeIds(kv, ids);
  const payload = toPublicQuestion(question, authorId, { includeStatus: true, summary: true, ownerStatus: true });
  payload.authorIdEcho = authorId;
  return json(payload, 201, cors);
}

async function getQuestion(id, url, kv, viewerId, cors) {
  const question = await readQuestion(kv, id);
  if (!question || question.status === 'deleted') return json({ error: 'not found' }, 404, cors);
  const mine = url.searchParams.get('mine') === '1';
  const owner = !!(mine && viewerId && question.authorId === viewerId);
  if (!isPublicStatus(question.status) && !owner) return json({ error: 'not found' }, 404, cors);
  return json({
    question: toPublicQuestion(question, viewerId, { includeStatus: owner, ownerStatus: owner, ownerAnswers: owner })
  }, 200, cors);
}

async function createAnswer(questionId, request, kv, viewerId, cors) {
  const question = await readQuestion(kv, questionId);
  if (!question || !isPublicStatus(question.status)) return json({ error: 'not found' }, 404, cors);
  const body = await readJsonBody(request);
  if (body == null) return json({ error: 'invalid JSON' }, 400, cors);
  const parsed = validateAnswer(body);
  if (!parsed.ok) return json({ error: parsed.errors[0], errors: parsed.errors }, 400, cors);
  const authorId = viewerId || ('srv_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  const decision = moderationDecision({
    title: '',
    body: parsed.value.body,
    category: question.category,
    sensitive: !!body.sensitive
  });
  const disclaimer = question.category === 'medical' || question.category === 'legal' || !!question.forceDisclaimer;
  const now = new Date().toISOString();
  const answer = {
    id: newId('a_'),
    authorId: authorId,
    displayName: parsed.value.displayName,
    anonymous: parsed.value.anonymous,
    body: parsed.value.body,
    disclaimer: disclaimer,
    status: decision.status,
    modReasons: decision.reasons,
    likeCount: 0,
    likers: [],
    createdAt: now
  };
  question.answers = question.answers || [];
  question.answers.push(answer);
  question.updatedAt = now;
  await writeQuestion(kv, question);
  const row = toPublicAnswer(answer, authorId);
  row.status = answer.status;
  return json({ answer: row, status: answer.status, authorIdEcho: authorId }, 201, cors);
}

async function findAnswer(kv, answerId) {
  const questionId = await kv.get(KV_PREFIX + 'a:' + answerId);
  if (!questionId) return null;
  const question = await readQuestion(kv, questionId);
  if (!question) return null;
  const answer = (question.answers || []).filter(function (item) { return item.id === answerId; })[0];
  if (!answer) return null;
  return { question: question, answer: answer };
}

async function toggleLike(answerId, request, kv, viewerId, cors) {
  if (!viewerId) return json({ error: 'missing X-Community-Author' }, 400, cors);
  const found = await findAnswer(kv, answerId);
  if (!found || !isPublicStatus(found.answer.status) || !isPublicStatus(found.question.status)) {
    return json({ error: 'not found' }, 404, cors);
  }
  if (found.answer.authorId === viewerId) return json({ error: '不能给自己的回答点赞' }, 403, cors);
  let liked = request.method !== 'DELETE';
  if (request.method === 'POST') {
    const body = await readJsonBody(request);
    if (body && body.liked === false) liked = false;
  }
  const likers = found.answer.likers || [];
  const index = likers.indexOf(viewerId);
  if (liked && index === -1) likers.push(viewerId);
  if (!liked && index !== -1) likers.splice(index, 1);
  found.answer.likers = likers;
  found.answer.likeCount = likers.length;
  found.question.updatedAt = new Date().toISOString();
  await writeQuestion(kv, found.question);
  return json({
    likeCount: found.answer.likeCount,
    liked: likers.indexOf(viewerId) !== -1
  }, 200, cors);
}

async function createReport(request, kv, viewerId, cors) {
  if (!viewerId) return json({ error: 'missing X-Community-Author' }, 400, cors);
  const body = await readJsonBody(request);
  if (!body) return json({ error: 'invalid JSON' }, 400, cors);
  const targetType = body.targetType === 'answer' ? 'answer' : 'question';
  const targetId = String(body.targetId || '');
  const reason = String(body.reason || '其他').slice(0, 80);
  let question = null;
  let answer = null;
  if (targetType === 'answer') {
    const found = await findAnswer(kv, targetId);
    if (!found) return json({ error: 'not found' }, 404, cors);
    question = found.question;
    answer = found.answer;
  } else {
    question = await readQuestion(kv, targetId);
    if (!question) return json({ error: 'not found' }, 404, cors);
  }
  const bucket = targetType === 'answer' ? (answer.reports = answer.reports || []) : (question.reports = question.reports || []);
  if (!bucket.some(function (report) { return report.authorId === viewerId; })) {
    bucket.push({ authorId: viewerId, reason: reason, createdAt: new Date().toISOString() });
  }
  const distinct = {};
  bucket.forEach(function (report) { distinct[report.authorId] = true; });
  let hidden = false;
  if (Object.keys(distinct).length >= 3) {
    if (targetType === 'answer') answer.status = 'hidden';
    else question.status = 'hidden';
    hidden = true;
  } else if (targetType === 'question' && question.status === 'published') {
    question.status = 'flagged';
  } else if (targetType === 'answer' && answer.status === 'published') {
    answer.status = 'flagged';
  }
  await writeQuestion(kv, question);
  return json({ ok: true, hidden: hidden }, 201, cors);
}

async function modQueue(kv, cors) {
  const all = await loadAll(kv);
  const questions = [];
  const answers = [];
  all.forEach(function (question) {
    if (question.status === 'pending' || question.status === 'flagged' || question.status === 'hidden') {
      questions.push(toModQuestion(question));
    }
    (question.answers || []).forEach(function (answer) {
      if (answer.status === 'pending' || answer.status === 'hidden' || answer.status === 'flagged') {
        answers.push({
          id: answer.id,
          questionId: question.id,
          authorId: answer.authorId,
          displayName: answer.displayName,
          anonymous: !!answer.anonymous,
          body: answer.body,
          status: answer.status,
          createdAt: answer.createdAt
        });
      }
    });
  });
  return json({ questions: questions, answers: answers }, 200, cors);
}

async function modAction(type, id, action, request, kv, cors) {
  const body = await readJsonBody(request);
  const reason = body && body.reason ? String(body.reason).slice(0, 80) : '';
  if (action === 'reject' && !reason) return json({ error: 'reason required' }, 400, cors);
  if (type === 'questions') {
    const question = await readQuestion(kv, id);
    if (!question) return json({ error: 'not found' }, 404, cors);
    question.status = action === 'approve' ? 'published' : 'rejected';
    question.modReason = reason;
    question.updatedAt = new Date().toISOString();
    await writeQuestion(kv, question);
    return json({ id: question.id, status: question.status }, 200, cors);
  }
  const found = await findAnswer(kv, id);
  if (!found) return json({ error: 'not found' }, 404, cors);
  found.answer.status = action === 'approve' ? 'published' : 'rejected';
  found.answer.modReason = reason;
  found.question.updatedAt = new Date().toISOString();
  await writeQuestion(kv, found.question);
  return json({ id: found.answer.id, status: found.answer.status }, 200, cors);
}

module.exports = {
  KV_PREFIX: KV_PREFIX,
  CATEGORIES: CATEGORIES,
  PUBLIC_STATUSES: PUBLIC_STATUSES,
  DISCLAIMER: DISCLAIMER,
  ANON_LABEL: ANON_LABEL,
  SEED_QUESTIONS: SEED_QUESTIONS,
  createMemoryKv: createMemoryKv,
  normalizeCategory: normalizeCategory,
  isPublicStatus: isPublicStatus,
  moderationDecision: moderationDecision,
  validateQuestion: validateQuestion,
  validateAnswer: validateAnswer,
  readAuthorId: readAuthorId,
  ensureSeed: ensureSeed,
  handleCommunity: handleCommunity
};
