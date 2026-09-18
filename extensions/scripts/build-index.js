#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXTENSIONS_DIR = path.join(__dirname, '..', 'extensions');
const OUTPUT_FILE = path.join(EXTENSIONS_DIR, 'index.json');

const REQUIRED_FIELDS = ['slug', 'name', 'description', 'version', 'author', 'homepage', 'min_theme_version', 'tags', 'download_url', 'integrity', 'updated_at'];

function buildIndex() {
  const extensions = [];
  const errors = [];

  const files = fs.readdirSync(EXTENSIONS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(EXTENSIONS_DIR, file), 'utf8');
      const ext = JSON.parse(content);
      const missing = REQUIRED_FIELDS.filter(f => !(f in ext));
      if (missing.length) { errors.push(`${file}: missing ${missing.join(', ')}`); continue; }
      if (extensions.some(e => e.slug === ext.slug)) { errors.push(`${file}: duplicate slug ${ext.slug}`); continue; }
      const semver = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;
      if (!semver.test(ext.version)) { errors.push(`${file}: bad version ${ext.version}`); continue; }
      extensions.push({
        slug: ext.slug,
        name: ext.name,
        description: ext.description || '',
        version: ext.version,
        author: ext.author || '',
        homepage: ext.homepage || '',
        min_theme_version: ext.min_theme_version || '2.0.0',
        tags: ext.tags || [],
        download_url: ext.download_url,
        integrity: ext.integrity || '',
        thumbnail: ext.thumbnail || '',
        updated_at: ext.updated_at || new Date().toISOString()
      });
    } catch (e) {
      errors.push(`${file}: ${e.message}`);
    }
  }

  if (errors.length) {
    console.error('Build errors:', errors.join('\n'));
    process.exit(1);
  }

  extensions.sort((a,b)=>a.name.localeCompare(b.name));
  const index = { schema_version: '1.0', generated_at: new Date().toISOString(), total_extensions: extensions.length, extensions };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`Generated extensions/index.json with ${extensions.length} extensions`);
}

buildIndex();
