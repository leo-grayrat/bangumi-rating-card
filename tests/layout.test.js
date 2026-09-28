const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

assert.match(html, /<div class="card-layout">[\s\S]*<div class="cover-slot">[\s\S]*<div class="card-main">/);
assert.match(css, /#capture\s*\{[^}]*width:\s*760px;/s);
assert.match(css, /\.card-layout\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*flex-start;/s);
assert.match(css, /\.cover-slot\s*\{[^}]*flex:\s*0\s+0\s+230px;/s);
assert.match(css, /\.cover-slot img\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto;/s);
assert.doesNotMatch(css, /\.cover-slot img[^}]*object-fit:\s*contain/s);
assert.doesNotMatch(css, /\.cover-slot img[^}]*min-height:/s);
assert.match(css, /\.card-main\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*align-self:\s*stretch;/s);
assert.doesNotMatch(html, /<h2>收藏盒<\/h2>/);
assert.doesNotMatch(css, /\.SidePanel h2\s*\{/);

console.log('layout tests passed');
