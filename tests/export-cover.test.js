const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

assert.match(source, /exportCoverDataUrl:\s*''/);
assert.match(source, /async function ensureExportCoverDataUrl\(/);
assert.match(source, /https:\/\/wsrv\.nl\/\?url=/);
assert.match(source, /onclone:\s*\(clonedDocument\)\s*=>/);
assert.match(source, /clonedCover\.src = exportCoverDataUrl/);
assert.match(source, /封面无法转换成可导出的图片/);
assert.doesNotMatch(source, /setCover\(el\.cardCover, el\.cardCoverPlaceholder, dataUrl\)/);

console.log('export cover tests passed');
