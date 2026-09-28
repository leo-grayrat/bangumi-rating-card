const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

assert.match(html, /<header class="bangumi-header">[\s\S]*class="bangumi-logo"[\s\S]*class="bangumi-nav"/);
assert.match(html, /https:\/\/bgm\.tv\/img\/rc3\/logo_2x\.png/);
assert.match(html, /<div class="page-breadcrumb">/);
assert.match(css, /--bgm-pink:\s*#f09199;/i);
assert.match(css, /body\s*\{[^}]*"Lucida Grande"/s);
assert.match(css, /\.bangumi-header\s*\{[^}]*border-bottom:\s*1px solid/s);
assert.match(css, /\.editor-section\s*\{[^}]*border:\s*0;/s);
assert.match(css, /\.editor-section h2::after/s);
assert.match(css, /\.text-link\s*\{[^}]*color:\s*var\(--bgm-link\)/s);

console.log('theme tests passed');
