const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

assert.match(html, /<div class="card-layout">[\s\S]*<div class="cover-slot">[\s\S]*<div class="card-main">/);
assert.match(css, /#capture\s*\{[^}]*width:\s*760px;/s);
assert.match(css, /\.card-layout\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*stretch;/s);
assert.match(css, /\.cover-slot\s*\{[^}]*flex:\s*0\s+0\s+210px;/s);
assert.match(css, /\.cover-slot img,\s*\.cover-placeholder\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*contain;/s);
assert.match(css, /\.card-main\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s);

console.log('layout tests passed');
