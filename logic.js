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

  function normalizeCounts(input) {
    const counts = {};
    for (let score = 1; score <= 10; score += 1) {
      const value = Number(input?.[score] ?? input?.[String(score)] ?? 0);
      counts[score] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    }
    return counts;
  }

  function controversyLabel(stdDev) {
    if (stdDev == null || !Number.isFinite(Number(stdDev))) return '';
    const value = Number(stdDev);
    if (value < 1.00) return '异口同声';
    if (value < 1.15) return '基本一致';
    if (value < 1.30) return '略有分歧';
    if (value < 1.45) return '莫衷一是';
    if (value < 1.60) return '各执一词';
    if (value < 1.75) return '你死我活';
    return '厨黑大战';
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

    const score = total ? weighted / total : null;
    let stdDev = null;
    if (score != null) {
      let squaredDistanceSum = 0;
      for (let value = 1; value <= 10; value += 1) {
        squaredDistanceSum += ((value - score) ** 2) * counts[value];
      }
      stdDev = Math.sqrt(squaredDistanceSum / total);
    }

    const bars = [];
    for (let scoreValue = 10; scoreValue >= 1; scoreValue -= 1) {
      const count = counts[scoreValue];
      const rawHeight = maxCount ? Math.round((92 * count) / maxCount) : 0;
      bars.push({ score: scoreValue, count, height: count ? Math.max(1, rawHeight) : 0 });
    }

    return {
      counts,
      total,
      score,
      stdDev,
      controversy: controversyLabel(stdDev),
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

  return {
    parseSubjectId,
    normalizeCounts,
    controversyLabel,
    calculateRating,
    scoreDescription,
    scoreClass,
  };
});
