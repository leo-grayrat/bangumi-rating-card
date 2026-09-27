const assert = require('node:assert/strict');
const {
  parseSubjectId,
  calculateRating,
  scoreDescription,
} = require('../logic.js');

assert.equal(parseSubjectId('12'), 12);
assert.equal(parseSubjectId('https://bgm.tv/subject/12345'), 12345);
assert.equal(parseSubjectId('https://bangumi.tv/subject/42?from=test'), 42);
assert.equal(parseSubjectId('nonsense'), null);

const rating = calculateRating({1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 2, 8: 3, 9: 0, 10: 0});
assert.equal(rating.total, 6);
assert.equal(rating.score, 7.333333333333333);
assert.equal(rating.bars.find((bar) => bar.score === 8).height, 92);
assert.equal(rating.bars.find((bar) => bar.score === 6).height, 31);

assert.equal(scoreDescription(8.6), '神作');
assert.equal(scoreDescription(8.2), '力荐');
assert.equal(scoreDescription(7.4), '推荐');
assert.equal(scoreDescription(6.4), '还行');
assert.equal(scoreDescription(5.4), '不过不失');
assert.equal(scoreDescription(4.9), '少于预期');
assert.equal(scoreDescription(null), '');

console.log('logic tests passed');
