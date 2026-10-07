/**
 * Local Community API for curl smoke. Not used by Netlify.
 *   node community-worker/dev-server.mjs
 * Memory KV resets when the process stops.
 */
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const community = require('./shared/community.js');
const kv = community.createMemoryKv();
const port = Number(process.env.PORT || 8787);

const server = createServer(async function (req, res) {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const request = new Request('http://127.0.0.1:' + port + req.url, {
      method: req.method,
      headers: req.headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body
    });
    const response = await community.handleCommunity(request, {
      MARKT: kv,
      COMMUNITY_MOD_SECRET: process.env.COMMUNITY_MOD_SECRET || 'dev-mod-secret'
    });
    res.statusCode = response.status;
    response.headers.forEach(function (value, key) { res.setHeader(key, value); });
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(err && err.message || err) }));
  }
});

server.listen(port, '127.0.0.1', function () {
  console.log('community dev API http://127.0.0.1:' + port + '/community/questions');
});
