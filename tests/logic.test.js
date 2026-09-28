const assert = require('node:assert/strict');
const {
  parseSubjectId,
  calculateRating,
  scoreDescription,
  controversyLabel,
} = require('../logic.js');

assert.equal(parseSubjectId('12'), 12);
assert.equal(parseSubjectId('https://bgm.tv/subject/12345'), 12345);
assert.equal(parseSubjectId('https://bangumi.tv/subject/42?from=test'), 42);
assert.equal(parseSubjectId('nonsense'), null);

const rating = calculateRating({1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 2, 8: 3, 9: 0, 10: 0});
assert.equal(rating.total, 6);
assert.equal(rating.score, 7.333333333333333);
assert.equal(rating.stdDev, 0.7453559924999299);
assert.equal(rating.controversy, '异口同声');
assert.equal(rating.bars.find((bar) => bar.score === 8).height, 92);
assert.equal(rating.bars.find((bar) => bar.score === 6).height, 31);

assert.equal(scoreDescription(8.6), '神作');
assert.equal(scoreDescription(8.2), '力荐');
assert.equal(scoreDescription(7.4), '推荐');
assert.equal(scoreDescription(6.4), '还行');
assert.equal(scoreDescription(5.4), '不过不失');
assert.equal(scoreDescription(4.9), '少于预期');
assert.equal(scoreDescription(null), '');

assert.equal(controversyLabel(0.99), '异口同声');
assert.equal(controversyLabel(1.00), '基本一致');
assert.equal(controversyLabel(1.1499), '基本一致');
assert.equal(controversyLabel(1.15), '略有分歧');
assert.equal(controversyLabel(1.30), '莫衷一是');
assert.equal(controversyLabel(1.45), '各执一词');
assert.equal(controversyLabel(1.60), '你死我活');
assert.equal(controversyLabel(1.75), '厨红黑大战');
assert.equal(controversyLabel(null), '');

console.log('logic tests passed');
