# RADYK Extension Directory — Complete Plan

> **Status**: Planning (v2 — Syndicate review applied)  
> **Created**: 2026-09-09  
> **Repository**: `radlabs/extensions` (GitHub Pages)  
> **Live URL**: `https://rahendz.github.io/radlabs/extensions/`  
> **Root Landing**: `https://rahendz.github.io/radlabs/` (repo root `index.html`)  
> **Changelog**: v2.1.0 — visual directory page added
> **Previous**: v2 — race condition fix, HMAC key mgmt, .gitattributes, validation hardening

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Repository Structure](#directory-repository-structure)
4. [Directory Website](#directory-website-extensionsindexhtml)
5. [Extension Repository Structure](#extension-repository-structure)
5. [Index Schema](#index-schema)
6. [Auto-Sync Workflow](#auto-sync-workflow)
7. [GitHub Actions Workflows](#github-actions-workflows)
8. [WordPress Client Extension](#wordpress-client-extension)
9. [Security Model](#security-model)
10. [CLI Commands](#cli-commands)
11. [Multi-Theme Strategy](#multi-theme-strategy)
12. [Development Phases](#development-phases)
13. [Technical Decisions](#technical-decisions)

---

## Overview

RADYK Extension Directory is a **private marketplace** for RADYK theme extensions. Similar to WordPress.org plugin directory, but exclusive to RADYK ecosystem.

**Key Principles:**
- Each extension lives in its **own GitHub repository** (isolated maintenance)
- Directory repo (`radlabs/extensions`) is a **GitHub Pages aggregator** (zero backend)
- **GitHub Actions** auto-sync extension metadata to directory on every release
- WordPress client fetches `index.json` from GitHub Pages, caches 24h
- **Double integrity**: ZIP hash (download) + HMAC token (boot verification)

**Zero Server Costs:**
- GitHub Pages: free static hosting + CDN (root `/` = landing page, `/extensions/` = directory)
- GitHub Releases: free ZIP hosting + versioning
- GitHub Actions: 2000 min/month free
- No PHP server, no database, no maintenance

**v2 Critical Fixes Applied:**
- Race condition: `concurrency` group on `sync-index.yml` prevents parallel index rebuilds
- HMAC key management: documented key generation, storage, rotation, and verification flow
- ZIP reproducibility: `.gitattributes` export-ignore in extension repos
- Pre-download checks: Content-Length guard, ZipArchive extension check
- Validation hardening: `validate.js` now checks all required fields + semver format

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER EXPERIENCE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Developer pushes release → GitHub Actions auto-publishes       │
│                                                                 │
│  ext-seo-suite (repo)         ext-analytics (repo)              │
│  ├── release v2.1.0           ├── release v1.0.0                │
│  └── .github/workflows/       └── .github/workflows/            │
│      └── publish.yml              └── publish.yml                │
│           │                              │                       │
│           └──────────┬───────────────────┘                       │
│                      ▼                                           │
│  ┌─────────────────────────────────────┐                        │
│  │  extensions-directory (repo)        │                        │
│  │  ├── index.html                     │ ← landing page (root)  │
│  │  ├── extensions/                    │                        │
│  │  │   ├── index.json                 │ ← auto-rebuilt         │
│  │  │   ├── seo-suite.json             │ ← auto-updated         │
│  │  │   └── analytics.json             │ ← auto-updated         │
│  │  └── .github/workflows/             │                        │
│  │      └── sync-index.yml             │                        │
│  └─────────────────────────────────────┘                        │
│           │                                                     │
│           ▼                                                     │
│  GitHub Pages:                                                  │
│    / (root)           → landing page (rahendz.github.io/radlabs/)  │
│    /extensions/       → directory website + API (index.html)   │
│    /extensions/index.json → raw data (API consumers)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ wp_remote_get(index.json)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORDPRESS CLIENT                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RADYK2 Theme → Extensions → [Installed] [Directory]            │
│                                                                 │
│  Directory Tab:                                                 │
│  ├── Card grid (browse, search, filter)                        │
│  ├── Install button → download ZIP → extract → enable          │
│  ├── Update button → compare version → download → replace      │
│  └── Detail modal → changelog, homepage, tags                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Repository Structure

**Repo**: `radlabs/extensions`  
**Branch**: `main`  
**GitHub Pages Source**: `/` (root — serves landing page + `/extensions/` subdirectory)

```
extensions/                           ← repo root
├── index.html                        ← root landing page (rahendz.github.io/radlabs/)
├── extensions/                       ← directory subdirectory (rahendz.github.io/radlabs/extensions/)
│   ├── index.html                    ← visual directory page (search, browse, cards)
│   ├── index.json                    ← auto-generated (NEVER edit manually)
│   ├── seo-suite.json                ← per-extension metadata (auto-updated)
│   ├── analytics.json                ← per-extension metadata (auto-updated)
│   └── form-builder.json             ← per-extension metadata (auto-updated)
├── scripts/
│   ├── build-index.js                ← generates extensions/index.json from extensions/*.json
│   ├── validate.js                   ← validates JSON schema
│   └── build-pages.js                ← (optional) prebuilds directory page data
├── assets/                           ← shared assets for directory website
│   ├── style.css                     ← directory page styles
│   └── app.js                        ← directory page logic (search, filter, render)
├── .github/
│   └── workflows/
│       └── sync-index.yml            ← rebuild index.json on push (with concurrency lock)
├── README.md
├── LICENSE
├── CONTRIBUTING.md
└── PLAN.md                           ← this file
```

### Key Files

#### `extensions/index.json` (auto-generated, NEVER edit manually)

```json
{
  "schema_version": "1.0",
  "generated_at": "2026-09-09T00:00:00Z",
  "total_extensions": 3,
  "extensions": [
    {
      "slug": "seo-suite",
      "name": "SEO Suite",
      "description": "Advanced SEO tools for RADYK themes",
      "version": "2.1.0",
      "author": "RADYK",
      "homepage": "https://github.com/radlabs/ext-seo-suite",
      "min_theme_version": "2.0.0",
      "tags": ["seo", "performance"],
      "download_url": "https://github.com/radlabs/ext-seo-suite/releases/download/v2.1.0/seo-suite-2.1.0.zip",
      "integrity": "sha256:abc123def456...",
      "thumbnail": "",
      "updated_at": "2026-09-09T00:00:00Z"
    }
  ]
}
```

**Client fetch URL**: `https://rahendz.github.io/radlabs/extensions/index.json`

#### `extensions/seo-suite.json` (per-extension metadata, auto-updated by publish.yml)

```json
{
  "slug": "seo-suite",
  "name": "SEO Suite",
  "description": "Advanced SEO tools for RADYK themes",
  "short_description": "Meta tags, canonical URLs, sitemap integration",
  "version": "2.1.0",
  "author": "RADYK",
  "author_url": "https://radlabs.dev",
  "repo": "radlabs/ext-seo-suite",
  "homepage": "https://github.com/radlabs/ext-seo-suite",
  "requires_php": "8.2",
  "requires_wp": "6.0",
  "min_theme_version": "2.0.0",
  "tested_up_to": "2.5.0",
  "tags": ["seo", "performance", "meta"],
  "categories": ["seo"],
  "download_url": "https://github.com/radlabs/ext-seo-suite/releases/download/v2.1.0/seo-suite-2.1.0.zip",
  "integrity": "sha256:abc123def456...",
  "license": "GPL-2.0-or-later",
  "thumbnail": "https://raw.githubusercontent.com/radlabs/ext-seo-suite/main/screenshot.png",
  "changelog": {
    "2.1.0": "## 2.1.0\n- Added meta description editor\n- Fixed canonical URL bug",
    "2.0.0": "## 2.0.0\n- Initial release"
  },
  "stats": {
    "downloads": 142,
    "active_installs": 38,
    "last_updated": "2026-09-09T00:00:00Z"
  },
  "created_at": "2026-01-15T00:00:00Z",
  "updated_at": "2026-09-09T00:00:00Z"
}
```

---

## Directory Website (`extensions/index.html`)

**URL**: `https://rahendz.github.io/radlabs/extensions/`  
**File**: `extensions/index.html` (static, zero-build, no framework)  
**Data source**: `index.json` (same directory, fetched client-side)

### Purpose

Visual landing page for browsing, searching, and discovering extensions — replaces raw JSON browsing with a proper directory interface. SEO-friendly, mobile-responsive, loads instantly (GitHub Pages CDN).

### Features

| Feature | Description |
|---|---|
| **Extension cards** | Grid of cards showing name, description, author, version, tags, thumbnail |
| **Search** | Real-time text search across name, description, author, tags |
| **Tag filter** | Clickable tag pills → filter extensions by category |
| **Sort** | By name (A-Z), newest, most downloaded |
| **Detail modal** | Click card → modal with full info: description, changelog, version history, homepage link, download button |
| **Responsive** | Mobile-first, works on all screen sizes |
| **Dark mode** | Auto-detects `prefers-color-scheme`, manual toggle persisted in `localStorage` |
| **Install count** | Display download/install stats when available |
| **Empty state** | Graceful message when no extensions match search/filter |
| **Fallback** | If `index.json` fetch fails, shows error with retry button |

### Tech Stack

- **HTML/CSS/JS** — no build step, no framework, no dependencies
- **CSS Grid** — card layout (responsive: 1→2→3 columns)
- **Vanilla JS** — fetch `index.json`, filter, search, render
- **`assets/style.css`** — shared styles (can be inlined for single-file deploy)
- **`assets/app.js`** — directory page logic

### Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search extensions...                    [🌙 Dark]   │
├─────────────────────────────────────────────────────────┤
│  [All] [seo] [performance] [forms] [analytics] [...]    │
├─────────────────────────────────────────────────────────┤
│  Sort: [Newest ▾]     Showing 5 extensions              │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 📷 thumb │  │ 📷 thumb │  │ 📷 thumb │              │
│  │ SEO      │  │ Analytics│  │ Forms    │              │
│  │ Suite    │  │ Pro      │  │ Builder  │              │
│  │ v2.1.0   │  │ v1.0.0   │  │ v1.2.0   │              │
│  │ [seo]    │  │ [data]   │  │ [forms]  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐                             │
│  │ Security │  │ Media    │                             │
│  │ Shield   │  │ Optimizer│                             │
│  │ v1.0.0   │  │ v1.1.0   │                             │
│  │ [security]│ │ [media]  │                             │
│  └──────────┘  └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### Detail Modal

```
┌─────────────────────────────────────────────────┐
│  ✕                                               │
│  SEO Suite                               v2.1.0  │
│  by RADYK                                        │
│  ─────────────────────────────────────────────── │
│  Advanced SEO tools for RADYK themes.            │
│  Meta tags, canonical URLs, sitemap integration  │
│                                                  │
│  Tags: [seo] [performance] [meta]                │
│  Requires: RADYK ≥ 2.0.0, PHP ≥ 8.2            │
│  License: GPL-2.0-or-later                       │
│                                                  │
│  ┌─ Changelog ─────────────────────────────────┐│
│  │ v2.1.0 — Added meta description editor      ││
│  │ v2.0.0 — Initial release                    ││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  [📥 Install]  [🔗 Homepage]  [📖 README]       │
└─────────────────────────────────────────────────┘
```

### SEO

- `<title>`: `RADYK Extensions — Browse & Install`
- `<meta description>`: `Discover and install extensions for RADYK themes.`
- Open Graph tags for social sharing
- Semantic HTML (`<article>`, `<nav>`, `<main>`, `<section>`)
- `aria-` labels for accessibility

### URL Params (optional)

- `?search=seo` → pre-fill search
- `?tag=performance` → pre-filter by tag
- `?ext=seo-suite` → open detail modal directly

Example: `https://rahendz.github.io/radlabs/extensions/?tag=seo&ext=seo-suite`

---

## Extension Repository Structure

**Repo naming**: `ext-{slug}` (e.g., `ext-seo-suite`)  
**Branch**: `main`

```
ext-seo-suite/
├── system/
│   └── Extensions/
│       └── SeoSuite/
│           ├── SeoSuite.extension.php      ← orchestrator
│           ├── register.json               ← metadata + integrity token
│           ├── Handlers/
│           │   └── seo.handler.php
│           ├── contents/
│           │   └── seo.php
│           └── Views/
│               └── settings.php
├── assets/                                 ← extension-specific assets (optional)
│   ├── css/
│   │   └── seo.css
│   └── js/
│       └── seo.js
├── .gitattributes                          ← export-ignore for reproducible ZIPs
├── screenshot.png                          ← thumbnail for directory
├── README.md                               ← description, installation, changelog
├── LICENSE
├── composer.json                           ← optional dependencies
├── package.json                            ← optional build tools
└── .github/
    └── workflows/
        ├── publish.yml                     ← auto-sync to directory
        └── ci.yml                          ← lint, test, build (optional)
```

### `.gitattributes` (required — ZIP reproducibility)

**File**: `.gitattributes` (root of extension repo)

```gitattributes
# Export-ignore: files excluded from git archive / ZIP builds
# Ensures reproducible ZIPs across builds

# Build artifacts
node_modules/      export-ignore
vendor/            export-ignore
build/             export-ignore
dist/              export-ignore

# Dev files
.github/           export-ignore
.gitignore         export-ignore
.gitattributes     export-ignore
.editorconfig      export-ignore
phpunit.xml        export-ignore
phpstan.neon       export-ignore
.eslintrc*         export-ignore
.prettierrc*       export-ignore

# OS files
.DS_Store          export-ignore
Thumbs.db          export-ignore
*.swp              export-ignore
*.swo              export-ignore

# Test files
tests/             export-ignore
*_test.php         export-ignore
test_*             export-ignore
```

### `register.json` (required)

```json
{
  "name": "seo-suite",
  "label": "SEO Suite",
  "description": "Advanced SEO tools for RADYK themes",
  "version": "2.1.0",
  "domain": "gen.radyk.ext",
  "integrity": "hmac-sha256:...",
  "settings": {
    "namespace": "SeoSuite\\",
    "orchestrator": "SeoSuite",
    "autodiscover": true,
    "network": true
  },
  "submenu": {
    "title": {
      "page": "SEO Suite Settings",
      "menu": "SEO"
    }
  },
  "export": {
    "options": ["radyk_seo_settings"],
    "theme_mods": [],
    "tables": []
  }
}
```

### Field Glossary (`register.json`)

| Field | Definition |
|---|---|
| `name` | Unique slug identifier — used in directory, URL, and folder naming |
| `label` | Human-readable display name |
| `domain` | Internal namespace domain — prevents option/table name collisions. Format: `{scope}.{project}.{type}` |
| `integrity` | HMAC-SHA256 token — signed by developer's private key, verified by theme's public key during boot. See [HMAC Key Management](#hmac-key-management) |
| `settings.namespace` | PHP namespace for autoloading (e.g., `SeoSuite\\`) |
| `settings.orchestrator` | Entry-point class name (extends `\\System\\Extensions\\Extension`) |
| `settings.autodiscover` | Auto-discover handler/content/view files in subdirectories |
| `settings.network` | Enable on WordPress Multisite network-wide |
| `export.options` | WordPress option names to export/import with theme migration |
| `export.theme_mods` | Theme mod keys to export/import |
| `export.tables` | Custom table names to export/import |

---

## Index Schema

### Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-09 | Initial schema |

### Schema v1.0

```json
{
  "schema_version": "string (required)",
  "generated_at": "ISO 8601 timestamp (required)",
  "total_extensions": "integer (required)",
  "extensions": [
    {
      "slug": "string (required, unique)",
      "name": "string (required)",
      "description": "string (required)",
      "version": "string (required, semver)",
      "author": "string (required)",
      "homepage": "string (URL, required)",
      "min_theme_version": "string (semver, required)",
      "tags": "array of strings (required)",
      "download_url": "string (URL, required)",
      "integrity": "string (sha256:hash, required)",
      "thumbnail": "string (URL, optional)",
      "updated_at": "ISO 8601 timestamp (required)"
    }
  ]
}
```

---

## Auto-Sync Workflow

### Developer Push Flow

```
1. Developer pushes code to ext-seo-suite repo
2. Developer creates release (v2.1.0) on GitHub
3. publish.yml triggers:
   a. Build ZIP using git archive (respects .gitattributes export-ignore)
   b. Upload ZIP as release asset
   c. Generate metadata JSON
   d. Push metadata to extensions-directory/extensions/seo-suite.json
   e. Trigger sync-index.yml via repository_dispatch
4. sync-index.yml triggers (concurrency-locked — only 1 instance at a time):
   a. Read all extensions/*.json
   b. Build extensions/index.json
   c. Commit & push to main
5. GitHub Pages deploys updated index.json
6. WordPress client fetches updated index.json (within 24h cache)
```

### Developer Update Flow

```
1. Developer updates code in ext-seo-suite repo
2. Bump version in register.json
3. Create new release (v2.1.1)
4. publish.yml triggers:
   a. Build new ZIP (git archive — reproducible)
   b. Upload as release asset
   c. Update extensions/seo-suite.json with new version
   d. Trigger sync-index.yml via repository_dispatch
5. index.json updated (within concurrency lock)
6. WordPress clients see update available (within 24h cache)
```

---

## GitHub Actions Workflows

### 1. `publish.yml` (in each extension repo)

**File**: `.github/workflows/publish.yml`

```yaml
name: Publish to Directory
on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish (overrides tag)'
        required: false

permissions:
  contents: read
  metadata: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout extension repo
        uses: actions/checkout@v4
        with:
          path: extension

      - name: Checkout directory repo
        uses: actions/checkout@v4
        with:
          repository: radlabs/extensions
          token: ${{ secrets.DIRECTORY_PAT }}
          path: directory

      - name: Read extension metadata
        id: meta
        run: |
          cd extension
          
          # Read register.json
          REG_JSON=$(cat system/Extensions/*/register.json)
          
          SLUG=$(echo $REG_JSON | jq -r '.name')
          LABEL=$(echo $REG_JSON | jq -r '.label')
          DESC=$(echo $REG_JSON | jq -r '.description')
          VERSION=$(echo $REG_JSON | jq -r '.version')
          NAMESPACE=$(echo $REG_JSON | jq -r '.settings.namespace' | sed 's/\\$//')
          
          # Validate semver format
          if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$'; then
            echo "ERROR: Invalid semver version: $VERSION"
            exit 1
          fi
          
          # Get release info
          TAG="${{ github.event.release.tag_name }}"
          TAG_VERSION="${TAG#v}"
          TAG_VERSION="${TAG_VERSION#${SLUG}-}"
          
          # Use tag version if different from register.json
          FINAL_VERSION="${TAG_VERSION:-$VERSION}"
          
          echo "slug=$SLUG" >> $GITHUB_OUTPUT
          echo "label=$LABEL" >> $GITHUB_OUTPUT
          echo "description=$DESC" >> $GITHUB_OUTPUT
          echo "version=$FINAL_VERSION" >> $GITHUB_OUTPUT
          echo "namespace=$NAMESPACE" >> $GITHUB_OUTPUT
          echo "tag=$TAG" >> $GITHUB_OUTPUT
          
      # ponytail: git archive respects .gitattributes export-ignore
      # zip -r is non-deterministic (timestamps, ordering). git archive is reproducible.
      - name: Build ZIP (reproducible)
        run: |
          cd extension
          ZIP_NAME="${{ steps.meta.outputs.slug }}-${{ steps.meta.outputs.version }}.zip"
          NAMESPACE_DIR="system/Extensions/${{ steps.meta.outputs.namespace }}"
          
          # Build ZIP via git archive (respects .gitattributes export-ignore)
          git archive HEAD -- "$NAMESPACE_DIR" | \
            tar -x --to-stdout "$NAMESPACE_DIR" | \
            zip -r "/tmp/${ZIP_NAME}" -
          
          # Fallback: if git archive fails, use zip with explicit excludes
          if [ ! -f "/tmp/${ZIP_NAME}" ]; then
            echo "git archive failed, falling back to zip with excludes"
            cd "$NAMESPACE_DIR"
            zip -r "/tmp/${ZIP_NAME}" . \
              -x '*.swp' -x '*.swo' -x '.DS_Store' \
              -x 'Thumbs.db' -x '.git*'
          fi
          
          # Calculate SHA256
          SHA256=$(sha256sum "/tmp/${ZIP_NAME}" | cut -d' ' -f1)
          echo "sha256=$SHA256" >> $GITHUB_OUTPUT
          
          # Upload to release
          cd ../../../..
          gh release upload "$TAG" "/tmp/${ZIP_NAME}" \
            --repo ${{ github.repository }}
          
      - name: Generate metadata JSON
        run: |
          cd directory
          mkdir -p extensions
          
          # Create metadata JSON
          EXISTING="extensions/${{ steps.meta.outputs.slug }}.json"
          cat > "$EXISTING" <<EOF
          {
            "slug": "${{ steps.meta.outputs.slug }}",
            "name": "${{ steps.meta.outputs.label }}",
            "description": "${{ steps.meta.outputs.description }}",
            "version": "${{ steps.meta.outputs.version }}",
            "author": "${{ github.repository_owner }}",
            "repo": "${{ github.repository }}",
            "homepage": "https://github.com/${{ github.repository }}",
            "requires_php": "8.2",
            "requires_wp": "6.0",
            "min_theme_version": "2.0.0",
            "tags": [],
            "download_url": "https://github.com/${{ github.repository }}/releases/download/${{ steps.meta.outputs.tag }}/${{ steps.meta.outputs.slug }}-${{ steps.meta.outputs.version }}.zip",
            "integrity": "sha256:${{ steps.meta.outputs.sha256 }}",
            "license": "GPL-2.0-or-later",
            "thumbnail": "https://raw.githubusercontent.com/${{ github.repository }}/main/screenshot.png",
            "changelog": {
              "${{ steps.meta.outputs.version }}": $(echo '${{ github.event.release.body }}' | jq -Rs .)
            },
            "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          }
          EOF
          
      - name: Push to directory repo
        run: |
          cd directory
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add extensions/
          git diff --staged --quiet || git commit -m "chore: update ${{ steps.meta.outputs.slug }} to ${{ steps.meta.outputs.version }}"
          git push
          
      - name: Trigger index rebuild
        run: |
          curl -X POST \
            -H "Accept: application/vnd.github.v3+json" \
            -H "Authorization: token ${{ secrets.DIRECTORY_PAT }}" \
            https://api.github.com/repos/radlabs/extensions/actions/workflows/sync-index.yml/dispatches \
            -d '{"ref": "main"}'
```

### 2. `sync-index.yml` (in directory repo)

**File**: `.github/workflows/sync-index.yml`

```yaml
name: Sync Index
on:
  push:
    paths: ['extensions/*.json']
  repository_dispatch:
    types: [index-rebuild]
  workflow_dispatch:

# CRITICAL: Prevents race condition when multiple extensions publish simultaneously.
# If 2+ dispatches arrive, only the latest commit is built.
concurrency:
  group: sync-index
  cancel-in-progress: true

permissions:
  contents: write
  pages: write

jobs:
  build-index:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2  # Need previous commit for diff

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build extensions/index.json
        run: node scripts/build-index.js

      - name: Validate extensions/index.json
        run: node scripts/validate.js

      - name: Commit (only if index changed)
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add extensions/index.json
          git diff --staged --quiet || git commit -m "chore: rebuild index [skip ci]"
          git push

  deploy-pages:
    needs: build-index
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3. `build-index.js` (in directory repo)

**File**: `scripts/build-index.js`

```javascript
const fs = require('fs');
const path = require('path');

const EXTENSIONS_DIR = path.join(__dirname, '..', 'extensions');
const OUTPUT_FILE = path.join(EXTENSIONS_DIR, 'index.json');

const REQUIRED_FIELDS = ['slug', 'name', 'description', 'version', 'author', 'homepage', 'min_theme_version', 'tags', 'download_url', 'integrity', 'updated_at'];

function buildIndex() {
  const extensions = [];
  const errors = [];
  
  // Read all extension JSON files
  if (!fs.existsSync(EXTENSIONS_DIR)) {
    console.error(`Extensions directory not found: ${EXTENSIONS_DIR}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(EXTENSIONS_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(EXTENSIONS_DIR, file), 'utf8');
      const ext = JSON.parse(content);
      
      // Validate required fields
      const missing = REQUIRED_FIELDS.filter(f => !ext[f]);
      if (missing.length > 0) {
        errors.push(`${file}: missing required fields: ${missing.join(', ')}`);
        continue;
      }
      
      // Validate slug uniqueness
      if (extensions.some(e => e.slug === ext.slug)) {
        errors.push(`${file}: duplicate slug '${ext.slug}'`);
        continue;
      }
      
      // Validate semver
      const semverRe = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;
      if (!semverRe.test(ext.version)) {
        errors.push(`${file}: invalid semver version '${ext.version}'`);
        continue;
      }
      
      // Add to index (minimal fields)
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
    } catch (err) {
      errors.push(`${file}: JSON parse error: ${err.message}`);
    }
  }
  
  // Report errors
  if (errors.length > 0) {
    console.error(`Build errors (${errors.length}):`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  
  // Sort by name
  extensions.sort((a, b) => a.name.localeCompare(b.name));
  
  const index = {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    total_extensions: extensions.length,
    extensions
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`Generated extensions/index.json with ${extensions.length} extensions`);
}

buildIndex();
```

### 4. `validate.js` (in directory repo)

**File**: `scripts/validate.js`

```javascript
const fs = require('fs');
const path = require('path');

const EXTENSIONS_DIR = path.join(__dirname, '..', 'extensions');
const INDEX_FILE = path.join(EXTENSIONS_DIR, 'index.json');

const SEMVER_RE = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;

function validate() {
  let errors = 0;
  
  // Validate index.json exists
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('extensions/index.json not found');
    process.exit(1);
  }
  
  let index;
  try {
    index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse extensions/index.json: ${err.message}`);
    process.exit(1);
  }
  
  // Validate schema
  if (!index.schema_version || !index.generated_at || !Array.isArray(index.extensions)) {
    console.error('Invalid index.json structure: missing schema_version, generated_at, or extensions array');
    process.exit(1);
  }
  
  // Validate each extension
  const slugs = new Set();
  for (const ext of index.extensions) {
    // Required fields (ALL must be present)
    const required = ['slug', 'name', 'description', 'version', 'author', 'homepage', 'min_theme_version', 'tags', 'download_url', 'integrity', 'updated_at'];
    for (const field of required) {
      if (!ext[field]) {
        console.error(`Extension ${ext.slug || 'unknown'}: missing required field '${field}'`);
        errors++;
      }
    }
    
    // Slug uniqueness
    if (ext.slug) {
      if (slugs.has(ext.slug)) {
        console.error(`Duplicate slug: '${ext.slug}'`);
        errors++;
      }
      slugs.add(ext.slug);
    }
    
    // Validate semver format
    if (ext.version && !SEMVER_RE.test(ext.version)) {
      console.error(`Extension ${ext.slug}: invalid semver version '${ext.version}'`);
      errors++;
    }
    
    // Validate min_theme_version semver
    if (ext.min_theme_version && !SEMVER_RE.test(ext.min_theme_version)) {
      console.error(`Extension ${ext.slug}: invalid min_theme_version '${ext.min_theme_version}'`);
      errors++;
    }
    
    // Validate download URL format
    if (ext.download_url && !ext.download_url.startsWith('https://')) {
      console.error(`Extension ${ext.slug}: download_url must be HTTPS`);
      errors++;
    }
    
    // Validate integrity format
    if (ext.integrity && !ext.integrity.startsWith('sha256:')) {
      console.error(`Extension ${ext.slug}: integrity must start with sha256:`);
      errors++;
    }
    
    // Validate tags is array
    if (ext.tags && !Array.isArray(ext.tags)) {
      console.error(`Extension ${ext.slug}: tags must be an array`);
      errors++;
    }
    
    // Validate updated_at is ISO 8601
    if (ext.updated_at && isNaN(Date.parse(ext.updated_at))) {
      console.error(`Extension ${ext.slug}: updated_at is not a valid ISO 8601 timestamp`);
      errors++;
    }
  }
  
  if (errors > 0) {
    console.error(`Validation failed with ${errors} error(s)`);
    process.exit(1);
  }
  
  console.log(`Validation passed: ${index.extensions.length} extensions`);
}

validate();
```

---

## WordPress Client Extension

### Extension Structure

```
system/Extensions/Repository/
├── Repository.extension.php           ← orchestrator
├── register.json
├── Handlers/
│   ├── index.handler.php              ← fetch + cache index
│   ├── install.handler.php            ← download + extract + enable
│   ├── update.handler.php             ← compare + update
│   └── uninstall.handler.php          ← remove + cleanup
└── contents/
    ├── directory.php                  ← browse/search UI
    └── detail.php                     ← extension detail view
```

### `register.json`

```json
{
  "name": "repository",
  "label": "Extension Directory",
  "description": "Browse, install, and manage extensions from the RADYK directory.",
  "version": "1.0.0",
  "domain": "gen.radyk.ext",
  "integrity": "hmac-sha256:...",
  "settings": {
    "namespace": "Repository\\",
    "orchestrator": "Repository",
    "autodiscover": true,
    "network": true
  },
  "submenu": {
    "title": {
      "page": "Extension Directory",
      "menu": "Directory"
    }
  },
  "export": {
    "options": ["radyk_repository_cache"],
    "theme_mods": [],
    "tables": []
  }
}
```

### Key Methods

```php
<?php
namespace System\Extensions\Repository;

class Repository extends \System\Extensions\Extension
{
    // Configuration
    const INDEX_URL = 'https://rahendz.github.io/radlabs/extensions/index.json';
    const CACHE_TTL = 86400; // 24 hours
    const MAX_ZIP_SIZE = 10485760; // 10MB
    const EXTENSIONS_DIR = 'system/Extensions/';
    
    // Fetch index from remote (with transient cache)
    public static function fetch_index(): array
    
    // Get single extension detail
    public static function get_extension(string $slug): ?object
    
    // Install extension
    public static function install(string $slug): array
    
    // Update extension
    public static function update(string $slug): array
    
    // Uninstall extension
    public static function uninstall(string $slug): array
    
    // Check for updates (compare local vs remote)
    public static function check_updates(): array
    
    // Get installed extensions from directory
    public static function get_installed(): array
}
```

### Install Flow (v2 — hardened)

```php
public static function install(string $slug): array
{
    // 0. Verify ZipArchive extension is available
    if (!class_exists('ZipArchive')) {
        return [false, "PHP ZipArchive extension is not installed. Contact your host."];
    }
    
    // 1. Fetch index
    $index = self::fetch_index();
    
    // 2. Find extension
    $ext = null;
    foreach ($index['extensions'] as $e) {
        if ($e['slug'] === $slug) {
            $ext = $e;
            break;
        }
    }
    
    if (!$ext) {
        return [false, "Extension '{$slug}' not found in directory."];
    }
    
    // 3. Check if already installed
    $target_dir = get_template_directory() . '/' . self::EXTENSIONS_DIR . ucfirst($slug);
    if (is_dir($target_dir)) {
        return [false, "Extension '{$slug}' is already installed."];
    }
    
    // 4. Pre-download: check Content-Length before downloading
    $head_response = wp_remote_head($ext['download_url'], ['timeout' => 10]);
    if (!is_wp_error($head_response)) {
        $content_length = (int) wp_remote_retrieve_header($head_response, 'content-length');
        if ($content_length > self::MAX_ZIP_SIZE) {
            return [false, "ZIP file too large (max " . (self::MAX_ZIP_SIZE / 1024 / 1024) . "MB)"];
        }
    }
    
    // 5. Download ZIP
    $response = wp_remote_get($ext['download_url'], [
        'timeout' => 60,
        'stream' => true,
        'sslverify' => true,
        'filename' => tempnam(sys_get_temp_dir(), 'radyk_ext_'),
    ]);
    
    if (is_wp_error($response)) {
        return [false, "Download failed: " . $response->get_error_message()];
    }
    
    $code = wp_remote_retrieve_response_code($response);
    if ($code !== 200) {
        return [false, "Download failed: HTTP {$code}"];
    }
    
    // 6. Verify size (post-download guard)
    $zip_file = $response['filename'];
    if (filesize($zip_file) > self::MAX_ZIP_SIZE) {
        unlink($zip_file);
        return [false, "ZIP file too large (max " . (self::MAX_ZIP_SIZE / 1024 / 1024) . "MB)"];
    }
    
    // 7. Verify integrity (SHA256)
    if (!empty($ext['integrity'])) {
        $hash = hash_file('sha256', $zip_file);
        $expected = str_replace('sha256:', '', $ext['integrity']);
        
        if ($hash !== $expected) {
            unlink($zip_file);
            return [false, "Integrity check failed. File may be corrupted."];
        }
    }
    
    // 8. Extract ZIP
    $zip = new \ZipArchive();
    if ($zip->open($zip_file) !== true) {
        unlink($zip_file);
        return [false, "Failed to open ZIP file."];
    }
    
    // Extract to temp directory first
    $temp_dir = sys_get_temp_dir() . '/radyk_ext_' . uniqid();
    $extract_ok = $zip->extractTo($temp_dir);
    $zip->close();
    unlink($zip_file);
    
    if (!$extract_ok) {
        self::remove_dir($temp_dir);
        return [false, "Failed to extract ZIP file."];
    }
    
    // 9. Find extension directory in extracted files
    $extracted_dirs = glob($temp_dir . '/*', GLOB_ONLYDIR);
    if (empty($extracted_dirs)) {
        self::remove_dir($temp_dir);
        return [false, "ZIP file is empty."];
    }
    
    $source_dir = $extracted_dirs[0]; // First directory in ZIP
    
    // 10. Verify register.json exists
    if (!file_exists($source_dir . '/register.json')) {
        // Check if extension directory is nested
        $nested = glob($source_dir . '/system/Extensions/*/register.json');
        if (!empty($nested)) {
            $source_dir = dirname($nested[0]);
        } else {
            self::remove_dir($temp_dir);
            return [false, "Invalid extension: register.json not found."];
        }
    }
    
    // 11. Move to final location (with rollback on failure)
    $move_ok = rename($source_dir, $target_dir);
    if (!$move_ok) {
        self::remove_dir($temp_dir);
        return [false, "Failed to move extension to target directory. Check permissions."];
    }
    
    // 12. Refresh integrity token
    $ext_file = $target_dir . '/' . ucfirst($slug) . '.extension.php';
    if (file_exists($ext_file)) {
        \Extensions::refresh_integrity($slug);
    }
    
    // 13. Cleanup temp directory
    self::remove_dir($temp_dir);
    
    return [true, "Extension '{$slug}' installed successfully."];
}
```

### Admin UI

**Directory Tab** (added to existing Extensions page):

```
┌─────────────────────────────────────────────────────────────────┐
│ Extensions                                        [Refresh]     │
├─────────────────────────────────────────────────────────────────┤
│ [Installed] [Directory]                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🔍 Search extensions...                                        │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│ │  SEO Suite  │ │  Analytics  │ │ Form Builder│                │
│ │  v2.1.0     │ │  v1.0.0     │ │  v3.2.1     │                │
│ │             │ │             │ │             │                │
│ │ Advanced    │ │ Track       │ │ Build       │                │
│ │ SEO tools   │ │ visitor     │ │ complex     │                │
│ │             │ │ analytics   │ │ forms       │                │
│ │             │ │             │ │             │                │
│ │ [Install]   │ │ [Install]   │ │ [Update]    │                │
│ └─────────────┘ └─────────────┘ └─────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Model

### Layer 1: Download Integrity

- **SHA256 hash** in `extensions/index.json` per extension
- Verified after download, before extract
- Prevents corrupted/tampered downloads

### Layer 2: Boot Integrity (HMAC Key Management)

- **HMAC-SHA256 token** in `register.json` per extension
- Verified by `ExtensionsTrait::verify()` during boot
- Prevents modified files from executing

#### HMAC Key Management

**How it works:**
1. **Key Pair**: Each extension developer generates an HMAC-SHA256 key pair (or uses a shared RADYK key)
2. **Signing**: Developer signs extension files → produces `hmac-sha256:<signature>` in `register.json`
3. **Verification**: Theme's `ExtensionsTrait::verify()` recomputes HMAC from files and compares

**Key Storage:**
- **Private key** (signing): Stored as GitHub Secret `HMAC_KEY` in extension repo (NEVER committed)
- **Public key / shared secret**: Embedded in theme's `Extensions::verify()` method or stored in `wp_options`

**Key Generation:**
```bash
# Generate HMAC key (run once per developer/organization)
openssl rand -hex 32 > hmac_key.txt
# Output: a6f2b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7
```

**Key Rotation:**
1. Generate new key, update GitHub Secret in all extension repos
2. Re-sign `register.json` with new key
3. Deploy updated theme with new public key
4. Old extensions continue working until next boot (grace period)

**Failure Modes:**
- Key mismatch → extension disabled at boot (safe default)
- Missing key → extension loads but logs warning (development mode)
- Compromised key → regenerate + re-sign all affected extensions

### Layer 3: Access Control

- **Nonce verification** on all AJAX handlers
- **Capability check**: `current_user_can('manage_options')`
- **ABSPATH guard** on all PHP files

### Layer 4: Rate Limiting

- **Transient cache** for `extensions/index.json` (24h)
- **Transient cache** for extension details (12h)
- **Forced refresh** available via `wp radyk ext refresh` CLI or UI button
- Prevents excessive GitHub API calls

---

## CLI Commands

### WP-CLI Integration

```
wp radyk ext list                    ← list installed extensions
wp radyk ext install <slug>          ← install from directory
wp radyk ext uninstall <slug>        ← remove extension
wp radyk ext update <slug>           ← update single extension
wp radyk ext update --all            ← update all extensions
wp radyk ext search <query>          ← search directory
wp radyk ext info <slug>             ← show extension details
wp radyk ext refresh                 ← force refresh index cache
```

### Implementation

**File**: `system/Extensions/CLI/handlers/ext.handler.php`

```php
<?php
namespace System\Extensions\CLI;

class Ext_Command
{
    /**
     * List installed extensions from directory.
     *
     * ## OPTIONS
     *
     * [--format=<format>]
     * : Output format. Default: table.
     * ---
     * default: table
     * options:
     *   - table
     *   - json
     *   - csv
     * ---
     *
     * @when after_wp_load
     */
    public function list(array $args, array $assoc_args): void
    {
        $installed = \System\Extensions\Repository\Repository::get_installed();
        
        // ... render table/json/csv
    }
    
    /**
     * Install extension from directory.
     *
     * ## OPTIONS
     *
     * <slug>
     * : Extension slug from directory.
     *
     * [--force]
     * : Overwrite existing installation.
     *
     * @when after_wp_load
     */
    public function install(array $args, array $assoc_args): void
    {
        $slug = $args[0];
        $force = $assoc_args['force'] ?? false;
        
        // ... install logic
    }
    
    // ... other commands
}
```

---

## Multi-Theme Strategy

### Theme-Specific Directories

```php
// Different themes can have different directories
const DIRECTORIES = [
    'radyk2' => 'https://rahendz.github.io/radlabs/extensions/index.json',
    'radyk-next' => 'https://rahendz.github.io/radlabs/extensions-next/index.json',
];

// Or single directory with theme filter
const DIRECTORY_URL = 'https://rahendz.github.io/radlabs/extensions/index.json';
// Filter by min_theme_version in client
```

### Shared Extensions

Some extensions work across themes:

```json
{
  "slug": "seo-suite",
  "min_theme_version": "2.0.0",
  "compatible_themes": ["radyk2", "radyk-next"]
}
```

### Client Detection

```php
// Auto-detect current theme
$current_theme = wp_get_theme()->get_template();
$directory_url = apply_filters('radyk_directory_url', 
    self::DIRECTORIES[$current_theme] ?? self::DEFAULT_DIRECTORY
);
```

---

## Development Phases

### Phase 0: Repository Setup (Day 1)

- [ ] Create GitHub organization `radlabs`
- [ ] Create repo `extensions` (directory repo)
- [ ] Create root `index.html` (landing page for `rahendz.github.io/radlabs/`)
- [ ] Create `extensions/index.html` (visual directory page with search + cards)
- [ ] Create `extensions/` subdirectory with empty `index.json`
- [ ] Create `assets/style.css` and `assets/app.js` (directory page assets)
- [ ] Setup GitHub Pages (Settings → Pages → Source: main, root `/`)
- [ ] Create `scripts/build-index.js` and `scripts/validate.js`
- [ ] Create `.github/workflows/sync-index.yml` (with concurrency lock)
- [ ] Test: push to main → `extensions/index.json` rebuilt → Pages deploy
- [ ] Test: open `https://rahendz.github.io/radlabs/extensions/` → directory page loads
- [ ] Test: fetch `https://rahendz.github.io/radlabs/extensions/index.json` from browser

### Phase 1: First Extension (Day 2-3)

- [ ] Create repo `ext-seo-suite` (or pick existing extension)
- [ ] Add `.gitattributes` (export-ignore rules)
- [ ] Add `publish.yml` workflow
- [ ] Generate HMAC key pair → store as GitHub Secret `HMAC_KEY`
- [ ] Sign `register.json` with HMAC key
- [ ] Create release v1.0.0
- [ ] Test: release → ZIP uploaded → metadata synced → `extensions/index.json` updated
- [ ] Test: fetch `index.json` from browser → verify new extension listed

### Phase 2: WordPress Client Extension (Week 1)

- [ ] Create `Repository.extension.php` + `register.json`
- [ ] Implement `index.handler.php` (fetch + cache `extensions/index.json`)
- [ ] Implement `install.handler.php` (pre-download check + download + SHA256 verify + extract + move)
- [ ] Add ZipArchive extension check
- [ ] Add `sslverify => true` to `wp_remote_get`
- [ ] Create `directory.page.php` (browse + install UI)
- [ ] Add tab to existing Extensions page
- [ ] Test: install extension from directory
- [ ] Test: corrupt ZIP → integrity check fails → no partial install left behind

### Phase 3: Production Features (Week 2)

- [ ] Implement `update.handler.php` (compare + update)
- [ ] Implement `uninstall.handler.php` (remove + cleanup)
- [ ] Add update checking (WP-Cron weekly)
- [ ] Add version badge on Extensions page
- [ ] Add search + tag filtering
- [ ] Add detail modal (changelog, homepage, tags)

### Phase 4: Polish (Week 3)

- [ ] Add WP-CLI commands
- [ ] Add error handling edge cases
- [ ] Add loading states + progress indicators
- [ ] Add retry logic for failed downloads
- [ ] Add admin notices for errors
- [ ] Add forced cache refresh button in UI
- [ ] Write developer documentation (publish guide)

### Phase 5: Scale (Optional)

- [ ] Add analytics (download count via GitHub API)
- [ ] Add rating/review system (requires backend)
- [ ] Add developer submission workflow
- [ ] Add multi-theme support

---

## Technical Decisions

### 1. Hosting: GitHub Pages

**Decision**: GitHub Pages for static hosting  
**Reason**: Free, CDN, zero maintenance, integrates with GitHub Actions  
**Fallback**: Can migrate to Cloudflare Pages or Vercel if needed

### 2. Repository Pattern: Multi-Repo

**Decision**: Each extension in its own repository  
**Reason**: Isolated maintenance, per-repo access control, natural versioning  
**Alternative**: Monorepo (rejected — harder to maintain, permission issues)

### 3. Auto-Sync: GitHub Actions

**Decision**: GitHub Actions for auto-sync metadata  
**Reason**: Zero server, free tier sufficient, reliable  
**Alternative**: Manual update (rejected — defeats purpose)

### 4. Client: WordPress Extension

**Decision**: Build as RADYK extension (not standalone plugin)  
**Reason**: Consistent with existing architecture, leverages existing infrastructure  
**Alternative**: Standalone plugin (rejected — adds complexity, separate update cycle)

### 5. Cache: Transients API

**Decision**: WordPress transients for caching  
**Reason**: Native WordPress, auto-expire, no extra dependencies  
**Alternative**: Custom cache (rejected — overkill for this use case)

### 6. Integrity: Double Hash

**Decision**: SHA256 for ZIP + HMAC for class files  
**Reason**: SHA256 verifies download integrity, HMAC verifies file integrity  
**Alternative**: Single hash (rejected — doesn't cover both attack vectors)

### 7. Versioning: SemVer

**Decision**: Semantic Versioning (MAJOR.MINOR.PATCH)  
**Reason**: Industry standard, predictable updates, clear compatibility  
**Alternative**: CalVer (rejected — harder to determine compatibility)

---

## Appendix

### Glossary

| Term | Definition |
|---|---|
| **Directory** | Central repository listing all available extensions (`extensions/index.json`) |
| **Extension** | A RADYK theme add-on that extends functionality |
| **Slug** | Unique identifier for an extension (e.g., `seo-suite`) |
| **Download Integrity** | SHA256 hash of ZIP file — verifies download hasn't been corrupted/tampered |
| **Boot Integrity** | HMAC-SHA256 token in `register.json` — verifies PHP files haven't been modified |
| **Registry** | Local cache of extension metadata from directory (WordPress transients) |
| **Concurrency Lock** | GitHub Actions concurrency group preventing parallel index rebuilds |
| **export-ignore** | `.gitattributes` directive excluding files from `git archive` (ZIP builds) |

### References

- [WordPress Plugin Directory](https://wordpress.org/plugins/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency)
- [Semantic Versioning](https://semver.org/)
- [RADYK Extension Guide](../memories/repo/radyk2-extension-guide.md)

### Changelog

| Date | Version | Changes |
|---|---|---|
| 2026-09-09 | 1.0.0 | Initial plan created |
| 2026-09-09 | 2.1.0 | Visual directory landing page (`extensions/index.html`) with search, tag filter, card grid, extension detail modals, mobile-responsive, reads from `index.json` |
| 2026-09-09 | 2.0.0 | Syndicate review: race condition fix (concurrency lock), HMAC key management documented, .gitattributes for ZIP reproducibility, pre-download Content-Length check, ZipArchive extension check, validate.js hardened (all required fields + semver + slug uniqueness), install flow rollback on failure, landing page at root, glossary expanded |
