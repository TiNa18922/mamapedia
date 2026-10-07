/**
 * Community API client helpers. No DOM and no network.
 * The page loads this before js/community.js.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CommunityApi = api;
})(typeof window !== 'undefined' ? window : null, function () {
  var API_BASE = 'https://mamapedia-chat.golightly2004.workers.dev';
  var AUTHOR_KEY = 'mamapedia_community_author';
  var PUBLIC_STATUSES = { published: true, flagged: true };
  var CATEGORIES = ['parenting', 'kita_school', 'housing', 'paperwork', 'medical', 'legal', 'activities', 'life'];

  function questionsUrl(query) {
    var q = query || {};
    var params = [];
    function add(key, value) {
      if (value == null || value === '' || value === 'all') return;
      params.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
    }
    add('category', q.category);
    add('q', q.q);
    add('sort', q.sort);
    add('page', q.page && Number(q.page) > 1 ? q.page : '');
    if (q.mine) add('mine', '1');
    return '/community/questions' + (params.length ? '?' + params.join('&') : '');
  }

  function isPublicStatus(status) {
    return !!PUBLIC_STATUSES[status || 'published'];
  }

  function mapStatus(row) {
    var status = row && row.status ? row.status : 'published';
    if (status === 'pending' || status === 'rejected' || status === 'hidden' || status === 'deleted' || status === 'published' || status === 'flagged') {
      return status;
    }
    return 'published';
  }

  function needsDisclaimer(row) {
    if (!row) return false;
    return row.category === 'medical' || row.category === 'legal' || row.topic === 'medical' || row.topic === 'legal' || !!row.needsDisclaimer || !!row.disclaimer;
  }

  function newAuthorId() {
    var rand = Math.random().toString(36).slice(2, 10);
    var stamp = Date.now().toString(36);
    return ('web_' + stamp + rand).slice(0, 80);
  }

  return {
    API_BASE: API_BASE,
    AUTHOR_KEY: AUTHOR_KEY,
    CATEGORIES: CATEGORIES,
    questionsUrl: questionsUrl,
    isPublicStatus: isPublicStatus,
    mapStatus: mapStatus,
    needsDisclaimer: needsDisclaimer,
    newAuthorId: newAuthorId
  };
});
