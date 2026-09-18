#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXTENSIONS_DIR = path.join(__dirname, '..', 'extensions');
const INDEX_FILE = path.join(EXTENSIONS_DIR, 'index.json');

const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;

function validate() {
  if (!fs.existsSync(INDEX_FILE)) { console.error('extensions/index.json not found'); process.exit(1); }
  let index;
  try { index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')); } catch (e) { console.error('parse error:', e.message); process.exit(1); }
  if (!index.schema_version || !index.generated_at || !Array.isArray(index.extensions)) {
    console.error('invalid schema'); process.exit(1);
  }
  let errors = 0;
  const slugs = new Set();
  for (const ext of index.extensions) {
    const required = ['slug','name','description','version','author','homepage','min_theme_version','tags','download_url','integrity','updated_at'];
    for (const f of required) { if (!ext[f]) { console.error(`missing ${f}`); errors++; } }
    if (slugs.has(ext.slug)) { console.error(`duplicate slug ${ext.slug}`); errors++; } else slugs.add(ext.slug);
    if (!SEMVER.test(ext.version)) { console.error(`bad version ${ext.version}`); errors++; }
    if (!SEMVER.test(ext.min_theme_version)) { console.error(`bad min_theme_version ${ext.min_theme_version}`); errors++; }
    if (!ext.download_url.startsWith('https://')) { console.error(`download_url not HTTPS`); errors++; }
    if (!ext.integrity.startsWith('sha256:')) { console.error(`integrity not sha256`); errors++; }
    if (!Array.isArray(ext.tags)) { console.error(`tags not array`); errors++; }
    if (isNaN(Date.parse(ext.updated_at))) { console.error(`invalid updated_at`); errors++; }
  }
  if (errors) { console.error(`validation failed ${errors} errors`); process.exit(1); }
  console.log(`validation passed ${index.extensions.length} extensions`);
}

validate();
