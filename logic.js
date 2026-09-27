(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BangumiRatingLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function parseSubjectId(value) {
    const text = String(value ?? '').trim();
    if (/^\d+$/.test(text)) return Number(text);
    const match = text.match(/(?:bgm\.tv|bangumi\.tv|chii\.in)\/subject\/(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  function corsImageUrl(url) {
    const value = String(url || '').trim();
    if (!value || /^(?:data|blob):/i.test(value)) return value;
    return `https://wsrv.nl/?url=${encodeURIComponent(value)}`;
  }

  function normalizeCounts(input) {
    const counts = {};
    for (let score = 1; score <= 10; score += 1) {
      const value = Number(input?.[score] ?? input?.[String(score)] ?? 0);
      counts[score] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    }
    return counts;
  }

  function calculateRating(input) {
    const counts = normalizeCounts(input);
    let total = 0;
    let weighted = 0;
    let maxCount = 0;
    for (let score = 1; score <= 10; score += 1) {
      const count = counts[score];
      total += count;
      weighted += score * count;
      maxCount = Math.max(maxCount, count);
    }
    const bars = [];
    for (let score = 10; score >= 1; score -= 1) {
      const count = counts[score];
      const rawHeight = maxCount ? Math.round((92 * count) / maxCount) : 0;
      bars.push({ score, count, height: count ? Math.max(1, rawHeight) : 0 });
    }
    return {
      counts,
      total,
      score: total ? weighted / total : null,
      bars,
    };
  }

  function scoreDescription(score) {
    if (score == null || !Number.isFinite(Number(score))) return '';
    const value = Number(score);
    if (value >= 8.5) return '神作';
    if (value >= 8.0) return '力荐';
    if (value >= 7.0) return '推荐';
    if (value >= 6.0) return '还行';
    if (value >= 5.0) return '不过不失';
    return '少于预期';
  }

  function scoreClass(score) {
    if (score == null || !Number.isFinite(Number(score))) return 'score1';
    return `score${Math.max(1, Math.min(10, Math.floor(Number(score))))}`;
  }

  return { parseSubjectId, corsImageUrl, normalizeCounts, calculateRating, scoreDescription, scoreClass };
});
