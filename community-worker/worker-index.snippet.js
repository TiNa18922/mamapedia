/**
 * Paste into mamapedia-chat `worker/index.js`.
 * Put this branch BEFORE `/chat`, Mietrecht, and KB handlers.
 * Do not change those handlers.
 *
 * Copy `community-worker/shared/community.js` to the worker tree, for example
 * `worker/shared/community.js`, then:
 *
 *   import community from "./shared/community.js";
 *
 * The shared file is CommonJS (`module.exports`). Wrangler/esbuild can import it.
 * If the live worker already uses ESM-only files, keep this import — esbuild
 * bundles the CJS module. Do not `wrangler deploy` from the Netlify repo.
 */
// import community from "./shared/community.js";
//
// export default {
//   async fetch(request, env, ctx) {
//     const path = new URL(request.url).pathname;
//     if (path === "/community" || path.startsWith("/community/")) {
//       return community.handleCommunity(request, env);
//     }
//     // existing /chat, /markt, Mietrecht, KB...
//   }
// };
