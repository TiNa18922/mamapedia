# Community API for mamapedia-chat

Drop-in modules for the **existing** mamapedia-chat Cloudflare Worker
(`https://mamapedia-chat.golightly2004.workers.dev`). Do **not** `wrangler deploy`
from this Netlify repo (`TiNa18922/mamapedia`). Grok Bot copies these files into
the live worker tree and deploys from that box.

Chat `/chat`, Mietrecht, and KB routes stay untouched. Community is a new path prefix.

## Copy steps

1. Copy `community-worker/shared/community.js` to the mamapedia-chat worker, e.g. `worker/shared/community.js`.
2. In `worker/index.js`, **before** the `/chat` branch, add the route from `worker-index.snippet.js`:

```js
import community from "./shared/community.js";

// inside fetch(request, env):
const path = new URL(request.url).pathname;
if (path === "/community" || path.startsWith("/community/")) {
  return community.handleCommunity(request, env);
}
```

`shared/community.js` is CommonJS (`module.exports`). Wrangler/esbuild bundles that import.
If a global CORS wrapper only allows `content-type`, extend it for Community responses:
`Content-Type, X-Community-Author, X-Mod-Secret` and method `DELETE`.

3. Reuse the existing **MARKT** KV binding. No new namespace. Keys use the prefix `community:` (`community:ids`, `community:q:<id>`, `community:a:<id>`, `community:seeded`). See `wrangler.community-snippet.toml`.
4. Set the mod secret on the worker (do not commit it):

```bash
wrangler secret put COMMUNITY_MOD_SECRET
```

If `COMMUNITY_MOD_SECRET` is unset, **only** `/community/mod/*` returns `503`. Public routes still work.

5. Deploy from the mamapedia-chat project, not from this repo.
6. The first `GET /community/questions` seeds four sample questions once (`community:seeded`). It does not seed again after that.

## Routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/community/questions?category=&q=&sort=&page=` | Published (and flagged) only. Never pending/rejected/hidden. |
| `GET` | `/community/questions?mine=1` | Caller's own questions, including 审核中. Header `X-Community-Author`. |
| `GET` | `/community/questions/:id` | Question + published answers. Pending only with `?mine=1` and the same author id. |
| `POST` | `/community/questions` | `201` and `status: published` or `pending`. |
| `POST` | `/community/questions/:id/answers` | Medical/legal answers get `disclaimer: true`（经验分享，非专业意见）. |
| `POST` | `/community/answers/:id/like` | Body `{ "liked": true }`. One like per author. No self-like (`403`). |
| `DELETE` | `/community/answers/:id/like` | Removes that author's like. `POST` with `{ "liked": false }` does the same. |
| `POST` | `/community/report` | `{ targetType, targetId, reason }`. 3 distinct reports hide the target. |
| `GET` | `/community/mod/queue` | Header `X-Mod-Secret`. |
| `POST` | `/community/mod/questions/:id/approve` | |
| `POST` | `/community/mod/questions/:id/reject` | JSON `{ "reason": "广告推销" }`. |
| `POST` | `/community/mod/answers/:id/approve` and `/reject` | Same secret. |
| `OPTIONS` | all of the above | CORS: `https://mamapedia.netlify.app`, `localhost`, `127.0.0.1`. |

`sort` is `new` (default), `unanswered`, or `hot`. `category` is one of:
`parenting`, `kita_school`, `housing`, `paperwork`, `medical`, `legal`, `activities`, `life`.

Pending when the client sends `sensitive: true`, or the text matches contact/link patterns
(`微信`, `whatsapp`, `@`, `http(s)://`, `电话`, `私聊`, `加我`, `DM`), or category is
`medical`/`legal` **and** the text hits the high-risk list (用药, 剂量, 诊断, 签证, 离婚, Jugendamt, 抚养, 停药, 处方, …).

Public JSON never includes `authorId`. Anonymous display name is `匿名家长`.

## Local curl (no Cloudflare token)

```bash
node community-worker/dev-server.mjs
# listens on http://127.0.0.1:8787  secret defaults to dev-mod-secret

curl -s http://127.0.0.1:8787/community/questions | head

curl -s -X POST http://127.0.0.1:8787/community/questions \
  -H 'Content-Type: application/json' \
  -H 'X-Community-Author: web_demo_author_01' \
  -d '{"title":"Bilk 附近周末可以去哪","body":"想找一个适合三岁孩子的室内地方，不要太吵。","category":"activities","displayName":"测试妈妈","anonymous":false}'

curl -s -X POST http://127.0.0.1:8787/community/questions \
  -H 'Content-Type: application/json' \
  -H 'X-Community-Author: web_demo_author_01' \
  -d '{"title":"想问疫苗剂量怎么吃","body":"孩子发烧后想问具体用药剂量，可以私聊我吗？","category":"medical","displayName":"测试妈妈","sensitive":true}'
# status pending — absent from the public list

curl -s -H 'X-Mod-Secret: dev-mod-secret' http://127.0.0.1:8787/community/mod/queue

curl -s -X POST http://127.0.0.1:8787/community/mod/questions/QUESTION_ID/approve \
  -H 'X-Mod-Secret: dev-mod-secret' -H 'Content-Type: application/json' -d '{}'
```

After the worker deploy, the same paths work on
`https://mamapedia-chat.golightly2004.workers.dev`. Until then the Netlify UI
calls that host and, if it 404s, shows the offline sample list.
